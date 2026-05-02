const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { ensureDemoUsers } = require("./utils/seedDemoUsers");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  await connectDB();
  await ensureDemoUsers();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(async () => {
      try {
        const mongoose = require("mongoose");
        await mongoose.connection.close(false);
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
