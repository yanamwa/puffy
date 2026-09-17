import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  markManagedNotificationAsReadForRole,
  markManagedNotificationsAsReadForRole,
  mergeManagedNotificationsForRole,
  subscribeToManagedNotifications,
} from "../../utils/notifications";

import "./StudentHeader.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_PROFILE_IMAGE = "/images/temporary profile.jpg";

/* =====================================================
   DEFAULT NOTIFICATIONS
===================================================== */

const defaultNotifications = [
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

/* =====================================================
   GET STORED USER
===================================================== */

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

/* =====================================================
   RESOLVE PROFILE IMAGE
===================================================== */

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

/* =====================================================
   STUDENT HEADER
===================================================== */

export default function StudentHeader({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search your course",
  onJoinCourse,
  showSearch = true,
  showJoinCourse = true,
}) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() =>
    getStoredUser()
  );

  const [notificationMenuOpen, setNotificationMenuOpen] =
    useState(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [notificationFilter, setNotificationFilter] =
    useState("all");

  const [notifications, setNotifications] = useState(() =>
    mergeManagedNotificationsForRole(
      "student",
      defaultNotifications
    )
  );

  /* =====================================================
     NOTIFICATION LISTENER
  ===================================================== */

  useEffect(() => {
    const refreshNotifications = () => {
      setNotifications((current) =>
        mergeManagedNotificationsForRole(
          "student",
          current
        )
      );
    };

    return subscribeToManagedNotifications(
      refreshNotifications
    );
  }, []);

  /* =====================================================
     USER PROFILE LISTENER
  ===================================================== */

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

  /* =====================================================
     CLOSE DROPDOWNS
  ===================================================== */

  useEffect(() => {
    const closeDropdowns = (event) => {
      if (
        !event.target.closest(
          ".notification-menu-wrapper"
        )
      ) {
        setNotificationMenuOpen(false);
      }

      if (
        !event.target.closest(
          ".profile-menu-wrapper"
        )
      ) {
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
      closeDropdowns
    );

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeDropdowns
      );

      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, []);

  /* =====================================================
     USER INFORMATION
  ===================================================== */

  const displayName =
    currentUser?.displayName ||
    currentUser?.display_name ||
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.full_name ||
    currentUser?.username ||
    "Student";

  const profileHandle = displayName.replace(/^@/, "");

  const accountLabel =
    currentUser?.email || "Student account";

  const profileImage = useMemo(
    () =>
      resolveProfileImage(
        currentUser?.profileImage ||
          currentUser?.profile_image ||
          currentUser?.avatar ||
          currentUser?.image ||
          ""
      ),
    [currentUser]
  );

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const unreadNotificationCount =
    notifications.filter(
      (notification) => notification.unread
    ).length;

  const visibleNotifications =
    notificationFilter === "unread"
      ? notifications.filter(
          (notification) => notification.unread
        )
      : notifications;

  const markAllNotificationsAsRead = () => {
    markManagedNotificationsAsReadForRole("student");

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const openNotification = (notificationId) => {
    markManagedNotificationAsReadForRole(
      "student",
      notificationId
    );

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

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

  /* =====================================================
     JSX
  ===================================================== */

  return (
    <header className="student-header">
      {/* SEARCH */}

      {showSearch && (
        <label className="student-header-search">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => {
              if (onSearchChange) {
                onSearchChange(event.target.value);
              }
            }}
          />

          <span
            className="student-header-search-icon"
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
      )}

      {/* RIGHT SIDE */}

      <div className="student-header-actions">
        {/* NOTIFICATION */}

        <div className="notification-menu-wrapper">
          <button
            type="button"
            className={`notification-button ${
              notificationMenuOpen ? "active" : ""
            }`}
            aria-label="Notifications"
            aria-expanded={notificationMenuOpen}
            onClick={(event) => {
              event.stopPropagation();

              setProfileMenuOpen(false);

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

          {/* NOTIFICATION DROPDOWN */}

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
                      : "You are all caught up"}
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

              {/* FILTER */}

              <div className="notification-dropdown-tabs">
                <button
                  type="button"
                  className={
                    notificationFilter === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setNotificationFilter("all")
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  className={
                    notificationFilter === "unread"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setNotificationFilter("unread")
                  }
                >
                  Unread
                </button>
              </div>

              {/* NOTIFICATION LIST */}

              <div className="notification-list">
                {visibleNotifications.length === 0 ? (
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
                      No notifications
                    </strong>

                    <p>
                      New updates will appear here.
                    </p>
                  </div>
                ) : (
                  visibleNotifications.map(
                    (notification) => (
                      <button
                        key={notification.id}
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
                        {/* ICON */}

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

                        {/* COPY */}

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
                    )
                  )
                )}
              </div>

              <button
                type="button"
                className="notification-view-all-button"
                onClick={() => {
                  setNotificationMenuOpen(false);

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

        {/* JOIN COURSE */}

        {showJoinCourse && (
          <button
            type="button"
            className="student-join-course-button"
            onClick={() => {
              if (onJoinCourse) {
                onJoinCourse();
              }
            }}
          >
            + Join course
          </button>
        )}

        {/* PROFILE */}

        <div className="profile-menu-wrapper">
          <div className="profile-chip">
            <button
              type="button"
              className="profile-main-button"
              onClick={() =>
                navigate("/student/profile")
              }
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

            {/* THREE DOT BUTTON */}

            <button
              type="button"
              className={`profile-dropdown-button ${
                profileMenuOpen ? "open" : ""
              }`}
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
              onClick={(event) => {
                event.stopPropagation();

                setNotificationMenuOpen(false);

                setProfileMenuOpen(
                  (current) => !current
                );
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="5" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="12" cy="19" r="1.6" />
              </svg>
            </button>
          </div>

          {/* PROFILE DROPDOWN */}

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

              {/* VIEW PROFILE */}

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);

                  navigate("/student/profile");
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

              {/* SETTINGS */}

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);

                  navigate("/student/settings");
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

              {/* LOGOUT */}

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
  );
}