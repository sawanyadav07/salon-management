const { ApiError } = require('../errors/apiError');
const { formatJoiValidationError } = require('../errors/joiValidationHandler');

const DEFAULT_OPTIONS = {
  abortEarly: false,
  stripUnknown: true,
  convert: true
};

const validate = (schemas, options = {}) => {
  const prefs = { ...DEFAULT_OPTIONS, ...options };

  return (req, _res, next) => {
    try {
      for (const key of ['params', 'query', 'body']) {
        if (!schemas?.[key]) continue;

        const { error, value } = schemas[key].validate(req[key], prefs);
        if (error) {
          const formatted = formatJoiValidationError(error);
          if (formatted) {
            return next(ApiError.badRequest(formatted.message, formatted.errors));
          }
          return next(ApiError.badRequest('Validation failed.'));
        }

        req[key] = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { validate };
