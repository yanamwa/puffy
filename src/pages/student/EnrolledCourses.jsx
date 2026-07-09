import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JoinCourseModal from './JoinCourseModal';
import { PROFESSOR_COURSES_EVENT } from '../professor/professorData';
import {
  enrollStudentInCourse,
  findJoinableCourseByCodeAsync,
  getStudentEnrolledCourses,
  loadStudentEnrolledCourses,
  STUDENT_ENROLLED_COURSES_EVENT,
} from './studentCourseData';
import './EnrolledCourses.css';

const navItems = [
  { label: 'Public Courses', to: '/student/public-courses', icon: 'public' },
  { label: 'Archived classes', to: '/student/archived-courses', icon: 'archive' },
  { label: 'Settings', to: '/student/settings', icon: 'settings' },
];

export function Icon({ name }) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.3 12 5l8 6.3V20a1 1 0 0 1-1 1h-4.6v-5.4H9.6V21H5a1 1 0 0 1-1-1v-8.7Z" />
      </svg>
    );
  }

  if (name === 'courses') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3.2 8.2 8.8-4.9 8.8 4.9-8.8 4.9-8.8-4.9Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 10.3v5.2c0 1.2 2.7 3 6 3s6-1.8 6-3v-5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M20.8 8.3v6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  if (name === 'quiz') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19 6.2 14.8 15.8 5.2a2 2 0 0 1 2.8 2.8L9 17.6 5 19Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="m14.4 6.6 3 3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  if (name === 'folder') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5h6l1.7 2H20v8.8H4V7.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'public') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 12h15M12 4.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (name === 'archive') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h14v11H5V8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 5h16v3H4V5ZM9 12h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m18.6 13.4 1.2 1.1-1.7 3-1.6-.5a7.4 7.4 0 0 1-1.6.9l-.3 1.6h-3.4l-.3-1.6a7.4 7.4 0 0 1-1.6-.9l-1.6.5-1.7-3 1.2-1.1a6.3 6.3 0 0 1 0-1.8l-1.2-1.1 1.7-3 1.6.5a7.4 7.4 0 0 1 1.6-.9l.3-1.6h3.4l.3 1.6a7.4 7.4 0 0 1 1.6.9l1.6-.5 1.7 3-1.2 1.1a6.3 6.3 0 0 1 0 1.8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }

  return null;
}

export function SortDropdown({ label, options }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(label);

  return (
    <div className="sort-dropdown">
      <button
        type="button"
        className="sort-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected}</span>
        <span className="dropdown-mark">v</span>
      </button>
      {open && (
        <div className="sort-menu" role="menu">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              onClick={() => {
                setSelected(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Avatar({ large = false }) {
  return (
    <span className={`anime-avatar${large ? ' large' : ''}`}>
      <img src="/images/temporaryimg.png" alt="" />
    </span>
  );
}

export default function EnrolledCourses() {
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courses, setCourses] = useState(() => getStudentEnrolledCourses());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const refreshCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const loadedCourses = await loadStudentEnrolledCourses();

        if (active) {
          setCourses(loadedCourses);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error.message || 'Could not load enrolled courses.');
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
    window.addEventListener(STUDENT_ENROLLED_COURSES_EVENT, handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(PROFESSOR_COURSES_EVENT, handleRefresh);
      window.removeEventListener(STUDENT_ENROLLED_COURSES_EVENT, handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const openCourse = (course) => {
    navigate(`/student/enrolled-courses/${course.id || course.code}`);
  };

  const joinByCourseCode = async () => {
    const course = await findJoinableCourseByCodeAsync(courseCode);

    if (!course) {
      window.alert('Course code not found. Please check the code from your professor.');
      return;
    }

    enrollStudentInCourse(course);
    closeJoinModal();
    navigate(`/student/enrolled-courses/${course.id || course.code}`);
  };

  return (
    <div className="enrolled-dashboard">
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

          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`side-nav-item${item.icon ? '' : ' plain-nav-item'}${item.active ? ' active' : ''}`}
            >
              {item.icon && <Icon name={item.icon} />}
              <span>{item.label}</span>
              {item.active && <span className="dropdown-mark">v</span>}
            </Link>
          ))}
        </nav>

        <button className="logout-button">
          <span className="logout-icon" aria-hidden="true">&lt;</span>
          <span>Log-out</span>
        </button>
      </aside>

      <main className="enrolled-main">
        <header className="enrolled-topbar">
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
          <h1>Enrolled Courses</h1>
          <div className="filter-actions">
            <SortDropdown label="Recent" options={['Recent', 'Oldest']} />
            <SortDropdown label="A to Z" options={['A to Z', 'Z to A']} />
          </div>
        </section>

        <section className="courses-grid" aria-label="Enrolled courses">
          {loading ? (
            <div className="student-empty-state">Loading enrolled courses...</div>
          ) : errorMessage ? (
            <div className="student-empty-state">{errorMessage}</div>
          ) : courses.length === 0 ? (
            <div className="student-empty-state">
              No enrolled courses yet. Join by code or start a public course.
            </div>
          ) : (
            courses.map((course) => (
              <article key={course.id || course.code} className="course-folder enrolled-course-folder">
                <button
                  type="button"
                  className="menu-button"
                  aria-label="Course options"
                  onClick={() => openCourse(course)}
                >
                  <span />
                  <span />
                  <span />
                </button>
                <div className="course-card-body">
                  <h2>{course.code} - {course.title}</h2>
                  <div className="enrolled-card-progress" aria-label={`${course.progress}% complete`}>
                    <span>
                      <i style={{ width: `${course.progress}%` }} />
                    </span>
                    <strong>{course.progress}% progress</strong>
                  </div>
                </div>
                <div className="course-card-footer">
                  <Avatar />
                  <span>Created by {course.instructor}</span>
                  <button
                    type="button"
                    className="start-learning-button"
                    onClick={() => openCourse(course)}
                  >
                    Practice
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
