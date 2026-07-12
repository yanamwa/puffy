import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QuizModesModal from '../../components/QuizModesModal';
import { getCourseQuizItems } from '../course/courseContent.js';
import { Avatar, Icon } from './EnrolledCourses';
import {
  findCourseByIdOrCodeAsync,
  getStudentCourseProgress,
  getStudentCourseModules,
  normalizeStudentCourse,
  readStudentCourseProgress,
  saveStudentCourseProgress,
} from './studentCourseData';
import './EnrolledCourses.css';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [rawCourse, setRawCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuizModes, setShowQuizModes] = useState(false);

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

  const course = rawCourse ? normalizeStudentCourse(rawCourse) : null;
  const modules = course ? getStudentCourseModules(course) : [];
  const progress = course ? getStudentCourseProgress(course) : 0;
  const courseRouteId = course
    ? String(course.id || course.course_id || course.code || '')
    : '';
  const courseQuizzes = useMemo(() => getCourseQuizItems(rawCourse), [rawCourse]);
  const completedCount = modules.length
    ? Math.floor((progress / 100) * modules.length)
    : 0;

  const updateCourseProgress = (amount) => {
    if (!course) return;

    const key = String(course.id || course.code);
    const nextProgress = Math.min(100, progress + amount);

    saveStudentCourseProgress({
      ...readStudentCourseProgress(),
      [key]: nextProgress,
    });
  };

  const startLearning = () => {
    updateCourseProgress(progress === 0 ? 8 : 4);
    navigate(`/introduction/${courseRouteId}`);
  };

  const practiceCourse = () => {
    updateCourseProgress(12);
    setShowQuizModes(true);
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

              <div className="student-course-progress">
                <div>
                  <span>Student progress</span>
                  <strong>{progress}%</strong>
                </div>
                <span className="student-course-progress-track">
                  <i style={{ width: `${progress}%` }} />
                </span>
              </div>

              <div className="student-course-actions">
                <button type="button" className="student-start-button" onClick={startLearning}>
                  Start Learning
                </button>
                <button type="button" className="student-practice-button" onClick={practiceCourse}>
                  Practice
                </button>
              </div>
            </div>
          </div>

          <section className="student-course-modules" aria-labelledby="course-modules-title">
            <div className="student-course-section-title">
              <h2 id="course-modules-title">Course content</h2>
              <span>{completedCount}/{modules.length} completed</span>
            </div>

            <div className="student-module-list">
              {modules.map((module, index) => {
                const isComplete = index < completedCount;
                const isCurrent = !isComplete && index === completedCount;

                return (
                  <article
                    className={`student-module-row${isComplete ? ' complete' : ''}${isCurrent ? ' current' : ''}`}
                    key={module.id}
                  >
                    <span className="student-module-number">{index + 1}</span>
                    <div>
                      <h3>{module.title}</h3>
                      <p>{module.description || 'Lesson page'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/introduction/${courseRouteId}`)}
                    >
                      {isComplete ? 'Review' : 'Open'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      {showQuizModes && (
        <QuizModesModal
          source="lesson"
          lessonId={courseRouteId}
          quizzes={courseQuizzes}
          onClose={() => setShowQuizModes(false)}
        />
      )}
    </div>
  );
}
