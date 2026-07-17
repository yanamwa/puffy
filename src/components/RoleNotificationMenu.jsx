import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiMessageSquare,
} from 'react-icons/fi';
import './RoleNotificationMenu.css';

const notificationSets = {
  admin: {
    viewAllPath: '/admin/notification',
    items: [
      {
        id: 'admin-new-professor',
        icon: 'course',
        title: 'Professor account ready',
        message: 'A newly approved professor can now access instructor tools.',
        time: '12 minutes ago',
        unread: true,
      },
      {
        id: 'admin-course-report',
        icon: 'announcement',
        title: 'Course report updated',
        message: 'The student progress report has new activity to review.',
        time: '1 hour ago',
        unread: true,
      },
      {
        id: 'admin-system',
        icon: 'sparkle',
        title: 'Module archive completed',
        message: 'Archived module records are available in course management.',
        time: 'Yesterday',
        unread: false,
      },
    ],
  },
  superAdmin: {
    viewAllPath: '/super-admin/announcements',
    items: [
      {
        id: 'super-admin-audit',
        icon: 'sparkle',
        title: 'Security action logged',
        message: 'A sensitive account update was added to the audit trail.',
        time: '8 minutes ago',
        unread: true,
      },
      {
        id: 'super-admin-backup',
        icon: 'course',
        title: 'Backup completed',
        message: 'The latest database backup finished successfully.',
        time: 'Today',
        unread: false,
      },
      {
        id: 'super-admin-announcement',
        icon: 'announcement',
        title: 'Announcement queue ready',
        message: 'Platform-wide notices can be reviewed before publishing.',
        time: 'Yesterday',
        unread: false,
      },
    ],
  },
  professor: {
    viewAllPath: '/professor/notifications',
    items: [
      {
        id: 'professor-submission',
        icon: 'course',
        title: 'New quiz submission',
        message: 'A student submitted the latest module quiz for review.',
        time: '10 minutes ago',
        unread: true,
      },
      {
        id: 'professor-announcement',
        icon: 'announcement',
        title: 'Announcement sent',
        message: 'Your class reminder was delivered to enrolled students.',
        time: '1 hour ago',
        unread: true,
      },
      {
        id: 'professor-system',
        icon: 'sparkle',
        title: 'Module published',
        message: 'Your newest module is now visible to the class.',
        time: 'Yesterday',
        unread: false,
      },
    ],
  },
};

function NotificationIcon({ type }) {
  if (type === 'course') return <FiBookOpen />;
  if (type === 'announcement') return <FiMessageSquare />;
  return <FiCheckCircle />;
}

export default function RoleNotificationMenu({ role = 'admin' }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const config = notificationSets[role] || notificationSets.admin;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(config.items);

  useEffect(() => {
    setNotifications(config.items);
    setActiveTab('all');
    setIsOpen(false);
  }, [config]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const visibleNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((notification) => notification.unread);
    }

    return notifications;
  }, [activeTab, notifications]);

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  const openNotification = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  return (
    <div className="role-notification-menu" ref={menuRef}>
      <button
        type="button"
        className={`role-notification-button ${isOpen ? 'active' : ''}`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
      >
        <FiBell aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="role-notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="role-notification-dropdown"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="role-notification-header">
            <div>
              <h2>Notifications</h2>
              <span>
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </span>
            </div>

            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="role-notification-tabs">
            <button
              type="button"
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={activeTab === 'unread' ? 'active' : ''}
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
          </div>

          <div className="role-notification-list">
            {visibleNotifications.length === 0 ? (
              <div className="role-notification-empty">
                <span>
                  <FiBell aria-hidden="true" />
                </span>
                <strong>No notifications yet</strong>
                <p>New updates will appear here.</p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`role-notification-item ${
                    notification.unread ? 'unread' : ''
                  }`}
                  onClick={() => openNotification(notification.id)}
                >
                  <span
                    className={`role-notification-icon ${notification.icon}`}
                    aria-hidden="true"
                  >
                    <NotificationIcon type={notification.icon} />
                  </span>

                  <span className="role-notification-copy">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{notification.time}</small>
                  </span>

                  {notification.unread && (
                    <span
                      className="role-notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className="role-notification-view-all"
            onClick={() => {
              setIsOpen(false);
              navigate(config.viewAllPath);
            }}
          >
            See all notifications
          </button>
        </section>
      )}
    </div>
  );
}
