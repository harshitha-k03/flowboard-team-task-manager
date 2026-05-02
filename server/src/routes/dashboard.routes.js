const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const {
  getDashboardStats,
  getDashboardActivity,
  getDashboardReminders
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(verifyToken);

router.get("/stats", getDashboardStats);
router.get("/activity", getDashboardActivity);
router.get("/reminders", getDashboardReminders);

module.exports = router;
