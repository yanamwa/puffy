import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import {
  enrollStudentInCourse,
  findJoinableCourseByCodeAsync,
} from './studentCourseData';
import './EnrolledCourses.css';

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

const temporaryStudentData = {
  name: 'Meiko Santos',
  studentNumber: '2026-001234',
  year: '3rd Year',
  section: 'BSIT 3A',
  email: 'meiko.santos@puffybrain.fun',
  course: 'Bachelor of Science in Information Technology',
  temporaryPassword: 'PuffyBrain@2026',
};

export default function StudentProfile() {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationItems);

  const [showTemporaryPassword, setShowTemporaryPassword] =
    useState(false);

  const [profileImage, setProfileImage] = useState(
    '/images/temporary profile.jpg',
  );

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

  useEffect(() => {
    return () => {
      if (profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  const unreadNotificationCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const toggleSidebar = () => {
    setSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;

      localStorage.setItem(
        'sidebarCollapsed',
        String(nextValue),
      );

      return nextValue;
    });
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const joinByCourseCode = async () => {
    const course = await findJoinableCourseByCodeAsync(courseCode);

    if (!course) {
      window.alert(
        'Course code not found. Please check the code from your professor.',
      );
      return;
    }

    enrollStudentInCourse(course);
    closeJoinModal();

    navigate(
      `/student/enrolled-courses/${course.id || course.code}`,
    );
  };

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
          ? {
              ...notification,
              unread: false,
            }
          : notification,
      ),
    );
  };

  const shareProfile = async () => {
    const profileLink = `${window.location.origin}/student/profile`;

    try {
      await navigator.clipboard.writeText(profileLink);
      window.alert('Profile link copied!');
    } catch (error) {
      console.error('Unable to copy profile link:', error);
      window.alert('Unable to copy the profile link.');
    }
  };

  const changeProfilePicture = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      window.alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (selectedFile.size > maximumFileSize) {
      window.alert(
        'The selected image is too large. Please choose an image smaller than 5 MB.',
      );
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setProfileImage(previewUrl);
    event.target.value = '';
  };

  const logOut = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();

    navigate('/login');
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
            onClick={toggleSidebar}
            title={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          />

          <span className="brand-name">PuffyBrain</span>
        </div>

        <nav
          className="side-nav"
          aria-label="Student navigation"
        >
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
            className="side-nav-item"
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
              sidebarCollapsed ? 'Public Courses' : undefined
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
          onClick={logOut}
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
            <input
              type="search"
              placeholder="Search your course"
            />

            <span
              className="student-search-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="5.5"
                />
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
                  setNotificationMenuOpen(
                    (currentValue) => !currentValue,
                  );
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
                  onClick={(event) =>
                    event.stopPropagation()
                  }
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
                        onClick={
                          markAllNotificationsAsRead
                        }
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-dropdown-tabs">
                    <button
                      type="button"
                      className="active"
                    >
                      All
                    </button>

                    <button type="button">
                      Unread
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty-state">
                        <span className="notification-empty-icon">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                            <path d="M10 19.2h4" />
                          </svg>
                        </span>

                        <strong>
                          No notifications yet
                        </strong>

                        <p>
                          New updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`notification-item ${
                              notification.unread
                                ? 'unread'
                                : ''
                            }`}
                            onClick={() =>
                              openNotification(
                                notification.id,
                              )
                            }
                          >
                            <span
                              className={`notification-item-icon ${notification.icon}`}
                              aria-hidden="true"
                            >
                              {notification.icon ===
                              'course' ? (
                                <svg viewBox="0 0 24 24">
                                  <path d="m3.5 8.2 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z" />
                                  <path d="M6.5 10.2v5c0 1.3 2.5 3 5.5 3s5.5-1.7 5.5-3v-5" />
                                </svg>
                              ) : notification.icon ===
                                'announcement' ? (
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
                              <strong>
                                {notification.title}
                              </strong>

                              <span>
                                {notification.message}
                              </span>

                              <small>
                                {notification.time}
                              </small>
                            </span>

                            {notification.unread && (
                              <span
                                className="notification-unread-dot"
                                aria-label="Unread"
                              />
                            )}
                          </button>
                        ),
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className="notification-view-all-button"
                    onClick={() => {
                      setNotificationMenuOpen(false);
                      navigate(
                        '/student/notifications',
                      );
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
                  onClick={() =>
                    navigate('/student/profile')
                  }
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
                  aria-label={
                    profileMenuOpen
                      ? 'Close profile menu'
                      : 'Open profile menu'
                  }
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  onClick={(event) => {
                    event.stopPropagation();

                    setNotificationMenuOpen(false);
                    setProfileMenuOpen(
                      (currentValue) => !currentValue,
                    );
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="5"
                      r="1.6"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.6"
                    />
                    <circle
                      cx="12"
                      cy="19"
                      r="1.6"
                    />
                  </svg>
                </button>
              </div>

              {profileMenuOpen && (
                <div
                  className="profile-dropdown-menu"
                  role="menu"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
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
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                      />

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
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />

                      <path d="M19 13.5v-3l-2-.6a7 7 0 0 0-.7-1.6l1-1.8-2.1-2.1-1.8 1a7 7 0 0 0-1.6-.7L11.5 3h-3l-.6 2a7 7 0 0 0-1.6.7l-1.8-1-2.1 2.1 1 1.8a7 7 0 0 0-.7 1.6L1 10.5v3l2 .6a7 7 0 0 0 .7 1.6l-1 1.8 2.1 2.1 1.8-1a7 7 0 0 0 1.6.7l.6 2h3l.6-2a7 7 0 0 0 1.6-.7l1.8 1 2.1-2.1-1-1.8a7 7 0 0 0 .7-1.6Z" />
                    </svg>

                    <span>Settings</span>
                  </button>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-logout-option"
                    onClick={logOut}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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
          <h1>Student Profile</h1>
        </section>

        <section className="student-profile-content">
  <div className="student-profile-layout">
    {/* LEFT: STUDENT ID CARD */}
    <article className="student-identity-card">
      <div className="student-identity-card-accent" />

      <div className="student-identity-header">
        <div className="student-identity-brand">
          <img
            src="/images/logo_solo.png"
            alt="PuffyBrain"
          />

          <div>
            <strong>PuffyBrain</strong>
            <span>Student Identification Card</span>
          </div>
        </div>

        <span className="student-identity-role">
          Student
        </span>
      </div>

      <div className="student-identity-photo-area">
        <div className="student-id-photo-frame">
          <img
            src={profileImage}
            alt={`${temporaryStudentData.name}'s profile`}
            className="student-id-photo"
          />

          <label
            className="student-photo-change-button"
            title="Change profile picture"
            aria-label="Change profile picture"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 8.5h3l1.4-2h7.2l1.4 2h3v10H4v-10Z" />
              <circle cx="12" cy="13.5" r="3.2" />
            </svg>

            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="student-photo-input"
              onChange={changeProfilePicture}
            />
          </label>
        </div>

        <div className="student-identity-main">
          <span className="student-identity-overline">
            Official student profile
          </span>

          <h2>{temporaryStudentData.name}</h2>

          <strong className="student-identity-number">
            {temporaryStudentData.studentNumber}
          </strong>

          <p>{temporaryStudentData.course}</p>

          <div className="student-identity-academic-row">
            <span>{temporaryStudentData.year}</span>
            <i aria-hidden="true" />
            <span>{temporaryStudentData.section}</span>
          </div>
        </div>
      </div>

      <div className="student-identity-footer">
        <div>
          <span>Issued by</span>
          <strong>PuffyBrain Learning System</strong>
        </div>

        <div
          className="student-id-barcode"
          aria-hidden="true"
        />
      </div>
    </article>

    {/* RIGHT: PROFILE INFORMATION */}
    <div className="student-profile-details">
      <div className="student-profile-details-header">
        <div>
          <span className="student-profile-eyebrow">
            Profile overview
          </span>

          <h2>Student Information</h2>

          <p>
            Your personal, academic, and account
            information.
          </p>
        </div>

        <button
          type="button"
          className="student-profile-share-button"
          onClick={shareProfile}
          title="Copy profile link"
          aria-label="Copy profile link"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="m8.2 10.8 7.5-4.4" />
            <path d="m8.2 13.2 7.5 4.4" />
          </svg>
        </button>
      </div>

      {/* PERSONAL INFORMATION */}
      <section className="student-info-section">
        <div className="student-info-section-heading">
          <span className="student-info-section-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6" />
            </svg>
          </span>

          <div>
            <h3>Personal Information</h3>
            <p>Basic student account details</p>
          </div>
        </div>

        <div className="student-info-grid">
          <div className="student-info-item">
            <span className="student-info-label">
              Full Name
            </span>

            <strong>{temporaryStudentData.name}</strong>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">
              Student Number
            </span>

            <strong>
              {temporaryStudentData.studentNumber}
            </strong>
          </div>

          <div className="student-info-item student-info-item-wide">
            <span className="student-info-label">
              Email Address
            </span>

            <strong>{temporaryStudentData.email}</strong>
          </div>
        </div>
      </section>

      {/* ACADEMIC INFORMATION */}
      <section className="student-info-section">
        <div className="student-info-section-heading">
          <span className="student-info-section-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m3.5 8.2 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z" />
              <path d="M6.5 10.2v5c0 1.3 2.5 3 5.5 3s5.5-1.7 5.5-3v-5" />
            </svg>
          </span>

          <div>
            <h3>Academic Information</h3>
            <p>Program and class assignment</p>
          </div>
        </div>

        <div className="student-info-grid">
          <div className="student-info-item student-info-item-wide">
            <span className="student-info-label">
              Course
            </span>

            <strong>{temporaryStudentData.course}</strong>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">
              Year Level
            </span>

            <strong>{temporaryStudentData.year}</strong>
          </div>

          <div className="student-info-item">
            <span className="student-info-label">
              Section
            </span>

            <strong>{temporaryStudentData.section}</strong>
          </div>
        </div>
      </section>

      {/* ACCOUNT SECURITY */}
      <section className="student-info-section student-security-section">
        <div className="student-info-section-heading">
          <span className="student-info-section-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>

          <div>
            <h3>Account Security</h3>
            <p>Temporary account credentials</p>
          </div>
        </div>

        <div className="student-password-card">
          <div className="student-password-copy">
            <span className="student-info-label">
              Temporary Password
            </span>

            <strong
              className={
                showTemporaryPassword
                  ? 'student-password-visible'
                  : 'student-password-hidden'
              }
            >
              {showTemporaryPassword
                ? temporaryStudentData.temporaryPassword
                : '••••••••••••••'}
            </strong>
          </div>

          <button
            type="button"
            className="student-password-toggle"
            onClick={() =>
              setShowTemporaryPassword(
                (currentValue) => !currentValue,
              )
            }
            title={
              showTemporaryPassword
                ? 'Hide temporary password'
                : 'Show temporary password'
            }
            aria-label={
              showTemporaryPassword
                ? 'Hide temporary password'
                : 'Show temporary password'
            }
            aria-pressed={showTemporaryPassword}
          >
            {showTemporaryPassword ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m3 3 18 18" />
                <path d="M10.6 6.2A10.3 10.3 0 0 1 12 6c6 0 9.5 6 9.5 6a18.8 18.8 0 0 1-2.5 3.2" />
                <path d="M6.2 6.2C3.8 8 2.5 12 2.5 12S6 18 12 18a9.7 9.7 0 0 0 3.8-.8" />
                <path d="M9.8 9.8a3 3 0 0 0 4.4 4.4" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}

            <span>
              {showTemporaryPassword ? 'Hide' : 'Show'}
            </span>
          </button>
        </div>

        <p className="student-password-note">
          Keep this password private. You can change it
          from the Settings page.
        </p>
      </section>
    </div>
  </div>
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