if (require.main === module) {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const Activity = require("./models/Activity");
const { hashPassword } = require("./utils/password");
const { calculatePriority, normalizeDueDate } = require("./utils/taskRules");
const { syncProjectProgress } = require("./utils/projectMetrics");
const { addDaysUtc } = require("./utils/date");

const createDateOffset = (days, hours = 0) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(9 + hours, 0, 0, 0);
  return date;
};

const userSeeds = [
  { name: "Ava Admin", email: "admin@flowboard.com", password: "123456", role: "admin", availability: "Available" },
  { name: "Mason Member", email: "member@flowboard.com", password: "123456", role: "member", availability: "Busy" },
  { name: "Sarah Chen", email: "sarah@flowboard.com", password: "123456", role: "member", availability: "Available" },
  { name: "Liam Carter", email: "liam@flowboard.com", password: "123456", role: "member", availability: "Busy" },
  { name: "Priya Singh", email: "priya@flowboard.com", password: "123456", role: "member", availability: "Available" },
  { name: "Noah Brown", email: "noah@flowboard.com", password: "123456", role: "member", availability: "On Leave" }
];

const projectSeeds = [
  { title: "Website Redesign", description: "Refresh the public website and improve conversion.", status: "In Progress", dueInDays: 10, members: ["member@flowboard.com", "sarah@flowboard.com"] },
  { title: "Mobile App Launch", description: "Prepare the mobile launch checklist and release assets.", status: "On Track", dueInDays: 18, members: ["liam@flowboard.com", "priya@flowboard.com"] },
  { title: "Marketing Campaign", description: "Coordinate campaign creative, tracking, and rollout.", status: "At Risk", dueInDays: 5, members: ["sarah@flowboard.com", "noah@flowboard.com"] },
  { title: "API Integration", description: "Connect partner APIs and validate auth and sync flows.", status: "In Progress", dueInDays: 7, members: ["member@flowboard.com", "liam@flowboard.com"] },
  { title: "Customer Portal", description: "Ship the new self-service portal for enterprise customers.", status: "Planning", dueInDays: 25, members: ["priya@flowboard.com", "noah@flowboard.com"] },
  { title: "Q2 Product Roadmap", description: "Finalize roadmap priorities and communicate milestones.", status: "On Track", dueInDays: 30, members: ["member@flowboard.com", "sarah@flowboard.com", "liam@flowboard.com"] }
];

const taskSeeds = [
  { project: "Website Redesign", title: "Design login experience", description: "Create the login UI and sign-in states.", assignee: "member@flowboard.com", status: "In Progress", dueInDays: 1, estimatedHours: 10, createdDaysAgo: -2, subtasks: ["Create login UI", "Implement form validation", "Connect login API"] },
  { project: "Website Redesign", title: "Build dashboard widgets", description: "Add stat cards and weekly productivity visuals.", assignee: "sarah@flowboard.com", status: "Todo", dueInDays: 2, estimatedHours: 12, createdDaysAgo: -4, subtasks: ["Create dashboard layout", "Add charts", "Connect dashboard APIs"] },
  { project: "Website Redesign", title: "Polish homepage copy", description: "Review hero messaging and CTA clarity.", assignee: "member@flowboard.com", status: "Done", dueInDays: -1, estimatedHours: 4, createdDaysAgo: -6, subtasks: ["Review copy", "Approve final content"] },
  { project: "Mobile App Launch", title: "Finalize app store assets", description: "Prepare screenshots, description, and icon set.", assignee: "liam@flowboard.com", status: "In Review", dueInDays: 3, estimatedHours: 6, createdDaysAgo: -3, subtasks: ["Capture screenshots", "Write store description"] },
  { project: "Mobile App Launch", title: "QA beta release", description: "Verify high-priority beta scenarios before launch.", assignee: "priya@flowboard.com", status: "Todo", dueInDays: 4, estimatedHours: 8, createdDaysAgo: -2, subtasks: ["Regression test auth", "Validate push notifications"] },
  { project: "Marketing Campaign", title: "Approve campaign budget", description: "Get sign-off for the paid media spend plan.", assignee: "noah@flowboard.com", status: "Blocked", dueInDays: -2, estimatedHours: 3, createdDaysAgo: -5, subtasks: ["Review budget sheet", "Get finance approval"] },
  { project: "Marketing Campaign", title: "Prepare launch brief", description: "Align campaign goals, audience, and creative plan.", assignee: "sarah@flowboard.com", status: "Done", dueInDays: -1, estimatedHours: 5, createdDaysAgo: -7, subtasks: ["Draft brief", "Share with team"] },
  { project: "API Integration", title: "Implement OAuth callback", description: "Complete the auth callback and token exchange.", assignee: "liam@flowboard.com", status: "In Progress", dueInDays: 0, estimatedHours: 9, createdDaysAgo: -1, subtasks: ["Handle callback", "Store access token"] },
  { project: "API Integration", title: "Validate partner sync", description: "Test payload mapping and sync retries.", assignee: "member@flowboard.com", status: "Todo", dueInDays: 6, estimatedHours: 7, createdDaysAgo: -3, subtasks: ["Map fields", "Retry failed sync"] },
  { project: "API Integration", title: "Document login flow", description: "Capture login edge cases and fallback paths.", assignee: "member@flowboard.com", status: "Todo", dueInDays: 2, estimatedHours: 5, createdDaysAgo: -2, subtasks: ["Add forgot password link", "Test login flow"] },
  { project: "Customer Portal", title: "Create portal wireframes", description: "Define core layout and navigation for the portal.", assignee: "priya@flowboard.com", status: "Todo", dueInDays: 8, estimatedHours: 10, createdDaysAgo: -1, subtasks: ["Map information architecture", "Sketch navigation"] },
  { project: "Customer Portal", title: "Draft access roles", description: "Clarify access boundaries for customers and admins.", assignee: "noah@flowboard.com", status: "Todo", dueInDays: 9, estimatedHours: 4, createdDaysAgo: -2, subtasks: ["List roles", "Write permission rules"] },
  { project: "Q2 Product Roadmap", title: "Prepare roadmap dashboard", description: "Summarize roadmap priorities in a dashboard view.", assignee: "member@flowboard.com", status: "In Review", dueInDays: 5, estimatedHours: 6, createdDaysAgo: -4, subtasks: ["Create dashboard layout", "Test responsiveness"] },
  { project: "Q2 Product Roadmap", title: "Prioritize platform backlog", description: "Rank the platform work with impact and effort scoring.", assignee: "sarah@flowboard.com", status: "Done", dueInDays: 1, estimatedHours: 5, createdDaysAgo: -6, subtasks: ["Score initiatives", "Review with product lead"] },
  { project: "Q2 Product Roadmap", title: "Review engineering capacity", description: "Assess capacity for roadmap delivery by squad.", assignee: "liam@flowboard.com", status: "In Progress", dueInDays: 3, estimatedHours: 5, createdDaysAgo: -2, subtasks: ["Collect squad inputs", "Summarize constraints"] }
];

const seedWorkspace = async ({ manageConnection = true } = {}) => {
  if (manageConnection) {
    await connectDB();
  }

  await Promise.all([
    Activity.deleteMany({}),
    Task.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({})
  ]);

  const createdUsers = {};

  for (const userSeed of userSeeds) {
    const user = await User.create({
      ...userSeed,
      password: await hashPassword(userSeed.password)
    });
    createdUsers[user.email] = user;
  }

  const adminUser = createdUsers["admin@flowboard.com"];
  const createdProjects = {};
  const activityEntries = [];

  for (const [index, projectSeed] of projectSeeds.entries()) {
    const members = projectSeed.members.map((email) => createdUsers[email]._id);
    const project = await Project.create({
      title: projectSeed.title,
      description: projectSeed.description,
      status: projectSeed.status,
      dueDate: normalizeDueDate(addDaysUtc(new Date(), projectSeed.dueInDays)),
      createdBy: adminUser._id,
      members: [adminUser._id, ...members]
    });

    createdProjects[project.title] = project;
    activityEntries.push({
      userId: adminUser._id,
      action: `Created project ${project.title}`,
      projectId: project._id,
      createdAt: createDateOffset(-8 + index)
    });
  }

  for (const [index, taskSeed] of taskSeeds.entries()) {
    const project = createdProjects[taskSeed.project];
    const assignee = createdUsers[taskSeed.assignee];
    const dueDate = normalizeDueDate(addDaysUtc(new Date(), taskSeed.dueInDays));
    const task = await Task.create({
      title: taskSeed.title,
      description: taskSeed.description,
      projectId: project._id,
      assignedTo: assignee._id,
      createdBy: adminUser._id,
      status: taskSeed.status,
      priority: calculatePriority({ dueDate, status: taskSeed.status }),
      dueDate,
      estimatedHours: taskSeed.estimatedHours,
      subtasks: taskSeed.subtasks.map((title, subtaskIndex) => ({
        title,
        completed: taskSeed.status === "Done" ? true : subtaskIndex === 0 && taskSeed.status !== "Todo"
      })),
      comments: [
        {
          userId: adminUser._id,
          text: `Initial scope added for ${taskSeed.title}.`,
          createdAt: createDateOffset(taskSeed.createdDaysAgo)
        }
      ]
    });

    await Task.findByIdAndUpdate(task._id, {
      createdAt: createDateOffset(taskSeed.createdDaysAgo),
      updatedAt: createDateOffset(taskSeed.createdDaysAgo + (taskSeed.status === "Done" ? 1 : 0))
    });

    activityEntries.push({
      userId: adminUser._id,
      action: `Created task ${task.title}`,
      projectId: project._id,
      taskId: task._id,
      createdAt: createDateOffset(taskSeed.createdDaysAgo)
    });

    if (taskSeed.status !== "Todo") {
      activityEntries.push({
        userId: assignee._id,
        action: `Updated task ${task.title}`,
        projectId: project._id,
        taskId: task._id,
        createdAt: createDateOffset(taskSeed.createdDaysAgo + 1, index % 4)
      });
    }
  }

  await Activity.insertMany(activityEntries);

  for (const project of Object.values(createdProjects)) {
    await syncProjectProgress(project._id);
  }

  console.log("FlowBoard seed complete.");
  console.log("Admin: admin@flowboard.com / 123456");
  console.log("Member: member@flowboard.com / 123456");

  if (manageConnection) {
    await mongoose.connection.close();
  }

  return {
    adminUser,
    summary: {
      users: Object.keys(createdUsers).length,
      projects: Object.keys(createdProjects).length,
      tasks: taskSeeds.length
    }
  };
};

if (require.main === module) {
  seedWorkspace().catch(async (error) => {
    console.error("FlowBoard seed failed", error);
    await mongoose.connection.close();
    process.exit(1);
  });
}

module.exports = {
  seedWorkspace
};
