/**
 * Middleware for logging HTTP requests
 */
export function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
