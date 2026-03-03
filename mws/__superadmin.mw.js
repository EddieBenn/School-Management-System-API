module.exports = ({ meta, config, managers, mongomodels, cache }) => {
  return async ({ req, res, next, results }) => {
    if (!results.__longToken) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }

    const userId = results.__longToken.userId;

    // Try to get from cache first
    let user = await cache.get(`user:session:${userId}`);
    if (user) {
      user = JSON.parse(user);
    } else {
      // Fetch user from mongodb
      user = await mongomodels.user.findById(userId);
      if (user) {
        user = user.toObject();
        delete user.password;
        // Cache for 1 hour
        await cache.set(`user:session:${userId}`, JSON.stringify(user), {
          ttl: 3600,
        });
      }
    }

    if (!user || user.role !== "superadmin") {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        errors: "superadmin access required",
      });
    }

    next(user);
  };
};
