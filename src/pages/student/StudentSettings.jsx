import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import './EnrolledCourses.css';

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

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('puffy-user') || 'null');
  } catch {
    return null;
  }
}

function getInitialSettingsForm() {
  const savedUser = getSavedUser() || {};

  return {
    fullName:
      localStorage.getItem('username') ||
      savedUser.displayName ||
      savedUser.display_name ||
      savedUser.name ||
      savedUser.username ||
      '',
    email: localStorage.getItem('user_email') || savedUser.email || '',
    yearLevel:
      localStorage.getItem('year_level') ||
      savedUser.yearLevel ||
      savedUser.year_level ||
      '',
  };
}

function clearStudentSession() {
  localStorage.removeItem('puffy-token');
  localStorage.removeItem('puffy-user');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_role');
  localStorage.removeItem('username');
  localStorage.removeItem('year_level');
  localStorage.removeItem('section_name');
  localStorage.removeItem('school_name');
  localStorage.removeItem('token');
  sessionStorage.clear();
}

export default function StudentSettings() {
  const navigate = useNavigate();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [settingsForm, setSettingsForm] = useState(getInitialSettingsForm);
  const [profileNotice, setProfileNotice] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  return localStorage.getItem("sidebarCollapsed") === "true";
});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationItems);

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const updateSettingsField = (fieldName) => (event) => {
    setProfileNotice('');
    setSettingsForm((currentForm) => ({
      ...currentForm,
      [fieldName]: event.target.value,
    }));
  };

  const handleProfileSave = (event) => {
    event.preventDefault();

    localStorage.setItem('year_level', settingsForm.yearLevel.trim());

    const savedUser = getSavedUser();

    if (savedUser) {
      localStorage.setItem(
        'puffy-user',
        JSON.stringify({
          ...savedUser,
          yearLevel: settingsForm.yearLevel.trim(),
        })
      );
    }

    setProfileNotice('Student settings saved on this device.');
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    clearStudentSession();
    navigate('/login');
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

  const displayUsername = settingsForm.fullName
    ? `@${settingsForm.fullName.replace(/^@/, '')}`
    : '@meiko';
  const accountLabel = settingsForm.email ? 'Student account' : 'Link-only preview';

  return (
    <div
  className={`enrolled-dashboard striped-dashboard student-settings-page ${
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
              className="side-nav-item "
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
              className="side-nav-item active"
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
            onClick={handleLogout}
          >
            <span
              className="logout-icon"
              aria-hidden="true"
            />

            <span className="logout-label">Log-out</span>
          </button>
        </aside>

      <main className="enrolled-main settings-main">
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
                  <strong>{displayUsername}</strong>
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
                  setNotificationMenuOpen(false);
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
                    <strong>{displayUsername}</strong>
                    <span>{accountLabel}</span>
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
                  onClick={handleLogout}
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

        <section className="settings-heading">
          <h1>Settings</h1>
        </section>

        <section className="student-settings-shell" aria-label="Student settings">
          <div className="settings-tabs" aria-hidden="true">
            <span className="settings-tab active">Personal Information</span>
            <span className="settings-tab">Settings</span>
          </div>

          <div className="settings-form-card">
            <form className="settings-form" onSubmit={handleProfileSave}>
              <div className="settings-fields">
                <label>
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={settingsForm.fullName}
                    readOnly
                    aria-readonly="true"
                  />
                </label>

                <label>
                  <span>Email Address</span>
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    value={settingsForm.email}
                    readOnly
                    aria-readonly="true"
                  />
                </label>

                <label>
                  <span>Year Level</span>
                  <input
                    type="text"
                    placeholder="enter your year level"
                    value={settingsForm.yearLevel}
                    onChange={updateSettingsField('yearLevel')}
                  />
                </label>
              </div>

              <div className="settings-photo-column">
                <button type="button" className="upload-photo-button">
                  Upload Photo
                </button>
                <button type="submit" className="upload-photo-button">
                  Save Changes
                </button>
                <p>{profileNotice || 'Recommend ratio 1:1 and file less than 5mb'}</p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={courseCode}
        onCourseCodeChange={setCourseCode}
        onCancel={closeJoinModal}
        onJoin={closeJoinModal}
      />
    </div>
  );
}
