const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { getProjectAccessFilter } = require("../utils/access");
const { sendSuccess } = require("../utils/response");
const { serializeActivity, serializeProject, serializeTask, serializeUser } = require("../utils/serializers");
const { getProjectMetricsMap } = require("../utils/projectMetrics");
const { getTaskScopeForUser } = require("../utils/scope");
const { buildReminderMessage, buildReminderType } = require("../utils/taskRules");
const { addDaysUtc, startOfDayUtc, startOfWeekUtc } = require("../utils/date");

const getDashboardStats = async (req, res) => {
  const taskScope = await getTaskScopeForUser(req.user);
  const projectScope = getProjectAccessFilter(req.user);
  const weekStart = startOfWeekUtc(new Date());
  const today = startOfDayUtc(new Date());
  const weekLabels = Array.from({ length: 7 }).map((_, index) => addDaysUtc(weekStart, index));

  const [tasks, projects, users] = await Promise.all([
    Task.find(taskScope)
      .populate("assignedTo", "name email role avatar availability")
      .lean(),
    Project.find(projectScope)
      .populate("members", "name email role avatar availability")
      .populate("createdBy", "name email role avatar availability")
      .lean(),
    User.find({ role: "member" }).select("name email role avatar availability createdAt").lean()
  ]);

  const projectMetricsMap = await getProjectMetricsMap(projects.map((project) => project._id));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const pendingTasks = tasks.filter((task) => task.status !== "Done").length;
  const overdueTasks = tasks.filter((task) => task.status !== "Done" && new Date(task.dueDate) < today).length;
  const thisWeekTasks = tasks.filter((task) => new Date(task.createdAt) >= weekStart);
  const completedThisWeek = thisWeekTasks.filter((task) => task.status === "Done").length;
  const weeklyProductivity = thisWeekTasks.length ? Math.round((completedThisWeek / thisWeekTasks.length) * 100) : 0;

  const weeklyProductivitySeries = weekLabels.map((date) => {
    const nextDate = addDaysUtc(date, 1);
    const dayTasks = tasks.filter((task) => new Date(task.createdAt) >= date && new Date(task.createdAt) < nextDate);
    const dayCompleted = dayTasks.filter((task) => task.status === "Done").length;
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      total: dayTasks.length,
      completed: dayCompleted,
      productivity: dayTasks.length ? Math.round((dayCompleted / dayTasks.length) * 100) : 0
    };
  });

  const projectProgress = projects.slice(0, 6).map((project) => {
    const metrics = projectMetricsMap.get(`${project._id}`) || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      progress: project.progress || 0,
      tasksByStatus: []
    };

    return serializeProject(project, {
      metrics
    });
  });
  const todayFocus = tasks
    .filter((task) => {
      const dueDate = new Date(task.dueDate);
      const isToday = dueDate >= today && dueDate < addDaysUtc(today, 1);
      const isHighPriority = ["Critical", "High"].includes(task.priority);
      return task.status !== "Done" && (isToday || isHighPriority);
    })
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .slice(0, 5)
    .map((task) => serializeTask(task));

  const workloadSource = req.user.role === "admin" ? users : users.filter((user) => `${user._id}` === `${req.user.id}`);
  const workloadBalance = workloadSource.map((user) => {
    const memberTasks = tasks.filter((task) => `${task.assignedTo?._id || task.assignedTo}` === `${user._id}`);
    const openTasks = memberTasks.filter((task) => task.status !== "Done").length;
    const doneTasks = memberTasks.filter((task) => task.status === "Done").length;
    return {
      ...serializeUser(user),
      openTasks,
      completedTasks: doneTasks,
      productivity: memberTasks.length ? Math.round((doneTasks / memberTasks.length) * 100) : 0
    };
  });

  sendSuccess(res, {
    data: {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayFocus,
      weeklyProductivity,
      weeklyProductivitySeries,
      projectProgress,
      workloadBalance
    }
  });
};

const getDashboardActivity = async (req, res) => {
  const projectScope = getProjectAccessFilter(req.user);
  const projectIds = await Project.find(projectScope).distinct("_id");
  const filter =
    req.user.role === "member"
      ? {
          $or: [{ userId: req.user.id }, { projectId: mongoose.trusted({ $in: projectIds }) }]
        }
      : {
          projectId: mongoose.trusted({ $in: projectIds })
        };

  const activity = await Activity.find(filter)
    .populate("userId", "name email role avatar availability")
    .populate("projectId", "title")
    .populate("taskId", "title")
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  sendSuccess(res, {
    data: activity.map(serializeActivity)
  });
};

const getDashboardReminders = async (req, res) => {
  const taskScope = await getTaskScopeForUser(req.user);
  const now = new Date();
  const nextWeek = addDaysUtc(now, 7);

  const tasks = await Task.find({
    ...taskScope,
    status: mongoose.trusted({ $ne: "Done" }),
    dueDate: mongoose.trusted({ $lte: nextWeek })
  })
    .populate("projectId", "title")
    .sort({ dueDate: 1 })
    .limit(10)
    .lean();

  sendSuccess(res, {
    data: tasks.map((task) => ({
      id: `${task._id}`,
      title: task.title,
      dueDate: task.dueDate,
      projectTitle: task.projectId?.title || "Unknown project",
      type: buildReminderType(task, now),
      message: buildReminderMessage(task, now)
    }))
  });
};

module.exports = {
  getDashboardStats,
  getDashboardActivity,
  getDashboardReminders
};
