import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./adminprofile.module.css";
import "boxicons/css/boxicons.min.css";
import { API_BASE } from "../../config.js";

import AHeader from "../../components/AHeader";
import ASidebar from "../../components/ASidebar";

export default function AdminProfile() {
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [bellNotifications, setBellNotifications] = useState([]);

  const [loginSortOpen, setLoginSortOpen] = useState(false);
  const [loginSort, setLoginSort] = useState("recent");
  const [loginPage, setLoginPage] = useState(1);

  const [actionSortOpen, setActionSortOpen] = useState(false);
  const [actionSort, setActionSort] = useState("recent");
  const [actionPage, setActionPage] = useState(1);

  const rowsPerPage = 5;
  const fetchedOnce = useRef(false);

  const [admin, setAdmin] = useState({
    id: "",
    username: "Admin",
    full_name: "",
    email: "",
    role: "",
    profile_image: "/images/temporary profile.jpg",
  });

  const [adminActivity, setAdminActivity] = useState({
    last_login: "Not recorded yet",
    login_history: [],
    modules_created: 0,
    recent_actions: [],
  });

  const getAdminImageUrl = (image) => {
    if (!image || image.includes("temporary profile.jpg")) {
      return "/images/temporary profile.jpg";
    }

    if (image.startsWith("http")) return image;

    const cleanImage = image.replace(/^\/+/, "").replace(/^puffybrain\//, "");
    return `${API_BASE}/${cleanImage}`;
  };

  const adminImage = getAdminImageUrl(admin.profile_image);

  const formatActivityDate = (dateValue) => {
    if (!dateValue || dateValue === "Not recorded yet") return "Not recorded yet";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRawDate = (item) =>
    item?.login_time || item?.date || item?.created_at || item?.last_login;

  const splitPhDate = (dateValue) => {
    const formatted = formatActivityDate(dateValue);
    const [datePart, timePart] = formatted.split(",");

    return {
      date: datePart || "—",
      time: timePart?.trim() || "—",
    };
  };

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAdminProfile.php`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) {
        console.error(data.message || "Admin not found");
        return;
      }

      setAdmin({
        id: data.admin?.id || data.admin?.AdminID || "",
        username: data.admin?.username || data.admin?.Username || "Admin",
        full_name:
          data.admin?.full_name ||
          data.admin?.FullName ||
          "System Administrator",
        email: data.admin?.email || data.admin?.Email || "Not set",
        role: data.admin?.role || data.admin?.Role || "Administrator",
        profile_image: data.admin?.profile_image || "/images/temporary profile.jpg",
      });
    } catch (err) {
      console.error("Failed to fetch admin:", err);
    }
  };

  const fetchAdminActivity = async () => {
    try {
      const adminData = JSON.parse(localStorage.getItem("admin") || "{}");

      if (!adminData.id) {
        console.warn("No admin ID found in localStorage");
        return;
      }

      const res = await fetch(
        `${API_BASE}/getAdminActivity.php?admin_id=${adminData.id}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        const lastLogin = data.activity?.last_login || "Not recorded yet";
        const backendLoginHistory = data.activity?.login_history || [];

        const loginHistory =
          backendLoginHistory.length > 0
            ? backendLoginHistory
            : lastLogin !== "Not recorded yet"
            ? [{ login_time: lastLogin }]
            : [];

        setAdminActivity({
          last_login: lastLogin,
          login_history: loginHistory,
          modules_created: data.activity?.modules_created || 0,
          recent_actions: data.activity?.recent_actions || [],
        });
      }
    } catch (err) {
      console.error("Fetch admin activity error:", err);
    }
  };

  const fetchBellNotifications = async () => {
    try {
      const adminData = JSON.parse(localStorage.getItem("admin") || "{}");

      const res = await fetch(
        `${API_BASE}/getAdminNotifications.php?admin_id=${adminData.id}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        setBellNotifications(data.notifications || []);
      } else {
        setBellNotifications([]);
      }
    } catch (err) {
      console.error("Bell notification fetch error:", err);
      setBellNotifications([]);
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;

    fetchedOnce.current = true;

    fetchAdmin();
    fetchAdminActivity();
    fetchBellNotifications();

    const handler = (e) => {
      const insideDropdown = e.target.closest(
        '[class*="notificationWrapper"], [class*="customSort"]'
      );

      if (!insideDropdown) {
        setNotificationOpen(false);
        setLoginSortOpen(false);
        setActionSortOpen(false);
      }
    };

    window.addEventListener("click", handler);

    return () => window.removeEventListener("click", handler);
  }, []);

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();

    const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
    const adminId = adminData.id;

    if (!adminId) {
      Swal.fire("Error", "No admin ID found. Please log in again.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/markAdminNotificationsRead.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchBellNotifications();
        setNotificationOpen(true);
      } else {
        Swal.fire("Error", data.message || "Failed to mark as read.", "error");
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
      Swal.fire("Server Error", "Failed to mark as read.", "error");
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7b5cff",
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`${API_BASE}/adminLogout.php`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }

    localStorage.removeItem("admin");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_username");
    localStorage.removeItem("admin_email");
    sessionStorage.clear();

    navigate("/pb-admin-access", { replace: true });
  };

  const sortedLoginHistory = useMemo(() => {
    return [...adminActivity.login_history].sort((a, b) => {
      const dateA = new Date(getRawDate(a)).getTime();
      const dateB = new Date(getRawDate(b)).getTime();
      return loginSort === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [adminActivity.login_history, loginSort]);

  const sortedRecentActions = useMemo(() => {
    return [...adminActivity.recent_actions].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime();
      const dateB = new Date(b.date || b.created_at).getTime();
      return actionSort === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [adminActivity.recent_actions, actionSort]);

  const totalLoginPages = Math.ceil(sortedLoginHistory.length / rowsPerPage);
  const totalActionPages = Math.ceil(sortedRecentActions.length / rowsPerPage);

  const paginatedLoginHistory = sortedLoginHistory.slice(
    (loginPage - 1) * rowsPerPage,
    loginPage * rowsPerPage
  );

  const paginatedRecentActions = sortedRecentActions.slice(
    (actionPage - 1) * rowsPerPage,
    actionPage * rowsPerPage
  );

  return (
    <div
      className={`${styles.gridContainer} ${
        isCollapsed ? styles.collapsedGrid : ""
      }`}
    >
      <ASidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        handleLogout={handleLogout}
      />

      <AHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notificationOpen={notificationOpen}
        setNotificationOpen={setNotificationOpen}
        bellNotifications={bellNotifications}
        handleMarkAllAsRead={handleMarkAllAsRead}
        admin={admin}
        adminImage={adminImage}
      />

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Admin Profile</h1>

        <div className={styles.profileCard}>
          <div className={styles.idPhotoBox}>
            <div className={styles.idPhotoFrame}>
              <img
                src={adminImage}
                alt="Admin Profile"
                className={styles.idPhoto}
                onError={(e) => {
                  e.currentTarget.src = "/images/temporary profile.jpg";
                }}
              />
            </div>

            <div className={styles.idBarcode}></div>
          </div>

          <div className={styles.profileCardInner}>
            <div className={styles.profileCardTop}>
              <h1 className={styles.profileTitle}>Admin ID Card</h1>
            </div>

            <div className={styles.profileDivider}></div>

            <div className={styles.profileInfoGrid}>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Full Name:</span>
                <span className={styles.profileValue}>{admin.full_name}</span>
              </div>

              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Role:</span>
                <span className={styles.profileValue}>{admin.role}</span>
              </div>

              <div className={styles.profileField}>
                <span className={styles.profileLabel}>Username:</span>
                <span className={styles.profileValue}>{admin.username}</span>
              </div>

              <div className={`${styles.profileField} ${styles.profileFieldWide}`}>
                <span className={styles.profileLabel}>Email:</span>
                <span className={styles.profileValue}>{admin.email}</span>
              </div>

              <div className={styles.profileButtonWrap}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => navigate("/admin/settings")}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.settingsCard}>
          <h2 className={styles.settingsHeading}>Admin Activity</h2>

          <div className={styles.settingsDivider}></div>

          <div className={styles.activityBody}>
            <div className={styles.activityItem}>
              <span>Modules Created</span>
              <strong>{adminActivity.modules_created}</strong>
            </div>

            <div className={styles.activityList}>
              <div className={styles.activityListHeader}>
                <h3>Login History</h3>

                <div className={styles.customSort}>
                  <button
                    type="button"
                    className={styles.customSortBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoginSortOpen((prev) => !prev);
                    }}
                  >
                    <i className="bx bx-sort-alt-2"></i>
                    <span>{loginSort === "recent" ? "Recent" : "Oldest"}</span>
                    <i className="bx bx-chevron-down"></i>
                  </button>

                  {loginSortOpen && (
                    <div className={styles.customSortMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginSort("recent");
                          setLoginPage(1);
                          setLoginSortOpen(false);
                        }}
                      >
                        Recent
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginSort("oldest");
                          setLoginPage(1);
                          setLoginSortOpen(false);
                        }}
                      >
                        Oldest
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.loginTable}>
                <div className={styles.loginTableHeader}>
                  <span>#</span>
                  <span>Date</span>
                  <span>Time</span>
                </div>

                {paginatedLoginHistory.length > 0 ? (
                  paginatedLoginHistory.map((login, index) => {
                    const rawDate = getRawDate(login);
                    const phDate = splitPhDate(rawDate);
                    const count = (loginPage - 1) * rowsPerPage + index + 1;

                    return (
                      <div className={styles.loginTableRow} key={`${rawDate}-${index}`}>
                        <span>{count}</span>
                        <span>{phDate.date}</span>
                        <span>{phDate.time}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noActivity}>No login history yet.</div>
                )}
              </div>

              {totalLoginPages > 1 && (
                <div className={styles.activityPagination}>
                  <button
                    type="button"
                    disabled={loginPage === 1}
                    onClick={() => setLoginPage((prev) => prev - 1)}
                  >
                    Prev
                  </button>

                  <span>
                    Page {loginPage} of {totalLoginPages}
                  </span>

                  <button
                    type="button"
                    disabled={loginPage === totalLoginPages}
                    onClick={() => setLoginPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className={styles.activityList}>
              <div className={styles.activityListHeader}>
                <h3>Recent Activity</h3>

                <div className={styles.customSort}>
                  <button
                    type="button"
                    className={styles.customSortBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionSortOpen((prev) => !prev);
                    }}
                  >
                    <i className="bx bx-sort-alt-2"></i>
                    <span>{actionSort === "recent" ? "Recent" : "Oldest"}</span>
                    <i className="bx bx-chevron-down"></i>
                  </button>

                  {actionSortOpen && (
                    <div className={styles.customSortMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          setActionSort("recent");
                          setActionPage(1);
                          setActionSortOpen(false);
                        }}
                      >
                        Recent
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionSort("oldest");
                          setActionPage(1);
                          setActionSortOpen(false);
                        }}
                      >
                        Oldest
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {paginatedRecentActions.length > 0 ? (
                paginatedRecentActions.map((action, index) => (
                  <div
                    key={`${action.text}-${action.date}-${index}`}
                    className={styles.activityAction}
                  >
                    <p>{action.text}</p>
                    <small>{formatActivityDate(action.date)}</small>
                  </div>
                ))
              ) : (
                <p className={styles.noActivity}>No recent admin actions yet.</p>
              )}

              {totalActionPages > 1 && (
                <div className={styles.activityPagination}>
                  <button
                    type="button"
                    disabled={actionPage === 1}
                    onClick={() => setActionPage((prev) => prev - 1)}
                  >
                    Prev
                  </button>

                  <span>
                    Page {actionPage} of {totalActionPages}
                  </span>

                  <button
                    type="button"
                    disabled={actionPage === totalActionPages}
                    onClick={() => setActionPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}