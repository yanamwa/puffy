import { useEffect, useMemo, useState } from 'react';
import { FiBell, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import {
  fetchManagedNotificationsFromServer,
  markManagedNotificationsAsReadForRole,
  mergeManagedNotificationsForRole,
  subscribeToManagedNotifications,
} from '../../utils/notifications';
import './ProfessorLayout.css';

const initialNotifications = [];

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Announcements', value: 'announcement' },
];

function getIcon(type) {
  if (type === 'announcement') return <FiMessageSquare />;
  if (type === 'system') return <FiCheckCircle />;
  return <FiBell />;
}

export default function ProfessorNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(() =>
    mergeManagedNotificationsForRole('professor', initialNotifications),
  );

  useEffect(() => {
    let isMounted = true;

    async function syncNotificationsFromServer() {
      try {
        await fetchManagedNotificationsFromServer();
      } catch (error) {
        console.warn('Unable to sync notifications from the server.', error);
      }

      if (isMounted) {
        setNotifications(mergeManagedNotificationsForRole('professor', []));
      }
    }

    syncNotificationsFromServer();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshNotifications = () => {
      setNotifications((current) =>
        mergeManagedNotificationsForRole('professor', current),
      );
    };

    return subscribeToManagedNotifications(refreshNotifications);
  }, []);

  const visibleNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') {
      return notifications.filter((notification) => notification.unread);
    }
    return notifications.filter((notification) => notification.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAllRead = () => {
    markManagedNotificationsAsReadForRole('professor');

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  return (
    <section className="professor-page professor-notifications">
      <div>
        <h1>Notifications</h1>
        <p>Review platform announcements.</p>
      </div>

      <div className="professor-notification-toolbar">
        <div className="professor-notification-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={activeTab === tab.value ? 'active' : ''}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button className="professor-mark-read" type="button" onClick={markAllRead}>
          Mark all as read ({unreadCount})
        </button>
      </div>

      <div className="professor-notification-list">
        {visibleNotifications.length === 0 ? (
          <div className="professor-card">No notifications found.</div>
        ) : (
          visibleNotifications.map((notification) => (
            <article
              className={`professor-notification-item ${
                notification.unread ? 'unread' : ''
              }`}
              key={notification.id}
            >
              <div className={`professor-notification-icon ${notification.type}`}>
                {getIcon(notification.type)}
              </div>

              <div className="professor-notification-content">
                <h2>{notification.title}</h2>
                <p>{notification.message}</p>
                <div className="professor-notification-meta">
                  <span>{notification.course}</span>
                  <span>{notification.time}</span>
                </div>
              </div>

              <div
                className={`professor-notification-badge ${notification.type}`}
              >
                {notification.type}
              </div>

              {notification.unread && <span className="professor-unread-dot" />}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
