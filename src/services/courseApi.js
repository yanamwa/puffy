import { API_BASE } from "../config.js";
import {
  readProfessorCourses,
  saveProfessorCourses,
} from "../pages/professor/professorData.js";

const COURSE_REQUEST_TIMEOUT_MS = 5000;

function isEnabled(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseList(value) {
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  return value === "publish" || value === "published" ? "published" : "draft";
}

function normalizeVisibility(visibility) {
  return String(visibility || "").toLowerCase() === "public" ? "public" : "private";
}

function normalizeLocalCourse(course) {
  const id = course.id || course.course_id || `local-${Date.now()}`;
  const code = String(course.code || course.courseCode || course.course_code || "").toUpperCase();
  const title =
    course.title ||
    course.courseName ||
    course.course_name ||
    course.subject ||
    code ||
    "Untitled course";
  const summary = course.summary || course.description || "";
  const lessonPages = parseList(course.lessonPages || course.lessonContent || course.lesson_pages);
  const quizItems = parseList(course.quizItems || course.quizModule || course.quiz_items);

  return {
    ...course,
    id,
    course_id: course.course_id || id,
    title,
    courseName: course.courseName || title,
    course_name: course.course_name || title,
    code,
    courseCode: course.courseCode || code,
    course_code: course.course_code || code,
    summary,
    description: course.description || summary,
    subject: course.subject || title,
    learningObjectives: course.learningObjectives || course.learning_objectives || "",
    learning_objectives: course.learning_objectives || course.learningObjectives || "",
    status: normalizeStatus(course.status),
    visibility: normalizeVisibility(course.visibility),
    lessonPages,
    lessonContent: JSON.stringify(lessonPages),
    lesson_content: JSON.stringify(lessonPages),
    quizItems,
    quizModule: JSON.stringify(quizItems),
    quiz_contents: JSON.stringify(quizItems),
    students: Number(course.students || 0),
    modules: lessonPages.length || Number(course.modules || 0),
    quizzes: quizItems.length || Number(course.quizzes || 0),
    joinLink: course.joinLink || `/student/join?courseCode=${encodeURIComponent(code)}`,
    join_link: course.join_link || course.joinLink || `/student/join?courseCode=${encodeURIComponent(code)}`,
    archived:
      course.archived === true ||
      course.archived === 1 ||
      course.archived === "1" ||
      course.archived === "true",
    updatedAt: course.updatedAt || new Date().toISOString().slice(0, 10),
  };
}

function filterLocalCourses(courses, params = {}) {
  const includeArchived = isEnabled(params.includeArchived);
  const publicOnly = isEnabled(params.public);
  const publishedOnly = isEnabled(params.published);

  return courses
    .map(normalizeLocalCourse)
    .filter((course) => includeArchived || !course.archived)
    .filter((course) => !publicOnly || course.visibility === "public")
    .filter((course) => !publishedOnly || course.status === "published");
}

function findLocalCourse(id) {
  const normalizedId = String(id || "").trim().toLowerCase();

  return readProfessorCourses()
    .map(normalizeLocalCourse)
    .find((course) => {
      const courseId = String(course.id || course.course_id || "").trim().toLowerCase();
      const courseCode = String(course.code || "").trim().toLowerCase();
      return courseId === normalizedId || courseCode === normalizedId;
    });
}

function canUseLocalWriteFallback(error) {
  return !error.status || error.status === 404 || error.status >= 500;
}

function saveLocalCourse(course) {
  const courses = readProfessorCourses().map(normalizeLocalCourse);
  const hasId = course.id !== undefined && course.id !== null && course.id !== "";
  const normalizedCourse = normalizeLocalCourse({
    ...course,
    id: hasId ? course.id : `local-${Date.now()}`,
    updatedAt: course.updatedAt || new Date().toISOString().slice(0, 10),
  });
  const nextCourses = hasId
    ? courses.map((item) =>
        String(item.id) === String(normalizedCourse.id) ? normalizedCourse : item
      )
    : [normalizedCourse, ...courses];
  const courseExists = nextCourses.some((item) => String(item.id) === String(normalizedCourse.id));

  saveProfessorCourses(courseExists ? nextCourses : [normalizedCourse, ...nextCourses]);
  return normalizedCourse;
}

function deleteLocalCourse(id) {
  const courses = readProfessorCourses().map(normalizeLocalCourse);
  const normalizedId = String(id || "");
  const nextCourses = courses.filter((course) => String(course.id) !== normalizedId);

  saveProfessorCourses(nextCourses);

  return {
    success: true,
    message: "Course deleted locally.",
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({
    success: false,
    message: "Server returned an invalid response.",
  }));

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || "Course request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestCourse(url, options) {
  let response;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    COURSE_REQUEST_TIMEOUT_MS
  );

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (fetchError) {
    const error = new Error(
      fetchError.name === "AbortError"
        ? "The courses API took too long to respond."
        : "Could not reach the courses API. Make sure the server is running."
    );
    error.status = 0;
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
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

  try {
    const data = await requestCourse(
      `${API_BASE}/courses${query.toString() ? `?${query}` : ""}`,
      {
        credentials: "include",
      }
    );

    return data.courses || data.modules || [];
  } catch (error) {
    console.warn("Using local course data:", error.message);
    return filterLocalCourses(readProfessorCourses(), params);
  }
}

export async function fetchCourse(id) {
  try {
    const data = await requestCourse(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
      credentials: "include",
    });

    return data.course || data.module;
  } catch (error) {
    const localCourse = findLocalCourse(id);

    if (localCourse) return localCourse;

    throw error;
  }
}

export async function saveCourse(course) {
  const hasId = course.id !== undefined && course.id !== null && course.id !== "";

  try {
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
  } catch (error) {
    if (!canUseLocalWriteFallback(error)) throw error;

    console.warn("Saving course locally:", error.message);
    return saveLocalCourse(course);
  }
}

export async function deleteCourseById(id) {
  try {
    return await requestCourse(`${API_BASE}/courses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    if (!canUseLocalWriteFallback(error)) throw error;

    console.warn("Deleting course locally:", error.message);
    return deleteLocalCourse(id);
  }
}
