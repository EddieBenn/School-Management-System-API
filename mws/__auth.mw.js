module.exports = ({ meta, config, managers }) => {
  return async ({ req, res, next, results }) => {
    if (!results.__longToken) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }

    // Fetch user from db
    let user = await managers.oyster.call(
      "get_block",
      results.__longToken.userId,
    );
    if (!user || user.error) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "invalid user",
      });
    }

    next(user);
  };
};
