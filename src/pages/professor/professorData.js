export const PROFESSOR_COURSES_KEY = 'professor-courses';
export const PROFESSOR_COURSES_EVENT = 'professor-courses-updated';

export const professorCoursesSeed = [
  {
    id: 1,
    title: 'Introduction to Web Development',
    code: 'WEB101',
    summary: 'HTML, CSS, JavaScript, and the basics of building responsive pages.',
    students: 42,
    modules: 6,
    quizzes: 4,
    status: 'published',
    visibility: 'public',
    archived: false,
    updatedAt: '2026-07-01',
    professorName: 'Professor',
    professorEmail: '',
  },
  {
    id: 2,
    title: 'Database Systems',
    code: 'DBS204',
    summary: 'Relational database design, SQL queries, normalization, and reporting.',
    students: 35,
    modules: 5,
    quizzes: 3,
    status: 'draft',
    visibility: 'private',
    archived: false,
    updatedAt: '2026-06-26',
    professorName: 'Professor',
    professorEmail: '',
  },
  {
    id: 3,
    title: 'Human Computer Interaction',
    code: 'HCI310',
    summary: 'Usability, accessibility, prototyping, and user-centered design.',
    students: 28,
    modules: 4,
    quizzes: 2,
    status: 'published',
    visibility: 'public',
    archived: false,
    updatedAt: '2026-06-20',
    professorName: 'Professor',
    professorEmail: '',
  },
];

export const recentProfessorActivities = [
  'Published Module 4 in Introduction to Web Development',
  'Reviewed quiz results for Database Systems',
  'Sent announcement to Human Computer Interaction students',
  'Updated learning objectives for Web Development',
];

export function readProfessorCourses() {
  try {
    const saved = localStorage.getItem(PROFESSOR_COURSES_KEY);
    return saved ? JSON.parse(saved) : professorCoursesSeed;
  } catch {
    return professorCoursesSeed;
  }
}

export function saveProfessorCourses(courses) {
  localStorage.setItem(PROFESSOR_COURSES_KEY, JSON.stringify(courses));

  window.dispatchEvent(
    new CustomEvent(PROFESSOR_COURSES_EVENT, {
      detail: { courses },
    })
  );
}

export function getProfessorCourseOwner(course) {
  return (
    course.professorDisplayName ||
    course.professor_display_name ||
    course.professorName ||
    course.professor_name ||
    course.createdByName ||
    course.created_by_name ||
    course.professorEmail ||
    course.professor_email ||
    course.createdBy ||
    course.created_by ||
    course.instructor ||
    'Professor'
  );
}
