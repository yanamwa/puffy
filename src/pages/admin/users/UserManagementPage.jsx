import { useEffect, useMemo, useState } from 'react';
import {
  FiEye,
  FiMail,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { API_BASE } from '../../../config';
import './Users.css';

const demoUsers = [
  {
    id: 1,
    name: 'Meiko Santos',
    email: 'meiko@puffybrain.test',
    role: 'student',
    status: 'Active',
    joined: '2026-07-01',
    decks: 8,
    modules: 4,
  },
  {
    id: 2,
    name: 'Anie Cruz',
    email: 'anie@puffybrain.test',
    role: 'student',
    status: 'Active',
    joined: '2026-06-28',
    decks: 5,
    modules: 3,
  },
  {
    id: 3,
    name: 'Ashborn Reyes',
    email: 'ashborn@puffybrain.test',
    role: 'professor',
    status: 'Active',
    joined: '2026-06-21',
    decks: 12,
    modules: 9,
  },
  {
    id: 4,
    name: 'Admin Meii',
    email: 'admin@puffybrain.test',
    role: 'admin',
    status: 'Active',
    joined: '2026-06-15',
    decks: 0,
    modules: 0,
  },
  {
    id: 5,
    name: 'Shzume Lee',
    email: 'shzume@puffybrain.test',
    role: 'student',
    status: 'Pending',
    joined: '2026-06-10',
    decks: 2,
    modules: 1,
  },
];

function normalizeUser(user) {
  const displayName = user.name || user.username || user.full_name || 'Unnamed User';

  return {
    id: user.id || user.user_id || user.UserID || displayName,
    name: displayName,
    email: user.email || 'No email found',
    role: user.role || 'student',
    status: user.status || 'Active',
    joined: user.joined || user.created_at || user.createdAt || '',
    decks: Number(user.decks || user.deck_count || 0),
    modules: Number(user.modules || user.module_count || 0),
    profileImage:
      user.profile_image ||
      user.profileImage ||
      user.profile_photo ||
      user.profilePhoto ||
      user.avatar ||
      user.image ||
      '',
  };
}

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getProfileImageUrl(image) {
  const value = String(image || '').trim();

  if (
    !value ||
    value.toLowerCase() === 'null' ||
    value.toLowerCase() === 'undefined' ||
    value.includes('temporary profile.jpg')
  ) {
    return '';
  }

  if (
    value.startsWith('http') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('/images/') ||
    value.startsWith('/api/')
  ) {
    return value;
  }

  const cleanImage = value.replace(/^\/+/, '').replace(/^puffybrain\//, '');
  return `${API_BASE}/${cleanImage}`;
}

function UserAvatar({ user, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = imageFailed ? '' : getProfileImageUrl(user.profileImage);
  const initials = getInitials(user.name) || '?';
  const className = large ? 'users-modal-avatar' : 'users-avatar';

  return (
    <span className={className}>
      {imageUrl ? (
        <img src={imageUrl} alt="" onError={() => setImageFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState(demoUsers);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');

        if (!response.ok) {
          throw new Error('User API unavailable.');
        }

        const data = await response.json();
        const nextUsers = Array.isArray(data.users) ? data.users : [];

        if (!ignore) {
          setUsers(nextUsers.map(normalizeUser));
          setNotice('');
        }
      } catch {
        if (!ignore) {
          setUsers(demoUsers);
          setNotice('Showing sample user info until the users API is available.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' || String(user.role).toLowerCase() === roleFilter;
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        String(user.id).toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [query, roleFilter, users]);

  const stats = useMemo(() => {
    const countRole = (role) =>
      users.filter((user) => String(user.role).toLowerCase() === role).length;

    return [
      { label: 'Total Users', value: users.length, icon: FiUsers },
      { label: 'Students', value: countRole('student'), icon: FiUser },
      { label: 'Professors', value: countRole('professor'), icon: FiMail },
      { label: 'Admins', value: countRole('admin'), icon: FiShield },
    ];
  }, [users]);

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage all PuffyBrain users.</p>
        </div>
      </div>

      <div className="users-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="users-stat-card" key={stat.label}>
              <div className="users-stat-icon">
                <Icon />
              </div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          );
        })}
      </div>

      <section className="users-panel">
        <div className="users-panel-top">
          <div>
            <h2>Users Information</h2>
            <p>{filteredUsers.length} user records shown</p>
          </div>

          <div className="users-controls">
            <label className="users-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search users..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              aria-label="Filter users by role"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="professor">Professors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {notice && <div className="users-notice">{notice}</div>}

        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="users-empty" colSpan="7">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="users-empty" colSpan="7">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-person">
                        <UserAvatar user={user} />
                        <div>
                          <strong>{user.name}</strong>
                          <small>ID: {user.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="users-role">{titleCase(user.role)}</span>
                    </td>
                    <td>
                      <span
                        className={`users-status ${
                          String(user.status).toLowerCase() === 'active'
                            ? 'is-active'
                            : 'is-pending'
                        }`}
                      >
                        {titleCase(user.status)}
                      </span>
                    </td>
                    <td>{formatDate(user.joined)}</td>
                    <td>{user.decks} decks / {user.modules} modules</td>
                    <td>
                      <button
                        className="users-view-btn"
                        type="button"
                        onClick={() => setSelectedUser(user)}
                      >
                        <FiEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser && (
        <div className="users-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="users-modal-close"
              type="button"
              onClick={() => setSelectedUser(null)}
              aria-label="Close user details"
            >
              x
            </button>
            <div className="users-modal-profile">
              <UserAvatar user={selectedUser} large />
              <div>
                <h2>{selectedUser.name}</h2>
                <p>{selectedUser.email}</p>
              </div>
            </div>
            <dl className="users-detail-grid">
              <div>
                <dt>User ID</dt>
                <dd>{selectedUser.id}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{titleCase(selectedUser.role)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{titleCase(selectedUser.status)}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(selectedUser.joined)}</dd>
              </div>
              <div>
                <dt>Decks Created</dt>
                <dd>{selectedUser.decks}</dd>
              </div>
              <div>
                <dt>Modules Joined</dt>
                <dd>{selectedUser.modules}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
