const express = require("express");
const { body } = require("express-validator");
const { signup, login, googleAuth, getMe } = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
    body("role").optional().isIn(["admin", "member"]).withMessage("Role must be admin or member.")
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required.")
  ],
  validate,
  login
);

router.post(
  "/google",
  [
    body("credential").trim().notEmpty().withMessage("Google credential is required."),
    body("role").optional().isIn(["admin", "member"]).withMessage("Role must be admin or member.")
  ],
  validate,
  googleAuth
);

router.get("/me", verifyToken, getMe);

module.exports = router;
