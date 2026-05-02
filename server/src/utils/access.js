const mongoose = require("mongoose");
const Project = require("../models/Project");
const AppError = require("./AppError");

const getProjectAccessFilter = (user) => {
  if (user.role === "admin") {
    return {};
  }

  return mongoose.trusted({
    members: user.id
  });
};

const getAccessibleProjectIds = async (user) => {
  const projects = await Project.find(getProjectAccessFilter(user)).select("_id");
  return projects.map((project) => project._id);
};

const ensureProjectAccess = async (projectId, user) => {
  const project = await Project.findOne({
    _id: projectId,
    ...getProjectAccessFilter(user)
  });

  if (!project) {
    throw new AppError(404, "Project not found or you do not have access to it.");
  }

  return project;
};

module.exports = {
  getProjectAccessFilter,
  getAccessibleProjectIds,
  ensureProjectAccess
};
