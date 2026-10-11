import { getStudentProgressStorageKey } from "../pages/student/courses/studentCourseData.js";

export function readAccountQuizResult(baseKey) {
  const key = getStudentProgressStorageKey(baseKey);
  return key ? localStorage.getItem(key) : null;
}

export function saveAccountQuizResult(baseKey, value) {
  const key = getStudentProgressStorageKey(baseKey);
  if (!key) return;
  try {
    const result = JSON.parse(value);
    if (result && typeof result === "object" && Array.isArray(result.answers)) {
      result.sessionId ||= crypto.randomUUID();
      result.completedAt ||= Date.now();
      value = JSON.stringify(result);
    }
  } catch {
    // Preserve non-JSON values used by existing callers.
  }
  localStorage.setItem(key, value);
}
