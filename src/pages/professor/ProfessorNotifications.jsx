import { useMemo, useState } from 'react';
import { FiBell, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import './ProfessorLayout.css';

const initialNotifications = [
  {
    id: 1,
    type: 'student',
    title: 'New quiz submission',
    message: 'Ana Reyes submitted the Web Development Module 1 quiz.',
    course: 'Introduction to Web Development',
    time: '10 minutes ago',
    unread: true,
  },
  {
    id: 2,
    type: 'announcement',
    title: 'Announcement sent',
    message: 'Your reminder about the database activity was sent to 35 students.',
    course: 'Database Systems',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: 3,
    type: 'system',
    title: 'Module published',
    message: 'Human Computer Interaction Module 3 is now visible to students.',
    course: 'Human Computer Interaction',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 4,
    type: 'student',
    title: 'Student needs review',
    message: 'Three students scored below 60% on the latest database quiz.',
    course: 'Database Systems',
    time: 'Jul 5, 2026',
    unread: false,
  },
];

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Student', value: 'student' },
  { label: 'Announcements', value: 'announcement' },
  { label: 'System', value: 'system' },
];

function getIcon(type) {
  if (type === 'announcement') return <FiMessageSquare />;
  if (type === 'system') return <FiCheckCircle />;
  return <FiBell />;
}

export default function ProfessorNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(initialNotifications);

  const visibleNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') {
      return notifications.filter((notification) => notification.unread);
    }
    return notifications.filter((notification) => notification.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  return (
    <section className="professor-page professor-notifications">
      <div>
        <h1>Notifications</h1>
        <p>Review student activity, announcements, and course updates.</p>
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
            <article className="professor-notification-item" key={notification.id}>
              <div className="professor-notification-icon">
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
