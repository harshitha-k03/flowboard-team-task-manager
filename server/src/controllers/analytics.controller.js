const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { sendSuccess } = require("../utils/response");
const { startOfWeekUtc, addDaysUtc, startOfDayUtc } = require("../utils/date");

const buildWeeklySeries = (tasks) => {
  const weekStart = startOfWeekUtc(new Date());

  return Array.from({ length: 7 }).map((_, index) => {
    const day = addDaysUtc(weekStart, index);
    const nextDay = addDaysUtc(day, 1);
    const dayTasks = tasks.filter((task) => new Date(task.createdAt) >= day && new Date(task.createdAt) < nextDay);
    const completed = dayTasks.filter((task) => task.status === "Done").length;
    const pending = dayTasks.length - completed;

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      productivity: dayTasks.length ? Math.round((completed / dayTasks.length) * 100) : 0,
      completed,
      total: dayTasks.length,
      pending
    };
  });
};

const getWeeklyAnalytics = async (_req, res) => {
  const [tasks, projects] = await Promise.all([
    Task.find({}).populate("projectId", "title").lean(),
    Project.find({}).lean()
  ]);

  const weeklySeries = buildWeeklySeries(tasks);
  const weekStart = startOfWeekUtc(new Date());
  const weekTasks = tasks.filter((task) => new Date(task.createdAt) >= weekStart);
  const completedThisWeek = weekTasks.filter((task) => task.status === "Done").length;
  const overdueTasks = tasks.filter((task) => task.status !== "Done" && new Date(task.dueDate) < startOfDayUtc(new Date())).length;

  sendSuccess(res, {
    data: {
      kpis: {
        weeklyProductivity: weekTasks.length ? Math.round((completedThisWeek / weekTasks.length) * 100) : 0,
        totalCompletedThisWeek: completedThisWeek,
        totalTasksThisWeek: weekTasks.length,
        overdueTasks,
        projectsOnTrack: projects.filter((project) => project.status === "On Track").length
      },
      weeklyProductivity: weeklySeries,
      completionBars: weeklySeries.map((entry) => ({
        name: entry.label,
        completed: entry.completed,
        pending: entry.pending
      }))
    }
  });
};

const getProductivityAnalytics = async (_req, res) => {
  const [tasks, projects, members] = await Promise.all([
    Task.find({}).populate("assignedTo", "name avatar").lean(),
    Project.find({}).lean(),
    User.find({ role: "member" }).select("name avatar").lean()
  ]);

  const projectProgressSummary = projects.map((project) => ({
    id: `${project._id}`,
    title: project.title,
    progress: project.progress || 0,
    status: project.status
  }));

  const mostProductiveMembers = members
    .map((member) => {
      const memberTasks = tasks.filter((task) => `${task.assignedTo?._id || task.assignedTo}` === `${member._id}`);
      const completed = memberTasks.filter((task) => task.status === "Done").length;
      return {
        id: `${member._id}`,
        name: member.name,
        avatar: member.avatar,
        completed,
        productivity: memberTasks.length ? Math.round((completed / memberTasks.length) * 100) : 0
      };
    })
    .sort((left, right) => right.productivity - left.productivity)
    .slice(0, 5);

  const overdueTrends = Array.from({ length: 4 }).map((_, index) => {
    const start = addDaysUtc(startOfDayUtc(new Date()), -index * 7);
    const end = addDaysUtc(start, 7);
    const count = tasks.filter((task) => task.status !== "Done" && new Date(task.dueDate) >= start && new Date(task.dueDate) < end).length;
    return {
      label: `W-${3 - index}`,
      count
    };
  });

  const distribution = ["Todo", "In Progress", "In Review", "Done", "Blocked"].map((status) => ({
    name: status,
    count: tasks.filter((task) => task.status === status).length
  }));

  sendSuccess(res, {
    data: {
      projectProgressSummary,
      mostProductiveMembers,
      overdueTrends,
      taskDistribution: distribution
    }
  });
};

module.exports = {
  getWeeklyAnalytics,
  getProductivityAnalytics
};
