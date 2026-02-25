const bcrypt = require("bcrypt");

module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    oyster,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.oyster = oyster;
    this.tokenManager = managers.token;
    this.emailManager = managers.email;
    this.managers = managers;

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
    const emailSearch = await this.oyster.call("search_find", {
      query: { text: "@email:" + email.replace(/[@.]/g, "\\\\$&") },
      label: "user",
    });
    if (emailSearch && emailSearch.docs && emailSearch.docs.length > 0) {
      return { error: "User with this email already exists" };
    }

    user.password = await this.hash(password);
    user._label = "user";

    // Add to Oyster DB
    let createdUser = await this.oyster.call("add_block", user);
    if (createdUser.error) return createdUser;

    // Emit created event
    this.emailManager.notifyUserCreated(createdUser);

    delete createdUser.password;

    return {
      user: createdUser,
    };
  }

  async login({ email, password }) {
    let result = await this.validators.user.login({ email, password });
    if (result) return result;

    // Search user by email
    const emailSearch = await this.oyster.call("search_find", {
      query: { text: "@email:" + email.replace(/[@.]/g, "\\\\$&") },
      label: "user",
    });

    if (!emailSearch || !emailSearch.docs || emailSearch.docs.length === 0) {
      return { error: "Invalid email or password" };
    }

    const user = emailSearch.docs[0];
    const isMatch = await this.checkPassword(password, user.password);

    if (!isMatch) {
      return { error: "Invalid email or password" };
    }

    // Generate long token
    let longToken = this.tokenManager.genLongToken({
      userId: user._id,
      userKey: user._key || "default", // Oyster DB blocks lack _key usually
    });

    delete user.password;
    return { user, longToken };
  }

  async getUser({ __longToken, __auth }) {
    const user = __auth; // Got populated by our middleware
    delete user.password;
    return { user };
  }
};
