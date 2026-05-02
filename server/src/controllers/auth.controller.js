const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const { verifyGoogleCredential } = require("../utils/google");
const { comparePassword, hashPassword } = require("../utils/password");
const { getAdminEmails } = require("../utils/env");
const { sendSuccess } = require("../utils/response");
const { serializeUser } = require("../utils/serializers");
const crypto = require("crypto");

const sendAuthResponse = (res, statusCode, user) => {
  const token = generateToken(user);

  sendSuccess(res, {
    statusCode,
    data: {
      token,
      user: serializeUser(user)
    }
  });
};

const resolveRole = async (normalizedEmail, requestedRole) => {
  const adminEmails = getAdminEmails();
  const desiredRole = requestedRole === "admin" ? "admin" : "member";
  const isConfiguredAdmin = adminEmails.includes(normalizedEmail);
  const userCount = await User.countDocuments();
  const allowFirstAdminBootstrap = process.env.ALLOW_FIRST_ADMIN_BOOTSTRAP !== "false";

  return desiredRole === "admin" && (isConfiguredAdmin || (userCount === 0 && allowFirstAdminBootstrap)) ? "admin" : "member";
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError(409, "A user with this email already exists.");
  }

  const role = await resolveRole(normalizedEmail, req.body.role);
  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role
  });

  sendAuthResponse(res, 201, user);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new AppError(400, "Invalid email or password.");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(400, "Invalid email or password.");
  }

  sendAuthResponse(res, 200, user);
};

const googleAuth = async (req, res) => {
  const { credential } = req.body;
  const requestedRole = req.body.role === "admin" ? "admin" : "member";
  const googleProfile = await verifyGoogleCredential(credential);
  const randomPassword = crypto.randomBytes(24).toString("hex");

  let user =
    (await User.findOne({ googleId: googleProfile.googleId }).select("+password")) ||
    (await User.findOne({ email: googleProfile.email }).select("+password"));

  if (user) {
    if (!user.googleId) {
      user.googleId = googleProfile.googleId;
    }

    if ((!user.avatar || user.avatar.includes("ui-avatars.com/api/")) && googleProfile.avatar) {
      user.avatar = googleProfile.avatar;
    }

    if (!user.password) {
      user.password = randomPassword;
    }

    await user.save();
    sendAuthResponse(res, 200, user);
    return;
  }

  const role = await resolveRole(googleProfile.email, requestedRole);

  user = await User.create({
    name: googleProfile.name,
    email: googleProfile.email,
    password: randomPassword,
    googleId: googleProfile.googleId,
    avatar: googleProfile.avatar,
    role
  });

  sendAuthResponse(res, 200, user);
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  sendSuccess(res, {
    data: {
      user: serializeUser(user)
    }
  });
};

module.exports = {
  signup,
  login,
  googleAuth,
  getMe
};
