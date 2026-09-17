import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import QuizModesModal from '../../components/QuizModesModal';
import {
  getCourseContentModules,
  getCourseQuizItems,
} from '../course/courseContent';
import { Avatar } from './EnrolledCourses';
import StudentSidebar from '../../components/students/StudentSidebar';
import StudentHeader from '../../components/students/StudentHeader';
import JoinCourseModal from './JoinCourseModal';

import {
  enrollStudentInCourseAsync,
  findCourseByIdOrCodeAsync,
  findJoinableCourseByCodeAsync,
  getStudentModuleReadingProgress,
  getStudentReadingProgress,
  getStudentCourseModules,
  normalizeStudentCourse,
  STUDENT_READING_PROGRESS_EVENT,
} from './studentCourseData';
import {
  clearStudentSession,
  getStudentAccountLabel,
  getStudentProfileHandle,
  useStudentProfile,
} from './studentProfileData';

import './StudentCourseDetail.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const notificationItems = [
  {
    id: 1,
    title: 'Welcome to PuffyBrain!',
    message:
      'Your student account is ready. Start exploring your enrolled courses.',
    time: 'Just now',
    unread: true,
    icon: 'sparkle',
  },
  {
    id: 2,
    title: 'New learning material',
    message:
      'A new module was added to ITEC 106 - Web Systems and Technologies 2.',
    time: '12 minutes ago',
    unread: true,
    icon: 'course',
  },
  {
    id: 3,
    title: 'Course announcement',
    message:
      'Your professor posted an announcement for Introduction to Computing.',
    time: 'Yesterday',
    unread: false,
    icon: 'announcement',
  },
];

function resolveProfileImage(imagePath) {
  if (!imagePath) return undefined;

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${serverOrigin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken')
  );
}

function getProfessorDepartment(course) {
  return course.professorDepartment || course.professor_department || 'Department not set';
}

function normalizeModule(module, index) {
  const lessonPages = Array.isArray(module?.lessonPages)
    ? module.lessonPages
    : Array.isArray(module?.lesson_pages)
      ? module.lesson_pages
      : [];

  const quizItems = Array.isArray(module?.quizItems)
    ? module.quizItems
    : Array.isArray(module?.quiz_items)
      ? module.quiz_items
      : [];

  return {
    ...module,
    id:
      module?.id ||
      module?.module_id ||
      `module-${index + 1}`,
    title:
      String(module?.title || '').trim() ||
      `Module ${index + 1}`,
    description: String(
      module?.description ||
        module?.summary ||
        ''
    ),
    learningObjectives: String(
      module?.learningObjectives ||
        module?.learning_objectives ||
        ''
    ),
    lessonPages,
    quizItems,
  };
}

function getNestedCourseModules(course) {
  const parsedModules = getCourseContentModules(course);

  if (parsedModules.length > 0) {
    return parsedModules.map(normalizeModule);
  }

  return getStudentCourseModules(course).map(normalizeModule);
}

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const studentProfile = useStudentProfile();

  const [rawCourse, setRawCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [quizModesOpen, setQuizModesOpen] = useState(false);
  const [selectedPracticeModule, setSelectedPracticeModule] =
    useState(null);

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCourseCode, setJoinCourseCode] = useState('');
  const [notificationMenuOpen, setNotificationMenuOpen] =
    useState(false);
  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);
  const [notifications, setNotifications] =
    useState(notificationItems);

  const [enrolledCoursesOpen, setEnrolledCoursesOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [, setProgressVersion] = useState(0);

  const loadEnrolledCourses = async () => {
    try {
      setCoursesLoading(true);

      const token = getStoredToken();

      if (!token) {
        setCourses([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/courses/enrolled`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not load enrolled courses.'
        );
      }

      const loadedCourses = Array.isArray(data.courses)
        ? data.courses
        : Array.isArray(data.data)
          ? data.data
          : [];

      setCourses(loadedCourses);
    } catch (error) {
      console.error(
        'Sidebar enrolled courses loading error:',
        error
      );

      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);

        const selectedCourse =
          await findCourseByIdOrCodeAsync(courseId);

        if (active) {
          setRawCourse(selectedCourse);
        }
      } catch (error) {
        console.error('Could not load course:', error);

        if (active) {
          setRawCourse(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    const refreshProgress = () => {
      setProgressVersion((version) => version + 1);
    };

    window.addEventListener(
      STUDENT_READING_PROGRESS_EVENT,
      refreshProgress
    );

    window.addEventListener('storage', refreshProgress);

    return () => {
      window.removeEventListener(
        STUDENT_READING_PROGRESS_EVENT,
        refreshProgress
      );

      window.removeEventListener(
        'storage',
        refreshProgress
      );
    };
  }, []);

  useEffect(() => {
    const closeOpenMenus = (event) => {
      if (!event.target.closest('.profile-menu-wrapper')) {
        setProfileMenuOpen(false);
      }

      if (!event.target.closest('.notification-menu-wrapper')) {
        setNotificationMenuOpen(false);
      }
    };

    const closeMenusWithEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOpenMenus);
    document.addEventListener('keydown', closeMenusWithEscape);

    return () => {
      document.removeEventListener('mousedown', closeOpenMenus);
      document.removeEventListener('keydown', closeMenusWithEscape);
    };
  }, []);

  const course = rawCourse
    ? normalizeStudentCourse(rawCourse)
    : null;

  const modules = useMemo(
    () => (course ? getNestedCourseModules(course) : []),
    [course]
  );

  const courseRouteId = course
    ? String(
        course.id ||
          course.course_id ||
          course.code ||
          ''
      )
    : '';

  const allQuizItems = course
    ? getCourseQuizItems(course)
    : [];

  const courseProgress = course
    ? getStudentReadingProgress(courseRouteId)
    : 0;

  const moduleProgressValues = modules.map(
    (_, index) =>
      getStudentModuleReadingProgress(
        courseRouteId,
        index,
        modules.length
      )
  );

  const getModuleProgress = (index) =>
    moduleProgressValues[index] ?? 0;

  const isModuleLearnUnlocked = (index) => {
    if (index === 0) {
      return true;
    }

    return getModuleProgress(index - 1) >= 100;
  };

  const isModulePracticeUnlocked = (index) =>
    isModuleLearnUnlocked(index) &&
    getModuleProgress(index) >= 100;

  const areAllModulesCompleted =
    modules.length > 0 &&
    moduleProgressValues.every((progress) => progress >= 100);

  const createFallbackQuiz = (module, index) => ({
    id: `${module.id || courseRouteId}-practice-${index + 1}`,
    type: 'multiple_choice',
    question: `What should you remember from ${module.title}?`,
    options: [
      module.description ||
        course?.summary ||
        'Review the module content.',
      'Skip the module content.',
      'Ignore the main idea.',
      'Only memorize the title.',
    ],
    correct_answer:
      module.description ||
      course?.summary ||
      'Review the module content.',
    answer:
      module.description ||
      course?.summary ||
      'Review the module content.',
    explanation:
      module.description ||
      course?.summary ||
      'Review this module before answering.',
    moduleId: module.id,
    moduleIndex: index,
    moduleTitle: module.title,
  });

  const getModulePracticeItems = (module, index) => {
    if (Array.isArray(module.quizItems) && module.quizItems.length) {
      return module.quizItems;
    }

    const moduleId = String(module.id || '');
    const moduleTitle = String(module.title || '')
      .trim()
      .toLowerCase();

    const matchingItems = allQuizItems.filter((item) => {
      const itemModuleId = String(
        item.moduleId || item.module_id || ''
      );

      const itemModuleIndex = Number(
        item.moduleIndex ?? item.module_index
      );

      const itemModuleTitle = String(
        item.moduleTitle ||
          item.module_title ||
          item.lessonTitle ||
          item.lesson_title ||
          ''
      )
        .trim()
        .toLowerCase();

      return (
        (moduleId && itemModuleId === moduleId) ||
        itemModuleIndex === index ||
        (moduleTitle && itemModuleTitle === moduleTitle)
      );
    });

    if (matchingItems.length) {
      return matchingItems;
    }

    if (modules.length === 1 && allQuizItems.length) {
      return allQuizItems;
    }

    return [createFallbackQuiz(module, index)];
  };

  const startModuleLearning = async (module, index) => {
    if (!isModuleLearnUnlocked(index)) {
      await Swal.fire({
        icon: 'info',
        title: 'Module Locked',
        text: `Complete Module ${index} before opening Module ${
          index + 1
        }.`,
        confirmButtonText: 'OK',
      });

      return;
    }

    const selectedModule = {
      courseId: courseRouteId,
      courseCode: course.code,
      moduleId: module.id,
      moduleIndex: index,
      moduleTitle: module.title,
      lessonPages: module.lessonPages,
    };

    localStorage.setItem(
      'selectedCourseModule',
      JSON.stringify(selectedModule)
    );

    navigate(
      `/introduction/${courseRouteId}?module=${index}`
    );
  };

  const openModulePractice = async (module, index) => {
    if (!isModuleLearnUnlocked(index)) {
      await Swal.fire({
        icon: 'info',
        title: 'Module Locked',
        text: `Complete Module ${index} before practicing Module ${
          index + 1
        }.`,
        confirmButtonText: 'OK',
      });

      return;
    }

    if (!isModulePracticeUnlocked(index)) {
      await Swal.fire({
        icon: 'info',
        title: 'Finish Reading First',
        text: `Read all lesson pages in Module ${
          index + 1
        } before starting its practice quiz.`,
        confirmButtonText: 'OK',
      });

      return;
    }

    const quizzes = getModulePracticeItems(module, index);

    const practiceModule = {
      id: module.id,
      index,
      title: module.title,
      detail: `${module.lessonPages.length} lesson page(s)`,
      quizzes,
    };

    localStorage.setItem(
      'practiceScope',
      JSON.stringify({
        courseId: courseRouteId,
        courseCode: course.code,
        scopeId: module.id,
        scopeType: 'module',
        moduleIndex: index,
        scopeTitle: module.title,
        scopeDetail: practiceModule.detail,
      })
    );

    setSelectedPracticeModule(practiceModule);
    setQuizModesOpen(true);
  };

  const startCourseLearning = () => {
    const firstIncompleteIndex = moduleProgressValues.findIndex(
      (progress) => progress < 100
    );

    const targetIndex =
      firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex;

    const targetModule = modules[targetIndex];

    if (targetModule) {
      startModuleLearning(targetModule, targetIndex);
    }
  };

  const openCoursePractice = async () => {
    if (!areAllModulesCompleted) {
      await Swal.fire({
        icon: 'info',
        title: 'Complete All Modules',
        text:
          'Finish reading every module before practicing the complete course.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const quizzes = modules.flatMap((module, index) =>
      getModulePracticeItems(module, index)
    );

    localStorage.setItem(
      'practiceScope',
      JSON.stringify({
        courseId: courseRouteId,
        courseCode: course.code,
        scopeId: 'all-modules',
        scopeType: 'course',
        scopeTitle: `Everything in ${course.code}`,
        scopeDetail: `${modules.length} module(s)`,
      })
    );

    setSelectedPracticeModule({
      id: 'all-modules',
      index: -1,
      title: `Everything in ${course.code}`,
      detail: `${modules.length} module(s)`,
      quizzes,
    });

    setQuizModesOpen(true);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;

      localStorage.setItem(
        'sidebarCollapsed',
        String(nextValue)
      );

      return nextValue;
    });
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setJoinCourseCode('');
  };

 const joinByCourseCode = async () => {
  try {
    const trimmedCode = joinCourseCode.trim();

    if (!trimmedCode) {
      await Swal.fire({
        icon: 'warning',
        title: 'Enter Course Code',
        text: 'Please enter the course code provided by your professor.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
      });

      return;
    }

    const course =
      await findJoinableCourseByCodeAsync(trimmedCode);

    if (!course) {
      await Swal.fire({
        icon: 'error',
        title: 'Course Not Found',
        text: 'Course code not found. Please check the code from your professor.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
      });

      return;
    }

    await enrollStudentInCourseAsync(course);

    closeJoinModal();

    await loadEnrolledCourses();

    await Swal.fire({
      icon: 'success',
      title: 'Course Joined!',
      text: `You have successfully joined ${
        course.title ||
        course.course_name ||
        course.name ||
        'the course'
      }.`,
      confirmButtonText: 'Continue',
      confirmButtonColor: '#198754',
    });

    const courseId =
      course.id ||
      course.courseId ||
      course.course_id ||
      course.code ||
      course.courseCode ||
      course.course_code;

    navigate(
      `/student/enrolled-courses/${courseId}`
    );
  } catch (error) {
    console.error(
      'Join course error:',
      error
    );

    await Swal.fire({
      icon: 'error',
      title: 'Unable to Join Course',
      text:
        error?.message ||
        'Unable to join the course.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#198754',
    });
  }
};

  const unreadNotificationCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const openNotification = (notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const profileHandle = getStudentProfileHandle(studentProfile);
  const accountLabel = getStudentAccountLabel(studentProfile);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);
    clearStudentSession();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="student-course-detail-page">
        <StudentSidebar />
        <div className="student-course-detail-main-area">
          <StudentHeader searchPlaceholder="Search your course" onJoinCourse={() => setJoinModalOpen(true)} />
          <main className="student-course-detail-content">
            <section className="student-course-shell"><div className="student-empty-state">Loading course...</div></section>
          </main>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="student-course-detail-page">
        <StudentSidebar />
        <div className="student-course-detail-main-area">
          <StudentHeader searchPlaceholder="Search your course" onJoinCourse={() => setJoinModalOpen(true)} />
          <main className="student-course-detail-content">
            <section className="student-course-shell"><div className="student-empty-state">Course not found.</div></section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="student-course-detail-page">
      <StudentSidebar />
      <div className="student-course-detail-main-area">
        <StudentHeader searchPlaceholder="Search your course" onJoinCourse={() => setJoinModalOpen(true)} />
        <main className="student-course-detail-content">
          <section className="student-course-shell">
                    <div className="student-course-hero">
                      <div className="student-course-copy">
                        <div className="student-course-meta-row">
                          <span>{course.code}</span>
          
                          <span>
                            {course.visibility === 'private'
                              ? 'Private course'
                              : 'Public course'}
                          </span>
                        </div>
          
                        <h1>{course.title}</h1>
          
                        <p>
                          {course.summary ||
                            'Continue learning and practicing this course.'}
                        </p>
          
                        <div
                          className="student-course-progress"
                          aria-label={`Course reading progress ${courseProgress}%`}
                        >
                          <span className="student-course-progress-track">
                            <i style={{ width: `${courseProgress}%` }} />
                          </span>
          
                          <div>
                            <span>Reading progress</span>
                            <strong>{courseProgress}%</strong>
                          </div>
                        </div>
          
                        <div className="student-course-bottom-row">
                          <div className="student-course-creator">
                            <Avatar
                              src={resolveProfileImage(
                                course.professorProfileImage ||
                                  course.professor_profile_image,
                              )}
                              alt={`${
                                course.instructor ||
                                course.professorName ||
                                'Professor'
                              }'s profile`}
                            />
          
                            <div className="enrolled-course-meta">
                              <span>
                                {course.instructor ||
                                  course.professorName ||
                                  'Professor'}
                              </span>
          
                              <small>
                                {getProfessorDepartment(
                                  course,
                                )}
                              </small>
                            </div>
                          </div>
          
                          <div className="student-course-actions">
                            <button
                              type="button"
                              className="student-start-button"
                              onClick={startCourseLearning}
                              disabled={modules.length === 0}
                            >
                              Start Learning
                            </button>
          
                            <button
                              type="button"
                              className="student-practice-button"
                              onClick={openCoursePractice}
                              disabled={!areAllModulesCompleted}
                              title={
                                areAllModulesCompleted
                                  ? 'Practice the complete course'
                                  : 'Complete all modules before practicing the complete course.'
                              }
                            >
                              Practice All
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
          
                    <section
                      className="student-course-modules"
                      aria-labelledby="course-modules-title"
                    >
                      <div className="student-course-section-title">
                        <div>
                          <h2 id="course-modules-title">Modules</h2>
                          <p className="student-module-section-description">
                            Complete each module to unlock the next one.
                          </p>
                        </div>
          
                        <span>{modules.length} module(s)</span>
                      </div>
          
                      {modules.length === 0 ? (
                        <div className="student-empty-state">
                          No modules have been added to this course yet.
                        </div>
                      ) : (
                        <div className="student-module-list">
                          {modules.map((module, index) => {
                            const moduleProgress = getModuleProgress(index);
                            const learnUnlocked =
                              isModuleLearnUnlocked(index);
                            const practiceUnlocked =
                              isModulePracticeUnlocked(index);
          
                            const moduleState = !learnUnlocked
                              ? 'locked'
                              : moduleProgress >= 100
                                ? 'complete'
                                : moduleProgress > 0
                                  ? 'current'
                                  : 'available';
          
                            return (
                              <article
                                className={`student-module-row ${moduleState}`}
                                key={module.id}
                              >
                                <span className="student-module-number">
                                  {learnUnlocked ? index + 1 : '🔒'}
                                </span>
          
                                <div className="student-module-main">
                                  <div className="student-module-title-row">
                                    <div>
                                      <span className="student-module-eyebrow">
                                        Module {index + 1}
                                      </span>
          
                                      <h3>{module.title}</h3>
                                    </div>
          
                                    <span
                                      className={`student-module-status ${moduleState}`}
                                    >
                                      {!learnUnlocked
                                        ? 'Locked'
                                        : moduleProgress >= 100
                                          ? 'Completed'
                                          : moduleProgress > 0
                                            ? 'In progress'
                                            : 'Available'}
                                    </span>
                                  </div>
          
                                  <p>
                                    {module.description ||
                                      `${module.lessonPages.length} lesson page(s)`}
                                  </p>
          
                                  {!learnUnlocked && (
                                    <small className="student-module-lock-message">
                                      Complete Module {index} to unlock this module.
                                    </small>
                                  )}
          
                                  <div
                                    className="student-module-progress"
                                    aria-label={`${module.title} reading progress ${moduleProgress}%`}
                                  >
                                    <span>
                                      <i style={{ width: `${moduleProgress}%` }} />
                                    </span>
          
                                    <strong>{moduleProgress}%</strong>
                                  </div>
                                </div>
          
                                <div className="student-module-actions">
                                  <button
                                    type="button"
                                    className="student-module-learn-button"
                                    onClick={() =>
                                      startModuleLearning(module, index)
                                    }
                                    disabled={!learnUnlocked}
                                  >
                                    {moduleProgress > 0
                                      ? 'Continue'
                                      : 'Learn'}
                                  </button>
          
                                  <button
                                    type="button"
                                    className="student-module-practice-button"
                                    onClick={() =>
                                      openModulePractice(module, index)
                                    }
                                    disabled={!practiceUnlocked}
                                    title={
                                      practiceUnlocked
                                        ? `Practice ${module.title}`
                                        : 'Finish reading this module first.'
                                    }
                                  >
                                    Practice
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </section>
        </main>
      </div>
      <JoinCourseModal open={joinModalOpen} courseCode={joinCourseCode} onCourseCodeChange={setJoinCourseCode} onCancel={closeJoinModal} onJoin={joinByCourseCode} />
      {quizModesOpen && selectedPracticeModule && (
        <QuizModesModal
          source={selectedPracticeModule.index === -1 ? 'course' : 'module'}
          lessonId={`${courseRouteId}-${selectedPracticeModule.id}`}
          quizzes={selectedPracticeModule.quizzes}
          onClose={() => { setQuizModesOpen(false); setSelectedPracticeModule(null); }}
        />
      )}
    </div>
  );
}
