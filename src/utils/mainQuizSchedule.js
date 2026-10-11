export function mainQuizScheduleState(settings, now = Date.now()) {
  if (!settings.enabled) return "disabled";
  const closes = new Date(settings.lockAt || "").getTime();
  const opens = new Date(settings.unlockAt || "").getTime();
  if (Number.isFinite(closes) && now >= closes) return "closed";
  if (Number.isFinite(opens) && now < opens) return "scheduled";
  return "open";
}
