const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new AppError(
      400,
      "Validation failed.",
      errors.array().map((issue) => ({
        field: issue.path,
        message: issue.msg
      }))
    )
  );
};

module.exports = validate;
