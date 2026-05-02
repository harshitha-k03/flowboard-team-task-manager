const express = require("express");
const { loadDemoWorkspace } = require("../controllers/demo.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/load", verifyToken, checkRole("admin"), loadDemoWorkspace);

module.exports = router;
