const Activity = require("../models/Activity");

const logActivity = async ({ userId, action, projectId = null, taskId = null }) => {
  await Activity.create({
    userId,
    action,
    projectId,
    taskId
  });
};

module.exports = {
  logActivity
};
