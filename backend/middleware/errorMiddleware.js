/**
 * Centralized Error Handling Middleware
 * Formats errors into consistent JSON responses and hides stack traces in production.
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Cannot find endpoint ${req.originalUrl} on this server`, 404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "test" && statusCode === 500) {
    console.error("Unhandled Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
