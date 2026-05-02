const express = require("express");
const { getDeadlines } = require("../controllers/deadlines.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, checkRole("admin"));

router.get("/", getDeadlines);

module.exports = router;
