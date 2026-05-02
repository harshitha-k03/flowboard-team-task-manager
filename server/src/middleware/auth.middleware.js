const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const verifyToken = async (req, _res, next) => {
  if (!process.env.JWT_SECRET) {
    return next(new AppError(500, "Authentication is not configured on the server."));
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: process.env.JWT_ISSUER || "flowboard",
      audience: process.env.JWT_AUDIENCE || "flowboard-client"
    });
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new AppError(401, "User no longer exists."));
    }

    req.user = {
      id: user.id,
      role: user.role
    };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError(401, "Session expired. Please log in again."));
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return next(new AppError(401, "Invalid authentication token."));
    }

    return next(new AppError(401, "Invalid authentication token."));
  }
};

const checkRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to perform this action."));
    }

    return next();
  };

module.exports = {
  verifyToken,
  checkRole
};
