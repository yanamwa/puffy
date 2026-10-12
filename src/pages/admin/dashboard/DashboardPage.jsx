
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiUser, FiUsers } from "react-icons/fi";
import "./Dashboard.css";

/* =====================================================
   CONFIGURATION
===================================================== */

const API_BASE = "/api";
const POLLING_INTERVAL = 5000;

// Change these only if your actual routes are different.
const USERS_PAGE = "/admin/users";
const MODULES_PAGE = "/admin/modules";

/* =====================================================
   API HELPERS
===================================================== */

function getToken() {
  return localStorage.getItem("token");
}

async function fetchApi(endpoint, signal) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed (${response.status})`
    );
  }

  if (!data || data.success === false) {
    throw new Error(
      data?.message || "Invalid server response."
    );
  }

  return data;
}

/* =====================================================
   FORMAT HELPERS
===================================================== */

function getTimestamp(value) {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getUserName(user) {
  return (
    user.displayName ||
    user.display_name ||
    user.name ||
    user.email ||
    "Unnamed User"
  );
}



const DEFAULT_PROFILE_IMAGE = "/images/temporaryimg.png";
const UPLOAD_SERVER = "http://localhost:5000";

function getProfileImage(user) {
  const image =
    user?.profileImage ||
    user?.profile_image ||
    user?.profileImageUrl ||
    user?.profile_image_url ||
    user?.profilePicture ||
    user?.profile_picture ||
    user?.avatar ||
    "";

  if (!image || typeof image !== "string") {
    return DEFAULT_PROFILE_IMAGE;
  }

  const path = image.trim().replace(/\\/g, "/");

  if (path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  let fixedPath = path;

  if (/^https?:\/\//i.test(fixedPath)) {
    const url = new URL(fixedPath);

    // Keep externally hosted profile pictures.
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
      return fixedPath;
    }

    fixedPath = url.pathname;
  }

  if (fixedPath.startsWith("/api/uploads/")) {
    fixedPath = fixedPath.replace(
      "/api/uploads/",
      "/uploads/"
    );
  }

  if (!fixedPath.startsWith("/")) {
    fixedPath = `/${fixedPath}`;
  }

  if (!fixedPath.startsWith("/uploads/")) {
    fixedPath = `/uploads/${fixedPath.replace(/^\/+/, "")}`;
  }

  return `${UPLOAD_SERVER}${fixedPath}`;
}


// Presence approximation:
// User is considered online if activity was recorded
// within the last 2 minutes.
function isUserOnline(user) {
  const lastActive =
    user.last_active ||
    user.lastActive ||
    user.last_seen_at;

  if (!lastActive) return false;

  const lastActiveTime = new Date(lastActive).getTime();

  if (!Number.isFinite(lastActiveTime)) return false;

  const TWO_MINUTES = 2 * 60 * 1000;

  return (
    Date.now() - lastActiveTime >= 0 &&
    Date.now() - lastActiveTime <= TWO_MINUTES
  );
}


function formatRole(role) {
  return String(role || "User")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDeckAuthor(deck) {
  return (
    deck.professorDisplayName ||
    deck.professorName ||
    deck.professor_name ||
    "Unknown Professor"
  );
}

/* =====================================================
   DASHBOARD PAGE
===================================================== */

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);

  const [usersLoading, setUsersLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);

  const [usersError, setUsersError] = useState("");
  const [modulesError, setModulesError] = useState("");

  /* =====================================================
     AUTOMATIC DATA SYNCHRONIZATION
  ===================================================== */

  useEffect(() => {
    let mounted = true;
    let requestInProgress = false;
    let activeController = null;

    async function loadDashboard() {
      if (!mounted || requestInProgress) return;

      requestInProgress = true;

      const controller = new AbortController();
      activeController = controller;

      try {
        const results = await Promise.allSettled([
          fetchApi("/users", controller.signal),
          fetchApi("/modules", controller.signal),
        ]);

        if (!mounted) return;

        const [usersResult, modulesResult] = results;

        // USERS
        if (usersResult.status === "fulfilled") {
          if (Array.isArray(usersResult.value.users)) {
            setUsers(usersResult.value.users);
            setUsersError("");
          } else {
            setUsersError("Invalid users response.");
          }
        } else if (usersResult.reason?.name !== "AbortError") {
          setUsersError(
            usersResult.reason?.message ||
              "Unable to load users."
          );
        }

        // LEARNING MODULES / DECKS
        if (modulesResult.status === "fulfilled") {
          if (Array.isArray(modulesResult.value.modules)) {
            setModules(modulesResult.value.modules);
            setModulesError("");
          } else {
            setModulesError("Invalid modules response.");
          }
        } else if (
          modulesResult.reason?.name !== "AbortError"
        ) {
          setModulesError(
            modulesResult.reason?.message ||
              "Unable to load decks."
          );
        }
      } finally {
        requestInProgress = false;

        if (activeController === controller) {
          activeController = null;
        }

        if (mounted) {
          setUsersLoading(false);
          setModulesLoading(false);
        }
      }
    }

    // Load immediately when the page opens.
    void loadDashboard();

    // Automatically fetch updates every 5 seconds.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    }, POLLING_INTERVAL);

    // Synchronize when returning to the browser tab.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    // Clean up when leaving the dashboard.
    return () => {
      mounted = false;

      window.clearInterval(interval);

      activeController?.abort();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /* =====================================================
     ACTIVE USERS
  ===================================================== */

  const activeUsers = useMemo(() => {
    return users.filter(
      (user) =>
        String(user.status || "").toLowerCase() ===
        "active"
    );
  }, [users]);

  /* =====================================================
     RECENT USERS
  ===================================================== */

  const recentUsers = useMemo(() => {
    return [...activeUsers]
      .sort((a, b) => {
        const dateDifference =
          getTimestamp(b.created_at || b.joined) -
          getTimestamp(a.created_at || a.joined);

        if (dateDifference !== 0) return dateDifference;

        return (
          Number(b.id || b.userId || 0) -
          Number(a.id || a.userId || 0)
        );
      })
      .slice(0, 5);
  }, [activeUsers]);

  /* =====================================================
     RECENT DECKS / LEARNING MODULES
  ===================================================== */

  const recentDecks = useMemo(() => {
    return [...modules]
      .sort((a, b) => {
        const dateDifference =
          getTimestamp(b.created_at || b.createdAt) -
          getTimestamp(a.created_at || a.createdAt);

        if (dateDifference !== 0) return dateDifference;

        return (
          Number(b.id || b.lesson_id || 0) -
          Number(a.id || a.lesson_id || 0)
        );
      })
      .slice(0, 5);
  }, [modules]);

  /* =====================================================
     DASHBOARD STATISTICS
  ===================================================== */

  
const stats = [
  {
    id: 1,
    label: "Total Users",
    value: usersLoading
      ? "..."
      : usersError && users.length === 0
        ? "—"
        : activeUsers.length,
    badge: "Active",
    status: usersLoading
      ? "connecting"
      : usersError
        ? "offline"
        : "online",
    icon: FiUsers,
  },
  {
    id: 2,
    label: "Total Decks",
    value: modulesLoading
      ? "..."
      : modulesError && modules.length === 0
        ? "—"
        : modules.length,
    badge: "Live",
    status: modulesLoading
      ? "connecting"
      : modulesError
        ? "offline"
        : "online",
    icon: FiBookOpen,
  },
  {
    id: 3,
    label: "Recent Decks",
    value: modulesLoading
      ? "..."
      : modulesError && modules.length === 0
        ? "—"
        : recentDecks.length,
    badge: "Latest 5",
    status: modulesLoading
      ? "connecting"
      : modulesError
        ? "offline"
        : "online",
    icon: FiBookOpen,
  },
];


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="dashboard-container">
      {/* PAGE TITLE */}
      <h1 className="dashboard-title">Dashboard</h1>

      {/* STATISTICS */}
      <div className="stat-cards">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.id}>
              <div className="stat-icon">
                <Icon />
              </div>

              <div className="stat-content">
                <p className="stat-label">
                  {stat.label}
                </p>

                
                    <span
                    className={`stat-change stat-change--${stat.status}`}
                    title={
                        stat.status === "online"
                        ? "API connected. Automatically syncing every 5 seconds."
                        : stat.status === "offline"
                            ? "API connection failed. Automatically retrying."
                            : "Connecting to server..."
                    }
                    >
                    <span>{stat.badge}</span>

                    <span
                        className="stat-status-dot"
                        aria-hidden="true"
                    />
                    </span>


                <p className="stat-value">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* DASHBOARD SECTIONS */}
      <div className="dashboard-sections">
        {/* RECENT CREATED DECKS */}
        <section className="section">
          <div className="section-header">
            <h2>Recent Created Decks</h2>

            <Link
              to={MODULES_PAGE}
              className="show-all"
            >
              Show all
            </Link>
          </div>

          <div className="decks-list">
            {modulesLoading ? (
              <p>Loading decks...</p>
            ) : modulesError && modules.length === 0 ? (
              <div role="alert">
                <p>Unable to load decks.</p>
                <p>{modulesError}</p>
                <p>Automatically reconnecting...</p>
              </div>
            ) : recentDecks.length === 0 ? (
              <p>No learning modules created yet.</p>
            ) : (
              recentDecks.map((deck) => (
                <div
                  key={deck.id || deck.lesson_id}
                  className="deck-item"
                >
                  <span className="deck-icon">
                    <FiBookOpen />
                  </span>

                  <div className="deck-info">
                    <p className="deck-title">
                      {deck.title || "Untitled Deck"}
                    </p>

                    <p className="deck-author">
                      Created by @{getDeckAuthor(deck)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {modulesError && modules.length > 0 && (
              <p role="status">
                Connection interrupted. Showing last
                available data.
              </p>
            )}
          </div>
        </section>

        {/* RECENT USERS */}
        <section className="section">
          <div className="section-header">
            <h2>Recent Users</h2>

            <Link
              to={USERS_PAGE}
              className="show-all"
            >
              Show all
            </Link>
          </div>

          <div className="users-list">
            {usersLoading ? (
              <p>Loading users...</p>
            ) : usersError && users.length === 0 ? (
              <div role="alert">
                <p>Unable to load users.</p>
                <p>{usersError}</p>
                <p>Automatically reconnecting...</p>
              </div>
            ) : recentUsers.length === 0 ? (
              <p>No active users found.</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id || user.userId}
                  className="user-item"
                >
                  
                        <div className="recent-user-avatar-wrapper">
                            <img
                            className="recent-user-profile-image"
                            src={getProfileImage(user)}
                            alt={`${getUserName(user)}'s profile`}
                            loading="lazy"
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                            }}
                            />


                        {isUserOnline(user) && (
                            <span
                            className="recent-user-online-dot"
                            title="Recently active"
                            aria-label="Recently active"
                            />
                        )}
                        </div>

                        <div className="user-info">
                        <p className="user-name">
                            {getUserName(user)}
                        </p>

                        <p className="recent-user-role">
                            {formatRole(user.role)}
                            {" · "}
                            {isUserOnline(user) ? "Recently active" : "Offline"}
                        </p>
                        </div>

                </div>
              ))
            )}

            {usersError && users.length > 0 && (
              <p role="status">
                Connection interrupted. Showing last
                available data.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
