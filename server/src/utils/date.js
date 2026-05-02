const startOfDayUtc = (value = new Date()) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));

const endOfDayUtc = (value = new Date()) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));

const addDaysUtc = (value, days) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const startOfWeekUtc = (value = new Date()) => {
  const date = startOfDayUtc(value);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysUtc(date, diff);
};

const differenceInCalendarDaysUtc = (left, right) => {
  const leftStart = startOfDayUtc(new Date(left));
  const rightStart = startOfDayUtc(new Date(right));
  return Math.round((leftStart.getTime() - rightStart.getTime()) / (24 * 60 * 60 * 1000));
};

module.exports = {
  startOfDayUtc,
  endOfDayUtc,
  addDaysUtc,
  startOfWeekUtc,
  differenceInCalendarDaysUtc
};
