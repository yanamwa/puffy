import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArchive,
  FiCheck,
  FiClock,
  FiEye,
  FiFileText,
  FiMail,
  FiPlus,
  FiSearch,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
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

const initialStudentForm = {
  name: '',
  email: '',
  studentId: '',
  yearLevel: '',
  sectionName: '',
};

const STUDENT_IMPORT_ACCEPT = '.csv,.xlsx';

const initialStudentImportStatus = {
  state: 'idle',
  fileName: '',
  fileSize: 0,
  message: '',
  detail: '',
};

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
    yearLevel: user.yearLevel || user.year_level || '',
    sectionName: user.sectionName || user.section_name || '',
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

function formatFileSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  const token =
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeImportHeader(value) {
  return String(value || '')
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';

      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      continue;
    }

    cell += character;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function normalizeStudentImportRows(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const cleanedRows = sourceRows
    .map((row) => {
      if (Array.isArray(row)) return row;
      if (row && typeof row === 'object') return Object.values(row);
      return [row];
    })
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => row.some(Boolean));

  if (cleanedRows.length === 0) return [];

  const header = cleanedRows[0].map(normalizeImportHeader);
  const headerAliases = [
    'email',
    'emailaddress',
    'studentemail',
    'name',
    'fullname',
    'studentname',
  ];
  const hasHeader = header.some((cell) => headerAliases.includes(cell));
  const dataRows = hasHeader ? cleanedRows.slice(1) : cleanedRows;
  const headerCells = hasHeader ? header : [];

  const indexOf = (names, fallback) => {
    const index = headerCells.findIndex((cell) => names.includes(cell));
    return index >= 0 ? index : fallback;
  };

  return dataRows
    .map((row, rowIndex) => ({
      sourceRow: rowIndex + (hasHeader ? 2 : 1),
      name: row[indexOf(['name', 'fullname', 'studentname'], 0)] || '',
      email: row[indexOf(['email', 'emailaddress', 'studentemail'], 1)] || '',
      studentId:
        row[
          indexOf(
            ['studentid', 'studentnumber', 'studentno', 'id', 'idnumber', 'schoolid'],
            2
          )
        ] || '',
      yearLevel:
        row[indexOf(['year', 'yearlevel', 'studentyear', 'grade', 'gradelevel'], 3)] ||
        '',
      sectionName:
        row[indexOf(['section', 'sectionname', 'studentsection', 'block'], 4)] || '',
    }))
    .filter((student) => student.name || student.email || student.studentId);
}

function parseStudentCsv(text) {
  return normalizeStudentImportRows(parseCsvRows(text));
}

async function parseStudentImportFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx') {
    const readXlsxFile = (await import('read-excel-file/browser')).default;
    return normalizeStudentImportRows(await readXlsxFile(file));
  }

  return parseStudentCsv(await file.text());
}

function isSupportedStudentImportFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'csv' || extension === 'xlsx';
}

function formatStudentImportFailure(student, fallbackMessage) {
  const email = String(student.email || '').trim();
  const normalizedMessage = String(fallbackMessage || '').toLowerCase();

  if (normalizedMessage.includes('email is already registered')) {
    return `- Email "${email}" has been registered.`;
  }

  if (!student.name && email) {
    return `- Email "${email}" is missing a student name.`;
  }

  if (!email) {
    return '- Student email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return `- Email "${email}" is not a valid email address.`;
  }

  return `- Email "${email}" could not be imported. ${
    fallbackMessage || 'Please check this student record.'
  }`;
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
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState(demoUsers.map(normalizeUser));
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [busyUserId, setBusyUserId] = useState('');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [studentImportStatus, setStudentImportStatus] = useState(
    initialStudentImportStatus
  );
  const studentImportBusy =
    studentImportStatus.state === 'reading' ||
    studentImportStatus.state === 'importing';

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

  useEffect(() => {
    if (studentModalOpen) {
      setStudentImportStatus(initialStudentImportStatus);
    }
  }, [studentModalOpen]);

  useEffect(() => {
    if (studentImportStatus.state !== 'success' && studentImportStatus.state !== 'partial') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStudentImportStatus(initialStudentImportStatus);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [studentImportStatus.state]);

  const updateUserInList = (nextUser) => {
    const normalized = normalizeUser(nextUser);
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === normalized.id ? normalized : user))
    );
    setSelectedUser((currentUser) =>
      currentUser && currentUser.id === normalized.id ? normalized : currentUser
    );
  };

  const closeStudentModal = () => {
    if (creatingStudent || studentImportBusy) return;
    setStudentModalOpen(false);
    setStudentForm(initialStudentForm);
  };

  const handleStudentFieldChange = (fieldName) => (event) => {
    setStudentForm((currentForm) => ({
      ...currentForm,
      [fieldName]: event.target.value,
    }));
  };

  const dismissStudentImportPopup = () => {
    if (studentImportBusy) return;
    setStudentImportStatus(initialStudentImportStatus);
  };

  const createStudent = async (payload) => {
    const response = await fetch(`${API_BASE}/users/student`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Could not create student account.');
    }

    return data;
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    setCreatingStudent(true);
    setNotice('');

    try {
      const data = await createStudent(studentForm);
      const createdUser = normalizeUser(data.user);

      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setRoleFilter('student');
      setStatusFilter('all');
      setQuery('');
      setStudentForm(initialStudentForm);
      setStudentModalOpen(false);
      setNotice(
        data.credentialsEmailed
          ? 'Student account created and temporary password emailed.'
          : 'Student account created.'
      );
    } catch (error) {
      setNotice(error.message || 'Could not create student account.');
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleImportStudentsClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (studentImportBusy || creatingStudent) return;
    fileInputRef.current?.click();
  };

  const handleBulkImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isSupportedStudentImportFile(file)) {
      setStudentImportStatus({
        state: 'error',
        fileName: file.name,
        fileSize: file.size,
        message: 'This file type is not supported.',
        detail: '- Only .csv and .xlsx Excel files can be imported.',
      });
      setNotice('Only CSV and XLSX files can be imported.');
      return;
    }

    setStudentImportStatus({
      state: 'reading',
      fileName: file.name,
      fileSize: file.size,
      message: 'Uploading student file...',
      detail: '',
    });

    try {
      const students = await parseStudentImportFile(file);

      if (students.length === 0) {
        setStudentImportStatus({
          state: 'error',
          fileName: file.name,
          fileSize: file.size,
          message: 'No student records found in this file.',
          detail: 'Use columns for name, email, student ID, year level, and section.',
        });
        setNotice('Import file has no student records.');
        return;
      }

      const createdUsers = [];
      const failures = [];

      for (const student of students) {
        setStudentImportStatus({
          state: 'importing',
          fileName: file.name,
          fileSize: file.size,
          message: `Importing ${
            createdUsers.length + failures.length + 1
          } of ${students.length} student records...`,
          detail: `${students.length} record${students.length === 1 ? '' : 's'} found in the file.`,
        });

        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email);

        if (!student.name || !student.email) {
          failures.push(
            formatStudentImportFailure(student, 'Student name and email are required.')
          );
          continue;
        }

        if (!validEmail) {
          failures.push(formatStudentImportFailure(student, 'Enter a valid email address.'));
          continue;
        }

        try {
          const data = await createStudent(student);
          createdUsers.push(normalizeUser(data.user));
        } catch (error) {
          failures.push(
            formatStudentImportFailure(
              student,
              error.message || 'Could not create student.'
            )
          );
        }
      }

      if (createdUsers.length === 0) {
        const detail = failures.slice(0, 3).join('\n');

        setStudentImportStatus({
          state: 'error',
          fileName: file.name,
          fileSize: file.size,
          message: 'No student accounts were imported.',
          detail,
        });
        setNotice(detail || 'No student accounts were imported.');
        return;
      }

      const importMessage =
        failures.length > 0
          ? `${createdUsers.length} imported, ${failures.length} failed.`
          : `${createdUsers.length} student account${
              createdUsers.length === 1 ? '' : 's'
            } imported.`;

      setStudentImportStatus({
        state: failures.length > 0 ? 'partial' : 'success',
        fileName: file.name,
        fileSize: file.size,
        message: importMessage,
        detail: failures.slice(0, 3).join('\n'),
      });
      setUsers((currentUsers) => [...createdUsers, ...currentUsers]);
      setRoleFilter('student');
      setStatusFilter('all');
      setQuery('');
      setStudentForm(initialStudentForm);
      setStudentModalOpen(false);
      setNotice(
        failures.length > 0
          ? `${createdUsers.length} student account${
              createdUsers.length === 1 ? '' : 's'
            } imported. ${failures.length} account${
              failures.length === 1 ? '' : 's'
            } failed.`
          : `${createdUsers.length} student account${
              createdUsers.length === 1 ? '' : 's'
            } imported and temporary password email${
              createdUsers.length === 1 ? '' : 's'
            } sent.`
      );
    } catch (error) {
      setStudentImportStatus({
        state: 'error',
        fileName: file.name,
        fileSize: file.size,
        message: 'Could not import this file.',
        detail: error.message || 'Please check the CSV or Excel file and try again.',
      });
      setNotice(error.message || 'Could not import students.');
    }
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

  const studentImportPopupTitle =
    studentImportStatus.state === 'reading'
      ? 'Uploading file'
      : studentImportStatus.state === 'importing'
      ? 'Importing students'
      : studentImportStatus.state === 'success'
      ? 'Students imported'
      : studentImportStatus.state === 'partial'
      ? 'Import finished with notes'
      : 'Student import';

  return (
    <div className="users-page">
      {studentImportStatus.state !== 'idle' && (
        <aside
          className={`student-import-popup is-${studentImportStatus.state}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="student-import-popup-icon">
            {studentImportStatus.state === 'success' ? (
              <FiCheck />
            ) : studentImportStatus.state === 'error' ? (
              <FiX />
            ) : studentImportStatus.state === 'partial' ? (
              <FiFileText />
            ) : (
              <FiClock />
            )}
          </span>
          <div className="student-import-popup-copy">
            <strong>{studentImportPopupTitle}</strong>
            <p>{studentImportStatus.message}</p>
            {studentImportStatus.fileName && (
              <span>
                {studentImportStatus.fileName} -{' '}
                {formatFileSize(studentImportStatus.fileSize)}
              </span>
            )}
            {studentImportStatus.detail && <small>{studentImportStatus.detail}</small>}
          </div>
          {!studentImportBusy && (
            <button
              className="student-import-popup-dismiss"
              type="button"
              onClick={dismissStudentImportPopup}
              aria-label="Dismiss import status"
            >
              <FiX />
            </button>
          )}
        </aside>
      )}

      <div className="users-page-header">
        <div>
          <h1>Admin User Management</h1>
          <p>
            Limited to registered students, approved professors, and archive or restore
            records.
          </p>
        </div>

        <div className="users-header-actions">
          <button
            className="users-create-btn"
            type="button"
            onClick={() => setStudentModalOpen(true)}
          >
            <FiPlus />
            Add Student
          </button>
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
                <dt>Year Level</dt>
                <dd>{selectedUser.yearLevel || 'None'}</dd>
              </div>
              <div>
                <dt>Section</dt>
                <dd>{selectedUser.sectionName || 'None'}</dd>
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

      {studentModalOpen && (
        <div className="users-modal-backdrop" onClick={closeStudentModal}>
          <section
            className="users-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="users-modal-close"
              type="button"
              onClick={closeStudentModal}
              disabled={creatingStudent || studentImportBusy}
              aria-label="Close student form"
            >
              x
            </button>

            <div className="users-modal-profile">
              <span className="users-modal-avatar">
                <FiUser />
              </span>
              <div>
                <h2>Add Student</h2>
                <p>Create or import student accounts with generated credentials.</p>
              </div>
            </div>

            <div className="student-import-panel">
              <div>
                <strong>Bulk Import Students</strong>
                <p>
                  Upload a CSV or Excel file with name, email, student ID, year level,
                  and section columns.
                </p>
              </div>
              <button
                className="users-secondary-btn"
                type="button"
                formNoValidate
                disabled={studentImportBusy || creatingStudent}
                onClick={handleImportStudentsClick}
              >
                <FiUpload />
                Import CSV or Excel
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={STUDENT_IMPORT_ACCEPT}
                hidden
                onChange={handleBulkImport}
              />
            </div>

            <form className="users-student-form" onSubmit={handleCreateStudent}>
              <label>
                Student Name
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={handleStudentFieldChange('name')}
                  disabled={creatingStudent || studentImportBusy}
                  required
                />
              </label>

              <label>
                Student Email
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={handleStudentFieldChange('email')}
                  disabled={creatingStudent || studentImportBusy}
                  required
                />
              </label>

              <label>
                Student ID
                <input
                  type="text"
                  value={studentForm.studentId}
                  onChange={handleStudentFieldChange('studentId')}
                  disabled={creatingStudent || studentImportBusy}
                />
              </label>

              <label>
                Year Level
                <select
                  value={studentForm.yearLevel}
                  onChange={handleStudentFieldChange('yearLevel')}
                  disabled={creatingStudent || studentImportBusy}
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </label>

              <label>
                Section
                <input
                  type="text"
                  value={studentForm.sectionName}
                  onChange={handleStudentFieldChange('sectionName')}
                  placeholder="Example: 1A"
                  disabled={creatingStudent || studentImportBusy}
                />
              </label>

              <button
                className="users-submit-btn"
                type="submit"
                disabled={creatingStudent || studentImportBusy}
              >
                {creatingStudent ? 'Creating Student...' : 'Create Student Account'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
