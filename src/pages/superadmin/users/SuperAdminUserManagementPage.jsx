import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiArchive,
  FiCheck,
  FiClock,
  FiEye,
  FiFileText,
  FiKey,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { API_BASE } from '../../../config';
import '../../admin/users/Users.css';

const USER_TABS = [
  { id: 'all', label: 'All Users' },
  { id: 'approvals', label: 'Professor Approvals' },
  { id: 'students', label: 'Students' },
  { id: 'professors', label: 'Professors' },
  { id: 'admins', label: 'Administrators' },
  { id: 'archived', label: 'Archived Accounts' },
];

const VALID_USER_TAB_IDS = USER_TABS.map((tab) => tab.id);

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'temporary', label: 'Temporary account' },
  { value: 'permanent', label: 'Permanent account' },
];

const TEMPORARY_DURATION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: '365', label: '1 year' },
];

const initialStudentForm = {
  name: '',
  email: '',
  studentId: '',
  yearLevel: '',
  sectionName: '',
  accountType: 'temporary',
  temporaryDurationDays: '30',
};

const initialAdminForm = {
  name: '',
  email: '',
  accountType: 'temporary',
  temporaryDurationDays: '30',
};

const initialProfessorForm = {
  name: '',
  email: '',
  facultyId: '',
  department: '',
  employmentProof: '',
  accountType: 'temporary',
  temporaryDurationDays: '30',
};

const STUDENT_IMPORT_ACCEPT =
  '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const demoUsers = [
  {
    id: 1,
    name: 'Meiko Santos',
    email: 'meiko@puffybrain.test',
    role: 'student',
    status: 'Active',
    joined: '2026-07-01',
  },
  {
    id: 2,
    name: 'Ashborn Reyes',
    email: 'ashborn@puffybrain.test',
    role: 'professor',
    status: 'Pending',
    verificationStatus: 'pending',
    professorFacultyId: 'FAC-2026-011',
    professorDepartment: 'Computer Studies',
    professorEmploymentProof: 'Employment certificate pending review',
    joined: '2026-06-21',
  },
  {
    id: 3,
    name: 'Admin Meii',
    email: 'admin@puffybrain.test',
    role: 'admin',
    status: 'Active',
    joined: '2026-06-15',
  },
];

function getRoleGroup(role) {
  const value = String(role || '').toLowerCase();
  return value === 'super_admin' || value === 'admin' ? 'admin' : value;
}

function isTemporaryExpired(user) {
  const isTemporary =
    user.isTemporary === true ||
    user.is_temporary === 1 ||
    user.is_temporary === true;
  const expiresAt =
    user.temporaryExpiresAt ||
    user.temporary_expires_at ||
    user.expiresAt ||
    user.expires_at;

  if (!isTemporary || !expiresAt) return false;

  const date = new Date(expiresAt);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function getStatusFromUser(user) {
  const archived =
    user.isArchived === true ||
    user.is_archived === 1 ||
    user.is_archived === true ||
    user.status === 'Archived';

  if (archived) return 'Archived';
  if (isTemporaryExpired(user)) return 'Expired';

  const verificationStatus = String(
    user.verificationStatus || user.verification_status || ''
  ).toLowerCase();

  if (user.role === 'professor' && verificationStatus === 'pending') {
    return 'Pending';
  }
  if (verificationStatus === 'declined') return 'Declined';

  return user.status || 'Active';
}

function normalizeUser(user) {
  const displayName =
    user.name || user.displayName || user.display_name || user.username || 'Unnamed User';
  const verificationStatus =
    user.verificationStatus || user.verification_status || 'approved';
  const isTemporary =
    user.isTemporary === true ||
    user.is_temporary === 1 ||
    user.is_temporary === true;
  const temporaryExpiresAt =
    user.temporaryExpiresAt ||
    user.temporary_expires_at ||
    user.expiresAt ||
    user.expires_at ||
    '';
  const temporaryExpired =
    user.temporaryExpired === true ||
    user.temporary_expired === 1 ||
    user.temporary_expired === true ||
    isTemporaryExpired(user);

  return {
    id: user.id || user.userId || user.user_id || user.UserID || displayName,
    name: displayName,
    email: user.email || 'No email found',
    role: user.role || 'student',
    status: getStatusFromUser(user),
    verificationStatus,
    joined: user.joined || user.created_at || user.createdAt || '',
    studentId: user.studentId || user.student_id || '',
    professorId: user.professorId || user.professor_id || '',
    professorFacultyId:
      user.professorFacultyId || user.professor_faculty_id || '',
    professorDepartment:
      user.professorDepartment || user.professor_department || '',
    professorEmploymentProof:
      user.professorEmploymentProof || user.professor_employment_proof || '',
    verified:
      user.verified === true ||
      user.is_verified === 1 ||
      user.is_verified === true ||
      user.isVerified === true,
    isArchived:
      user.isArchived === true ||
      user.is_archived === 1 ||
      user.is_archived === true ||
      user.status === 'Archived',
    mustChangePassword:
      user.mustChangePassword === true ||
      user.must_change_password === 1 ||
      user.must_change_password === true,
    isTemporary,
    temporaryExpiresAt,
    temporaryExpired,
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

function getAuthHeaders() {
  const token = localStorage.getItem('puffy-token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getTemporaryPayload(form) {
  const isTemporary = (form.accountType || 'temporary') === 'temporary';

  return {
    isTemporary,
    temporaryDurationDays: isTemporary ? form.temporaryDurationDays || '30' : '',
  };
}

function withTemporaryAccountFields(payload) {
  return {
    ...payload,
    ...getTemporaryPayload(payload),
  };
}

function getAccountSecurityLabel(user) {
  if (user.temporaryExpired) return 'Temporary expired';
  if (user.isTemporary) return `Temporary until ${formatDate(user.temporaryExpiresAt)}`;
  if (user.mustChangePassword) return 'Temporary password';
  return user.verified ? 'Email verified' : 'Email pending';
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function UserAvatar({ user, large = false }) {
  const initials = getInitials(user.name) || '?';
  return <span className={large ? 'users-modal-avatar' : 'users-avatar'}>{initials}</span>;
}

export default function SuperAdminUserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState(demoUsers.map(normalizeUser));
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    return VALID_USER_TAB_IDS.includes(requestedTab) ? requestedTab : 'all';
  });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(initialAdminForm);
  const [professorModalOpen, setProfessorModalOpen] = useState(false);
  const [professorForm, setProfessorForm] = useState(initialProfessorForm);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [credentialResults, setCredentialResults] = useState([]);
  const [busyUserId, setBusyUserId] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);

      if (!response.ok) {
        throw new Error('User API unavailable.');
      }

      const data = await response.json();
      const nextUsers = Array.isArray(data.users) ? data.users : [];

      setUsers(nextUsers.map(normalizeUser));
      setNotice('');
    } catch {
      setUsers(demoUsers.map(normalizeUser));
      setNotice('Showing sample user info until the users API is available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');

    if (VALID_USER_TAB_IDS.includes(requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    const requestedAction = searchParams.get('action');

    if (
      requestedAction !== 'add-student' &&
      requestedAction !== 'add-professor' &&
      requestedAction !== 'add-admin'
    ) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');

    if (requestedAction === 'add-student') {
      nextParams.set('tab', 'students');
      setActiveTab('students');
      setStudentModalOpen(true);
    }

    if (requestedAction === 'add-admin') {
      nextParams.set('tab', 'admins');
      setActiveTab('admins');
      setAdminModalOpen(true);
    }

    if (requestedAction === 'add-professor') {
      nextParams.set('tab', 'professors');
      setActiveTab('professors');
      setProfessorModalOpen(true);
    }

    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleTabChange = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');

    if (tabId === 'all') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tabId);
    }

    setActiveTab(tabId);
    setSearchParams(nextParams);
  };

  const userGroups = useMemo(() => {
    const all = users;
    const approvals = users.filter((user) => user.role === 'professor');
    const students = users.filter((user) => user.role === 'student');
    const professors = users.filter(
      (user) =>
        user.role === 'professor' &&
        String(user.verificationStatus).toLowerCase() === 'approved'
    );
    const admins = users.filter((user) => user.role === 'admin');
    const archived = users.filter((user) => user.isArchived);

    return { all, approvals, students, professors, admins, archived };
  }, [users]);

  const visibleUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const tabUsers = userGroups[activeTab] || userGroups.all;

    return tabUsers.filter((user) => {
      if (!search) return true;

      return [
        user.name,
        user.email,
        user.id,
        user.studentId,
        user.professorFacultyId,
        user.professorDepartment,
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [activeTab, query, userGroups]);

  const stats = useMemo(
    () => [
      { label: 'All Users', value: users.length, icon: FiUsers },
      { label: 'Temporary Accounts', value: users.filter((user) => user.isTemporary).length, icon: FiClock },
      { label: 'Students', value: userGroups.students.length, icon: FiUser },
      { label: 'Administrators', value: userGroups.admins.length, icon: FiShield },
    ],
    [userGroups, users.length]
  );

  const updateUserInList = (nextUser) => {
    const normalized = normalizeUser(nextUser);
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === normalized.id ? normalized : user))
    );
    setSelectedUser((currentUser) =>
      currentUser && currentUser.id === normalized.id ? normalized : currentUser
    );
  };

  const removeUserFromList = (userId) => {
    setUsers((currentUsers) =>
      currentUsers.filter((user) => Number(user.id) !== Number(userId))
    );
    setSelectedUser(null);
  };

  const renderAccountTypeFields = (form, setForm) => (
    <>
      <label>
        Account Type
        <select
          value={form.accountType}
          onChange={(event) =>
            setForm((currentForm) => ({
              ...currentForm,
              accountType: event.target.value,
            }))
          }
        >
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {form.accountType === 'temporary' && (
        <label>
          Expires After
          <select
            value={form.temporaryDurationDays}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                temporaryDurationDays: event.target.value,
              }))
            }
          >
            {TEMPORARY_DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );

  const handleProfessorDecision = async (user, status) => {
    try {
      setBusyUserId(`${user.id}-${status}`);
      const response = await fetch(`${API_BASE}/users/${user.id}/registration`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not update registration.');
      }

      updateUserInList(data.user);
      setNotice(data.message);
    } catch (error) {
      setNotice(error.message || 'Could not update registration.');
    } finally {
      setBusyUserId('');
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

  const handleResetCredentials = async (user) => {
    try {
      setBusyUserId(`${user.id}-credentials`);
      const response = await fetch(`${API_BASE}/users/${user.id}/reset-credentials`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not generate credentials.');
      }

      setCredentialResults([
        {
          name: user.name,
          email: data.email || user.email,
          temporaryPassword: data.temporaryPassword,
          temporaryExpiresAt: user.temporaryExpiresAt,
        },
      ]);
      setNotice('Temporary credentials generated.');
    } catch (error) {
      setNotice(error.message || 'Could not generate credentials.');
    } finally {
      setBusyUserId('');
    }
  };

  const handlePermanentRemove = async (user) => {
    const ok = window.confirm(`Permanently remove ${user.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      setBusyUserId(`${user.id}-delete`);
      const response = await fetch(`${API_BASE}/users/${user.id}/archived`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not remove account.');
      }

      removeUserFromList(user.id);
      setNotice(data.message);
    } catch (error) {
      setNotice(error.message || 'Could not remove account.');
    } finally {
      setBusyUserId('');
    }
  };

  const createStudent = async (payload) => {
    const response = await fetch(`${API_BASE}/users/student`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(withTemporaryAccountFields(payload)),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Could not create student account.');
    }

    return data;
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    try {
      const data = await createStudent(studentForm);
      setUsers((currentUsers) => [normalizeUser(data.user), ...currentUsers]);
      setCredentialResults([
        {
          name: data.user.name,
          email: data.user.email,
          temporaryPassword: data.temporaryPassword,
          temporaryExpiresAt: data.user.temporaryExpiresAt,
        },
      ]);
      setStudentForm(initialStudentForm);
      setStudentModalOpen(false);
      setNotice(data.user.isTemporary ? 'Temporary student account created.' : 'Student account created.');
    } catch (error) {
      setNotice(error.message || 'Could not create student account.');
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/users/admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(withTemporaryAccountFields(adminForm)),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not create admin account.');
      }

      setUsers((currentUsers) => [normalizeUser(data.user), ...currentUsers]);
      setCredentialResults([
        {
          name: data.user.name,
          email: data.user.email,
          temporaryPassword: data.temporaryPassword,
          temporaryExpiresAt: data.user.temporaryExpiresAt,
        },
      ]);
      setAdminForm(initialAdminForm);
      setAdminModalOpen(false);
      setNotice(data.user.isTemporary ? 'Temporary administrator account created.' : 'Administrator account created.');
    } catch (error) {
      setNotice(error.message || 'Could not create admin account.');
    }
  };

  const handleCreateProfessor = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/users/professor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(withTemporaryAccountFields(professorForm)),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not create professor account.');
      }

      setUsers((currentUsers) => [normalizeUser(data.user), ...currentUsers]);
      setCredentialResults([
        {
          name: data.user.name,
          email: data.user.email,
          temporaryPassword: data.temporaryPassword,
          temporaryExpiresAt: data.user.temporaryExpiresAt,
        },
      ]);
      setProfessorForm(initialProfessorForm);
      setProfessorModalOpen(false);
      setNotice(data.user.isTemporary ? 'Temporary professor account created.' : 'Professor account created.');
    } catch (error) {
      setNotice(error.message || 'Could not create professor account.');
    }
  };

  const normalizeStudentImportRows = (rows) => {
    const cleanedRows = rows
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some(Boolean));

    if (cleanedRows.length === 0) return [];

    const header = cleanedRows[0].map((cell) => cell.toLowerCase());
    const hasHeader = header.includes('email') || header.includes('name');
    const dataRows = hasHeader ? cleanedRows.slice(1) : cleanedRows;
    const headerCells = hasHeader ? header : [];

    const indexOf = (names, fallback) => {
      const index = headerCells.findIndex((cell) => names.includes(cell));
      return index >= 0 ? index : fallback;
    };

    return dataRows
      .map((row) => ({
        name: row[indexOf(['name', 'full name', 'student name'], 0)] || '',
        email: row[indexOf(['email', 'email address'], 1)] || '',
        studentId: row[indexOf(['studentid', 'student id', 'student_id'], 2)] || '',
        yearLevel: row[indexOf(['year', 'year level', 'yearlevel'], 3)] || '',
        sectionName: row[indexOf(['section', 'section name', 'sectionname'], 4)] || '',
      }))
      .filter((student) => student.name || student.email || student.studentId);
  };

  const parseStudentCsv = (text) => {
    const rows = text
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(','));

    return normalizeStudentImportRows(rows);
  };

  const parseStudentImportFile = async (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx') {
      const readXlsxFile = (await import('read-excel-file/browser')).default;
      return normalizeStudentImportRows(await readXlsxFile(file));
    }

    return parseStudentCsv(await file.text());
  };

  const handleBulkImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const students = await parseStudentImportFile(file);

      if (students.length === 0) {
        setNotice('Import file has no student records.');
        return;
      }

      const createdUsers = [];
      const credentials = [];

      for (const student of students) {
        const data = await createStudent(student);
        createdUsers.push(normalizeUser(data.user));
        credentials.push({
          name: data.user.name,
          email: data.user.email,
          temporaryPassword: data.temporaryPassword,
          temporaryExpiresAt: data.user.temporaryExpiresAt,
        });
      }

      setUsers((currentUsers) => [...createdUsers, ...currentUsers]);
      setCredentialResults(credentials);
      setStudentModalOpen(false);
      setNotice(`${createdUsers.length} student account${createdUsers.length === 1 ? '' : 's'} imported.`);
    } catch (error) {
      setNotice(error.message || 'Could not import students.');
    }
  };

  const copyCredentials = async () => {
    const text = credentialResults
      .map((item) => {
        const expiry = item.temporaryExpiresAt
          ? `expires ${formatDate(item.temporaryExpiresAt)}`
          : 'permanent account';

        return `${item.name}, ${item.email}, ${item.temporaryPassword}, ${expiry}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setNotice('Temporary credentials copied.');
    } catch {
      setNotice('Temporary credentials are ready to copy.');
    }
  };

  const renderProof = (user) => {
    const proof = user.professorEmploymentProof;
    if (!proof) return 'Not submitted';

    if (isUrl(proof)) {
      return (
        <a href={proof} target="_blank" rel="noreferrer">
          View proof
        </a>
      );
    }

    return proof;
  };

  const renderApprovalActions = (user) => (
    <div className="users-action-group">
      <button
        className="users-icon-btn users-view-btn"
        type="button"
        onClick={() => setSelectedUser(user)}
        title="Review professor"
      >
        <FiEye />
        <span>View</span>
      </button>
      <button
        className="users-icon-btn users-approve-btn"
        type="button"
        onClick={() => handleProfessorDecision(user, 'approved')}
        disabled={busyUserId === `${user.id}-approved`}
        title="Approve professor"
      >
        <FiCheck />
        <span>Approve</span>
      </button>
      <button
        className="users-icon-btn users-decline-btn"
        type="button"
        onClick={() => handleProfessorDecision(user, 'declined')}
        disabled={busyUserId === `${user.id}-declined`}
        title="Decline professor"
      >
        <FiX />
        <span>Decline</span>
      </button>
    </div>
  );

  const renderGenericRows = (rows) =>
    rows.map((user) => {
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
          <td><span className="users-role">{titleCase(user.role)}</span></td>
          <td><span className={`users-status is-${status}`}>{titleCase(user.status)}</span></td>
          <td>{formatDate(user.joined)}</td>
          <td>{getAccountSecurityLabel(user)}</td>
          <td>
            <div className="users-action-group">
              <button className="users-icon-btn users-view-btn" type="button" onClick={() => setSelectedUser(user)} title="Review account">
                <FiEye />
                <span>View</span>
              </button>
              {user.role !== 'super_admin' && (
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
              )}
            </div>
          </td>
        </tr>
      );
    });

  const renderUserTable = () => {
    if (loading) {
      return (
        <tbody>
          <tr><td className="users-empty" colSpan="8">Loading users...</td></tr>
        </tbody>
      );
    }

    if (visibleUsers.length === 0) {
      return (
        <tbody>
          <tr><td className="users-empty" colSpan="8">No records found.</td></tr>
        </tbody>
      );
    }

    if (activeTab === 'approvals') {
      return (
        <tbody>
          {visibleUsers.map((user) => (
            <tr key={user.id}>
              <td><strong>{user.name}</strong></td>
              <td>{user.email}</td>
              <td>{user.professorFacultyId || 'Not submitted'}</td>
              <td>{user.professorDepartment || 'Not submitted'}</td>
              <td>{renderProof(user)}</td>
              <td>{formatDate(user.joined)}</td>
              <td><span className={`users-status is-${String(user.status).toLowerCase()}`}>{titleCase(user.status)}</span></td>
              <td>{renderApprovalActions(user)}</td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (activeTab === 'students') {
      return (
        <tbody>
          {visibleUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="users-person">
                  <UserAvatar user={user} />
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.studentId || 'No student ID'}</small>
                  </div>
                </div>
              </td>
              <td>{user.email}</td>
              <td>{getAccountSecurityLabel(user)}</td>
              <td><span className={`users-status is-${String(user.status).toLowerCase()}`}>{titleCase(user.status)}</span></td>
              <td>{formatDate(user.joined)}</td>
              <td>
                <div className="users-action-group">
                  <button className="users-icon-btn users-view-btn" type="button" onClick={() => setSelectedUser(user)} title="Review student">
                    <FiEye />
                    <span>View</span>
                  </button>
                  <button
                    className="users-icon-btn users-reset-btn"
                    type="button"
                    onClick={() => handleResetCredentials(user)}
                    disabled={busyUserId === `${user.id}-credentials`}
                    title="Resend account credentials"
                  >
                    <FiRefreshCw />
                    <span>Reset</span>
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
          ))}
        </tbody>
      );
    }

    if (activeTab === 'archived') {
      return (
        <tbody>
          {visibleUsers.map((user) => (
            <tr key={user.id}>
              <td><strong>{user.name}</strong></td>
              <td>{user.email}</td>
              <td>{titleCase(user.role)}</td>
              <td>{formatDate(user.joined)}</td>
              <td>
                <div className="users-action-group">
                  <button className="users-icon-btn users-archive-btn" type="button" onClick={() => handleArchiveToggle(user)} title="Restore account">
                    <FiArchive />
                    <span>Restore</span>
                  </button>
                  <button className="users-icon-btn users-decline-btn" type="button" onClick={() => handlePermanentRemove(user)} title="Permanently remove">
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    return <tbody>{renderGenericRows(visibleUsers)}</tbody>;
  };

  const tableHeaders =
    activeTab === 'approvals'
      ? ['Full Name', 'Email Address', 'Employee or Faculty ID', 'Department', 'Submitted Proof', 'Registration Date', 'Status', 'Actions']
      : activeTab === 'students'
      ? ['Student', 'Email', 'Credentials', 'Status', 'Registered', 'Actions']
      : activeTab === 'archived'
      ? ['Account', 'Email', 'Role', 'Registration Date', 'Actions']
      : ['User', 'Email', 'Role', 'Status', 'Joined', 'Security', 'Action'];

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage accounts, professor approvals, student credentials, and archived users.</p>
        </div>

        <div className="users-header-actions">
          <button className="users-create-btn" type="button" onClick={() => setAdminModalOpen(true)}>
            <FiShield />
            Add Admin
          </button>
          <button className="users-create-btn" type="button" onClick={() => setProfessorModalOpen(true)}>
            <FiFileText />
            Add Professor
          </button>
          <button className="users-create-btn" type="button" onClick={() => setStudentModalOpen(true)}>
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
              <div className="users-stat-icon"><Icon /></div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          );
        })}
      </div>

      <section className="users-panel">
        <div className="user-management-tabs" aria-label="User management sections">
          {USER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="users-panel-top">
          <div>
            <h2>{USER_TABS.find((tab) => tab.id === activeTab)?.label}</h2>
            <p>{visibleUsers.length} record{visibleUsers.length === 1 ? '' : 's'} shown</p>
          </div>

          <label className="users-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {notice && <div className="users-notice">{notice}</div>}

        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>{tableHeaders.map((header) => <th key={header}>{header}</th>)}</tr>
            </thead>
            {renderUserTable()}
          </table>
        </div>
      </section>

      {credentialResults.length > 0 && (
        <div className="users-modal-backdrop" onClick={() => setCredentialResults([])}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="users-modal-close" type="button" onClick={() => setCredentialResults([])} aria-label="Close credentials">
              x
            </button>
            <div className="users-modal-profile">
              <span className="users-modal-avatar"><FiKey /></span>
              <div>
                <h2>Temporary Credentials</h2>
                <p>Share these with users. Temporary accounts stop working after their expiry date.</p>
              </div>
            </div>

            <div className="credential-result-list">
              {credentialResults.map((item) => (
                <div className="users-temp-box" key={`${item.email}-${item.temporaryPassword}`}>
                  <span>{item.name} - {item.email}</span>
                  <code>{item.temporaryPassword}</code>
                  <span>
                    {item.temporaryExpiresAt
                      ? `Temporary account expires ${formatDate(item.temporaryExpiresAt)}`
                      : 'Permanent account'}
                  </span>
                </div>
              ))}
            </div>

            <button className="users-submit-btn" type="button" onClick={copyCredentials}>
              Copy Credentials
            </button>
          </section>
        </div>
      )}

      {adminModalOpen && (
        <div className="users-modal-backdrop" onClick={() => setAdminModalOpen(false)}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="users-modal-close" type="button" onClick={() => setAdminModalOpen(false)} aria-label="Close admin form">
              x
            </button>
            <div className="users-modal-profile">
              <span className="users-modal-avatar"><FiShield /></span>
              <div>
                <h2>Add Administrator</h2>
                <p>Create an admin account with generated credentials and optional expiry.</p>
              </div>
            </div>
            <form className="users-student-form" onSubmit={handleCreateAdmin}>
              <label>
                Admin Name
                <input type="text" value={adminForm.name} onChange={(event) => setAdminForm((form) => ({ ...form, name: event.target.value }))} required />
              </label>
              <label>
                Admin Email
                <input type="email" value={adminForm.email} onChange={(event) => setAdminForm((form) => ({ ...form, email: event.target.value }))} required />
              </label>
              {renderAccountTypeFields(adminForm, setAdminForm)}
              <button className="users-submit-btn" type="submit">Create Admin Account</button>
            </form>
          </section>
        </div>
      )}

      {professorModalOpen && (
        <div className="users-modal-backdrop" onClick={() => setProfessorModalOpen(false)}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="users-modal-close" type="button" onClick={() => setProfessorModalOpen(false)} aria-label="Close professor form">
              x
            </button>
            <div className="users-modal-profile">
              <span className="users-modal-avatar"><FiFileText /></span>
              <div>
                <h2>Add Professor</h2>
                <p>Create an approved professor account with generated credentials.</p>
              </div>
            </div>
            <form className="users-student-form" onSubmit={handleCreateProfessor}>
              <label>
                Professor Name
                <input type="text" value={professorForm.name} onChange={(event) => setProfessorForm((form) => ({ ...form, name: event.target.value }))} required />
              </label>
              <label>
                Professor Email
                <input type="email" value={professorForm.email} onChange={(event) => setProfessorForm((form) => ({ ...form, email: event.target.value }))} required />
              </label>
              <label>
                Faculty ID
                <input type="text" value={professorForm.facultyId} onChange={(event) => setProfessorForm((form) => ({ ...form, facultyId: event.target.value }))} />
              </label>
              <label>
                Department
                <input type="text" value={professorForm.department} onChange={(event) => setProfessorForm((form) => ({ ...form, department: event.target.value }))} />
              </label>
              <label>
                Employment Proof
                <input type="text" value={professorForm.employmentProof} onChange={(event) => setProfessorForm((form) => ({ ...form, employmentProof: event.target.value }))} placeholder="URL or note" />
              </label>
              {renderAccountTypeFields(professorForm, setProfessorForm)}
              <button className="users-submit-btn" type="submit">Create Professor Account</button>
            </form>
          </section>
        </div>
      )}

      {studentModalOpen && (
        <div className="users-modal-backdrop" onClick={() => setStudentModalOpen(false)}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="users-modal-close" type="button" onClick={() => setStudentModalOpen(false)} aria-label="Close student form">
              x
            </button>
            <div className="users-modal-profile">
              <span className="users-modal-avatar"><FiUser /></span>
              <div>
                <h2>Add Student</h2>
                <p>Create a student account with generated credentials and optional expiry.</p>
              </div>
            </div>
            <div className="student-import-panel">
              <div>
                <strong>Bulk Import Students</strong>
                <p>Upload a CSV or Excel file with name, email, student ID, year level, and section columns.</p>
              </div>
              <button className="users-secondary-btn" type="button" onClick={() => fileInputRef.current?.click()}>
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
                <input type="text" value={studentForm.name} onChange={(event) => setStudentForm((form) => ({ ...form, name: event.target.value }))} required />
              </label>
              <label>
                Student Email
                <input type="email" value={studentForm.email} onChange={(event) => setStudentForm((form) => ({ ...form, email: event.target.value }))} required />
              </label>
              <label>
                Student ID
                <input type="text" value={studentForm.studentId} onChange={(event) => setStudentForm((form) => ({ ...form, studentId: event.target.value }))} />
              </label>
              <label>
                Year Level
                <select value={studentForm.yearLevel} onChange={(event) => setStudentForm((form) => ({ ...form, yearLevel: event.target.value }))}>
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </label>
              <label>
                Section
                <input type="text" value={studentForm.sectionName} onChange={(event) => setStudentForm((form) => ({ ...form, sectionName: event.target.value }))} placeholder="Example: 1A" />
              </label>
              {renderAccountTypeFields(studentForm, setStudentForm)}
              <button className="users-submit-btn" type="submit">Create Student Account</button>
            </form>
          </section>
        </div>
      )}

      {selectedUser && (
        <div className="users-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <section className="users-modal" onClick={(event) => event.stopPropagation()}>
            <button className="users-modal-close" type="button" onClick={() => setSelectedUser(null)} aria-label="Close user details">
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
              <div><dt>User ID</dt><dd>{selectedUser.id}</dd></div>
              <div><dt>Role</dt><dd>{titleCase(selectedUser.role)}</dd></div>
              <div><dt>Status</dt><dd>{titleCase(selectedUser.status)}</dd></div>
              <div><dt>Registered</dt><dd>{formatDate(selectedUser.joined)}</dd></div>
              <div><dt>Faculty ID</dt><dd>{selectedUser.professorFacultyId || 'None'}</dd></div>
              <div><dt>Department</dt><dd>{selectedUser.professorDepartment || 'None'}</dd></div>
              <div><dt>Proof</dt><dd>{renderProof(selectedUser)}</dd></div>
              <div><dt>Account Type</dt><dd>{selectedUser.isTemporary ? 'Temporary' : 'Permanent'}</dd></div>
              <div><dt>Expires</dt><dd>{selectedUser.isTemporary ? formatDate(selectedUser.temporaryExpiresAt) : 'Never'}</dd></div>
              <div><dt>Password</dt><dd>{selectedUser.mustChangePassword ? 'Temporary' : 'User managed'}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
