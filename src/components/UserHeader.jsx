import styles from "../pages/course/Learning_Module.module.css";

export default function UserHeader({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  notificationOpen,
  setNotificationOpen,
  notificationCount = 0,
  notifications = [],
  markNotificationsAsRead,
  user = {},
  profileDropdownOpen,
  setProfileDropdownOpen,
  handleLogout,
}) {
  return (
    <header className={styles.headerContainer}>
      <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery?.(event.target.value)}
          placeholder="Search..."
        />
        <span aria-hidden="true">S</span>
      </form>

      <div className={styles.profileWrapper}>
        <div className={styles.notificationWrapper}>
          <button
            className={styles.notificationBtn}
            type="button"
            onClick={() => setNotificationOpen?.((current) => !current)}
            aria-label="Notifications"
          >
            <span aria-hidden="true">!</span>
            {notificationCount > 0 && (
              <span className={styles.notificationBadge}>{notificationCount}</span>
            )}
          </button>

          <div
            className={`${styles.notificationDropdown} ${
              notificationOpen ? styles.show : ""
            }`}
          >
            <div className={styles.notificationHeader}>
              <h4>Notifications</h4>
              <button
                className={styles.markReadBtn}
                type="button"
                onClick={markNotificationsAsRead}
              >
                Mark read
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className={styles.emptyNotification}>
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification, index) => (
                <article className={styles.notificationItem} key={notification.id || index}>
                  <div className={styles.notificationTop}>
                    <h5>{notification.title || "Notification"}</h5>
                    <span className={styles.notificationRole}>
                      {notification.role || "system"}
                    </span>
                  </div>
                  <p>{notification.message || notification.body || ""}</p>
                  <small>{notification.created_at || notification.date || ""}</small>
                </article>
              ))
            )}
          </div>
        </div>

        <button
          className={styles.profileLink}
          type="button"
          onClick={() => setProfileDropdownOpen?.((current) => !current)}
        >
          <span className={styles.dpContainer}>
            <img
              className={styles.profilePic}
              src={user.profile_image || "/images/temporary profile.jpg"}
              alt=""
            />
          </span>
          <span className={styles.userInfo}>
            <p>@{user.username || "user"}</p>
          </span>
        </button>

        <div className={styles.dropdown}>
          <div
            className={`${styles.dropdownContent} ${
              profileDropdownOpen ? styles.show : ""
            }`}
          >
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
