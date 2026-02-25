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
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.usersCollection = "users";
    this.userExposed = ["createUser"];
    this.adminExposed = ["createUser", "deleteUser", "get=getUsers"];
  }

  async createUser({ username, email, password }) {
    const user = { username, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result) return result;

    // Creation Logic
    let createdUser = { username, email, password };
    let longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
      userKey: createdUser.key,
    });

    // Response
    return {
      user: createdUser,
      longToken,
    };
  }

  async deleteUser({ userId }) {
    // TODO: implement deletion logic
    return { message: "User deleted successfully" };
  }

  async getUsers() {
    // TODO: implement list logic
    return { users: [] };
  }
};
