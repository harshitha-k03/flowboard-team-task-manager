const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const AppError = require("../utils/AppError");
const { ensureProjectAccess, getAccessibleProjectIds } = require("../utils/access");
const { logActivity } = require("../utils/activity");
const { sendSuccess } = require("../utils/response");
const { serializeActivity, serializeTask } = require("../utils/serializers");
const { syncProjectProgress } = require("../utils/projectMetrics");
const { calculatePriority, normalizeDueDate } = require("../utils/taskRules");

const buildSearchRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const mapAttachments = (attachments) =>
  Array.isArray(attachments)
    ? attachments
        .map((attachment) => ({
          name: attachment.name?.trim(),
          url: attachment.url?.trim()
        }))
        .filter((attachment) => attachment.name && attachment.url)
    : [];

const populateTask = (query) =>
  query
    .populate("assignedTo", "name email role avatar availability")
    .populate("createdBy", "name email role avatar availability")
    .populate("projectId", "title status dueDate progress")
    .populate("comments.userId", "name email role avatar availability")
    .lean();

const ensureTaskAccess = async (taskId, user) => {
  const task = await Task.findById(taskId)
    .populate("projectId")
    .populate("assignedTo", "name email role avatar availability")
    .populate("createdBy", "name email role avatar availability")
    .populate("comments.userId", "name email role avatar availability");

  if (!task) {
    throw new AppError(404, "Task not found.");
  }

  const project = await ensureProjectAccess(task.projectId._id, user);

  if (user.role === "member" && `${task.assignedTo._id || task.assignedTo}` !== `${user.id}`) {
    throw new AppError(403, "You can only access tasks assigned to you.");
  }

  return { task, project };
};

const ensureAssigneeBelongsToProject = (project, assigneeId) => {
  const isMember = project.members.some((memberId) => `${memberId}` === `${assigneeId}`);

  if (!isMember) {
    throw new AppError(400, "The selected assignee must belong to the project team.");
  }
};

const listTasks = async (req, res) => {
  const { status, priority, dueDate, project: projectId, assignee, search } = req.query;
  const scope = {};

  if (req.user.role === "member") {
    scope.assignedTo = req.user.id;
  } else if (assignee) {
    scope.assignedTo = assignee;
  }

  if (projectId) {
    await ensureProjectAccess(projectId, req.user);
    scope.projectId = projectId;
  } else if (req.user.role === "admin") {
    const accessibleProjectIds = await getAccessibleProjectIds(req.user);
    scope.projectId = mongoose.trusted({ $in: accessibleProjectIds });
  }

  if (status) {
    scope.status = status;
  }

  if (priority) {
    scope.priority = priority;
  }

  if (dueDate === "today") {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
    scope.dueDate = mongoose.trusted({ $gte: start, $lte: end });
  }

  if (dueDate === "overdue") {
    scope.dueDate = mongoose.trusted({ $lt: new Date() });
    scope.status = mongoose.trusted({ $ne: "Done" });
  }

  if (dueDate === "week") {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    scope.dueDate = mongoose.trusted({ $gte: start, $lte: end });
  }

  if (search?.trim()) {
    scope.$or = mongoose.trusted([
      { title: buildSearchRegex(search.trim()) },
      { description: buildSearchRegex(search.trim()) }
    ]);
  }

  const tasks = await populateTask(Task.find(scope).sort({ dueDate: 1, updatedAt: -1 }));

  sendSuccess(res, {
    data: tasks.map((task) => serializeTask(task))
  });
};

const createTask = async (req, res) => {
  const project = await ensureProjectAccess(req.body.projectId, req.user);
  ensureAssigneeBelongsToProject(project, req.body.assignedTo);

  const dueDate = normalizeDueDate(req.body.dueDate);
  const status = req.body.status || "Todo";
  const priority = calculatePriority({ dueDate, status });

  const task = await Task.create({
    title: req.body.title.trim(),
    description: req.body.description?.trim() || "",
    projectId: project._id,
    assignedTo: req.body.assignedTo,
    createdBy: req.user.id,
    status,
    priority,
    dueDate,
    estimatedHours: Number(req.body.estimatedHours) || 4,
    subtasks: Array.isArray(req.body.subtasks)
      ? req.body.subtasks
          .map((subtask) => ({
            title: subtask.title?.trim(),
            completed: Boolean(subtask.completed)
          }))
          .filter((subtask) => subtask.title)
      : [],
    attachments: mapAttachments(req.body.attachments)
  });

  await syncProjectProgress(project._id);
  await logActivity({
    userId: req.user.id,
    action: `Created task ${task.title}`,
    projectId: project._id,
    taskId: task._id
  });

  const populatedTask = await populateTask(Task.findById(task._id));

  sendSuccess(res, {
    statusCode: 201,
    data: serializeTask(populatedTask)
  });
};

const getTaskById = async (req, res) => {
  const { task } = await ensureTaskAccess(req.params.id, req.user);
  const activity = await Activity.find({ taskId: task._id })
    .populate("userId", "name email role avatar availability")
    .populate("projectId", "title")
    .populate("taskId", "title")
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, {
    data: {
      task: serializeTask(task),
      activity: activity.map(serializeActivity)
    }
  });
};

const updateTask = async (req, res) => {
  const { task } = await ensureTaskAccess(req.params.id, req.user);

  if (req.user.role === "member") {
    const allowedFields = ["status", "subtasks"];
    const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));

    if (invalidFields.length) {
      throw new AppError(403, "Members can only update task status.");
    }
  }

  let projectIdToSync = task.projectId._id || task.projectId;

  if (req.body.projectId && req.user.role === "admin" && `${req.body.projectId}` !== `${task.projectId._id}`) {
    const nextProject = await ensureProjectAccess(req.body.projectId, req.user);
    projectIdToSync = [task.projectId._id, nextProject._id];
    task.projectId = nextProject._id;

    if (req.body.assignedTo) {
      ensureAssigneeBelongsToProject(nextProject, req.body.assignedTo);
    }
  }

  if (req.body.assignedTo && req.user.role === "admin") {
    const project = await Project.findById(task.projectId._id || task.projectId);
    ensureAssigneeBelongsToProject(project, req.body.assignedTo);
    task.assignedTo = req.body.assignedTo;
  }

  if (req.body.title !== undefined && req.user.role === "admin") {
    task.title = req.body.title.trim();
  }

  if (req.body.description !== undefined && req.user.role === "admin") {
    task.description = req.body.description.trim();
  }

  if (req.body.status !== undefined) {
    task.status = req.body.status;
  }

  if (req.body.dueDate !== undefined && req.user.role === "admin") {
    task.dueDate = normalizeDueDate(req.body.dueDate);
  }

  if (req.body.estimatedHours !== undefined && req.user.role === "admin") {
    task.estimatedHours = Number(req.body.estimatedHours) || task.estimatedHours;
  }

  if (req.body.subtasks !== undefined) {
    task.subtasks = Array.isArray(req.body.subtasks)
      ? req.body.subtasks
          .map((subtask) => ({
            title: subtask.title?.trim(),
            completed: Boolean(subtask.completed)
          }))
          .filter((subtask) => subtask.title)
      : [];
  }

  if (req.body.attachments !== undefined && req.user.role === "admin") {
    task.attachments = mapAttachments(req.body.attachments);
  }

  task.priority = calculatePriority({
    dueDate: task.dueDate,
    status: task.status
  });

  await task.save();

  const projectsToSync = Array.isArray(projectIdToSync) ? projectIdToSync : [projectIdToSync];
  await Promise.all(projectsToSync.map((projectId) => syncProjectProgress(projectId)));

  await logActivity({
    userId: req.user.id,
    action: `Updated task ${task.title}`,
    projectId: task.projectId._id || task.projectId,
    taskId: task._id
  });

  const updatedTask = await populateTask(Task.findById(task._id));

  sendSuccess(res, {
    data: serializeTask(updatedTask)
  });
};

const patchTaskStatus = async (req, res) => {
  const { task } = await ensureTaskAccess(req.params.id, req.user);
  task.status = req.body.status;
  task.priority = calculatePriority({
    dueDate: task.dueDate,
    status: task.status
  });
  await task.save();

  await syncProjectProgress(task.projectId._id || task.projectId);
  await logActivity({
    userId: req.user.id,
    action: `Changed task status for ${task.title} to ${task.status}`,
    projectId: task.projectId._id || task.projectId,
    taskId: task._id
  });

  const updatedTask = await populateTask(Task.findById(task._id));

  sendSuccess(res, {
    data: serializeTask(updatedTask)
  });
};

const addComment = async (req, res) => {
  const { task } = await ensureTaskAccess(req.params.id, req.user);
  task.comments.push({
    userId: req.user.id,
    text: req.body.text.trim()
  });
  await task.save();

  await logActivity({
    userId: req.user.id,
    action: `Commented on task ${task.title}`,
    projectId: task.projectId._id || task.projectId,
    taskId: task._id
  });

  const updatedTask = await populateTask(Task.findById(task._id));

  sendSuccess(res, {
    statusCode: 201,
    data: serializeTask(updatedTask)
  });
};

const deleteTask = async (req, res) => {
  const { task } = await ensureTaskAccess(req.params.id, req.user);
  const projectId = task.projectId._id || task.projectId;

  await Activity.deleteMany({ taskId: task._id });
  await task.deleteOne();
  await syncProjectProgress(projectId);

  sendSuccess(res, {
    data: {
      deleted: true
    }
  });
};

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  patchTaskStatus,
  addComment
};
