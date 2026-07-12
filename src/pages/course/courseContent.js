import { API_BASE } from "../../config.js";
import { fetchCourse, fetchCourses } from "../../services/courseApi.js";

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeLessonPage(page, index) {
  if (typeof page === "string") {
    return {
      title: `Lesson Page ${index + 1}`,
      content: page,
    };
  }

  return {
    title: page?.title || page?.heading || `Lesson Page ${index + 1}`,
    content: page?.content || page?.body || page?.lesson || "",
  };
}

function parseLessonPages(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeLessonPage).filter((page) => page.content.trim());
  }

  const text = String(value || "").trim();
  if (!text) return [];

  const parsed = parseJson(text);
  if (Array.isArray(parsed)) {
    return parsed.map(normalizeLessonPage).filter((page) => page.content.trim());
  }

  return text
    .split("---")
    .map((content, index) => normalizeLessonPage(content.trim(), index))
    .filter((page) => page.content.trim());
}

function normalizeQuizItem(item, index) {
  return {
    id: item?.id ?? index + 1,
    question: String(item?.question || "").trim(),
    options: Array.isArray(item?.options) ? item.options.filter(Boolean) : [],
    topic: String(item?.topic || item?.category || item?.subject || "").trim(),
    correct_answer: String(
      item?.correct_answer || item?.correctAnswer || item?.answer || ""
    ).trim(),
    answer: String(item?.answer || item?.correct_answer || item?.correctAnswer || "").trim(),
    explanation: String(item?.explanation || "").trim(),
  };
}

function parseQuizItems(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeQuizItem).filter((item) => item.question);
  }

  const text = String(value || "").trim();
  if (!text) return [];

  const parsed = parseJson(text);
  if (!Array.isArray(parsed)) return [];

  return parsed.map(normalizeQuizItem).filter((item) => item.question);
}

export function getCourseLessonPages(content) {
  const candidates = [
    content?.lessonPages,
    content?.lesson_pages,
    content?.lessonContent,
    content?.lesson_content,
    content?.lesson_contents,
  ];

  for (const candidate of candidates) {
    const pages = parseLessonPages(candidate);
    if (pages.length) return pages;
  }

  return [];
}

export function getCourseQuizItems(content) {
  const candidates = [
    content?.quizItems,
    content?.quiz_items,
    content?.quizModule,
    content?.quiz_contents,
    content?.quizContent,
  ];

  for (const candidate of candidates) {
    const items = parseQuizItems(candidate);
    if (items.length) return items;
  }

  return [];
}

export function normalizeCourseContent(source) {
  const lessonPages = getCourseLessonPages(source);
  const quizItems = getCourseQuizItems(source);
  const id = source?.id || source?.course_id || source?.lesson_id || source?.module_id;
  const title =
    source?.title ||
    source?.courseName ||
    source?.course_name ||
    source?.course_title ||
    "Untitled course";
  const description = source?.summary || source?.description || source?.module_description || "";
  const learningObjectives =
    source?.learningObjectives || source?.learning_objectives || "";

  return {
    ...source,
    id,
    course_id: source?.course_id || id,
    lesson_id: source?.lesson_id || id,
    title,
    description,
    summary: description,
    learningObjectives,
    learning_objectives: learningObjectives,
    lessonPages,
    lessonContent: JSON.stringify(lessonPages),
    lesson_content: JSON.stringify(lessonPages),
    quizItems,
    quizModule: JSON.stringify(quizItems),
    quiz_contents: JSON.stringify(quizItems),
    modules: lessonPages.length,
    quizzes: quizItems.length,
  };
}

async function fetchLegacyContent(contentId) {
  const response = await fetch(
    `${API_BASE}/getLessonsById.php?id=${encodeURIComponent(contentId)}`,
    { credentials: "include" }
  );

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Course content not found.");
  }

  return data.lesson || data.module || data.course || data.data || data;
}

async function fetchModuleContent(contentId) {
  const response = await fetch(`${API_BASE}/modules/${encodeURIComponent(contentId)}`, {
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Learning module not found.");
  }

  return data.module || data.course || data.lesson || data.data || data;
}

async function findCourseByIdOrCode(contentId) {
  const normalizedId = String(contentId || "").trim().toLowerCase();
  const courses = await fetchCourses({ includeArchived: true });

  return courses.find((course) => {
    const id = String(course.id || course.course_id || "").trim().toLowerCase();
    const code = String(course.code || course.courseCode || "").trim().toLowerCase();
    return id === normalizedId || code === normalizedId;
  });
}

export async function fetchCourseContent(contentId) {
  const cleanId = String(contentId || "").trim();
  if (!cleanId) throw new Error("Missing course id.");

  const errors = [];

  try {
    return normalizeCourseContent(await fetchCourse(cleanId));
  } catch (error) {
    errors.push(error);
  }

  try {
    const course = await findCourseByIdOrCode(cleanId);
    if (course) return normalizeCourseContent(course);
  } catch (error) {
    errors.push(error);
  }

  try {
    return normalizeCourseContent(await fetchModuleContent(cleanId));
  } catch (error) {
    errors.push(error);
  }

  try {
    return normalizeCourseContent(await fetchLegacyContent(cleanId));
  } catch (error) {
    errors.push(error);
  }

  throw errors.at(-1) || new Error("Course content not found.");
}

export function getCourseSlideCount(content) {
  return getCourseLessonPages(content).length + getCourseQuizItems(content).length;
}
