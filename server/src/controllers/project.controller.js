const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { ensureProjectAccess, getProjectAccessFilter } = require("../utils/access");
const { logActivity } = require("../utils/activity");
const { sendSuccess } = require("../utils/response");
const { serializeActivity, serializeProject, serializeTask, serializeUser } = require("../utils/serializers");
const { buildEmptyProjectMetrics, getProjectMetricsMap, syncProjectProgress } = require("../utils/projectMetrics");

const populateProject = (query) =>
  query
    .populate("createdBy", "name email role avatar availability createdAt")
    .populate("members", "name email role avatar availability createdAt")
    .lean();

const resolveMemberIds = async (memberIds = [], creatorId) => {
  const normalizedIds = [...new Set(memberIds.filter(Boolean).map((id) => `${id}`))];
  const uniqueIds = normalizedIds.includes(`${creatorId}`) ? normalizedIds : [...normalizedIds, `${creatorId}`];

  const users = await User.find({
    _id: mongoose.trusted({ $in: uniqueIds })
  }).select("_id");

  if (users.length !== uniqueIds.length) {
    throw new AppError(400, "One or more selected team members could not be found.");
  }

  return uniqueIds;
};

const getProjects = async (req, res) => {
  const { search = "", status } = req.query;
  const query = {
    ...getProjectAccessFilter(req.user)
  };

  if (status) {
    query.status = status;
  }

  if (search.trim()) {
    query.title = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const projects = await populateProject(Project.find(query).sort({ dueDate: 1, createdAt: -1 }));
  const metricsMap = await getProjectMetricsMap(projects.map((project) => project._id));

  sendSuccess(res, {
    data: projects.map((project) => {
      const metrics = metricsMap.get(`${project._id}`) || buildEmptyProjectMetrics();
      return serializeProject(project, { metrics });
    })
  });
};

const createProject = async (req, res) => {
  const memberIds = await resolveMemberIds(req.body.memberIds || [], req.user.id);

  const project = await Project.create({
    title: req.body.title.trim(),
    description: req.body.description?.trim() || "",
    status: req.body.status || "Planning",
    dueDate: new Date(req.body.dueDate),
    createdBy: req.user.id,
    members: memberIds
  });

  await logActivity({
    userId: req.user.id,
    action: `Created project ${project.title}`,
    projectId: project._id
  });

  const populatedProject = await populateProject(Project.findById(project._id));

  sendSuccess(res, {
    statusCode: 201,
    data: serializeProject(populatedProject, { metrics: buildEmptyProjectMetrics() })
  });
};

const getProjectById = async (req, res) => {
  const projectDoc = await ensureProjectAccess(req.params.id, req.user);
  const project = await populateProject(Project.findById(projectDoc._id));

  if (!project) {
    throw new AppError(404, "Project not found.");
  }

  const taskScope =
    req.user.role === "member"
      ? { projectId: project._id, assignedTo: req.user.id }
      : { projectId: project._id };

  const [tasks, activity, metricsMap] = await Promise.all([
    Task.find(taskScope)
      .populate("assignedTo", "name email role avatar availability")
      .populate("createdBy", "name email role avatar availability")
      .populate("projectId", "title status dueDate")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean(),
    Activity.find({ projectId: project._id })
      .populate("userId", "name email role avatar availability")
      .populate("projectId", "title")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
    getProjectMetricsMap([project._id])
  ]);

  const metrics = metricsMap.get(`${project._id}`) || buildEmptyProjectMetrics();
  const teamWorkload = project.members.map((member) => {
    const memberTasks = tasks.filter((task) => `${task.assignedTo?._id || task.assignedTo}` === `${member._id}`);
    const openTasks = memberTasks.filter((task) => task.status !== "Done").length;
    const completedTasks = memberTasks.filter((task) => task.status === "Done").length;
    const productivity = memberTasks.length ? Math.round((completedTasks / memberTasks.length) * 100) : 0;

    return {
      ...serializeUser(member),
      openTasks,
      completedTasks,
      productivity
    };
  });

  const milestones = [
    { id: "brief", title: "Project kickoff", status: project.status === "Planning" ? "active" : "done", date: project.createdAt },
    { id: "build", title: "Execution phase", status: project.progress >= 50 ? "done" : "active", date: project.dueDate },
    { id: "launch", title: "Delivery target", status: project.progress === 100 ? "done" : "upcoming", date: project.dueDate }
  ];

  sendSuccess(res, {
    data: {
      project: serializeProject(project, { metrics }),
      tasks: tasks.map((task) => serializeTask(task)),
      metrics,
      activity: activity.map(serializeActivity),
      team: teamWorkload,
      milestones
    }
  });
};

const updateProject = async (req, res) => {
  const project = await ensureProjectAccess(req.params.id, req.user);

  if (req.body.title !== undefined) {
    project.title = req.body.title.trim();
  }

  if (req.body.description !== undefined) {
    project.description = req.body.description.trim();
  }

  if (req.body.status !== undefined) {
    project.status = req.body.status;
  }

  if (req.body.dueDate !== undefined) {
    project.dueDate = new Date(req.body.dueDate);
  }

  if (req.body.memberIds !== undefined) {
    project.members = await resolveMemberIds(req.body.memberIds, project.createdBy);
  }

  await project.save();

  await logActivity({
    userId: req.user.id,
    action: `Updated project ${project.title}`,
    projectId: project._id
  });

  const metrics = await syncProjectProgress(project._id);
  const updatedProject = await populateProject(Project.findById(project._id));

  sendSuccess(res, {
    data: serializeProject(updatedProject, { metrics })
  });
};

const deleteProject = async (req, res) => {
  const project = await ensureProjectAccess(req.params.id, req.user);

  await Activity.deleteMany({ projectId: project._id });
  await Task.deleteMany({ projectId: project._id });
  await project.deleteOne();

  sendSuccess(res, {
    data: {
      deleted: true
    }
  });
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};
