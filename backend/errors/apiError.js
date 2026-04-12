class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) { return new ApiError(400, message); }
  static unauthorized(message) { return new ApiError(401, message); }
  static forbidden(message) { return new ApiError(403, message); }
  static notFound(message) { return new ApiError(404, message); }
  static conflict(message) { return new ApiError(409, message); }
  static internal(message) { return new ApiError(500, message); }
}

const errorMiddleware = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
};

module.exports = { ApiError, errorMiddleware };
