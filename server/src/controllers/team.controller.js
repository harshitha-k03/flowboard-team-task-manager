const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { sendSuccess } = require("../utils/response");
const { serializeUser } = require("../utils/serializers");
const { startOfWeekUtc } = require("../utils/date");

const buildMemberSummary = async () => {
  const weekStart = startOfWeekUtc(new Date());
  const [members, tasks, projects] = await Promise.all([
    User.find({ role: "member" }).select("name email role avatar availability createdAt").lean(),
    Task.find({})
      .populate("assignedTo", "name email role avatar availability")
      .populate("projectId", "title")
      .lean(),
    Project.find({}).select("title members").lean()
  ]);

  const memberSummaries = members.map((member) => {
    const memberTasks = tasks.filter((task) => `${task.assignedTo?._id || task.assignedTo}` === `${member._id}`);
    const activeTasks = memberTasks.filter((task) => task.status !== "Done").length;
    const completedThisWeek = memberTasks.filter(
      (task) => task.status === "Done" && new Date(task.updatedAt) >= weekStart
    ).length;
    const totalThisWeek = memberTasks.filter((task) => new Date(task.updatedAt) >= weekStart).length;
    const assignedProjects = projects.filter((project) => project.members.some((memberId) => `${memberId}` === `${member._id}`));
    const utilization = Math.min(140, activeTasks * 8 + assignedProjects.length * 10);
    const loadStatus = utilization > 100 ? "Overloaded" : utilization < 70 ? "Underutilized" : "Balanced";

    return {
      ...serializeUser(member),
      assignedProjects: assignedProjects.map((project) => ({
        id: `${project._id}`,
        title: project.title
      })),
      assignedProjectsCount: assignedProjects.length,
      activeTasks,
      weeklyProductivity: totalThisWeek ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0,
      utilization,
      loadStatus
    };
  });

  const overloadedMembers = memberSummaries.filter((member) => member.loadStatus === "Overloaded" && member.availability !== "On Leave");
  const availableTargets = memberSummaries
    .filter((member) => member.loadStatus === "Underutilized" && member.availability === "Available")
    .sort((left, right) => left.activeTasks - right.activeTasks);
  const reassignmentSuggestions = overloadedMembers.slice(0, 3).flatMap((sourceMember, index) => {
    const targetMember = availableTargets[index % availableTargets.length];
    const task = tasks.find((item) => `${item.assignedTo?._id || item.assignedTo}` === sourceMember.id && item.status !== "Done");

    if (!targetMember || !task) {
      return [];
    }

    return {
      id: `${sourceMember.id}-${targetMember.id}-${task._id}`,
      from: sourceMember,
      to: targetMember,
      task: {
        id: `${task._id}`,
        title: task.title,
        projectTitle: task.projectId?.title || "Project"
      },
      reason: `${sourceMember.name} is overloaded while ${targetMember.name} has available capacity.`
    };
  });

  return {
    members: memberSummaries,
    reassignmentSuggestions,
    totals: {
      totalMembers: memberSummaries.length,
      activeMembers: memberSummaries.filter((member) => member.activeTasks > 0).length,
      newMembersThisWeek: memberSummaries.filter((member) => new Date(member.createdAt) >= weekStart).length
    }
  };
};

const getTeam = async (_req, res) => {
  const { members, totals, reassignmentSuggestions } = await buildMemberSummary();

  sendSuccess(res, {
    data: {
      ...totals,
      members,
      reassignmentSuggestions
    }
  });
};

const getTeamWorkload = async (_req, res) => {
  const { members } = await buildMemberSummary();

  sendSuccess(res, {
    data: members.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      availability: member.availability,
      openTasks: member.activeTasks,
      assignedProjects: member.assignedProjectsCount,
      productivity: member.weeklyProductivity,
      utilization: member.utilization,
      loadStatus: member.loadStatus
    }))
  });
};

module.exports = {
  getTeam,
  getTeamWorkload
};
