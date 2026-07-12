import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Icon, SortDropdown } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import {
  PROFESSOR_COURSES_EVENT,
} from '../professor/professorData';
import {
  enrollStudentInCourse,
  getPublicStudentCourses,
  findJoinableCourseByCodeAsync,
  loadPublicStudentCourses,
} from './studentCourseData';
import './EnrolledCourses.css';

export default function PublicCourses() {
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [publicCourses, setPublicCourses] = useState(() => getPublicStudentCourses());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const refreshCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const courses = await loadPublicStudentCourses();

        if (active) {
          setPublicCourses(courses);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error.message || 'Could not load public courses.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const handleRefresh = () => {
      refreshCourses();
    };

    refreshCourses();

    window.addEventListener(PROFESSOR_COURSES_EVENT, handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(PROFESSOR_COURSES_EVENT, handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const startLearning = (course) => {
    enrollStudentInCourse(course);
    navigate(`/introduction/${course.id || course.course_id || course.code}`);
  };

  const joinByCourseCode = async () => {
    const course = await findJoinableCourseByCodeAsync(courseCode);

    if (!course) {
      window.alert('Course code not found. Please check the code from your professor.');
      return;
    }

    closeJoinModal();
    startLearning(course);
  };

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
          <Link to="/student/enrolled-courses" className="side-nav-item">
            <Icon name="courses" />
            <span>Enrolled Courses</span>
            <span className="dropdown-mark">v</span>
          </Link>
          <Link to="/student/public-courses" className="side-nav-item plain-nav-item active">
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

      <main className="enrolled-main public-main">
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
            <button type="button" className="primary-button" onClick={() => setJoinModalOpen(true)}>
              + Join course
            </button>
            <div className="profile-chip">
              <Avatar />
              <strong>@meiko</strong>
              <span className="dropdown-mark">v</span>
            </div>
          </div>
        </header>

        <section className="public-heading">
          <h1>Public Courses</h1>
          <div className="filter-actions">
            <SortDropdown label="Recent" options={['Recent', 'Oldest']} />
            <SortDropdown label="A to Z" options={['A to Z', 'Z to A']} />
          </div>
        </section>

        <section className="public-courses-grid" aria-label="Public courses">
          {loading ? (
            <div className="student-empty-state">Loading public courses...</div>
          ) : errorMessage ? (
            <div className="student-empty-state">{errorMessage}</div>
          ) : publicCourses.length === 0 ? (
            <div className="student-empty-state">No public courses available yet.</div>
          ) : (
            publicCourses.map((course) => (
              <article key={course.id} className="course-folder public-course-folder">
                <button
                  type="button"
                  className="add-course-button"
                  aria-label="Add public course"
                  onClick={() => startLearning(course)}
                >
                  +
                </button>
                <div className="course-card-body">
                  <h2>{course.code} - {course.title}</h2>
                </div>
                <div className="course-card-footer">
                  <Avatar />
                  <span>{course.instructor}</span>
                  <button
                    type="button"
                    className="start-learning-button"
                    onClick={() => startLearning(course)}
                  >
                    Start Learning
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={courseCode}
        onCourseCodeChange={setCourseCode}
        onCancel={closeJoinModal}
        onJoin={joinByCourseCode}
      />
    </div>
  );
}
