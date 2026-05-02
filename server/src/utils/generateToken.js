const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: process.env.JWT_ISSUER || "flowboard",
      audience: process.env.JWT_AUDIENCE || "flowboard-client",
      algorithm: "HS256"
    }
  );
};

module.exports = generateToken;
