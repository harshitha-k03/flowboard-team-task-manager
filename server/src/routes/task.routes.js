const express = require("express");
const { body, param, query } = require("express-validator");
const {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  patchTaskStatus,
  addComment
} = require("../controllers/task.controller");
const { verifyToken, checkRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

router.use(verifyToken);

router
  .route("/")
  .get(
    [
      query("status")
        .optional()
        .isIn(["Todo", "In Progress", "In Review", "Done", "Blocked"])
        .withMessage("Invalid task status filter."),
      query("priority")
        .optional()
        .isIn(["Critical", "High", "Medium", "Low"])
        .withMessage("Invalid task priority filter."),
      query("dueDate").optional().isIn(["today", "week", "overdue"]).withMessage("Invalid due date filter."),
      query("project").optional().isMongoId().withMessage("Invalid project filter."),
      query("assignee").optional().isMongoId().withMessage("Invalid assignee filter."),
      query("search").optional().trim().isLength({ max: 120 }).withMessage("Search query is too long.")
    ],
    validate,
    listTasks
  )
  .post(
    checkRole("admin"),
    [
      body("title").trim().notEmpty().withMessage("Task title is required."),
      body("description").optional().trim().isLength({ max: 1500 }).withMessage("Task description is too long."),
      body("projectId").isMongoId().withMessage("Task project is required."),
      body("assignedTo").isMongoId().withMessage("Task assignee is required."),
      body("status")
        .optional()
        .isIn(["Todo", "In Progress", "In Review", "Done", "Blocked"])
        .withMessage("Invalid task status."),
      body("dueDate").isISO8601().withMessage("Task due date is required."),
      body("estimatedHours").optional().isNumeric().withMessage("Estimated hours must be numeric."),
      body("subtasks").optional().isArray().withMessage("Subtasks must be an array."),
      body("attachments").optional().isArray().withMessage("Attachments must be an array."),
      body("attachments.*.name").optional().trim().notEmpty().withMessage("Attachment name is required."),
      body("attachments.*.url").optional().isURL().withMessage("Attachment URL must be valid.")
    ],
    validate,
    createTask
  );

router
  .route("/:id")
  .get([param("id").isMongoId().withMessage("Invalid task id."), validate], getTaskById)
  .put(
    [
      param("id").isMongoId().withMessage("Invalid task id."),
      body("title").optional().trim().notEmpty().withMessage("Task title cannot be empty."),
      body("description").optional().trim().isLength({ max: 1500 }).withMessage("Task description is too long."),
      body("projectId").optional().isMongoId().withMessage("A valid project is required."),
      body("assignedTo").optional().isMongoId().withMessage("A valid assignee is required."),
      body("status")
        .optional()
        .isIn(["Todo", "In Progress", "In Review", "Done", "Blocked"])
        .withMessage("Invalid task status."),
      body("dueDate").optional().isISO8601().withMessage("A valid due date is required."),
      body("estimatedHours").optional().isNumeric().withMessage("Estimated hours must be numeric."),
      body("subtasks").optional().isArray().withMessage("Subtasks must be an array."),
      body("attachments").optional().isArray().withMessage("Attachments must be an array."),
      body("attachments.*.name").optional().trim().notEmpty().withMessage("Attachment name is required."),
      body("attachments.*.url").optional().isURL().withMessage("Attachment URL must be valid.")
    ],
    validate,
    updateTask
  )
  .delete(
    checkRole("admin"),
    [param("id").isMongoId().withMessage("Invalid task id."), validate],
    deleteTask
  );

router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid task id."),
    body("status")
      .isIn(["Todo", "In Progress", "In Review", "Done", "Blocked"])
      .withMessage("Invalid task status.")
  ],
  validate,
  patchTaskStatus
);

router.post(
  "/:id/comments",
  [
    param("id").isMongoId().withMessage("Invalid task id."),
    body("text").trim().notEmpty().withMessage("Comment text is required.").isLength({ max: 500 }).withMessage("Comment is too long.")
  ],
  validate,
  addComment
);

module.exports = router;
