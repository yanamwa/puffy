import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Avatar, Icon, SortToggle } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import { PROFESSOR_COURSES_EVENT } from '../professor/professorData';
import {
  enrollStudentInCourseAsync,
  findJoinableCourseByCodeAsync,
  loadPublicStudentCourses,
} from './studentCourseData';
import {
  markManagedNotificationAsReadForRole,
  markManagedNotificationsAsReadForRole,
  mergeManagedNotificationsForRole,
  subscribeToManagedNotifications,
} from '../../utils/notifications';
import './EnrolledCourses.css';
import { FiLogOut } from 'react-icons/fi';

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

  return `${serverOrigin}${
    imagePath.startsWith('/') ? '' : '/'
  }${imagePath}`;
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

function getUserRole(user) {
  return user?.role || user?.userRole || user?.user_role || '';
}

function isStudentUser(user) {
  return getUserRole(user) === 'student';
}

function getStoredStudentField(key) {
  return localStorage.getItem('user_role') === 'student'
    ? localStorage.getItem(key) || ''
    : '';
}

function getSavedUser() {
  try {
    const storedUser =
      localStorage.getItem('puffy-user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('user') ||
      sessionStorage.getItem('currentUser');

    if (!storedUser) {
      return null;
    }

    const savedUser = JSON.parse(storedUser);
    return isStudentUser(savedUser) ? savedUser : null;
  } catch (error) {
    console.error('Unable to read the saved user:', error);
    return null;
  }
}

function saveUpdatedUser(updatedUser) {
  if (!isStudentUser(updatedUser)) return;

  const serializedUser = JSON.stringify(updatedUser);

  localStorage.setItem('puffy-user', serializedUser);
  localStorage.setItem('user', serializedUser);
  localStorage.setItem('currentUser', serializedUser);
  localStorage.setItem('user_role', updatedUser.role || 'student');

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

function getStudentAccount(user) {
  const savedUser =
    isStudentUser(user) ? user : getSavedUser() || {};

  return {
    fullName:
      savedUser.displayName ||
      savedUser.display_name ||
      savedUser.name ||
      savedUser.fullName ||
      savedUser.full_name ||
      savedUser.username ||
      getStoredStudentField('username') ||
      '',

    email:
      savedUser.email ||
      getStoredStudentField('user_email') ||
      '',

    profileImage:
      savedUser.profileImage ||
      savedUser.profile_image ||
      savedUser.avatar ||
      savedUser.image ||
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
  localStorage.removeItem('admin');
  localStorage.removeItem('admin_id');
  localStorage.removeItem('admin_email');
  localStorage.removeItem('admin_username');
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

function getCourseTitle(course) {
  return course.title || course.courseName || course.course_name || 'Untitled course';
}

function getCourseKey(course) {
  return String(
    course?.id ||
      course?.courseId ||
      course?.course_id ||
      course?.code ||
      course?.courseCode ||
      course?.course_code ||
      ''
  ).trim();
}

function getCourseTimestamp(course) {
  const rawDate =
    course?.updatedAt ||
    course?.updated_at ||
    course?.createdAt ||
    course?.created_at ||
    '';
  const timestamp = Date.parse(rawDate);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getProfessorDepartment(course) {
  return course.professorDepartment || course.professor_department || 'Department not set';
}

function getCourseNavigationId(course) {
  return (
    course.id ||
    course.courseId ||
    course.course_id ||
    course.code ||
    course.courseCode ||
    course.course_code
  );
}

function normalizeCourse(course) {
  return {
    id:
      course.id ||
      course.courseId ||
      course.course_id ||
      course.courseCode ||
      course.course_code,

    code:
      course.code ||
      course.courseCode ||
      course.course_code ||
      'COURSE',

    title:
      course.title ||
      course.courseName ||
      course.course_name ||
      course.name ||
      'Untitled course',
  };
}

export default function PublicCourses() {
  const navigate = useNavigate();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [publicCourses, setPublicCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState('Recent');
  const [titleSort, setTitleSort] = useState('A to Z');
  const [activeSort, setActiveSort] = useState('date');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [
    enrolledCoursesOpen,
    setEnrolledCoursesOpen,
  ] = useState(false);

  const [
    enrolledCourses,
    setEnrolledCourses,
  ] = useState([]);

  const [
    enrolledCoursesLoading,
    setEnrolledCoursesLoading,
  ] = useState(true);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(() =>
    mergeManagedNotificationsForRole('student', notificationItems),
  );
  const savedUser = getSavedUser() || {};
  const savedStudentAccount = getStudentAccount(savedUser);

  const [studentAccount, setStudentAccount] = useState(
    savedStudentAccount,
  );

  const [profileImage, setProfileImage] = useState(
    resolveProfileImage(savedStudentAccount.profileImage),
  );

  const displayUsername =
    studentAccount.fullName?.replace(/^@/, '').trim() ||
    'Student';

  const accountLabel = studentAccount.email
    ? 'Student account'
    : 'Account information unavailable';

  const enrolledCourseKeys = useMemo(
    () => new Set(enrolledCourses.map(getCourseKey).filter(Boolean)),
    [enrolledCourses],
  );

  const visiblePublicCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return publicCourses
      .filter((course) => {
        if (!query) {
          return true;
        }

        return [
          getCourseTitle(course),
          course.code,
          course.courseCode,
          course.course_code,
          course.instructor,
          getProfessorDepartment(course),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((firstCourse, secondCourse) => {
        if (activeSort === 'title') {
          const direction = titleSort === 'A to Z' ? 1 : -1;

          return (
            getCourseTitle(firstCourse).localeCompare(
              getCourseTitle(secondCourse),
            ) * direction
          );
        }

        const direction = dateSort === 'Recent' ? -1 : 1;
        const timestampDifference =
          getCourseTimestamp(firstCourse) - getCourseTimestamp(secondCourse);

        if (timestampDifference !== 0) {
          return timestampDifference * direction;
        }

        return getCourseTitle(firstCourse).localeCompare(
          getCourseTitle(secondCourse),
        );
      });
  }, [
    activeSort,
    dateSort,
    publicCourses,
    searchQuery,
    titleSort,
  ]);

  useEffect(() => {
    const refreshNotifications = () => {
      setNotifications((currentNotifications) =>
        mergeManagedNotificationsForRole(
          'student',
          currentNotifications,
        ),
      );
    };

    return subscribeToManagedNotifications(refreshNotifications);
  }, []);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);

    clearStudentSession();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const token = getStoredToken();

      if (!token) return;

      try {
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load your account.',
          );
        }

        const currentUser =
          data.user ||
          data.data?.user ||
          data.data ||
          data;

        if (!isStudentUser(currentUser)) {
          return;
        }

        if (!active) return;

        const account = getStudentAccount(currentUser);

        setStudentAccount(account);
        setProfileImage(
          resolveProfileImage(account.profileImage),
        );

        saveUpdatedUser(currentUser);
      } catch (error) {
        console.error(
          'Unable to load the current user:',
          error,
        );
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser =
        event.detail || getSavedUser() || {};

      if (!isStudentUser(updatedUser)) {
        return;
      }

      const updatedAccount =
        getStudentAccount(updatedUser);

      setStudentAccount(updatedAccount);
      setProfileImage(
        resolveProfileImage(updatedAccount.profileImage),
      );
    };

    const handleStorageUpdate = (event) => {
      if (
        !['puffy-user', 'user', 'currentUser'].includes(
          event.key,
        )
      ) {
        return;
      }

      const updatedUser = getSavedUser() || {};
      const updatedAccount =
        getStudentAccount(updatedUser);

      setStudentAccount(updatedAccount);
      setProfileImage(
        resolveProfileImage(updatedAccount.profileImage),
      );
    };

    window.addEventListener(
      'puffy-user-updated',
      handleUserUpdated,
    );

    window.addEventListener(
      'storage',
      handleStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        'puffy-user-updated',
        handleUserUpdated,
      );

      window.removeEventListener(
        'storage',
        handleStorageUpdate,
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
          setPublicCourses([]);
          setErrorMessage(
            error.message || 'Could not load public courses.',
          );
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

      window.removeEventListener(
        PROFESSOR_COURSES_EVENT,
        handleRefresh,
      );

      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadEnrolledCoursesForSidebar() {
      try {
        setEnrolledCoursesLoading(true);

        const token = getStoredToken();

        if (!token) {
          if (active) {
            setEnrolledCourses([]);
            setEnrolledCoursesLoading(false);
          }
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/courses/enrolled?summaryOnly=true`,
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
              'Could not load enrolled courses.',
          );
        }

        const loadedCourses = Array.isArray(data.courses)
          ? data.courses
          : Array.isArray(data.data)
            ? data.data
            : [];

        if (!active) return;

        setEnrolledCourses(loadedCourses.map(normalizeCourse));
      } catch (error) {
        console.error(
          'Enrolled courses loading error:',
          error,
        );

        if (active) {
          setEnrolledCourses([]);
        }
      } finally {
        if (active) {
          setEnrolledCoursesLoading(false);
        }
      }
    }

    loadEnrolledCoursesForSidebar();

    return () => {
      active = false;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(
      (currentValue) => {
        const nextValue =
          !currentValue;

        localStorage.setItem(
          'sidebarCollapsed',
          String(nextValue),
        );

        return nextValue;
      },
    );
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const confirmEnrollment = async (course) => {
  const courseTitle = getCourseTitle(course);

  const result = await Swal.fire({
    title: 'Do you want to enroll in this course?',
    text: courseTitle,
    imageUrl: '/images/asking.png',
    imageWidth: 180,
    imageHeight: 180,
    showCancelButton: true,
    confirmButtonText: 'Send Request',
    cancelButtonText: 'Cancel',

    customClass: {
      popup: 'enroll-popup',
      confirmButton: 'enroll-confirm-btn',
      cancelButton: 'enroll-cancel-btn',
    },

    buttonsStyling: false,
  });

  if (!result.isConfirmed) {
    return false;
  }

  try {
    const courseKey = getCourseKey(course);

    const storedRequests = JSON.parse(
      localStorage.getItem('puffy-enrollment-requests') || '[]'
    );

    const alreadyRequested = storedRequests.some(
      (request) =>
        String(request.courseId) === String(courseKey) &&
        request.status === 'pending'
    );

    if (alreadyRequested) {
      await Swal.fire({
        title: 'Request already sent',
        text: `Your enrollment request for ${courseTitle} is still waiting for professor approval.`,
        imageUrl: '/images/asking.png',
        imageWidth: 160,
        imageHeight: 160,
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
      });

      return false;
    }

    const savedUser = getSavedUser() || {};

    const enrollmentRequest = {
      id: Date.now(),

      courseId: courseKey,

      courseCode:
        course.code ||
        course.courseCode ||
        course.course_code ||
        '',

      courseTitle,

      studentId:
        savedUser.studentId ||
        savedUser.student_id ||
        savedUser.schoolId ||
        '202310102',

      studentUserId:
        savedUser.id ||
        savedUser.userId ||
        savedUser.user_id ||
        null,

      studentName:
        savedUser.name ||
        savedUser.fullName ||
        savedUser.full_name ||
        savedUser.username ||
        'Student',

      studentCourse:
        savedUser.course ||
        savedUser.program ||
        'Bachelor of Science Information Technology',

      yearLevel:
        savedUser.yearLevel ||
        savedUser.year_level ||
        '1st Year',

      profileImage:
        savedUser.profileImage ||
        savedUser.profile_image ||
        '',

      status: 'pending',

      requestedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      'puffy-enrollment-requests',
      JSON.stringify([
        enrollmentRequest,
        ...storedRequests,
      ])
    );

    await Swal.fire({
      title: 'Enrollment request sent!',
      text: `Your request to join ${courseTitle} is waiting for professor approval.`,
      imageUrl: '/images/success.png',
      imageWidth: 170,
      imageHeight: 170,
      confirmButtonText: 'OK',
      confirmButtonColor: '#198754',
    });

    return true;
  } catch (error) {
    console.error('Enrollment request error:', error);

    await Swal.fire({
      title: 'Unable to send request',
      text:
        error.message ||
        'Could not send your enrollment request. Please try again.',
      imageUrl: '/images/error.png',
      imageWidth: 170,
      imageHeight: 170,
      confirmButtonText: 'OK',
      confirmButtonColor: '#858d9b',
    });

    return false;
  }
};

  const joinByCourseCode = async () => {
  try {
    const trimmedCode = courseCode.trim();

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

    const course = await findJoinableCourseByCodeAsync(trimmedCode);

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

    closeJoinModal();

    await confirmEnrollment(course);
  } catch (error) {
    console.error('Join course error:', error);

    await Swal.fire({
      icon: 'error',
      title: 'Unable to Join Course',
      text:
        error?.message ||
        'Unable to find or request enrollment for this course.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#198754',
    });
  }
};
  const unreadNotificationCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const markAllNotificationsAsRead = () => {
    markManagedNotificationsAsReadForRole('student');

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

  const openNotification = (notificationId) => {
    markManagedNotificationAsReadForRole('student', notificationId);

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

          <div className="sidebar-course-group">

  <button
    type="button"
    className="side-nav-item sidebar-enrolled-toggle"
    onClick={() => {
      setEnrolledCoursesOpen(
        (previous) => !previous,
      );
    }}
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

    {!sidebarCollapsed && (
      <svg
        className={`sidebar-dropdown-arrow ${
          enrolledCoursesOpen ? 'open' : ''
        }`}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m7 9 5 5 5-5" />
      </svg>
    )}
  </button>

  {!sidebarCollapsed &&
    enrolledCoursesOpen && (
      <div className="sidebar-enrolled-list">

        {enrolledCoursesLoading ? (
          <div className="sidebar-enrolled-message">
            Loading courses...
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="sidebar-enrolled-message">
            No enrolled courses
          </div>
        ) : (
          enrolledCourses.map((course) => {
            const courseId =
              course.id ||
              course.courseId ||
              course.course_id ||
              course.code ||
              course.courseCode ||
              course.course_code;

            const courseCode =
              course.code ||
              course.courseCode ||
              course.course_code ||
              'COURSE';

            const courseTitle =
              course.title ||
              course.courseName ||
              course.course_name ||
              course.name ||
              'Untitled course';

            return (
              <Link
                key={courseId}
                to={`/student/enrolled-courses/${courseId}`}
                className="sidebar-enrolled-course"
              >
                <span className="sidebar-course-indicator" />

                <span className="sidebar-enrolled-course-text">
                  <strong>
                    {courseCode}
                  </strong>

                  <small>
                    {courseTitle}
                  </small>
                </span>
              </Link>
            );
          })
        )}

      </div>
    )}

</div>

          <Link
            to="/student/public-courses"
            className="side-nav-item active"
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
              Archived Classes
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
                ? 'Logout'
                : undefined
            }
            onClick={handleLogout}
          >
            <FiLogOut
              className="logout-icon"
              aria-hidden="true"
            />

            <span className="logout-label">
              Logout
            </span>
          </button>
      </aside>

      <main className="enrolled-main public-main">
        <header className="enrolled-topbar transparent-topbar enrolled-courses-topbar">
          <label className="search-input">
            <input
              type="search"
              placeholder="Search your course"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
                    navigate('/student/profile')
                  }
                  aria-label="Open your profile"
                >
                  <span className="profile-avatar">
                    <img
                      src={profileImage}
                      alt={`${displayUsername}'s profile`}
                      className="profile-header-image"
                      onError={(event) => {
                        event.currentTarget.src =
                          DEFAULT_PROFILE_IMAGE;
                      }}
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
                      onError={(event) => {
                        event.currentTarget.src =
                          DEFAULT_PROFILE_IMAGE;
                      }}
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
                      setProfileMenuOpen(false);

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

                    <span>View profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);

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
                    onClick={handleLogout}
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
          <h1>Public Courses</h1>

          <div className="filter-actions">
            <span className="sort-by-label">
              Sort by
            </span>

            <SortToggle
              options={['Recent', 'Oldest']}
              value={dateSort}
              onChange={(value) => {
                setDateSort(value);
                setActiveSort('date');
              }}
            />

            <SortToggle
              options={['A to Z', 'Z to A']}
              value={titleSort}
              onChange={(value) => {
                setTitleSort(value);
                setActiveSort('title');
              }}
            />
          </div>
        </section>

        <section
          className="public-courses-grid"
          aria-label="Public courses"
        >
          {loading ? (
            <div className="student-empty-state">
              Loading public courses...
            </div>
          ) : errorMessage ? (
            <div className="student-empty-state">
              {errorMessage}
            </div>
          ) : visiblePublicCourses.length === 0 ? (
            <div className="student-empty-state">
              {publicCourses.length === 0
                ? 'No public courses available yet.'
                : 'No public courses match your search.'}
            </div>
          ) : (
            visiblePublicCourses.map((course) => {
              const courseEnrolled = enrolledCourseKeys.has(getCourseKey(course));

              return (
                <article
                  key={
                    course.id ||
                    course.course_id ||
                    course.code
                  }
                  className="course-folder public-course-folder"
                >
                  <button
                    type="button"
                    className={`add-course-button ${
                      courseEnrolled ? 'enrolled-course-status' : ''
                    }`}
                    aria-label={
                      courseEnrolled
                        ? `Already enrolled in ${getCourseTitle(course)}`
                        : `Add ${getCourseTitle(course)}`
                    }
                    disabled={courseEnrolled}
                    onClick={() => {
                      if (!courseEnrolled) {
                        confirmEnrollment(course);
                      }
                    }}
                  >
                    {courseEnrolled ? 'Enrolled' : '+'}
                  </button>

                  <div className="course-card-body">
                    <h2>
                      {getCourseTitle(course)}
                    </h2>
                  </div>

                  <div className="course-card-footer">
                    <Avatar
                      src={
                        course.professorProfileImage ||
                        course.professor_profile_image
                          ? resolveProfileImage(
                              course.professorProfileImage ||
                                course.professor_profile_image,
                            )
                          : undefined
                      }
                      alt={`${
                        course.instructor ||
                        'Professor'
                      }'s profile`}
                    />

                    <div className="public-course-meta">
                      <span>
                        {course.instructor ||
                          'Professor'}
                      </span>

                      <small>
                        {getProfessorDepartment(
                          course,
                        )}
                      </small>
                    </div>

                    <button
                      type="button"
                      className={`start-learning-button ${
                        courseEnrolled ? 'enrolled-course-status' : ''
                      }`}
                      disabled={courseEnrolled}
                      onClick={() => {
                        if (!courseEnrolled) {
                          confirmEnrollment(course);
                        }
                      }}
                    >
                      {courseEnrolled ? 'Enrolled' : 'Enroll'}
                    </button>
                  </div>
                </article>
              );
            })
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
