// utils/dateUtils.js

export function toDateKey(date) {
  // YYYY-MM-DD in local time
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSunday(date) {
  const d = new Date(date);
  return d.getDay() === 0;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(start, end) {
  const dates = [];
  let current = new Date(start);

  while (current < end) {
    current = addDays(current, 1);
    dates.push(new Date(current));
  }

  return dates;
}
