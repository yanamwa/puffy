import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiTrash2 } from 'react-icons/fi';
import '../Features/AdminFeaturePages.css';

const STORAGE_KEY = 'puffy-notifications-announcements';
const LEGACY_STORAGE_KEY = 'admin-notifications';

const defaultCopy = {
  pageTitle: 'Notifications & Announcements',
  pageDescription: 'Create and manage notifications and announcements for PuffyBrain users.',
  createTitle: 'Create Notification or Announcement',
  titlePlaceholder: 'Enter notification or announcement title',
  messagePlaceholder: 'Write your notification or announcement message',
  postLabel: 'Post Notification',
  listTitle: 'Posted Notifications & Announcements',
  emptyMessage: 'No notifications or announcements found.',
  deleteConfirm: 'Delete this notification or announcement?',
};

const announcementCopy = {
  ...defaultCopy,
  pageTitle: 'Announcement & Notification Management',
  createTitle: 'Create Announcement',
  titlePlaceholder: 'Enter announcement title',
  messagePlaceholder: 'Write your announcement message',
  postLabel: 'Post Announcement',
};

const seedNotifications = [
  {
    id: 1,
    title: 'Admin Notice',
    message: 'Administrative updates can be posted here.',
    target: 'admin',
    createdAt: '2026-06-08T08:33:00',
  },
  {
    id: 2,
    title: 'User Announcement',
    message: 'General user announcements can be sent from this page.',
    target: 'user',
    createdAt: '2026-06-08T08:33:00',
  },
  {
    id: 3,
    title: 'Welcome',
    message: 'Welcome to PuffyBrain.',
    target: 'all',
    createdAt: '2026-06-08T08:33:00',
  },
];

function readNotifications() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedNotifications;
  } catch {
    return seedNotifications;
  }
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTarget(value) {
  const labels = {
    all: 'All',
    user: 'Users',
    student: 'Students',
    professor: 'Professors',
    admin: 'Admins',
  };

  return labels[value] || value;
}

export default function NotificationPage({ variant = 'notification' }) {
  const copy = variant === 'announcement' ? announcementCopy : defaultCopy;
  const [notifications, setNotifications] = useState(() => readNotifications());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'az') return String(a.title).localeCompare(String(b.title));
      if (sortBy === 'za') return String(b.title).localeCompare(String(a.title));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [notifications, sortBy]);

  const addNotification = (event) => {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      window.alert('Please enter both title and message.');
      return;
    }

    setNotifications((current) => [
      {
        id: Date.now(),
        title: title.trim(),
        message: message.trim(),
        target,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setTitle('');
    setMessage('');
    setTarget('all');
  };

  const deleteNotification = (id) => {
    const ok = window.confirm(copy.deleteConfirm);
    if (!ok) return;

    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="admin-page feature-page notification-management-page">
      <h1>{copy.pageTitle}</h1>
      <p>{copy.pageDescription}</p>

      <div className="notification-management-grid">
        <form className="feature-card notification-form" onSubmit={addNotification}>
          <div className="feature-card-top" />
          <div className="feature-card-body">
            <h2>{copy.createTitle}</h2>

            <label className="feature-field">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={copy.titlePlaceholder}
              />
            </label>

            <label className="feature-field">
              <span>Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={copy.messagePlaceholder}
              />
            </label>

            <label className="feature-field">
              <span>Send To</span>
              <select value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="all">All</option>
                <option value="student">Students</option>
                <option value="professor">Professors</option>
                <option value="admin">Admins</option>
              </select>
            </label>

            <button className="primary-feature-btn" type="submit">
              {copy.postLabel}
            </button>
          </div>
        </form>

        <section className="feature-card notification-list-card">
          <div className="feature-card-top" />
          <div className="feature-card-body">
            <div className="feature-section-top">
              <h2>{copy.listTitle}</h2>
              <label className="sort-control">
                <span>Sort by</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
                <FiChevronDown />
              </label>
            </div>

            <div className="notification-list">
              {sortedNotifications.length === 0 ? (
                <div className="feature-empty">{copy.emptyMessage}</div>
              ) : (
                sortedNotifications.map((item) => (
                  <article className="notification-item" key={item.id}>
                    <div className="notification-item-top">
                      <h3>{item.title}</h3>
                      <span>{formatTarget(item.target)}</span>
                    </div>
                    <p>{item.message}</p>
                    <small>{formatDate(item.createdAt)}</small>
                    <button
                      className="danger-feature-btn"
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
