import {
  getProfessorCourseOwner,
  readProfessorCourses,
} from '../professor/professorData';
import { fetchCourse, fetchCourses } from '../../services/courseApi.js';

export const STUDENT_ENROLLED_COURSES_KEY = 'student-enrolled-courses';
export const STUDENT_COURSE_PROGRESS_KEY = 'student-course-progress';
export const STUDENT_ENROLLED_COURSES_EVENT = 'student-enrolled-courses-updated';

function getCourseKey(course) {
  return String(course?.id || course?.course_id || course?.code || '').trim();
}

function isEnabled(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function courseMatchesEnrollment(course, enrolledKeys) {
  return (
    enrolledKeys.has(String(course?.id || '').trim()) ||
    enrolledKeys.has(String(course?.course_id || '').trim()) ||
    enrolledKeys.has(String(course?.code || '').trim())
  );
}

function filterCourses(courses, params = {}) {
  const includeArchived = isEnabled(params.includeArchived);
  const publicOnly = isEnabled(params.public);
  const publishedOnly = isEnabled(params.published);

  return courses
    .filter((course) => includeArchived || !course.archived)
    .filter((course) => !publicOnly || (course.visibility || 'public') === 'public')
    .filter((course) => !publishedOnly || course.status === 'published');
}

async function loadProfessorCourses(params = {}) {
  try {
    const courses = await fetchCourses(params);
    return filterCourses(courses, params);
  } catch (error) {
    console.error('Student course API error:', error);
    return filterCourses(readProfessorCourses(), params);
  }
}

function dispatchEnrollmentUpdate(course) {
  window.dispatchEvent(
    new CustomEvent(STUDENT_ENROLLED_COURSES_EVENT, {
      detail: { course },
    })
  );
}

export function readStudentEnrollmentKeys() {
  try {
    const saved = localStorage.getItem(STUDENT_ENROLLED_COURSES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveStudentEnrollmentKeys(keys) {
  const uniqueKeys = [...new Set(keys.map(String).filter(Boolean))];
  localStorage.setItem(STUDENT_ENROLLED_COURSES_KEY, JSON.stringify(uniqueKeys));
  return uniqueKeys;
}

export function readStudentCourseProgress() {
  try {
    const saved = localStorage.getItem(STUDENT_COURSE_PROGRESS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStudentCourseProgress(progress) {
  localStorage.setItem(STUDENT_COURSE_PROGRESS_KEY, JSON.stringify(progress));
}

export function getStudentCourseProgress(course) {
  const key = getCourseKey(course);
  const savedProgress = Number(readStudentCourseProgress()[key]);

  if (Number.isFinite(savedProgress)) {
    return Math.max(0, Math.min(100, Math.round(savedProgress)));
  }

  return Math.max(0, Math.min(100, Number(course?.studentProgress || 0)));
}

export function getStudentCourseModules(course) {
  const lessonPages = Array.isArray(course?.lessonPages) ? course.lessonPages : [];

  if (lessonPages.length) {
    return lessonPages.map((page, index) => ({
      id: `${getCourseKey(course)}-lesson-${index}`,
      title: page.title || `Lesson Page ${index + 1}`,
      description: page.content || '',
    }));
  }

  return [
    {
      id: `${getCourseKey(course)}-overview`,
      title: 'Course Overview',
      description: course?.summary || 'Start with the course overview.',
    },
    {
      id: `${getCourseKey(course)}-practice`,
      title: 'Practice Quiz',
      description: 'Review key ideas with practice questions.',
    },
  ];
}

export function normalizeStudentCourse(course) {
  return {
    ...course,
    id: course.id || course.course_id,
    code: course.code || 'COURSE',
    title: course.title || 'Untitled course',
    instructor: getProfessorCourseOwner(course),
    progress: getStudentCourseProgress(course),
    modulesList: getStudentCourseModules(course),
  };
}

export function findCourseByIdOrCode(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  return readProfessorCourses().find((course) => {
    const id = String(course.id || '').trim().toLowerCase();
    const code = String(course.code || '').trim().toLowerCase();
    return id === normalizedValue || code === normalizedValue;
  });
}

export async function findCourseByIdOrCodeAsync(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) return null;

  if (/^\d+$/.test(normalizedValue)) {
    try {
      return await fetchCourse(normalizedValue);
    } catch {
      // Fall through to searching all courses; route params may be old codes.
    }
  }

  const courses = await loadProfessorCourses({ includeArchived: true });

  return courses.find((course) => {
    const id = String(course.id || course.course_id || '').trim().toLowerCase();
    const code = String(course.code || '').trim().toLowerCase();
    return id === normalizedValue || code === normalizedValue;
  }) || null;
}

export function findJoinableCourseByCode(code) {
  const normalizedCode = String(code || '').trim().toLowerCase();

  if (!normalizedCode) return null;

  return readProfessorCourses().find((course) => (
    !course.archived &&
    course.status === 'published' &&
    String(course.code || '').trim().toLowerCase() === normalizedCode
  ));
}

export async function findJoinableCourseByCodeAsync(code) {
  const normalizedCode = String(code || '').trim().toLowerCase();

  if (!normalizedCode) return null;

  const courses = await loadProfessorCourses({ published: true });

  return courses.find((course) => (
    !course.archived &&
    course.status === 'published' &&
    String(course.code || '').trim().toLowerCase() === normalizedCode
  )) || null;
}

export function enrollStudentInCourse(course) {
  const key = getCourseKey(course);

  if (!key) return false;

  const keys = readStudentEnrollmentKeys();
  saveStudentEnrollmentKeys([...keys, key]);

  const progress = readStudentCourseProgress();
  if (!Number.isFinite(Number(progress[key]))) {
    saveStudentCourseProgress({ ...progress, [key]: 0 });
  }

  dispatchEnrollmentUpdate(course);
  return true;
}

export function getStudentEnrolledCourses() {
  const enrolledKeys = new Set(readStudentEnrollmentKeys());

  return readProfessorCourses()
    .filter((course) => courseMatchesEnrollment(course, enrolledKeys))
    .filter((course) => !course.archived)
    .map(normalizeStudentCourse);
}

export async function loadStudentEnrolledCourses() {
  const enrolledKeys = new Set(readStudentEnrollmentKeys());
  const courses = await loadProfessorCourses();

  return courses
    .filter((course) => courseMatchesEnrollment(course, enrolledKeys))
    .map(normalizeStudentCourse);
}

export function getPublicStudentCourses() {
  return readProfessorCourses()
    .filter((course) => !course.archived)
    .filter((course) => course.status === 'published')
    .filter((course) => (course.visibility || 'public') === 'public')
    .map(normalizeStudentCourse);
}

export async function loadPublicStudentCourses() {
  const courses = await loadProfessorCourses({ public: true, published: true });
  return courses.map(normalizeStudentCourse);
}
