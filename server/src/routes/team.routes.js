const express = require("express");
const { getTeam, getTeamWorkload } = require("../controllers/team.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, checkRole("admin"));

router.get("/", getTeam);
router.get("/workload", getTeamWorkload);

module.exports = router;
