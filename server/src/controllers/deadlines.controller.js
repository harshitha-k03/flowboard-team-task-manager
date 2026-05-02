const mongoose = require("mongoose");
const Task = require("../models/Task");
const { sendSuccess } = require("../utils/response");
const { serializeTask } = require("../utils/serializers");
const { buildReminderMessage, buildReminderType } = require("../utils/taskRules");
const { addDaysUtc, differenceInCalendarDaysUtc, startOfDayUtc } = require("../utils/date");

const getDeadlines = async (_req, res) => {
  const now = new Date();
  const today = startOfDayUtc(now);
  const tomorrow = startOfDayUtc(addDaysUtc(now, 1));
  const nextWeek = addDaysUtc(today, 7);

  const tasks = await Task.find({
    status: mongoose.trusted({ $ne: "Done" }),
    dueDate: mongoose.trusted({ $lte: nextWeek })
  })
    .populate("assignedTo", "name email role avatar availability")
    .populate("createdBy", "name email role avatar availability")
    .populate("projectId", "title status dueDate progress")
    .sort({ dueDate: 1 })
    .lean();

  const dueToday = tasks.filter((task) => differenceInCalendarDaysUtc(task.dueDate, today) === 0);
  const dueTomorrow = tasks.filter((task) => differenceInCalendarDaysUtc(task.dueDate, today) === 1);
  const overdue = tasks.filter((task) => new Date(task.dueDate) < today);
  const upcoming7Days = tasks.filter((task) => new Date(task.dueDate) >= today && new Date(task.dueDate) <= nextWeek);

  sendSuccess(res, {
    data: {
      dueToday: dueToday.map((task) => serializeTask(task)),
      dueTomorrow: dueTomorrow.map((task) => serializeTask(task)),
      overdue: overdue.map((task) => serializeTask(task)),
      upcoming7Days: upcoming7Days.map((task) => serializeTask(task)),
      deadlineRiskChart: [
        { label: "Overdue", count: overdue.length },
        { label: "Today", count: dueToday.length },
        { label: "Tomorrow", count: dueTomorrow.length },
        { label: "This Week", count: upcoming7Days.length }
      ],
      timeline: Array.from({ length: 7 }).map((_, index) => {
        const day = addDaysUtc(today, index);
        return {
          date: day.toISOString(),
          count: tasks.filter((task) => differenceInCalendarDaysUtc(task.dueDate, day) === 0).length
        };
      }),
      reminders: tasks.slice(0, 8).map((task) => ({
        id: `${task._id}`,
        title: task.title,
        dueDate: task.dueDate,
        projectTitle: task.projectId?.title || "Unknown project",
        type: buildReminderType(task, now),
        message: buildReminderMessage(task, now)
      }))
    }
  });
};

module.exports = {
  getDeadlines
};
