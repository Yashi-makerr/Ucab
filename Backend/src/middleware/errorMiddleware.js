/**
 * Central Express Error Handler
 * Must be registered LAST in app.js (after all routes).
 * Usage: throw an error from any controller and it lands here.
 */
const errorHandler = (err, req, res, next) => {
    // Use status already set on the error, or default to 500
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Only expose stack trace in development for security
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

/**
 * 404 Not Found handler
 * Place this BEFORE errorHandler but AFTER all routes.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
