const mongoose = require("mongoose");
const { getAccessibleProjectIds } = require("./access");

const getTaskScopeForUser = async (user) => {
  if (user.role === "member") {
    return {
      assignedTo: new mongoose.Types.ObjectId(user.id)
    };
  }

  const projectIds = await getAccessibleProjectIds(user);

  return {
    projectId: mongoose.trusted({ $in: projectIds })
  };
};

module.exports = {
  getTaskScopeForUser
};
