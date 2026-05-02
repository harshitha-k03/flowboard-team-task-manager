const { addDaysUtc, differenceInCalendarDaysUtc, startOfDayUtc } = require("./date");

const DONE_STATUS = "Done";

const normalizeDueDate = (value) => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return new Date(`${year}-${month}-${day}T12:00:00.000Z`);
};

const isOverdue = (dueDate, status, now = new Date()) => {
  if (!dueDate || status === DONE_STATUS) {
    return false;
  }

  return normalizeDueDate(dueDate).getTime() < startOfDayUtc(now).getTime();
};

const calculatePriority = ({ dueDate, status }, now = new Date()) => {
  const normalized = normalizeDueDate(dueDate);

  if (isOverdue(normalized, status, now)) {
    return "Critical";
  }

  const daysUntilDue = differenceInCalendarDaysUtc(normalized, now);

  if (daysUntilDue <= 1) {
    return "High";
  }

  if (daysUntilDue <= 3) {
    return "Medium";
  }

  return "Low";
};

const buildReminderType = ({ dueDate, status }, now = new Date()) => {
  if (isOverdue(dueDate, status, now)) {
    return "overdue";
  }

  const daysUntilDue = differenceInCalendarDaysUtc(normalizeDueDate(dueDate), now);

  if (daysUntilDue === 0) {
    return "today";
  }

  if (daysUntilDue === 1) {
    return "tomorrow";
  }

  return "upcoming";
};

const buildReminderMessage = (task, now = new Date()) => {
  const reminderType = buildReminderType(task, now);

  if (reminderType === "overdue") {
    return `${task.title} is overdue and needs attention.`;
  }

  if (reminderType === "today") {
    return `${task.title} is due today.`;
  }

  if (reminderType === "tomorrow") {
    return `${task.title} is due tomorrow.`;
  }

  return `${task.title} is due soon.`;
};

const getUpcomingRange = (now = new Date()) => ({
  today: startOfDayUtc(now),
  tomorrow: startOfDayUtc(addDaysUtc(now, 1)),
  threeDays: startOfDayUtc(addDaysUtc(now, 3)),
  sevenDays: startOfDayUtc(addDaysUtc(now, 7))
});

module.exports = {
  DONE_STATUS,
  normalizeDueDate,
  isOverdue,
  calculatePriority,
  buildReminderType,
  buildReminderMessage,
  getUpcomingRange
};
