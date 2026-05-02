const sanitizeStrings = (value) => {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeStrings(entry));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, entry]) => {
      accumulator[key] = sanitizeStrings(entry);
      return accumulator;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, _res, next) => {
  req.body = sanitizeStrings(req.body);
  req.query = sanitizeStrings(req.query);
  req.params = sanitizeStrings(req.params);
  next();
};

module.exports = sanitizeRequest;
