export const PROFESSOR_COURSES_KEY = "professor-courses";
export const PROFESSOR_COURSES_EVENT = "professor-courses-updated";

const USER_STORAGE_KEYS = ["puffy-user", "user", "currentUser"];

export const professorCoursesSeed = [
  {
    id: 1,
    title: "Introduction to Web Development",
    code: "WEB101",
    summary:
      "HTML, CSS, JavaScript, and the basics of building responsive pages.",
    students: 42,
    modules: 6,
    quizzes: 4,
    status: "published",
    visibility: "public",
    archived: false,
    updatedAt: "2026-07-01",
    professorName: "Professor",
    professorEmail: "",
  },
  {
    id: 2,
    title: "Database Systems",
    code: "DBS204",
    summary:
      "Relational database design, SQL queries, normalization, and reporting.",
    students: 35,
    modules: 5,
    quizzes: 3,
    status: "draft",
    visibility: "private",
    archived: false,
    updatedAt: "2026-06-26",
    professorName: "Professor",
    professorEmail: "",
  },
  {
    id: 3,
    title: "Human Computer Interaction",
    code: "HCI310",
    summary: "Usability, accessibility, prototyping, and user-centered design.",
    students: 28,
    modules: 4,
    quizzes: 2,
    status: "published",
    visibility: "public",
    archived: false,
    updatedAt: "2026-06-20",
    professorName: "Professor",
    professorEmail: "",
  },
];

export const recentProfessorActivities = [
  "Published Module 4 in Introduction to Web Development",
  "Reviewed quiz results for Database Systems",
  "Sent announcement to Human Computer Interaction students",
  "Updated learning objectives for Web Development",
];

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function normalizeRole(role) {
  const value = normalizeKey(role).replace(/[\s-]+/g, "_");

  if (value === "instructor") {
    return "professor";
  }

  return value;
}

function readStoredUser() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of USER_STORAGE_KEYS) {
      try {
        const value = storage.getItem(key);

        if (!value) {
          continue;
        }

        const parsed = JSON.parse(value);

        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {
        storage.removeItem(key);
      }
    }
  }

  return null;
}

function getAccountId(user) {
  return cleanText(user?.userId || user?.id || user?.user_id);
}

export function getCurrentProfessorIdentity(user = readStoredUser()) {
  const role = normalizeRole(user?.role || localStorage.getItem("user_role"));

  if (role !== "professor") {
    return null;
  }

  return {
    id: getAccountId(user),
    email: normalizeKey(
      user?.email ||
        localStorage.getItem("user_email") ||
        localStorage.getItem("email"),
    ),
    name: cleanText(
      user?.displayName ||
        user?.display_name ||
        user?.name ||
        localStorage.getItem("username") ||
        "Professor",
    ),
    department: cleanText(
      user?.professorDepartment ||
        user?.professor_department ||
        user?.department,
    ),
    profileImage: cleanText(
      user?.profileImage || user?.profile_image || user?.avatar || user?.image,
    ),
  };
}

function getCourseProfessorId(course) {
  return cleanText(course?.professorId || course?.professor_id);
}

function getCourseProfessorEmail(course) {
  return normalizeKey(course?.professorEmail || course?.professor_email);
}

export function courseBelongsToProfessor(
  course,
  professor = getCurrentProfessorIdentity(),
) {
  if (!professor) {
    return true;
  }

  const courseProfessorId = getCourseProfessorId(course);
  const courseProfessorEmail = getCourseProfessorEmail(course);

  if (courseProfessorId && professor.id && courseProfessorId === professor.id) {
    return true;
  }

  if (
    courseProfessorEmail &&
    professor.email &&
    courseProfessorEmail === professor.email
  ) {
    return true;
  }

  return false;
}

export function stampCourseForProfessor(
  course,
  professor = getCurrentProfessorIdentity(),
) {
  if (!professor) {
    return course;
  }

  return {
    ...course,
    professorId: professor.id || null,
    professor_id: professor.id || null,
    professorName: professor.name || "Professor",
    professor_name: professor.name || "Professor",
    professorEmail: professor.email || "",
    professor_email: professor.email || "",
    professorDepartment: professor.department || "",
    professor_department: professor.department || "",
    professorProfileImage: professor.profileImage || "",
    professor_profile_image: professor.profileImage || "",
  };
}

let persistedCourses = null;
let courseStorageReady;

function openCourseDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("puffy-course-storage", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("courses");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function accessCourseStorage(courses) {
  const database = await openCourseDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const writing = courses !== undefined;
      const transaction = database.transaction("courses", writing ? "readwrite" : "readonly");
      const store = transaction.objectStore("courses");
      const request = writing ? store.put(courses, PROFESSOR_COURSES_KEY) : store.get(PROFESSOR_COURSES_KEY);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error || new Error("Course storage transaction failed."));
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export function loadProfessorCourseStorage() {
  if (!courseStorageReady) {
    courseStorageReady = accessCourseStorage().then((courses) => {
      if (Array.isArray(courses)) persistedCourses = courses;
    }).catch((error) => {
      courseStorageReady = null;
      throw error;
    });
  }
  return courseStorageReady;
}

function readAllProfessorCourses() {
  if (persistedCourses) return persistedCourses;
  try {
    const saved = localStorage.getItem(PROFESSOR_COURSES_KEY);
    return saved ? JSON.parse(saved) : professorCoursesSeed;
  } catch {
    return professorCoursesSeed;
  }
}

export function readProfessorCourses(options = {}) {
  const courses = readAllProfessorCourses();

  if (options.includeAll) {
    return courses;
  }

  const professor = options.professor || getCurrentProfessorIdentity();

  if (!professor) {
    return courses;
  }

  return courses.filter((course) =>
    courseBelongsToProfessor(course, professor),
  );
}

export async function saveProfessorCourses(courses, options = {}) {
  await loadProfessorCourseStorage();
  const incomingCourses = Array.isArray(courses) ? courses : [];
  const professor = options.professor || getCurrentProfessorIdentity();
  let coursesToStore = incomingCourses;
  let visibleCourses = incomingCourses;

  if (professor && !options.includeAll) {
    const stampedCourses = incomingCourses.map((course) =>
      stampCourseForProfessor(course, professor),
    );
    const preservedCourses = readAllProfessorCourses().filter(
      (course) => !courseBelongsToProfessor(course, professor),
    );

    coursesToStore = [...stampedCourses, ...preservedCourses];
    visibleCourses = stampedCourses;
  }

  try {
    await accessCourseStorage(coursesToStore);
  } catch {
    throw new Error("Could not save the course in this browser. Keep this page open and try again, or reconnect to the server.");
  }
  persistedCourses = coursesToStore;
  // Remove only the legacy course copy, and only after durable storage succeeds.
  localStorage.removeItem(PROFESSOR_COURSES_KEY);

  window.dispatchEvent(
    new CustomEvent(PROFESSOR_COURSES_EVENT, {
      detail: { courses: visibleCourses, allCourses: coursesToStore },
    }),
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
    "Professor"
  );
}

// Hydrate synchronous dashboard readers and notify them when persisted data arrives.
if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
  loadProfessorCourseStorage().then(() => {
    if (persistedCourses) window.dispatchEvent(new CustomEvent(PROFESSOR_COURSES_EVENT));
  }).catch(() => {});
}
