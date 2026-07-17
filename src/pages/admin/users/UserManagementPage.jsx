import { useEffect, useMemo, useState } from 'react';
import {
  FiArchive,
  FiEye,
  FiMail,
  FiSearch,
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
    name: 'Ashborn Reyes',
    email: 'ashborn@puffybrain.test',
    role: 'professor',
    status: 'Active',
    verificationStatus: 'approved',
    joined: '2026-06-21',
    decks: 12,
    modules: 9,
  },
];

function normalizeUser(user) {
  const displayName =
    user.name || user.displayName || user.display_name || user.username || 'Unnamed User';
  const verificationStatus =
    user.verificationStatus || user.verification_status || 'approved';
  const archived =
    user.isArchived === true ||
    user.is_archived === 1 ||
    user.is_archived === true ||
    user.status === 'Archived';

  return {
    id: user.id || user.userId || user.user_id || user.UserID || displayName,
    name: displayName,
    email: user.email || 'No email found',
    role: user.role || 'student',
    status: archived ? 'Archived' : user.status || 'Active',
    verificationStatus,
    joined: user.joined || user.created_at || user.createdAt || '',
    decks: Number(user.decks || user.deck_count || 0),
    modules: Number(user.modules || user.module_count || 0),
    studentId: user.studentId || user.student_id || '',
    professorId: user.professorId || user.professor_id || '',
    verified:
      user.verified === true ||
      user.is_verified === 1 ||
      user.is_verified === true ||
      user.isVerified === true,
    isArchived: archived,
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

function isAdminManagedUser(user) {
  const role = String(user.role || '').toLowerCase();
  const verificationStatus = String(user.verificationStatus || '').toLowerCase();

  if (role === 'student') return true;
  if (role === 'professor') return verificationStatus === 'approved';

  return false;
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

function getAuthHeaders() {
  const token = localStorage.getItem('puffy-token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
  const [users, setUsers] = useState(demoUsers.map(normalizeUser));
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [busyUserId, setBusyUserId] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/users`);

        if (!response.ok) {
          throw new Error('User API unavailable.');
        }

        const data = await response.json();
        const nextUsers = Array.isArray(data.users) ? data.users : [];

        if (!ignore) {
          setUsers(nextUsers.map(normalizeUser).filter(isAdminManagedUser));
          setNotice('');
        }
      } catch {
        if (!ignore) {
          setUsers(demoUsers.map(normalizeUser));
          setNotice('Showing sample approved users until the users API is available.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  const updateUserInList = (nextUser) => {
    const normalized = normalizeUser(nextUser);
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === normalized.id ? normalized : user))
    );
    setSelectedUser((currentUser) =>
      currentUser && currentUser.id === normalized.id ? normalized : currentUser
    );
  };

  const handleArchiveToggle = async (user) => {
    const archive = !user.isArchived;

    try {
      setBusyUserId(`${user.id}-archive`);
      const response = await fetch(`${API_BASE}/users/${user.id}/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ archive }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not update account.');
      }

      updateUserInList(data.user);
      setNotice(data.message);
    } catch (error) {
      setNotice(error.message || 'Could not update account.');
    } finally {
      setBusyUserId('');
    }
  };

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return users.filter((user) => {
      const role = String(user.role).toLowerCase();
      const status = String(user.status).toLowerCase();
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' || status === statusFilter.toLowerCase();
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        String(user.id).toLowerCase().includes(search) ||
        String(user.studentId).toLowerCase().includes(search);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [query, roleFilter, statusFilter, users]);

  const stats = useMemo(() => {
    const countRole = (role) =>
      users.filter((user) => String(user.role).toLowerCase() === role).length;
    const archivedCount = users.filter((user) => user.isArchived).length;

    return [
      { label: 'Managed Users', value: users.length, icon: FiUsers },
      { label: 'Students', value: countRole('student'), icon: FiUser },
      { label: 'Approved Professors', value: countRole('professor'), icon: FiMail },
      { label: 'Archived', value: archivedCount, icon: FiArchive },
    ];
  }, [users]);

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <h1>Admin User Management</h1>
          <p>Manage approved professors and registered students.</p>
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
            <h2>Approved Users</h2>
            <p>{filteredUsers.length} user records shown</p>
          </div>

          <div className="users-controls">
            <label className="users-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search approved users..."
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
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter users by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
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
                  <td className="users-empty" colSpan="7">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="users-empty" colSpan="7">
                    No approved users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = String(user.status).toLowerCase();

                  return (
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
                        <span className={`users-status is-${status}`}>
                          {titleCase(user.status)}
                        </span>
                      </td>
                      <td>{formatDate(user.joined)}</td>
                      <td>{user.decks} decks / {user.modules} modules</td>
                      <td>
                        <div className="users-action-group">
                          <button
                            className="users-icon-btn users-view-btn"
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            title="View user"
                          >
                            <FiEye />
                            <span>View</span>
                          </button>

                          <button
                            className="users-icon-btn users-archive-btn"
                            type="button"
                            onClick={() => handleArchiveToggle(user)}
                            disabled={busyUserId === `${user.id}-archive`}
                            title={user.isArchived ? 'Restore account' : 'Archive account'}
                          >
                            <FiArchive />
                            <span>{user.isArchived ? 'Restore' : 'Archive'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser && (
        <div className="users-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <section
            className="users-modal"
            onClick={(event) => event.stopPropagation()}
          >
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
                <dt>Email</dt>
                <dd>{selectedUser.verified ? 'Verified' : 'Pending'}</dd>
              </div>
              <div>
                <dt>Student ID</dt>
                <dd>{selectedUser.studentId || 'None'}</dd>
              </div>
              <div>
                <dt>Professor ID</dt>
                <dd>{selectedUser.professorId || 'None'}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(selectedUser.joined)}</dd>
              </div>
              <div>
                <dt>Activity</dt>
                <dd>{selectedUser.decks} decks / {selectedUser.modules} modules</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
