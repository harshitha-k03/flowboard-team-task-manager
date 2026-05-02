require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const teamRoutes = require("./routes/team.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const deadlinesRoutes = require("./routes/deadlines.routes");
const demoRoutes = require("./routes/demo.routes");
const { attachRequestContext } = require("./middleware/request.middleware");
const sanitizeRequest = require("./middleware/sanitize.middleware");
const { apiLimiter, authLimiter } = require("./middleware/rateLimit.middleware");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const { getClientOrigins } = require("./utils/env");
const { sendSuccess } = require("./utils/response");

const app = express();

const getDatabaseStatus = () => {
  const readyStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  return readyStates[mongoose.connection.readyState] || "unknown";
};

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(attachRequestContext);

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = getClientOrigins();

      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }

        return callback(new Error("CORS is not configured for this environment."));
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());
app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT || "10kb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT || "10kb" }));
app.use(mongoSanitize());
app.use(sanitizeRequest);
app.use(apiLimiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  const database = getDatabaseStatus();

  sendSuccess(res, {
    statusCode: database === "connected" ? 200 : 503,
    data: {
      status: database === "connected" ? "ok" : "degraded",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database
    }
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/deadlines", deadlinesRoutes);
app.use("/api/demo", demoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
