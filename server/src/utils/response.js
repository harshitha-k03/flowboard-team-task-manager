const sendSuccess = (res, { statusCode = 200, message = null, data = {}, meta = null } = {}) => {
  const payload = {
    success: true,
    data
  };

  if (message) {
    payload.message = message;
  }

  if (meta) {
    payload.meta = meta;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess
};
