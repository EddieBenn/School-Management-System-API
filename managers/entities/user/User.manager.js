const bcrypt = require("bcrypt");

module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.userModel = mongomodels.user;
    this.tokenManager = managers.token;
    this.emailManager = managers.email;
    this.managers = managers;
    this.cache = cache;

    this.userExposed = ["createUser", "login", "get=getUser"];
    this.adminExposed = ["createUser", "get=getUser"];
  }

  async hash(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async checkPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  async createUser({ username, email, password, role, schoolId }) {
    let user = { username, email, password, role, schoolId };

    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    user.password = await this.hash(password);

    // Save to MongoDB
    let createdUser = await this.userModel.create(user);

    // Emit created event
    this.emailManager.notifyUserCreated(createdUser);

    const userObj = createdUser.toObject();
    delete userObj.password;

    return {
      user: userObj,
    };
  }

  async login({ email, password }) {
    let result = await this.validators.user.login({ email, password });
    if (result) return result;

    // Try to get from cache first (optional, but requested)
    // const cachedUser = await this.cache.get(`user:${email}`);
    // if (cachedUser) { ... }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      return { error: "Invalid email" };
    }

    const isMatch = await this.checkPassword(password, user.password);

    if (!isMatch) {
      return { error: "Invalid password" };
    }

    // Generate long token
    let longToken = this.tokenManager.genLongToken({
      userId: user._id,
      userKey: "default",
    });

    const userObj = user.toObject();
    delete userObj.password;

    // Cache user session data in Redis
    await this.cache.set(`user:session:${user._id}`, JSON.stringify(userObj), {
      ttl: 3600,
    });

    return { user: userObj, longToken };
  }

  async getUser({ __longToken, __auth }) {
    const user = __auth; // Got populated by our middleware
    delete user.password;
    return { user };
  }
};
