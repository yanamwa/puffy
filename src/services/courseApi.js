import { API_BASE } from "../config.js";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({
    success: false,
    message: "Server returned an invalid response.",
  }));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Course request failed.");
  }

  return data;
}

async function requestCourse(url, options) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Could not reach the courses API. Make sure the server is running.");
  }

  return parseResponse(response);
}

export async function fetchCourses(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const data = await requestCourse(
    `${API_BASE}/courses${query.toString() ? `?${query}` : ""}`,
    {
      credentials: "include",
    }
  );

  return data.courses || data.modules || [];
}

export async function fetchCourse(id) {
  const data = await requestCourse(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
    credentials: "include",
  });

  return data.course || data.module;
}

export async function saveCourse(course) {
  const hasId = course.id !== undefined && course.id !== null && course.id !== "";
  const data = await requestCourse(
    hasId
      ? `${API_BASE}/courses/${encodeURIComponent(course.id)}`
      : `${API_BASE}/courses`,
    {
      method: hasId ? "PUT" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(course),
    }
  );

  return data.course || data.module;
}

export async function deleteCourseById(id) {
  return requestCourse(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
}
