const AppError = require("../utils/AppError");

const notFound = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (error, req, res, _next) => {
  let err = error;

  if (!(err instanceof AppError)) {
    console.error(error);
    if (err.name === "ValidationError") {
      const details = Object.values(err.errors).map((issue) => ({
        field: issue.path,
        message: issue.message
      }));
      err = new AppError(400, "Validation failed.", details);
    } else if (err.name === "CastError") {
      err = new AppError(400, "Invalid resource identifier.");
    } else if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0] || "resource";
      err = new AppError(409, `${duplicateField} already exists.`);
    } else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      err = new AppError(400, "Invalid JSON payload.");
    } else if (err.message === "Not allowed by CORS") {
      err = new AppError(403, "Origin is not allowed by CORS policy.");
    } else if (err.message === "Not allowed by CORS.") {
      err = new AppError(403, "Origin is not allowed by CORS policy.");
    } else if (err.message === "CORS is not configured for this environment.") {
      err = new AppError(500, "CORS is not configured for this environment.");
    } else {
      err = new AppError(500, process.env.NODE_ENV === "production" ? "Internal server error." : err.message);
    }
  }

  const response = {
    success: false,
    data: null,
    statusCode: err.statusCode || 500,
    message: err.message,
    requestId: req.requestId
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  if (err.statusCode >= 500 || process.env.NODE_ENV === "development") {
    console.error(
      JSON.stringify({
        level: "error",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: err.statusCode || 500,
        message: err.message
      })
    );
  }

  res.status(err.statusCode || 500).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
