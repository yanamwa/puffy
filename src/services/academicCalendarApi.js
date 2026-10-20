import { API_BASE } from "../config.js";
import { lessonAuthHeaders } from "./lessonAuth.js";
export async function academicCalendarRequest(path = "", options = {}) {
  const response = await fetch(`${API_BASE}/academic-calendars${path}`, {
    ...options,
    credentials: "include",
    headers: { ...lessonAuthHeaders(), ...options.headers },
  });
  if (options.document && response.ok) return response.blob();
  const data = await response
    .json()
    .catch(() => ({ message: "Could not read the calendar response." }));
  if (!response.ok || data.success === false)
    throw new Error(data.message || "Could not load the academic calendar.");
  return data;
}
