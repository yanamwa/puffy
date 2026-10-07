import { getStudentProgressStorageKey } from "../pages/student/courses/studentCourseData.js";

export function readAccountQuizResult(baseKey) {
  const key = getStudentProgressStorageKey(baseKey);
  return key ? localStorage.getItem(key) : null;
}

export function saveAccountQuizResult(baseKey, value) {
  const key = getStudentProgressStorageKey(baseKey);
  if (key) localStorage.setItem(key, value);
}
