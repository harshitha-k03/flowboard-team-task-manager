const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { isOverdue } = require("./taskRules");

const statusLabels = ["Todo", "In Progress", "In Review", "Done", "Blocked"];

const buildEmptyProjectMetrics = () => ({
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  progress: 0,
  tasksByStatus: statusLabels.map((status) => ({ status, count: 0 }))
});

const getProjectMetricsMap = async (projectIds) => {
  if (!projectIds.length) {
    return new Map();
  }

  const taskDocs = await Task.find({
    projectId: mongoose.trusted({ $in: projectIds })
  })
    .select("projectId status dueDate")
    .lean();

  const metricsMap = new Map(projectIds.map((projectId) => [`${projectId}`, buildEmptyProjectMetrics()]));

  taskDocs.forEach((task) => {
    const key = `${task.projectId}`;
    const metrics = metricsMap.get(key) || buildEmptyProjectMetrics();
    metrics.totalTasks += 1;

    if (task.status === "Done") {
      metrics.completedTasks += 1;
    } else {
      metrics.pendingTasks += 1;
    }

    if (isOverdue(task.dueDate, task.status)) {
      metrics.overdueTasks += 1;
    }

    metrics.tasksByStatus = metrics.tasksByStatus.map((entry) =>
      entry.status === task.status ? { ...entry, count: entry.count + 1 } : entry
    );

    metrics.progress = metrics.totalTasks ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;
    metricsMap.set(key, metrics);
  });

  return metricsMap;
};

const syncProjectProgress = async (projectId) => {
  const metricsMap = await getProjectMetricsMap([projectId]);
  const metrics = metricsMap.get(`${projectId}`) || buildEmptyProjectMetrics();

  await Project.findByIdAndUpdate(projectId, { progress: metrics.progress });

  return metrics;
};

module.exports = {
  buildEmptyProjectMetrics,
  getProjectMetricsMap,
  syncProjectProgress
};
