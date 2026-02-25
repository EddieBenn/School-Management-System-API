module.exports = ({ meta, config, managers }) => {
  return async ({ req, res, next, results }) => {
    if (!results.__longToken) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }

    let user = await managers.oyster.call(
      "get_block",
      results.__longToken.userId,
    );
    if (user.error || user.role !== "superadmin") {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        errors: "superadmin access required",
      });
    }

    next(user);
  };
};
