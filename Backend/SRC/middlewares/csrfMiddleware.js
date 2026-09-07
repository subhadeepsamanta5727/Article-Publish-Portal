const ApiError = require("../utils/ApiError");

const csrfMiddleware = (req, res, next) => {
  const cookieToken = req.cookies?.seo_csrf_token;
  const headerToken = req.get("X-CSRF-Token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, "CSRF validation failed"));
  }
  return next();
};

module.exports = csrfMiddleware;