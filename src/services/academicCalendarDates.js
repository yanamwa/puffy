export const calendarDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const eventsOnDate = (events, key) =>
  (events || []).filter(
    (event) =>
      event.start_date <= key && (event.end_date || event.start_date) >= key,
  );
