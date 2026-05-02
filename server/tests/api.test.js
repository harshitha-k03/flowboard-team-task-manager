process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1d";
process.env.JWT_ISSUER = "flowboard";
process.env.JWT_AUDIENCE = "flowboard-client";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.ALLOW_FIRST_ADMIN_BOOTSTRAP = "true";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Project = require("../src/models/Project");
const Task = require("../src/models/Task");
const Activity = require("../src/models/Activity");

let mongoServer;

beforeAll(async () => {
  mongoose.set("strictQuery", true);
  mongoose.set("sanitizeFilter", true);
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  process.env.ADMIN_EMAILS = "";
  await Promise.all([Activity.deleteMany({}), Task.deleteMany({}), Project.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("FlowBoard API", () => {
  it("exposes a health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("supports auth, admin project/task management, member status updates, and analytics endpoints", async () => {
    const adminSignup = await request(app).post("/api/auth/signup").send({
      name: "Admin User",
      email: "admin@flowboard.com",
      password: "123456",
      role: "admin"
    });

    const memberSignup = await request(app).post("/api/auth/signup").send({
      name: "Member User",
      email: "member@flowboard.com",
      password: "123456",
      role: "member"
    });

    expect(adminSignup.statusCode).toBe(201);
    expect(adminSignup.body.data.user.role).toBe("admin");
    expect(memberSignup.statusCode).toBe(201);

    const adminToken = adminSignup.body.data.token;
    const memberToken = memberSignup.body.data.token;
    const memberId = memberSignup.body.data.user.id;

    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Website Redesign",
        description: "Refresh the marketing site",
        status: "In Progress",
        dueDate: "2030-06-15",
        memberIds: [memberId]
      });

    expect(projectResponse.statusCode).toBe(201);
    expect(projectResponse.body.data.title).toBe("Website Redesign");

    const taskResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Design login experience",
        description: "Create login UI and validation",
        projectId: projectResponse.body.data.id,
        assignedTo: memberId,
        status: "Todo",
        dueDate: "2030-06-10",
        estimatedHours: 8,
        subtasks: [{ title: "Create login UI" }, { title: "Connect login API" }]
      });

    expect(taskResponse.statusCode).toBe(201);
    expect(taskResponse.body.data.priority).toBeDefined();

    const memberTasks = await request(app).get("/api/tasks").set("Authorization", `Bearer ${memberToken}`);
    expect(memberTasks.statusCode).toBe(200);
    expect(memberTasks.body.data).toHaveLength(1);

    const memberStatusUpdate = await request(app)
      .patch(`/api/tasks/${taskResponse.body.data.id}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "Done" });

    expect(memberStatusUpdate.statusCode).toBe(200);
    expect(memberStatusUpdate.body.data.status).toBe("Done");

    const memberDeleteAttempt = await request(app)
      .delete(`/api/tasks/${taskResponse.body.data.id}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(memberDeleteAttempt.statusCode).toBe(403);

    const commentResponse = await request(app)
      .post(`/api/tasks/${taskResponse.body.data.id}/comments`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ text: "Completed and ready for review." });

    expect(commentResponse.statusCode).toBe(201);
    expect(commentResponse.body.data.comments.length).toBeGreaterThan(0);

    const taskDetails = await request(app)
      .get(`/api/tasks/${taskResponse.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(taskDetails.statusCode).toBe(200);
    expect(taskDetails.body.data.task.title).toBe("Design login experience");
    expect(taskDetails.body.data.activity.length).toBeGreaterThan(0);

    const projectDetails = await request(app)
      .get(`/api/projects/${projectResponse.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(projectDetails.statusCode).toBe(200);
    expect(projectDetails.body.data.tasks).toHaveLength(1);

    const dashboardStats = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(dashboardStats.statusCode).toBe(200);
    expect(dashboardStats.body.data.totalTasks).toBe(1);

    const dashboardActivity = await request(app)
      .get("/api/dashboard/activity")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(dashboardActivity.statusCode).toBe(200);
    expect(dashboardActivity.body.data.length).toBeGreaterThan(0);

    const dashboardReminders = await request(app)
      .get("/api/dashboard/reminders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(dashboardReminders.statusCode).toBe(200);

    const teamResponse = await request(app).get("/api/team").set("Authorization", `Bearer ${adminToken}`);
    expect(teamResponse.statusCode).toBe(200);
    expect(teamResponse.body.data.totalMembers).toBe(1);

    const workloadResponse = await request(app).get("/api/team/workload").set("Authorization", `Bearer ${adminToken}`);
    expect(workloadResponse.statusCode).toBe(200);
    expect(workloadResponse.body.data).toHaveLength(1);

    const analyticsWeekly = await request(app)
      .get("/api/analytics/weekly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(analyticsWeekly.statusCode).toBe(200);
    expect(analyticsWeekly.body.data.weeklyProductivity).toHaveLength(7);

    const analyticsProductivity = await request(app)
      .get("/api/analytics/productivity")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(analyticsProductivity.statusCode).toBe(200);
    expect(Array.isArray(analyticsProductivity.body.data.projectProgressSummary)).toBe(true);

    const deadlinesResponse = await request(app)
      .get("/api/deadlines")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deadlinesResponse.statusCode).toBe(200);
    expect(Array.isArray(deadlinesResponse.body.data.timeline)).toBe(true);
  });

  it("prevents members from accessing admin-only endpoints", async () => {
    const adminSignup = await request(app).post("/api/auth/signup").send({
      name: "Admin User",
      email: "admin@flowboard.com",
      password: "123456",
      role: "admin"
    });

    const memberSignup = await request(app).post("/api/auth/signup").send({
      name: "Member User",
      email: "member@flowboard.com",
      password: "123456",
      role: "member"
    });

    const memberToken = memberSignup.body.data.token;

    const teamResponse = await request(app).get("/api/team").set("Authorization", `Bearer ${memberToken}`);
    expect(teamResponse.statusCode).toBe(403);

    const deadlinesResponse = await request(app).get("/api/deadlines").set("Authorization", `Bearer ${memberToken}`);
    expect(deadlinesResponse.statusCode).toBe(403);

    const meResponse = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${memberToken}`);
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.body.data.user.role).toBe("member");

    expect(adminSignup.statusCode).toBe(201);
  });
});
