import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './EnrolledCourses';
import Swal from "sweetalert2";
import JoinCourseModal from './JoinCourseModal';
import {
  enrollStudentInCourseAsync,
  findJoinableCourseByCodeAsync,
} from './studentCourseData';
import { API_BASE } from '../../config.js';
import './EnrolledCourses.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const DEFAULT_PROFILE_IMAGE =
  '/images/temporary profile.jpg';

function resolveProfileImage(imagePath) {
  if (!imagePath) return DEFAULT_PROFILE_IMAGE;

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

function saveUpdatedUser(updatedUser) {
  const serializedUser = JSON.stringify(updatedUser);

  localStorage.setItem('user', serializedUser);
  localStorage.setItem('currentUser', serializedUser);
  localStorage.setItem('puffy-user', serializedUser);

  if (sessionStorage.getItem('user')) {
    sessionStorage.setItem('user', serializedUser);
  }

  if (sessionStorage.getItem('currentUser')) {
    sessionStorage.setItem('currentUser', serializedUser);
  }

  window.dispatchEvent(
    new CustomEvent('puffy-user-updated', {
      detail: updatedUser,
    }),
  );
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

function getSavedUser() {
  try {
    const storedUser =
      localStorage.getItem('puffy-user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('user') ||
      sessionStorage.getItem('currentUser');

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      'Unable to read saved user:',
      error,
    );

    return null;
  }
}

function normalizeStudent(user) {
  const savedUser = user || {};

  return {
    id:
      savedUser.userId ||
      savedUser.user_id ||
      savedUser.id ||
      '',

    name:
      savedUser.displayName ||
      savedUser.display_name ||
      savedUser.name ||
      savedUser.fullName ||
      savedUser.full_name ||
      savedUser.username ||
      'Student',

    studentNumber:
      savedUser.studentId ||
      savedUser.student_id ||
      savedUser.studentNumber ||
      savedUser.student_number ||
      savedUser.verificationId ||
      savedUser.verification_id ||
      'Not assigned',

    email:
      savedUser.email ||
      'Not available',

    year:
      savedUser.yearLevel ||
      savedUser.year_level ||
      savedUser.year ||
      'Not set',

    section:
      savedUser.sectionName ||
      savedUser.section_name ||
      savedUser.section ||
      'Not set',

    role:
      savedUser.role ||
      'student',

    course:
      savedUser.course ||
      savedUser.program ||
      savedUser.courseName ||
      savedUser.course_name ||
      savedUser.programName ||
      savedUser.program_name ||
      'Program not set',

    profileImage:
      savedUser.profileImage ||
      savedUser.profile_image ||
      savedUser.avatar ||
      savedUser.image ||
      '',

    temporaryPassword:
      savedUser.temporaryPassword ||
      savedUser.temporary_password ||
      savedUser.initialPassword ||
      savedUser.initial_password ||
      'Not available',
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
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');

  sessionStorage.removeItem('token');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('currentUser');
}

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

export default function StudentProfile() {
  const navigate = useNavigate();

  const savedStudent =
    normalizeStudent(getSavedUser());

  const [studentData, setStudentData] =
    useState(savedStudent);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [profileError, setProfileError] =
    useState('');

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(() => {
      return (
        localStorage.getItem(
          'sidebarCollapsed',
        ) === 'true'
      );
    });

  const [joinModalOpen, setJoinModalOpen] =
    useState(false);

  const [courseCode, setCourseCode] =
    useState('');

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [
    notificationMenuOpen,
    setNotificationMenuOpen,
  ] = useState(false);

  const [notifications, setNotifications] =
    useState(notificationItems);

  const [profileImage, setProfileImage] =
    useState(
      resolveProfileImage(
        savedStudent.profileImage,
      ),
    );

  const [profileImageUploading, setProfileImageUploading] =
    useState(false);

  const displayUsername =
    studentData.name?.replace(/^@/, '') ||
    'Student';

  const accountLabel =
    studentData.email &&
    studentData.email !== 'Not available'
      ? 'Student account'
      : 'Account information unavailable';

  const [
    showTemporaryPassword,
    setShowTemporaryPassword,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStudentProfile() {
      try {
        setProfileLoading(true);
        setProfileError('');

        const token = getStoredToken();

        if (!token) {
          throw new Error(
            'Your login session was not found. Please log in again.',
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/users/me`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to load your profile information.',
          );
        }

        const loggedInUser =
          data.user ||
          data.data ||
          data;

        const normalizedUser =
          normalizeStudent(loggedInUser);

        if (!active) return;

        setStudentData(normalizedUser);

        if (normalizedUser.profileImage) {
          setProfileImage(
            resolveProfileImage(
              normalizedUser.profileImage,
            ),
          );
        }

        saveUpdatedUser(loggedInUser);
      } catch (error) {
        console.error(
          'Student profile loading error:',
          error,
        );

        if (active) {
          setProfileError(
            error.message ||
              'Unable to load your profile information.',
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadStudentProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStudentProfile() {
      const token = getStoredToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'Could not load your student profile.',
          );
        }

        const loadedUser = data.user || data.data || null;

        if (!active || !loadedUser) {
          return;
        }

        const nextProfile = buildStudentProfile(loadedUser);

        setStudentProfile(nextProfile);
        setProfileImage((currentImage) =>
          currentImage?.startsWith('blob:')
            ? currentImage
            : nextProfile.profileImage,
        );

        localStorage.setItem('puffy-user', JSON.stringify(loadedUser));
        localStorage.setItem('user', JSON.stringify(loadedUser));
        localStorage.setItem('currentUser', JSON.stringify(loadedUser));
        localStorage.setItem('user_role', loadedUser.role || 'student');
        localStorage.setItem('user_email', cleanText(loadedUser.email));
        localStorage.setItem(
          'username',
          cleanText(
            loadedUser.displayName ||
              loadedUser.display_name ||
              loadedUser.name,
          ),
        );
        localStorage.setItem(
          'year_level',
          cleanText(loadedUser.yearLevel || loadedUser.year_level),
        );
        localStorage.setItem(
          'section_name',
          cleanText(loadedUser.sectionName || loadedUser.section_name),
        );
      } catch (error) {
        console.error('Student profile loading error:', error);
      }
    }

    loadStudentProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const closeOpenMenus = (event) => {
      if (
        !event.target.closest(
          '.profile-menu-wrapper',
        )
      ) {
        setProfileMenuOpen(false);
      }

      if (
        !event.target.closest(
          '.notification-menu-wrapper',
        )
      ) {
        setNotificationMenuOpen(false);
      }
    };

    const closeMenusWithEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      closeOpenMenus,
    );

    document.addEventListener(
      'keydown',
      closeMenusWithEscape,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        closeOpenMenus,
      );

      document.removeEventListener(
        'keydown',
        closeMenusWithEscape,
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  const unreadNotificationCount =
    notifications.filter(
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
    try {
      const course =
        await findJoinableCourseByCodeAsync(
          courseCode,
        );

      if (!course) {
        window.alert(
          'Course code not found. Please check the code from your professor.',
        );

        return;
      }

      await enrollStudentInCourseAsync(course);

      closeJoinModal();

      const courseId =
        course.id ||
        course.courseId ||
        course.course_id ||
        course.code ||
        course.courseCode ||
        course.course_code;

      navigate(
        `/student/enrolled-courses/${courseId}`,
      );
    } catch (error) {
      console.error(
        'Join course error:',
        error,
      );

      window.alert(
        error.message ||
          'Unable to join the course.',
      );
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) => ({
            ...notification,
            unread: false,
          }),
        ),
    );
  };

  const openNotification = (
    notificationId,
  ) => {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) =>
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
    const profileLink =
      `${window.location.origin}/student/profile`;

    try {
      await navigator.clipboard.writeText(
        profileLink,
      );

      window.alert(
        'Profile link copied!',
      );
    } catch (error) {
      console.error(
        'Unable to copy profile link:',
        error,
      );

      window.alert(
        'Unable to copy the profile link.',
      );
    }
  };

  const changeProfilePicture = async (event) => {
    const selectedFile = event.target.files?.[0];

    event.target.value = '';

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      Swal.fire({
      icon: "error",
      title: "Invalid File",
      text: "Please select a valid image file.",
      confirmButtonColor: "#2ea86b",
    });
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (selectedFile.size > maximumFileSize) {
      Swal.fire({
          icon: "warning",
          title: "File Too Large",
          text: "Please choose an image smaller than 5 MB.",
          confirmButtonColor: "#2ea86b",
        });
      return;
    }

    const token = getStoredToken();

    if (!token) {
      Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Please log in again.",
          confirmButtonColor: "#2ea86b",
        });
      return;
    }

    const previousImage = profileImage;
    const previewUrl = URL.createObjectURL(selectedFile);

    setProfileImage(previewUrl);
    setProfileImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/users/me/profile-image`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to update your profile picture.',
        );
      }

      const returnedUser =
        data.user || data.data?.user || data.data || {};

      const returnedImage =
        returnedUser.profileImage ||
        returnedUser.profile_image ||
        data.profileImage ||
        data.profile_image;

      if (!returnedImage) {
        throw new Error(
          'The server updated the photo but did not return its saved path.',
        );
      }

      const currentSavedUser = getSavedUser() || {};
      const updatedUser = {
        ...currentSavedUser,
        ...returnedUser,
        profileImage: returnedImage,
        profile_image: returnedImage,
      };

      const savedImageUrl = resolveProfileImage(returnedImage);

      URL.revokeObjectURL(previewUrl);
      setProfileImage(savedImageUrl);
      setStudentData(normalizeStudent(updatedUser));
      saveUpdatedUser(updatedUser);

      Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your profile picture has been updated successfully.",
          confirmButtonColor: "#2ea86b",
          timer: 1800,
          showConfirmButton: false,
        });
    } catch (error) {
      console.error('Profile picture update error:', error);

      URL.revokeObjectURL(previewUrl);
      setProfileImage(previousImage);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.message ||
          "Unable to update your profile picture.",
        confirmButtonColor: "#2ea86b",
      });
    } finally {
      setProfileImageUploading(false);
    }
  };

  const logOut = () => {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);

    clearStudentSession();

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <div
      className={`enrolled-dashboard striped-dashboard ${
        sidebarCollapsed
          ? 'sidebar-collapsed'
          : ''
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

          <span className="brand-name">
            PuffyBrain
          </span>
        </div>

        <nav
          className="side-nav"
          aria-label="Student navigation"
        >
          <Link
            to="/student"
            className="side-nav-item"
            title={
              sidebarCollapsed
                ? 'Home'
                : undefined
            }
          >
            <Icon name="home" />

            <span className="nav-label">
              Home
            </span>
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

            <span className="dropdown-mark">
              v
            </span>
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
              sidebarCollapsed
                ? 'Settings'
                : undefined
            }
          >
            <Icon name="settings" />

            <span className="nav-label">
              Settings
            </span>
          </Link>
        </nav>

        <button
          type="button"
          className="logout-button"
          title={
            sidebarCollapsed
              ? 'Log-out'
              : undefined
          }
          onClick={logOut}
        >
          <span
            className="logout-icon"
            aria-hidden="true"
          />

          <span className="logout-label">
            Log-out
          </span>
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
                  notificationMenuOpen
                    ? 'active'
                    : ''
                }`}
                aria-label={`Notifications${
                  unreadNotificationCount > 0
                    ? `, ${unreadNotificationCount} unread`
                    : ''
                }`}
                aria-expanded={
                  notificationMenuOpen
                }
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.stopPropagation();

                  setProfileMenuOpen(false);

                  setNotificationMenuOpen(
                    (currentValue) =>
                      !currentValue,
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

                {unreadNotificationCount >
                  0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount >
                    9
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
                        {unreadNotificationCount >
                        0
                          ? `${unreadNotificationCount} unread`
                          : 'You are all caught up'}
                      </span>
                    </div>

                    {unreadNotificationCount >
                      0 && (
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
                    {notifications.length ===
                    0 ? (
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
                          New updates will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
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
                                {
                                  notification.title
                                }
                              </strong>

                              <span>
                                {
                                  notification.message
                                }
                              </span>

                              <small>
                                {
                                  notification.time
                                }
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
                      setNotificationMenuOpen(
                        false,
                      );

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
              onClick={() =>
                setJoinModalOpen(true)
              }
            >
              + Join course
            </button>

            <div className="profile-menu-wrapper">
              <div className="profile-chip">
                <button
                  type="button"
                  className="profile-main-button"
                  onClick={() =>
                    navigate(
                      '/student/profile',
                    )
                  }
                  aria-label="Open your profile"
                >
                  <span className="profile-avatar">
                    <img
                      src={profileImage}
                      alt={`${displayUsername}'s profile`}
                      className="profile-header-image"
                    />

                    <span className="profile-status-dot" />
                  </span>

                  <span className="profile-user-info">
                    <strong>
                      {displayUsername}
                    </strong>

                    <small>Student</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`profile-dropdown-button ${
                    profileMenuOpen
                      ? 'open'
                      : ''
                  }`}
                  aria-label={
                    profileMenuOpen
                      ? 'Close profile menu'
                      : 'Open profile menu'
                  }
                  aria-expanded={
                    profileMenuOpen
                  }
                  aria-haspopup="menu"
                  onClick={(event) => {
                    event.stopPropagation();

                    setNotificationMenuOpen(
                      false,
                    );

                    setProfileMenuOpen(
                      (currentValue) =>
                        !currentValue,
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
                    <img
                      src={profileImage}
                      alt={`${displayUsername}'s profile`}
                      className="profile-dropdown-image"
                    />

                    <div>
                      <strong>
                        {displayUsername}
                      </strong>

                      <span>
                        {accountLabel}
                      </span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false,
                      );

                      navigate(
                        '/student/profile',
                      );
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

                    <span>
                      View profile
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false,
                      );

                      navigate(
                        '/student/settings',
                      );
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

        {profileLoading && (
          <div className="student-empty-state">
            Loading your profile
            information...
          </div>
        )}

        {!profileLoading &&
          profileError && (
            <div className="student-empty-state">
              {profileError}
            </div>
          )}

        {!profileLoading &&
          !profileError && (
            <section className="student-profile-content">
              <div className="student-profile-layout">
                <article className="student-identity-card">
                  <div className="student-identity-card-accent" />

                  <div className="student-identity-header">
                    <div className="student-identity-brand">
                      <img
                        src="/images/logo_solo.png"
                        alt="PuffyBrain"
                      />

                      <div>
                        <strong>
                          PuffyBrain
                        </strong>

                        <span>
                          Student Identification
                          Card
                        </span>
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
                        alt={`${studentData.name}'s profile`}
                        className="student-id-photo"
                      />

                      <label
                        className="student-photo-change-button"
                        title="Change profile picture"
                        aria-label="Change profile picture"
                      >
                        {profileImageUploading ? (
                          <span className="student-photo-uploading">...</span>
                        ) : (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M4 8.5h3l1.4-2h7.2l1.4 2h3v10H4v-10Z" />
                          <circle
                            cx="12"
                            cy="13.5"
                            r="3.2"
                          />
                        </svg>
                        )}

                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="student-photo-input"
                          onChange={
                            changeProfilePicture
                          }
                          disabled={
                            profileImageUploading
                          }
                        />
                      </label>
                    </div>

                    <div className="student-identity-main">
                      <span className="student-identity-overline">
                        Official student profile
                      </span>

                      <h2>
                        {studentData.name}
                      </h2>

                      <strong className="student-identity-number">
                        {
                          studentData.studentNumber
                        }
                      </strong>

                      <p>
                        {studentData.course}
                      </p>

                      <div className="student-identity-academic-row">
                        <span>
                          {studentData.year}
                        </span>

                        <i aria-hidden="true" />

                        <span>
                          {studentData.section}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="student-identity-footer">
                    <div>
                      <span>Issued by</span>

                      <strong>
                        PuffyBrain Learning
                        System
                      </strong>
                    </div>

                    <div
                      className="student-id-barcode"
                      aria-hidden="true"
                    />
                  </div>
                </article>

                <div className="student-profile-details">
                  <div className="student-profile-details-header">
                    <div>
                      <span className="student-profile-eyebrow">
                        Profile overview
                      </span>

                      <h2>
                        Student Information
                      </h2>

                      <p>
                        Your personal,
                        academic, and account
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
                        <circle
                          cx="18"
                          cy="5"
                          r="2.5"
                        />

                        <circle
                          cx="6"
                          cy="12"
                          r="2.5"
                        />

                        <circle
                          cx="18"
                          cy="19"
                          r="2.5"
                        />

                        <path d="m8.2 10.8 7.5-4.4" />
                        <path d="m8.2 13.2 7.5 4.4" />
                      </svg>
                    </button>
                  </div>

                  <section className="student-info-section">
                    <div className="student-info-section-heading">
                      <span className="student-info-section-icon">
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
                      </span>

                      <div>
                        <h3>
                          Personal Information
                        </h3>

                        <p>
                          Basic student account
                          details
                        </p>
                      </div>
                    </div>

                    <div className="student-info-grid">
                      <div className="student-info-item">
                        <span className="student-info-label">
                          Full Name
                        </span>

                        <strong>
                          {studentData.name}
                        </strong>
                      </div>

                      <div className="student-info-item">
                        <span className="student-info-label">
                          Student Number
                        </span>

                        <strong>
                          {
                            studentData.studentNumber
                          }
                        </strong>
                      </div>

                      <div className="student-info-item student-info-item-wide">
                        <span className="student-info-label">
                          Email Address
                        </span>

                        <strong>
                          {studentData.email}
                        </strong>
                      </div>
                    </div>
                  </section>

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
                        <h3>
                          Academic Information
                        </h3>

                        <p>
                          Year level and class
                          assignment
                        </p>
                      </div>
                    </div>

                    <div className="student-info-grid">
                      <div className="student-info-item student-info-item-wide">
                        <span className="student-info-label">
                          Course
                        </span>

                        <strong>
                          {studentData.course}
                        </strong>
                      </div>

                      <div className="student-info-item">
                        <span className="student-info-label">
                          Year Level
                        </span>

                        <strong>
                          {studentData.year}
                        </strong>
                      </div>

                      <div className="student-info-item">
                        <span className="student-info-label">
                          Section
                        </span>

                        <strong>
                          {studentData.section}
                        </strong>
                      </div>
                    </div>
                  </section>

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
                        <h3>
                          Account Security
                        </h3>

                        <p>
                          Temporary account
                          credentials
                        </p>
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
                            ? studentData.temporaryPassword
                            : '••••••••••••••'}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="student-password-toggle"
                        onClick={() =>
                          setShowTemporaryPassword(
                            (currentValue) =>
                              !currentValue,
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
                        aria-pressed={
                          showTemporaryPassword
                        }
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
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                            />
                          </svg>
                        )}

                        <span>
                          {showTemporaryPassword
                            ? 'Hide'
                            : 'Show'}
                        </span>
                      </button>
                    </div>

                    <p className="student-password-note">
                      This is the password assigned
                      when your account was created.
                      Keep it private and change it
                      from the Settings page.
                    </p>
                  </section>
                </div>
              </div>
            </section>
          )}
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
