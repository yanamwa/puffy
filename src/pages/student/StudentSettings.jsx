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

function getStudentAccount() {
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
  };
}

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

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
  const [studentAccount] = useState(getStudentAccount);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordNotice, setPasswordNotice] = useState({ type: '', message: '' });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
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

  const updatePasswordField = (fieldName) => (event) => {
    setPasswordNotice({ type: '', message: '' });
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [fieldName]: event.target.value,
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const passwordChecks = {
    length: passwordForm.newPassword.length >= 12,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    lowercase: /[a-z]/.test(passwordForm.newPassword),
    number: /\d/.test(passwordForm.newPassword),
    symbol: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };

  const passwordIsStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordNotice({ type: '', message: '' });

    if (!passwordForm.currentPassword) {
      setPasswordNotice({
        type: 'error',
        message: 'Enter your current password first.',
      });
      return;
    }

    if (!passwordIsStrong) {
      setPasswordNotice({
        type: 'error',
        message: 'Your new password does not meet all requirements.',
      });
      return;
    }

    if (!passwordsMatch) {
      setPasswordNotice({
        type: 'error',
        message: 'The new password and confirmation do not match.',
      });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordNotice({
        type: 'error',
        message: 'Your new password must be different from your current password.',
      });
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const token =
        localStorage.getItem('puffy-token') || localStorage.getItem('token');

      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to change your password.');
      }

      setPasswordForm(initialPasswordForm);
      setPasswordNotice({
        type: 'success',
        message: data.message || 'Your password was changed successfully.',
      });
    } catch (error) {
      setPasswordNotice({
        type: 'error',
        message:
          error.message || 'Something went wrong while changing your password.',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
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

  const displayUsername = studentAccount.fullName
    ? `@${studentAccount.fullName.replace(/^@/, '')}`
    : '@meiko';
  const accountLabel = studentAccount.email ? 'Student account' : 'Link-only preview';

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
          <div>
            <h1>Account Settings</h1>
            <p>Manage your password and keep your student account secure.</p>
          </div>
        </section>

        <section className="password-settings-section" aria-label="Change password">
          <div className="password-settings-card">
            <div className="password-card-header">
              <span className="password-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <circle cx="12" cy="15" r="1.2" />
                </svg>
              </span>

              <div>
                <h2>Change Password</h2>
                <p>Use a strong password that you do not use on other accounts.</p>
              </div>
            </div>

            <form className="password-settings-form" onSubmit={handlePasswordChange}>
              <div className="password-field-group">
                <label htmlFor="current-password">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="current-password"
                    type={visiblePasswords.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={updatePasswordField('currentPassword')}
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    aria-label={
                      visiblePasswords.currentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                  >
                    {visiblePasswords.currentPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="password-form-divider" />

              <div className="password-field-group">
                <label htmlFor="new-password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="new-password"
                    type={visiblePasswords.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={updatePasswordField('newPassword')}
                    autoComplete="new-password"
                    placeholder="Create a new password"
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    aria-label={
                      visiblePasswords.newPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                  >
                    {visiblePasswords.newPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="password-requirements" aria-label="Password requirements">
                <span className={passwordChecks.length ? 'met' : ''}>12 characters</span>
                <span className={passwordChecks.uppercase ? 'met' : ''}>Uppercase</span>
                <span className={passwordChecks.lowercase ? 'met' : ''}>Lowercase</span>
                <span className={passwordChecks.number ? 'met' : ''}>Number</span>
                <span className={passwordChecks.symbol ? 'met' : ''}>Symbol</span>
              </div>

              <div className="password-field-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    type={visiblePasswords.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={updatePasswordField('confirmPassword')}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    className={
                      passwordForm.confirmPassword && !passwordsMatch
                        ? 'input-error'
                        : ''
                    }
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    aria-label={
                      visiblePasswords.confirmPassword
                        ? 'Hide confirmed password'
                        : 'Show confirmed password'
                    }
                  >
                    {visiblePasswords.confirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {passwordForm.confirmPassword && (
                  <small className={passwordsMatch ? 'match-success' : 'match-error'}>
                    {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                  </small>
                )}
              </div>

              {passwordNotice.message && (
                <div
                  className={`password-notice ${passwordNotice.type}`}
                  role={passwordNotice.type === 'error' ? 'alert' : 'status'}
                >
                  {passwordNotice.message}
                </div>
              )}

              <div className="password-form-actions">
                <button
                  type="button"
                  className="password-cancel-button"
                  onClick={() => {
                    setPasswordForm(initialPasswordForm);
                    setPasswordNotice({ type: '', message: '' });
                  }}
                  disabled={isSubmittingPassword}
                >
                  Clear
                </button>

                <button
                  type="submit"
                  className="password-save-button"
                  disabled={isSubmittingPassword}
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <aside className="password-security-note">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Security reminder</strong>
              <p>
                After changing your password, avoid sharing it and sign out from
                devices you no longer use.
              </p>
            </div>
          </aside>
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
