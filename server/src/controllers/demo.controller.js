const generateToken = require("../utils/generateToken");
const { sendSuccess } = require("../utils/response");
const { serializeUser } = require("../utils/serializers");
const { seedWorkspace } = require("../seed");

const loadDemoWorkspace = async (_req, res) => {
  const { adminUser, summary } = await seedWorkspace({ manageConnection: false });
  const token = generateToken(adminUser);

  sendSuccess(res, {
    data: {
      summary,
      session: {
        token,
        user: serializeUser(adminUser)
      }
    },
    message: "Demo workspace loaded."
  });
};

module.exports = {
  loadDemoWorkspace
};
