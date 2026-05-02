const express = require("express");
const { getWeeklyAnalytics, getProductivityAnalytics } = require("../controllers/analytics.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, checkRole("admin"));

router.get("/weekly", getWeeklyAnalytics);
router.get("/productivity", getProductivityAnalytics);

module.exports = router;
