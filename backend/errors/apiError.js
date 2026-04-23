const { formatJoiValidationError } = require('./joiValidationHandler');

const FIELD_LABELS = {
  phone: 'Phone number',
  email: 'Email address',
  name: 'Name',
  role: 'Role',
  category: 'Category',
  price: 'Price',
  duration: 'Duration',
  customerId: 'Customer',
  staffId: 'Staff member',
  date: 'Date',
  timeSlot: 'Time slot'
};

const toTitleCase = (value = '') =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._]/g, ' ')
    .trim()
    .replace(/^./, (ch) => ch.toUpperCase());

const getFieldLabel = (field = '') => FIELD_LABELS[field] || toTitleCase(field || 'Field');

const normalizeSequelizeValidationMessage = (item) => {
  const fieldLabel = getFieldLabel(item.path);
  switch (item.validatorKey) {
    case 'isEmail':
      return 'Please enter a valid email address.';
    case 'not_null':
      return `${fieldLabel} is required.`;
    case 'len':
      return `${fieldLabel} length is invalid.`;
    case 'isIn':
      return `${fieldLabel} has an invalid value.`;
    case 'min':
      return `${fieldLabel} is too small.`;
    case 'max':
      return `${fieldLabel} is too large.`;
    default:
      return item.message || `${fieldLabel} is invalid.`;
  }
};

const buildSequelizeErrorPayload = (err) => {
  if (!err?.name) return null;

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = (err.errors || []).map((item) => ({
      field: item.path,
      message: `${getFieldLabel(item.path)} is already in use.`
    }));
    return {
      statusCode: 409,
      message: errors.length ? errors.map((item) => item.message).join(' ') : 'Duplicate value not allowed.',
      errors
    };
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = (err.errors || []).map((item) => ({
      field: item.path,
      message: normalizeSequelizeValidationMessage(item)
    }));
    return {
      statusCode: 400,
      message: errors.length ? errors.map((item) => item.message).join(' ') : 'Validation failed.',
      errors
    };
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return {
      statusCode: 400,
      message: 'Invalid linked record selected.',
      errors: []
    };
  }

  return null;
};

class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : undefined;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors) { return new ApiError(400, message, errors); }
  static unauthorized(message, errors) { return new ApiError(401, message, errors); }
  static forbidden(message, errors) { return new ApiError(403, message, errors); }
  static notFound(message, errors) { return new ApiError(404, message, errors); }
  static conflict(message, errors) { return new ApiError(409, message, errors); }
  static internal(message, errors) { return new ApiError(500, message, errors); }
}

const errorMiddleware = (err, _req, res, _next) => {
  const joiError = formatJoiValidationError(err);
  if (joiError) {
    return res.status(joiError.statusCode).json({
      message: joiError.message,
      errors: joiError.errors
    });
  }

  const sequelizeError = buildSequelizeErrorPayload(err);
  if (sequelizeError) {
    return res.status(sequelizeError.statusCode).json({
      message: sequelizeError.message,
      errors: sequelizeError.errors
    });
  }

  const status = err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal server error'
  };

  if (Array.isArray(err.errors) && err.errors.length) {
    payload.errors = err.errors;
  }

  return res.status(status).json(payload);
};

module.exports = { ApiError, errorMiddleware };
