const { randomUUID } = require("crypto");

const attachRequestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};

module.exports = {
  attachRequestContext
};
