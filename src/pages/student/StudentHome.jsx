import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Icon } from "./EnrolledCourses";
import JoinCourseModal from "./JoinCourseModal";
import {
  enrollStudentInCourseAsync,
  findJoinableCourseByCodeAsync,
  loadStudentEnrolledCourses,
} from "./studentCourseData";
import { API_BASE } from "../../config.js";
import "./EnrolledCourses.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_PROFILE_IMAGE =
  "/images/temporary profile.jpg";

function resolveProfileImage(imagePath) {
  if (!imagePath) {
    return DEFAULT_PROFILE_IMAGE;
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

  return `${serverOrigin}${
    imagePath.startsWith("/") ? "" : "/"
  }${imagePath}`;
}

function saveUpdatedUser(updatedUser) {
  if (!updatedUser) return;

  const serializedUser = JSON.stringify(updatedUser);

  localStorage.setItem("puffy-user", serializedUser);
  localStorage.setItem("user", serializedUser);
  localStorage.setItem("currentUser", serializedUser);

  if (sessionStorage.getItem("user")) {
    sessionStorage.setItem("user", serializedUser);
  }

  if (sessionStorage.getItem("currentUser")) {
    sessionStorage.setItem("currentUser", serializedUser);
  }

  window.dispatchEvent(
    new CustomEvent("puffy-user-updated", {
      detail: updatedUser,
    })
  );
}

const initialTodos = [];

const progressData = {
  week: [
    {
      id: 1,
      label: "Courses on track",
      value: "4/5",
      accent: "BK",
    },
    {
      id: 2,
      label: "Studied this week",
      value: "6.5 hrs",
      accent: "TM",
    },
    {
      id: 3,
      label: "Avg. quiz accuracy",
      value: "84%",
      accent: "OK",
    },
  ],

  month: [
    {
      id: 1,
      label: "Courses on track",
      value: "4/5",
      accent: "BK",
    },
    {
      id: 2,
      label: "Studied this month",
      value: "24 hrs",
      accent: "TM",
    },
    {
      id: 3,
      label: "Avg. quiz accuracy",
      value: "87%",
      accent: "OK",
    },
  ],

  year: [
    {
      id: 1,
      label: "Courses completed",
      value: "8",
      accent: "BK",
    },
    {
      id: 2,
      label: "Studied this year",
      value: "142 hrs",
      accent: "TM",
    },
    {
      id: 3,
      label: "Avg. quiz accuracy",
      value: "89%",
      accent: "OK",
    },
  ],
};

const notificationItems = [
  {
    id: 1,
    title: "Welcome to PuffyBrain!",
    message:
      "Your student account is ready. Start exploring your enrolled courses.",
    time: "Just now",
    unread: true,
    icon: "sparkle",
  },
  {
    id: 2,
    title: "New learning material",
    message:
      "A new module was added to ITEC 106 - Web Systems and Technologies 2.",
    time: "12 minutes ago",
    unread: true,
    icon: "course",
  },
  {
    id: 3,
    title: "Course announcement",
    message:
      "Your professor posted an announcement for Introduction to Computing.",
    time: "Yesterday",
    unread: false,
    icon: "announcement",
  },
];

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("puffy-token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken")
  );
}

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("puffy-user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("currentUser");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read stored user:", error);
    return null;
  }
}

function normalizeCourse(course) {
  const title =
    course.title ||
    course.courseName ||
    course.course_name ||
    course.name ||
    "Untitled course";

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
      "COURSE",

    title,
    courseName: course.courseName || title,
    course_name: course.course_name || title,

    description: course.description || "",

    professorName:
      course.professorName ||
      course.professor_name ||
      course.instructor ||
      course.instructorName ||
      course.createdBy ||
      course.created_by ||
      "Professor",

    professorDepartment:
      course.professorDepartment ||
      course.professor_department ||
      course.database_professor_department ||
      course.department ||
      "",
  };
}

function getProfessorDepartment(course) {
  return course.professorDepartment || course.professor_department || "Department not set";
}

export default function StudentHome() {
  const navigate = useNavigate();
  const [progressPeriod, setProgressPeriod] = useState("week");
  const progressCards = progressData[progressPeriod];


  const [shownMonth, setShownMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(new Date());

 const getTodoStorageKey = () => {
  const user = getStoredUser();

  return `student-todos-${
    user?.userId ||
    user?.id ||
    user?.email ||
    "guest"
  }`;
};

const [todos, setTodos] = useState(() => {
  try {
    const saved = localStorage.getItem(getTodoStorageKey());

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
});
useEffect(() => {
  localStorage.setItem(
    getTodoStorageKey(),
    JSON.stringify(todos)
  );
}, [todos]);
  const [newTodo, setNewTodo] = useState("");

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");

  const [notificationMenuOpen, setNotificationMenuOpen] =
    useState(false);
  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState(notificationItems);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const [currentUser, setCurrentUser] = useState(() =>
    getStoredUser()
  );
  

  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState("");

  const calendarDays = useMemo(() => {
    const year = shownMonth.getFullYear();
    const month = shownMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    return [
      ...Array.from({ length: firstDay }, (_, index) => ({
        key: `blank-${index}`,
        blank: true,
      })),

      ...Array.from({ length: daysInMonth }, (_, index) => ({
        key: `${year}-${month}-${index + 1}`,
        date: new Date(year, month, index + 1),
        day: index + 1,
      })),
    ];
  }, [shownMonth]);

  const monthLabel = shownMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayName =
    currentUser?.displayName ||
    currentUser?.display_name ||
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.username ||
    "Student";

  const yearLevel =
    currentUser?.yearLevel ||
    currentUser?.year_level ||
    currentUser?.year ||
    "";

  const sectionName =
    currentUser?.sectionName ||
    currentUser?.section_name ||
    currentUser?.section ||
    "";

  const studentInformation = [yearLevel, sectionName]
    .filter(Boolean)
    .join(" • ");

  const profileHandle = displayName.replace(/^@/, "");
  const accountLabel =
    currentUser?.email ||
    "Student account";

  const profileImage = resolveProfileImage(
    currentUser?.profileImage ||
      currentUser?.profile_image ||
      currentUser?.avatar ||
      currentUser?.image ||
      ""
  );

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const token = getStoredToken();

        if (!token) {
          throw new Error(
            "Your login session was not found. Please log in again."
          );
        }

        const requestOptions = {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const [userResponse, loadedCourses] =
          await Promise.all([
            fetch(
              `${API_BASE}/users/me`,
              requestOptions
            ),

            loadStudentEnrolledCourses(),
          ]);

        const userData = await userResponse
          .json()
          .catch(() => ({}));

        if (!userResponse.ok) {
          throw new Error(
            userData.message ||
              "Failed to load your account information."
          );
        }

        if (!active) return;

        const loadedUser =
          userData.user || userData.data || null;

        setEnrolledCourses(
          loadedCourses.map(normalizeCourse)
        );

        if (loadedUser) {
          setCurrentUser(loadedUser);
          saveUpdatedUser(loadedUser);
        }
      } catch (error) {
        console.error(
          "Student dashboard loading error:",
          error
        );

        if (active) {
          setDashboardError(
            error.message ||
              "Could not load your dashboard."
          );
        }
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser =
        event.detail || getStoredUser();

      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    const handleStorageUpdate = (event) => {
      if (
        ![
          "puffy-user",
          "user",
          "currentUser",
        ].includes(event.key)
      ) {
        return;
      }

      const updatedUser = getStoredUser();

      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    window.addEventListener(
      "puffy-user-updated",
      handleUserUpdated
    );

    window.addEventListener(
      "storage",
      handleStorageUpdate
    );

    return () => {
      window.removeEventListener(
        "puffy-user-updated",
        handleUserUpdated
      );

      window.removeEventListener(
        "storage",
        handleStorageUpdate
      );
    };
  }, []);

  useEffect(() => {
    const closeOpenMenus = (event) => {
      if (
        !event.target.closest(
          ".notification-menu-wrapper"
        )
      ) {
        setNotificationMenuOpen(false);
      }

      if (!event.target.closest(".profile-menu-wrapper")) {
        setProfileMenuOpen(false);
      }
    };

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeOpenMenus
    );

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOpenMenus
      );

      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, []);

  const shiftMonth = (amount) => {
    setShownMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1
        )
    );
  };

  const addTodo = () => {
    const text = newTodo.trim();

    if (!text) return;

    setTodos((current) => [
      ...current,
      {
        id: Date.now(),
        text,
        done: false,
      },
    ]);

    setNewTodo("");
  };

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              done: !todo.done,
            }
          : todo
      )
    );
  };

  const removeTodo = (id) => {
    setTodos((current) =>
      current.filter((todo) => todo.id !== id)
    );
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode("");
  };

  const joinByCourseCode = async () => {
    try {
      const course =
        await findJoinableCourseByCodeAsync(courseCode);

      if (!course) {
        window.alert(
          "Course code not found. Please check the code from your professor."
        );

        return;
      }

      await enrollStudentInCourseAsync(course);

      closeJoinModal();

      navigate(
        `/student/enrolled-courses/${
          course.id ||
          course.courseId ||
          course.course_id ||
          course.code
        }`
      );
    } catch (error) {
      console.error("Join course error:", error);

      window.alert(
        error.message || "Unable to join the course."
      );
    }
  };

  const unreadNotificationCount =
    notifications.filter(
      (notification) => notification.unread
    ).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      }))
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
          : notification
      )
    );
  };

  const handleCourseOpen = (course) => {
    navigate(
      `/student/enrolled-courses/${course.id}`
    );
  };

  const handleCourseKeyDown = (event, course) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      handleCourseOpen(course);
    }
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);

    [
      "token",
      "authToken",
      "puffy-token",
      "puffy-user",
      "user",
      "currentUser",
      "user_email",
      "user_role",
      "username",
      "year_level",
      "section_name",
      "school_name",
    ].forEach((key) => localStorage.removeItem(key));

    [
      "token",
      "authToken",
      "puffy-token",
      "user",
      "currentUser",
    ].forEach((key) => sessionStorage.removeItem(key));

    navigate("/login", {
      replace: true,
    });
  };

  const progressPeriods = [
  "week",
  "month",
  "year",
];

  const nextProgressPeriod = () => {
  setProgressPeriod((current) => {
    const index = progressPeriods.indexOf(current);

    return progressPeriods[
      (index + 1) % progressPeriods.length
    ];
  });
};
  return (
    <div
      className={`student-home-dashboard striped-dashboard ${
        sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      <aside className="enrolled-sidebar">
        <div className="brand-lockup">
          <img
            src="/images/logo_solo.png"
            alt="PuffyBrain logo"
            className="sidebar-logo"
            onClick={() => {
              setSidebarCollapsed((previous) => {
                const newValue = !previous;

                localStorage.setItem(
                  "sidebarCollapsed",
                  String(newValue)
                );

                return newValue;
              });
            }}
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
            className="side-nav-item active"
            title={
              sidebarCollapsed
                ? "Home"
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
                ? "Enrolled Courses"
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
                ? "Public Courses"
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
                ? "Archived Classes"
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
                ? "Settings"
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
              ? "Log-out"
              : undefined
          }
          onClick={handleLogout}
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

      <main className="home-main">
        <header className="enrolled-topbar transparent-topbar home-topbar">
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
                    ? "active"
                    : ""
                }`}
                aria-label={`Notifications${
                  unreadNotificationCount > 0
                    ? `, ${unreadNotificationCount} unread`
                    : ""
                }`}
                aria-expanded={
                  notificationMenuOpen
                }
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.stopPropagation();

                  setNotificationMenuOpen(
                    (current) => !current
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
                      ? "9+"
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
                          : "You are all caught up"}
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
                          New updates will appear
                          here.
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
                                ? "unread"
                                : ""
                            }`}
                            onClick={() =>
                              openNotification(
                                notification.id
                              )
                            }
                          >
                            <span
                              className={`notification-item-icon ${notification.icon}`}
                              aria-hidden="true"
                            >
                              {notification.icon ===
                              "course" ? (
                                <svg viewBox="0 0 24 24">
                                  <path d="m3.5 8.2 8.5-4.7 8.5 4.7-8.5 4.7-8.5-4.7Z" />

                                  <path d="M6.5 10.2v5c0 1.3 2.5 3 5.5 3s5.5-1.7 5.5-3v-5" />
                                </svg>
                              ) : notification.icon ===
                                "announcement" ? (
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
                        )
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className="notification-view-all-button"
                    onClick={() => {
                      setNotificationMenuOpen(
                        false
                      );

                      navigate(
                        "/student/notifications"
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
                  onClick={() => navigate("/student/profile")}
                  aria-label="Open your profile"
                >
                  <span className="profile-avatar">
                    <img
                      src={profileImage}
                      alt={`${displayName}'s profile`}
                      className="profile-header-image"
                      onError={(event) => {
                        event.currentTarget.src =
                          DEFAULT_PROFILE_IMAGE;
                      }}
                    />
                    <span className="profile-status-dot" />
                  </span>

                  <span className="profile-user-info">
                    <strong>{profileHandle}</strong>
                    <small>Student</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`profile-dropdown-button ${
                    profileMenuOpen ? "open" : ""
                  }`}
                  aria-label={
                    profileMenuOpen
                      ? "Close profile menu"
                      : "Open profile menu"
                  }
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
                    <img
                      src={profileImage}
                      alt={`${displayName}'s profile`}
                      className="profile-dropdown-image"
                      onError={(event) => {
                        event.currentTarget.src =
                          DEFAULT_PROFILE_IMAGE;
                      }}
                    />

                    <div>
                      <strong>{profileHandle}</strong>
                      <span>{accountLabel}</span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/student/profile");
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
                      navigate("/student/settings");
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

        <div className="home-content">
          <section className="welcome-card">
            <div>
              <p className="home-eyebrow">
                Student dashboard
              </p>

              <h1>
                Hello, {displayName}!
              </h1>

              <p>
                Continue learning and improve
                your mastery at your own pace.
              </p>

              {dashboardError && (
                <p className="dashboard-error-message">
                  {dashboardError}
                </p>
              )}
            </div>
          </section>

          <section
            className="home-section"
            aria-labelledby="continue-quizzes-title"
          >
            <div className="home-section-header">
              <h2 id="continue-quizzes-title">
                Continue your quizzes
              </h2>

              <Link to="/student/enrolled-courses">
                See all quizzes -&gt;
              </Link>
            </div>

            <div className="quiz-resume-grid">
              {dashboardLoading ? (
                <div className="student-empty-state">
                  Loading your enrolled
                  courses...
                </div>
              ) : enrolledCourses.length ===
                0 ? (
                <div className="student-empty-state">
                  You are not enrolled in any
                  courses yet.
                </div>
              ) : (
                enrolledCourses
                  .slice(0, 3)
                  .map((course) => (
                    <article
                      key={course.id}
                      className="course-folder enrolled-course-folder home-course-folder"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleCourseOpen(course)
                      }
                      onKeyDown={(event) =>
                        handleCourseKeyDown(
                          event,
                          course
                        )
                      }
                    >
                      <div className="course-card-body">
                        <h2>{course.title}</h2>
                      </div>

                      <div className="course-card-footer">
                        <Avatar />

                        <div className="enrolled-course-meta">
                          <span>{course.professorName}</span>
                          <small>{getProfessorDepartment(course)}</small>
                        </div>
                      </div>
                    </article>
                  ))
              )}
            </div>
          </section>

          <section
            className="home-section progress-section"
            aria-labelledby="progress-overview-title"
          >
            <div className="home-section-header">
              <h2 id="progress-overview-title">
                Progress overview
              </h2>

              <label className="progress-filter-wrapper">
                  

                  <button
              type="button"
              className="week-filter"
              onClick={nextProgressPeriod}
            >
              {progressPeriod === "week"
                ? "week"
                : progressPeriod === "month"
                ? "month"
                : "year"}
            </button>
                </label>
            </div>

            <div className="progress-overview-grid">
              {progressCards.map((item) => (
                <article
                  key={item.id}
                  className="progress-overview-card"
                >
                  <span className="progress-card-icon">
                    {item.accent}
                  </span>

                  <strong>
                    {item.value}
                  </strong>

                  <span>
                    {item.label}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <aside className="student-profile-panel">
        <span className="anime-avatar large">
          <img
            src={profileImage}
            alt={`${displayName}'s profile`}
            onError={(event) => {
              event.currentTarget.src =
                DEFAULT_PROFILE_IMAGE;
            }}
          />
        </span>

        <strong>{displayName}</strong>

        <span>
          {studentInformation ||
            "Student information not set"}
        </span>

        <Link
          to="/student/profile"
          className="profile-button"
        >
          Profile
        </Link>

        <section className="mini-calendar">
          <div className="calendar-header">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              &lt;
            </button>

            <h2>{monthLabel}</h2>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          <div className="calendar-weekdays">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((item) =>
              item.blank ? (
                <span key={item.key} />
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className={
                    item.date.toDateString() ===
                    selectedDate.toDateString()
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedDate(item.date)
                  }
                >
                  {item.day}
                </button>
              )
            )}
          </div>
        </section>

        <section className="todo-card">
          <h2>
            To do list{" "}

            <button
              type="button"
              onClick={addTodo}
            >
              +
            </button>
          </h2>

          <div className="todo-add-row">
            <input
              type="text"
              value={newTodo}
              placeholder="new task"
              onChange={(event) =>
                setNewTodo(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTodo();
                }
              }}
            />
          </div>

         {todos.length === 0 ? (
        <div className="todo-empty-message">
          No tasks yet. Add your first task.
        </div>
      ) : (
        todos.map((todo) => (
          <label
            key={todo.id}
            className={todo.done ? "done" : ""}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />

            <span>{todo.text}</span>

            <button
              type="button"
              onClick={() => removeTodo(todo.id)}
              aria-label={`Remove ${todo.text}`}
            >
              x
            </button>
          </label>
        ))
      )}
        </section>
      </aside>

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