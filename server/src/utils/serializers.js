const toId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value.id) {
    return value.id;
  }

  if (value._id) {
    return String(value._id);
  }

  return String(value);
};

const titleCaseRole = (role) => {
  if (!role) {
    return role;
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
};

const serializeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: toId(user),
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: titleCaseRole(user.role),
    availability: user.availability || "Available",
    avatar: user.avatar,
    createdAt: user.createdAt
  };
};

const deriveProjectHealth = (project, metrics = {}) => {
  const now = new Date();
  const dueDate = project?.dueDate ? new Date(project.dueDate) : null;
  const progress = project?.progress || metrics.progress || 0;
  const overdueTasks = metrics.overdueTasks || 0;

  if (project?.status === "Completed" || progress >= 100) {
    return { health: "On Track", healthScore: 100 };
  }

  if ((dueDate && dueDate < now) || overdueTasks > 0) {
    return { health: "Delayed", healthScore: Math.max(20, Math.min(55, progress)) };
  }

  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : 30;

  if (project?.status === "At Risk" || (daysUntilDue <= 7 && progress < 60)) {
    return { health: "At Risk", healthScore: Math.max(45, Math.min(74, progress + 10)) };
  }

  return { health: "On Track", healthScore: Math.max(75, Math.min(99, progress + 20)) };
};

const serializeProject = (project, extra = {}) => {
  if (!project) {
    return null;
  }

  const metrics = extra.metrics || project.metrics;
  const health = deriveProjectHealth(project, metrics);

  return {
    id: toId(project),
    title: project.title,
    description: project.description,
    status: project.status,
    health: health.health,
    healthScore: health.healthScore,
    dueDate: project.dueDate,
    progress: project.progress || 0,
    createdBy:
      typeof project.createdBy === "object" && project.createdBy !== null
        ? serializeUser(project.createdBy)
        : { id: toId(project.createdBy) },
    members: Array.isArray(project.members)
      ? project.members.map((member) => (typeof member === "object" ? serializeUser(member) : { id: toId(member) }))
      : [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ...extra
  };
};

const serializeComment = (comment) => ({
  id: toId(comment),
  text: comment.text,
  createdAt: comment.createdAt,
  user:
    comment.userId && typeof comment.userId === "object"
      ? serializeUser(comment.userId)
      : {
          id: toId(comment.userId)
        }
});

const serializeAttachment = (attachment) => ({
  id: toId(attachment),
  name: attachment.name,
  url: attachment.url
});

const serializeTask = (task, extra = {}) => {
  if (!task) {
    return null;
  }

  return {
    id: toId(task),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    projectId: task.projectId && typeof task.projectId === "object" ? toId(task.projectId) : toId(task.projectId),
    project:
      task.projectId && typeof task.projectId === "object"
        ? {
            id: toId(task.projectId),
            title: task.projectId.title,
            status: task.projectId.status,
            dueDate: task.projectId.dueDate
          }
        : null,
    assignedTo:
      task.assignedTo && typeof task.assignedTo === "object"
        ? serializeUser(task.assignedTo)
        : { id: toId(task.assignedTo) },
    createdBy:
      task.createdBy && typeof task.createdBy === "object"
        ? serializeUser(task.createdBy)
        : { id: toId(task.createdBy) },
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map((subtask) => ({
          id: toId(subtask),
          title: subtask.title,
          completed: Boolean(subtask.completed)
        }))
      : [],
    comments: Array.isArray(task.comments) ? task.comments.map(serializeComment) : [],
    attachments: Array.isArray(task.attachments) ? task.attachments.map(serializeAttachment) : [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    ...extra
  };
};

const serializeActivity = (activity) => ({
  id: toId(activity),
  action: activity.action,
  createdAt: activity.createdAt,
  user: activity.userId && typeof activity.userId === "object" ? serializeUser(activity.userId) : { id: toId(activity.userId) },
  project:
    activity.projectId && typeof activity.projectId === "object"
      ? {
          id: toId(activity.projectId),
          title: activity.projectId.title
        }
      : activity.projectId
        ? { id: toId(activity.projectId) }
        : null,
  task:
    activity.taskId && typeof activity.taskId === "object"
      ? {
          id: toId(activity.taskId),
          title: activity.taskId.title
        }
      : activity.taskId
        ? { id: toId(activity.taskId) }
        : null
});

module.exports = {
  toId,
  serializeUser,
  deriveProjectHealth,
  serializeProject,
  serializeTask,
  serializeActivity
};
