const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require("../controllers/project.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

router.use(verifyToken);

router
  .route("/")
  .get(
    [
      query("search").optional().trim().isLength({ max: 120 }).withMessage("Search query is too long."),
      query("status")
        .optional()
        .isIn(["Planning", "In Progress", "On Track", "At Risk", "Completed"])
        .withMessage("Invalid project status filter.")
    ],
    validate,
    getProjects
  )
  .post(
    checkRole("admin"),
    [
      body("title").trim().notEmpty().withMessage("Project title is required."),
      body("description").optional().trim().isLength({ max: 1000 }).withMessage("Project description is too long."),
      body("status")
        .optional()
        .isIn(["Planning", "In Progress", "On Track", "At Risk", "Completed"])
        .withMessage("Invalid project status."),
      body("dueDate").isISO8601().withMessage("Project due date is required."),
      body("memberIds").optional().isArray().withMessage("memberIds must be an array."),
      body("memberIds.*").optional().isMongoId().withMessage("Each member id must be valid.")
    ],
    validate,
    createProject
  );

router
  .route("/:id")
  .get([param("id").isMongoId().withMessage("Invalid project id."), validate], getProjectById)
  .put(
    checkRole("admin"),
    [
      param("id").isMongoId().withMessage("Invalid project id."),
      body("title").optional().trim().notEmpty().withMessage("Project title cannot be empty."),
      body("description").optional().trim().isLength({ max: 1000 }).withMessage("Project description is too long."),
      body("status")
        .optional()
        .isIn(["Planning", "In Progress", "On Track", "At Risk", "Completed"])
        .withMessage("Invalid project status."),
      body("dueDate").optional().isISO8601().withMessage("A valid due date is required."),
      body("memberIds").optional().isArray().withMessage("memberIds must be an array."),
      body("memberIds.*").optional().isMongoId().withMessage("Each member id must be valid.")
    ],
    validate,
    updateProject
  )
  .delete(
    checkRole("admin"),
    [param("id").isMongoId().withMessage("Invalid project id."), validate],
    deleteProject
  );

module.exports = router;
