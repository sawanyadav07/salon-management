const { ApiError } = require('../errors/apiError');

const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user?.role) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You are not allowed to access this resource'));
  }

  return next();
};

module.exports = { authorize };
