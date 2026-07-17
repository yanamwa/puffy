import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QuizModesModal from '../../components/QuizModesModal';
import { getCourseQuizItems } from '../course/courseContent';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import {
  enrollStudentInCourse,
  findCourseByIdOrCodeAsync,
  findJoinableCourseByCodeAsync,
  getStudentModuleReadingProgress,
  getStudentReadingProgress,
  getStudentCourseModules,
  normalizeStudentCourse,
  STUDENT_READING_PROGRESS_EVENT,
} from './studentCourseData';
import './EnrolledCourses.css';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [rawCourse, setRawCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [practiceScopeOpen, setPracticeScopeOpen] = useState(false);
  const [quizModesOpen, setQuizModesOpen] = useState(false);
  const [selectedPracticeScope, setSelectedPracticeScope] = useState(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCourseCode, setJoinCourseCode] = useState('');
  const [, setProgressVersion] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        const selectedCourse = await findCourseByIdOrCodeAsync(courseId);

        if (active) {
          setRawCourse(selectedCourse);
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
    const refreshProgress = () => setProgressVersion((version) => version + 1);

    window.addEventListener(STUDENT_READING_PROGRESS_EVENT, refreshProgress);
    window.addEventListener('storage', refreshProgress);

    return () => {
      window.removeEventListener(STUDENT_READING_PROGRESS_EVENT, refreshProgress);
      window.removeEventListener('storage', refreshProgress);
    };
  }, []);

  const course = rawCourse ? normalizeStudentCourse(rawCourse) : null;
  const modules = course ? getStudentCourseModules(course) : [];
  const courseRouteId = course
    ? String(course.id || course.course_id || course.code || '')
    : '';
  const allQuizItems = course ? getCourseQuizItems(course) : [];
  const courseProgress = course ? getStudentReadingProgress(courseRouteId) : 0;
  const moduleProgressValues = modules.map((_, index) => (
    getStudentModuleReadingProgress(courseRouteId, index, modules.length)
  ));
  const isPracticeUnlocked =
    courseProgress >= 100 || moduleProgressValues.some((progress) => progress >= 100);
  const getModuleProgress = (index) => (
    moduleProgressValues[index] ?? 0
  );

  const createFallbackQuiz = (module, index) => ({
    id: `${module.id || courseRouteId}-practice-${index + 1}`,
    question: `What should you remember from ${module.title}?`,
    options: [
      module.description || course?.summary || 'Review the lesson content.',
      'Skip the lesson content.',
      'Ignore the main idea.',
      'Only memorize the title.',
    ],
    correct_answer: module.description || course?.summary || 'Review the lesson content.',
    answer: module.description || course?.summary || 'Review the lesson content.',
    explanation: module.description || course?.summary || 'Review this lesson before answering.',
    lessonTitle: module.title,
  });

  const getModulePracticeItems = (module, index) => {
    const matchingItems = allQuizItems.filter((item) => {
      const lessonIndex = Number(item.lessonIndex ?? item.lesson_index ?? item.pageIndex ?? item.page_index);
      const lessonTitle = String(item.lessonTitle || item.lesson_title || item.pageTitle || '').toLowerCase();
      const moduleTitle = String(module.title || '').toLowerCase();

      return lessonIndex === index || (lessonTitle && lessonTitle === moduleTitle);
    });

    if (matchingItems.length) return matchingItems;
    if (modules.length === 1 && allQuizItems.length) return allQuizItems;
    return [createFallbackQuiz(module, index)];
  };

  const practiceScopes = course
    ? [
        {
          id: 'all',
          title: `Everything in ${course.code}`,
          detail: `${modules.length} module page(s)`,
          progress: courseProgress,
          locked: courseProgress < 100,
          quizzes: allQuizItems.length
            ? allQuizItems
            : modules.map((module, index) => createFallbackQuiz(module, index)),
        },
        ...modules.map((module, index) => {
          const progress = getModuleProgress(index);

          return {
            id: module.id,
            title: `${course.code} - Module ${index + 1}`,
            detail: module.title,
            progress,
            locked: progress < 100,
            quizzes: getModulePracticeItems(module, index),
          };
        }),
      ]
    : [];

  const startLearning = () => {
    navigate(`/introduction/${courseRouteId}`);
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setJoinCourseCode('');
  };

  const joinByCourseCode = async () => {
    const joinableCourse = await findJoinableCourseByCodeAsync(joinCourseCode);

    if (!joinableCourse) {
      window.alert('Course code not found. Please check the code from your professor.');
      return;
    }

    enrollStudentInCourse(joinableCourse);
    closeJoinModal();
    navigate(`/student/enrolled-courses/${joinableCourse.id || joinableCourse.code}`);
  };

  const openPracticeModes = (scope) => {
    if (scope.locked) return;

    setSelectedPracticeScope(scope);
    localStorage.setItem(
      'practiceScope',
      JSON.stringify({
        courseId: courseRouteId,
        courseCode: course.code,
        scopeId: scope.id,
        scopeTitle: scope.title,
        scopeDetail: scope.detail,
      })
    );
    setPracticeScopeOpen(false);
    setQuizModesOpen(true);
  };

  if (loading) {
    return (
      <div className="enrolled-dashboard striped-dashboard">
        <aside className="enrolled-sidebar">
          <div className="brand-lockup">
            <img src="/images/logo_solo.png" alt="" />
            <span>PuffyBrain</span>
          </div>
        </aside>
        <main className="enrolled-main">
          <section className="student-course-shell">
            <div className="student-empty-state">Loading course...</div>
          </section>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="enrolled-dashboard striped-dashboard">
        <aside className="enrolled-sidebar">
          <div className="brand-lockup">
            <img src="/images/logo_solo.png" alt="" />
            <span>PuffyBrain</span>
          </div>
        </aside>
        <main className="enrolled-main">
          <section className="student-course-shell">
            <div className="student-empty-state">Course not found.</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="enrolled-dashboard striped-dashboard">
      <aside className="enrolled-sidebar">
        <div className="brand-lockup">
          <img src="/images/logo_solo.png" alt="" />
          <span>PuffyBrain</span>
        </div>

        <nav className="side-nav" aria-label="Student navigation">
          <Link to="/student" className="side-nav-item">
            <Icon name="home" />
            <span>Home</span>
          </Link>
          <Link to="/student/enrolled-courses" className="side-nav-item active">
            <Icon name="courses" />
            <span>Enrolled Courses</span>
            <span className="dropdown-mark">v</span>
          </Link>
          <Link to="/student/public-courses" className="side-nav-item plain-nav-item">
            <Icon name="public" />
            <span>Public Courses</span>
          </Link>
          <Link to="/student/archived-courses" className="side-nav-item plain-nav-item">
            <Icon name="archive" />
            <span>Archived classes</span>
          </Link>
          <Link to="/student/settings" className="side-nav-item plain-nav-item">
            <Icon name="settings" />
            <span>Settings</span>
          </Link>
        </nav>

        <button className="logout-button">
          <span className="logout-icon" aria-hidden="true">&lt;</span>
          <span>Log-out</span>
        </button>
      </aside>

      <main className="enrolled-main">
        <header className="enrolled-topbar transparent-topbar">
          <label className="search-input">
            <input type="search" placeholder="Search your course" />
            <span className="student-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4 4" />
              </svg>
            </span>
          </label>

          <div className="topbar-actions">
            <button className="notification-button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                <path d="M10 19.2h4" />
              </svg>
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => setJoinModalOpen(true)}
            >
              + Join course
            </button>

            <div className="profile-chip">
              <Avatar />
              <strong>@meiko</strong>
              <span className="dropdown-mark">v</span>
            </div>
          </div>
        </header>

        <section className="student-course-shell">
          <div className="student-course-hero">
            <div className="student-course-copy">
              <div className="student-course-meta-row">
                <span>{course.code}</span>
                <span>{course.visibility === 'private' ? 'Private course' : 'Public course'}</span>
              </div>
              <h1>{course.title}</h1>
              <p>{course.summary || 'Continue learning and practicing this course.'}</p>

              <div className="student-course-creator">
                <Avatar />
                <span>Created by {course.instructor}</span>
              </div>

              <div className="student-course-actions">
                <button type="button" className="student-start-button" onClick={startLearning}>
                  Start Learning
                </button>
                <button
                  type="button"
                  className="student-practice-button"
                  onClick={() => setPracticeScopeOpen(true)}
                  disabled={!isPracticeUnlocked}
                  title={
                    isPracticeUnlocked
                      ? 'Practice'
                      : 'Finish the module content before practicing.'
                  }
                >
                  Practice
                </button>
              </div>

              <div
                className="student-course-progress"
                aria-label={`Course reading progress ${courseProgress}%`}
              >
                <div>
                  <span>Reading progress</span>
                  <strong>{courseProgress}%</strong>
                </div>
                <span className="student-course-progress-track">
                  <i style={{ width: `${courseProgress}%` }}></i>
                </span>
              </div>
            </div>
          </div>

          <section className="student-course-modules" aria-labelledby="course-modules-title">
            <div className="student-course-section-title">
              <h2 id="course-modules-title">Module content</h2>
              <span>{modules.length} module page(s)</span>
            </div>

            <div className="student-module-list">
              {modules.map((module, index) => {
                const moduleProgress = getModuleProgress(index);
                const moduleState = moduleProgress >= 100
                  ? 'complete'
                  : moduleProgress > 0
                    ? 'current'
                    : '';

                return (
                  <article
                    className={`student-module-row ${moduleState}`}
                    key={module.id}
                  >
                    <span className="student-module-number">{index + 1}</span>
                    <div className="student-module-main">
                      <h3>{module.title}</h3>
                      <p>{module.description || 'Lesson page'}</p>
                      <div
                        className="student-module-progress"
                        aria-label={`${module.title} reading progress ${moduleProgress}%`}
                      >
                        <span>
                          <i style={{ width: `${moduleProgress}%` }}></i>
                        </span>
                        <strong>{moduleProgress}%</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/introduction/${courseRouteId}`)}
                    >
                      Open
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={joinCourseCode}
        onCourseCodeChange={setJoinCourseCode}
        onCancel={closeJoinModal}
        onJoin={joinByCourseCode}
      />

      {practiceScopeOpen && (
        <div className="practice-scope-overlay" onClick={() => setPracticeScopeOpen(false)}>
          <section
            className="practice-scope-modal"
            aria-modal="true"
            role="dialog"
            aria-labelledby="practice-scope-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="practice-scope-header">
              <h2 id="practice-scope-title">What do you want to practice?</h2>
              <button
                type="button"
                onClick={() => setPracticeScopeOpen(false)}
                aria-label="Close practice picker"
              >
                x
              </button>
            </div>

            <div className="practice-scope-list">
              {practiceScopes.map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  className="practice-scope-option"
                  onClick={() => openPracticeModes(scope)}
                  disabled={scope.locked}
                >
                  <strong>{scope.title}</strong>
                  <span>{scope.detail}</span>
                  <small>
                    {scope.locked
                      ? `${scope.progress}% read`
                      : `${scope.quizzes.length} practice question(s)`}
                  </small>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {quizModesOpen && selectedPracticeScope && (
        <QuizModesModal
          source="lesson"
          lessonId={`${courseRouteId}-${selectedPracticeScope.id}`}
          quizzes={selectedPracticeScope.quizzes}
          onClose={() => setQuizModesOpen(false)}
        />
      )}
    </div>
  );
}
