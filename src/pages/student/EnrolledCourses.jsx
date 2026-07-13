import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuizModesModal from '../../components/QuizModesModal';
import { getCourseQuizItems } from '../course/courseContent.js';
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


const notificationItems = [
  {
    id: 1,
    title: 'Welcome to PuffyBrain!',
    message: 'Your student account is ready. Start exploring your enrolled courses.',
    time: 'Just now',
    unread: true,
    icon: 'sparkle',
  },
  {
    id: 2,
    title: 'New learning material',
    message: 'A new module was added to ITEC 106 - Web Systems and Technologies 2.',
    time: '12 minutes ago',
    unread: true,
    icon: 'course',
  },
  {
    id: 3,
    title: 'Course announcement',
    message: 'Your professor posted an announcement for Introduction to Computing.',
    time: 'Yesterday',
    unread: false,
    icon: 'announcement',
  },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  return localStorage.getItem("sidebarCollapsed") === "true";
});
  const [practiceCourse, setPracticeCourse] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationItems);

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

  const openPracticeModes = (course) => {
    setPracticeCourse(course);
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

  const unreadNotificationCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

  const openNotification = (notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification,
      ),
    );
  };

  return (
    <div
  className={`enrolled-dashboard striped-dashboard ${
    sidebarCollapsed ? 'sidebar-collapsed' : ''
  }`}
>
      <aside className="enrolled-sidebar">
          <div className="brand-lockup">
           <img
              src="/images/logo_solo.png"
              alt="PuffyBrain logo"
              className="sidebar-logo"
              onClick={() => {
                setSidebarCollapsed((prev) => {
                  const newValue = !prev;
                  localStorage.setItem("sidebarCollapsed", newValue);
                  return newValue;
                });
              }}
            />

            <span className="brand-name">PuffyBrain</span>

          </div>

          <nav className="side-nav" aria-label="Student navigation">
            <Link
              to="/student"
              className="side-nav-item"
              title={sidebarCollapsed ? 'Home' : undefined}
            >
              <Icon name="home" />
              <span className="nav-label">Home</span>
            </Link>

            <Link
              to="/student/enrolled-courses"
              className="side-nav-item active"
              title={
                sidebarCollapsed
                  ? 'Enrolled Courses'
                  : undefined
              }
            >
              <Icon name="courses" />
              <span className="nav-label">
                Enrolled Courses
              </span>
              <span className="dropdown-mark">v</span>
            </Link>

            <Link
              to="/student/public-courses"
              className="side-nav-item plain-nav-item"
              title={
                sidebarCollapsed
                  ? 'Public Courses'
                  : undefined
              }
            >
              <Icon name="public" />
              <span className="nav-label">
                Public Courses
              </span>
            </Link>

            <Link
              to="/student/archived-courses"
              className="side-nav-item plain-nav-item"
              title={
                sidebarCollapsed
                  ? 'Archived Classes'
                  : undefined
              }
            >
              <Icon name="archive" />
              <span className="nav-label">
                Archived classes
              </span>
            </Link>

            <Link
              to="/student/settings"
              className="side-nav-item plain-nav-item"
              title={
                sidebarCollapsed ? 'Settings' : undefined
              }
            >
              <Icon name="settings" />
              <span className="nav-label">Settings</span>
            </Link>
          </nav>

          <button
            type="button"
            className="logout-button"
            title={sidebarCollapsed ? 'Log-out' : undefined}
          >
            <span
              className="logout-icon"
              aria-hidden="true"
            />

            <span className="logout-label">Log-out</span>
          </button>
        </aside>

      <main className="enrolled-main">
        <header className="enrolled-topbar transparent-topbar enrolled-courses-topbar">
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
            <div className="notification-menu-wrapper">
              <button
                type="button"
                className={`notification-button ${
                  notificationMenuOpen ? 'active' : ''
                }`}
                aria-label={`Notifications${
                  unreadNotificationCount > 0
                    ? `, ${unreadNotificationCount} unread`
                    : ''
                }`}
                aria-expanded={notificationMenuOpen}
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileMenuOpen(false);
                  setNotificationMenuOpen((current) => !current);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                  <path d="M10 19.2h4" />
                </svg>

                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount > 9
                      ? '9+'
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationMenuOpen && (
                <section
                  className="notification-dropdown-menu"
                  role="dialog"
                  aria-label="Notifications"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="notification-dropdown-header">
                    <div>
                      <h2>Notifications</h2>
                      <span>
                        {unreadNotificationCount > 0
                          ? `${unreadNotificationCount} unread`
                          : 'You are all caught up'}
                      </span>
                    </div>

                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        className="mark-all-read-button"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-dropdown-tabs">
                    <button type="button" className="active">
                      All
                    </button>
                    <button type="button">Unread</button>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty-state">
                        <span className="notification-empty-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                            <path d="M10 19.2h4" />
                          </svg>
                        </span>
                        <strong>No notifications yet</strong>
                        <p>New updates will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`notification-item ${
                            notification.unread ? 'unread' : ''
                          }`}
                          onClick={() => openNotification(notification.id)}
                        >
                          <span
                            className={`notification-item-icon ${notification.icon}`}
                            aria-hidden="true"
                          >
                            {notification.icon === 'course' ? (
                              <svg viewBox="0 0 24 24">
                                <path d="m3.5 8.2 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z" />
                                <path d="M6.5 10.2v5c0 1.3 2.5 3 5.5 3s5.5-1.7 5.5-3v-5" />
                              </svg>
                            ) : notification.icon === 'announcement' ? (
                              <svg viewBox="0 0 24 24">
                                <path d="M4 11v2h3l7 4V7l-7 4H4Z" />
                                <path d="m17 9 3-2M17 12h3M17 15l3 2" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24">
                                <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
                              </svg>
                            )}
                          </span>

                          <span className="notification-item-copy">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                            <small>{notification.time}</small>
                          </span>

                          {notification.unread && (
                            <span
                              className="notification-unread-dot"
                              aria-label="Unread"
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="notification-view-all-button"
                    onClick={() => {
                      setNotificationMenuOpen(false);
                      navigate('/student/notifications');
                    }}
                  >
                    See all notifications
                  </button>
                </section>
              )}
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setJoinModalOpen(true)}
            >
              + Join course
            </button>

            <div className="profile-menu-wrapper">
            <div className="profile-chip">
              <button
                type="button"
                className="profile-main-button"
                onClick={() => navigate('/student/profile')}
                aria-label="Open your profile"
              >
                <span className="profile-avatar">
                  <Avatar />
                  <span className="profile-status-dot" />
                </span>

                <span className="profile-user-info">
                  <strong>@meiko</strong>
                  <small>Student</small>
                </span>
              </button>

              <button
                type="button"
                className={`profile-dropdown-button ${
                  profileMenuOpen ? 'open' : ''
                }`}
                aria-label={profileMenuOpen ? 'Close profile menu' : 'Open profile menu'}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileMenuOpen((current) => !current);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
            </div>

            {profileMenuOpen && (
              <div
                className="profile-dropdown-menu"
                role="menu"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="profile-dropdown-header">
                  <Avatar />

                  <div>
                    <strong>@meiko</strong>
                    <span>Student account</span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/student/profile');
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6" />
                  </svg>

                  <span>View profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/student/settings');
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19 13.5v-3l-2-.6a7 7 0 0 0-.7-1.6l1-1.8-2.1-2.1-1.8 1a7 7 0 0 0-1.6-.7L11.5 3h-3l-.6 2a7 7 0 0 0-1.6.7l-1.8-1-2.1 2.1 1 1.8a7 7 0 0 0-.7 1.6L1 10.5v3l2 .6a7 7 0 0 0 .7 1.6l-1 1.8 2.1 2.1 1.8-1a7 7 0 0 0 1.6.7l.6 2h3l.6-2a7 7 0 0 0 1.6-.7l1.8 1 2.1-2.1-1-1.8a7 7 0 0 0 .7-1.6Z" />
                  </svg>

                  <span>Settings</span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-logout-option"
                  onClick={() => {
                    setProfileMenuOpen(false);

                    localStorage.removeItem('token');
                    sessionStorage.clear();

                    navigate('/login');
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 5H5v14h5" />
                    <path d="m14 8 4 4-4 4" />
                    <path d="M18 12H9" />
                  </svg>

                  <span>Log out</span>
                </button>
              </div>
            )}
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
                    onClick={() => openPracticeModes(course)}
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

      {practiceCourse && (
        <QuizModesModal
          source="lesson"
          lessonId={practiceCourse.id || practiceCourse.course_id || practiceCourse.code}
          quizzes={getCourseQuizItems(practiceCourse)}
          onClose={() => setPracticeCourse(null)}
        />
      )}
    </div>
  );
}