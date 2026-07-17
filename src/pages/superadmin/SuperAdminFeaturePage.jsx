import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArchive,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiKey,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import '../admin/Features/AdminFeaturePages.css';

const featureContent = {
  analytics: {
    title: 'System Analytics',
    summary: 'Monitor users, courses, modules, quizzes, reports, and platform activity.',
    items: ['User growth', 'Course activity', 'Quiz usage', 'Learning progress'],
  },
  announcements: {
    title: 'System Announcements',
    summary: 'Send platform-wide messages to admins, instructors, and students.',
    items: ['Global announcements', 'Role-targeted notices', 'Scheduled updates'],
  },
  audit: {
    title: 'Audit Logs',
    summary: 'Review sensitive actions, account changes, login activity, and record updates.',
    items: ['User activity', 'Approval history', 'Archive history', 'Security events'],
  },
  archives: {
    title: 'Archive Center',
    summary: 'Restore or review archived accounts, courses, modules, quizzes, and records.',
    items: ['Archived accounts', 'Archived courses', 'Archived modules', 'Archived records'],
  },
  settings: {
    title: 'System Settings',
    summary: 'Configure security, roles, permissions, and system-level platform settings.',
    items: ['Role permissions', 'Security rules', 'Account policies', 'Platform settings'],
  },
  security: {
    title: 'Security and Permissions',
    summary: 'Manage role access, account requirements, password policies, and sensitive actions.',
    items: ['Role access', 'Password policy', 'Approval rules', 'Permission audit'],
  },
  backup: {
    title: 'Database Backup & Restore',
    summary: 'Create recovery exports and restore system data when needed.',
    items: ['Database backup', 'Restore database', 'Recovery records', 'Export history'],
  },
};

const securitySections = [
  {
    title: 'Role Access',
    icon: FiUsers,
    description:
      'Control what Super Admins, Admins, Professors, and Students can view, create, approve, archive, or restore.',
    items: [
      'Super Admin keeps full system ownership and administrator management access.',
      'Admin manages approved professors, students, courses, modules, reports, and announcements.',
      'Professor access is limited to owned courses, enrolled students, learning materials, and class reports.',
      'Student access is limited to enrolled courses, modules, quizzes, progress, and notifications.',
    ],
  },
  {
    title: 'Password Policy',
    icon: FiKey,
    description:
      'Set sign-in requirements for generated accounts, professor registrations, and administrator accounts.',
    items: [
      'Temporary student passwords require a reset on first login.',
      'Passwords must meet minimum length and complexity requirements.',
      'Failed login attempts are monitored for account protection.',
      'Credential resets are tracked in the permission audit.',
    ],
  },
  {
    title: 'Approval Rules',
    icon: FiUserCheck,
    description:
      'Define how professor registrations, proof of employment, and sensitive account requests are reviewed.',
    items: [
      'Professor accounts remain pending until reviewed by the Super Admin.',
      'Employee or faculty ID and proof of employment are required for review.',
      'Approved professors can access instructor tools after verification.',
      'Declined registrations remain blocked from professor dashboard access.',
    ],
  },
  {
    title: 'Permission Audit',
    icon: FiFileText,
    description:
      'Review sensitive permission changes, security actions, approval decisions, and account recovery activity.',
    items: [
      'Role changes and permission updates are logged.',
      'Professor approvals and declines are stored for accountability.',
      'Archive, restore, backup, and credential reset actions are tracked.',
      'Security events can be reviewed from the audit log page.',
    ],
  },
];

const roleAccessRows = [
  {
    role: 'Super Admin',
    access: 'Full access',
    controls: 'Administrators, approvals, roles, backup, audit logs, system settings',
  },
  {
    role: 'Admin',
    access: 'Operational access',
    controls: 'Approved professors, students, courses, modules, reports, notifications',
  },
  {
    role: 'Professor',
    access: 'Course access',
    controls: 'Owned courses, modules, quizzes, enrolled students, class performance',
  },
  {
    role: 'Student',
    access: 'Learning access',
    controls: 'Enrolled courses, study modules, quizzes, progress, announcements',
  },
];

const securityPolicyCards = [
  { label: 'Temporary Password Reset', value: 'Required', status: 'Active', icon: FiRefreshCw },
  { label: 'Professor Approval', value: 'Super Admin review', status: 'Protected', icon: FiShield },
  { label: 'Sensitive Actions', value: 'Audit logged', status: 'Tracked', icon: FiLock },
  { label: 'Registration Requests', value: 'Proof required', status: 'Required', icon: FiClock },
];

const permissionAuditRows = [
  {
    event: 'Professor approval rule updated',
    owner: 'Super Admin',
    scope: 'Registration approval',
    time: 'Today',
  },
  {
    event: 'Student temporary password policy enforced',
    owner: 'System',
    scope: 'Account requirements',
    time: 'Today',
  },
  {
    event: 'Administrator account management restricted',
    owner: 'Super Admin',
    scope: 'Role access',
    time: 'Yesterday',
  },
];

const auditSummaryCards = [
  { label: 'User Activity Events', value: '128', status: 'Today', icon: FiActivity },
  { label: 'Approval Decisions', value: '12', status: 'This week', icon: FiUserCheck },
  { label: 'Archive Actions', value: '7', status: 'This month', icon: FiArchive },
  { label: 'Security Events', value: '4', status: 'Needs review', icon: FiShield },
];

const auditRows = [
  {
    category: 'User Activity',
    action: 'Administrator created a student account',
    user: 'Admin Meii',
    target: 'Kei Navarro',
    time: 'Today, 9:18 AM',
    status: 'Recorded',
  },
  {
    category: 'Approval History',
    action: 'Professor registration approved',
    user: 'Super Admin',
    target: 'Dr. Mina Cruz',
    time: 'Today, 8:42 AM',
    status: 'Approved',
  },
  {
    category: 'Archive History',
    action: 'Student account archived',
    user: 'Super Admin',
    target: 'Old student record',
    time: 'Yesterday, 5:05 PM',
    status: 'Archived',
  },
  {
    category: 'Security Events',
    action: 'Failed login attempts detected',
    user: 'System',
    target: 'professor@puffybrain.test',
    time: 'Yesterday, 2:31 PM',
    status: 'Needs review',
  },
  {
    category: 'Security Events',
    action: 'Database backup completed',
    user: 'System',
    target: 'PuffyBrain database',
    time: 'Today, 2:00 AM',
    status: 'Completed',
  },
];

const auditFilterOptions = [
  { id: 'all', label: 'All Events' },
  { id: 'User Activity', label: 'User Activity' },
  { id: 'Approval History', label: 'Approvals' },
  { id: 'Archive History', label: 'Archives' },
  { id: 'Security Events', label: 'Security' },
];

function AuditLogsPage({ content }) {
  const [activeAuditFilter, setActiveAuditFilter] = useState('all');
  const filteredAuditRows =
    activeAuditFilter === 'all'
      ? auditRows
      : auditRows.filter((row) => row.category === activeAuditFilter);

  return (
    <div className="admin-page feature-page audit-log-page">
      <div className="feature-page-top">
        <div>
          <h1>{content.title}</h1>
          <p>{content.summary}</p>
        </div>
        <Link className="secondary-feature-btn security-log-link" to="/super-admin/security">
          Security Settings
        </Link>
      </div>

      <div className="security-policy-grid audit-summary-grid">
        {auditSummaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <section className="security-policy-card audit-summary-card" key={card.label}>
              <span><Icon /></span>
              <small>{card.status}</small>
              <h2>{card.label}</h2>
              <p>{card.value}</p>
            </section>
          );
        })}
      </div>

      <section className="feature-card security-role-card audit-events-card">
        <div className="feature-card-body">
          <div className="feature-section-top">
            <div>
              <h2>Audit Event Records</h2>
              <p>Recent sensitive actions, account changes, login activity, and record updates.</p>
            </div>
            <div className="audit-filter-pills" aria-label="Audit log filters">
              {auditFilterOptions.map((filter) => (
                <button
                  aria-pressed={activeAuditFilter === filter.id}
                  className={activeAuditFilter === filter.id ? 'active' : ''}
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveAuditFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="security-table-wrap">
            <table className="security-table audit-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Target</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditRows.length > 0 ? (
                  filteredAuditRows.map((row) => (
                    <tr key={`${row.category}-${row.action}-${row.time}`}>
                      <td>{row.category}</td>
                      <td>{row.action}</td>
                      <td>{row.user}</td>
                      <td>{row.target}</td>
                      <td>{row.time}</td>
                      <td><span>{row.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="feature-empty" colSpan="6">
                      No audit events found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function SecurityPermissionsPage({ content }) {
  return (
    <div className="admin-page feature-page security-permissions-page">
      <div className="feature-page-top">
        <div>
          <h1>{content.title}</h1>
          <p>{content.summary}</p>
        </div>
        <Link className="secondary-feature-btn security-log-link" to="/super-admin/audit-logs">
          View Audit Logs
        </Link>
      </div>

      <div className="security-policy-grid">
        {securityPolicyCards.map((card) => {
          const Icon = card.icon;
          return (
            <section className="security-policy-card" key={card.label}>
              <span><Icon /></span>
              <small>{card.status}</small>
              <h2>{card.label}</h2>
              <p>{card.value}</p>
            </section>
          );
        })}
      </div>

      <div className="security-permission-grid">
        {securitySections.map((section) => {
          const Icon = section.icon;
          return (
            <section className="feature-card security-permission-card" key={section.title}>
              <div className="feature-card-body">
                <div className="security-section-title">
                  <span><Icon /></span>
                  <h2>{section.title}</h2>
                </div>
                <p>{section.description}</p>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>
                      <FiCheckCircle />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      <section className="feature-card security-role-card">
        <div className="feature-card-body">
          <div className="feature-section-top">
            <div>
              <h2>Role Access Matrix</h2>
              <p>Clear ownership boundaries for each PuffyBrain role.</p>
            </div>
          </div>
          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Access Level</th>
                  <th>Allowed Controls</th>
                </tr>
              </thead>
              <tbody>
                {roleAccessRows.map((row) => (
                  <tr key={row.role}>
                    <td>{row.role}</td>
                    <td><span>{row.access}</span></td>
                    <td>{row.controls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="feature-card security-role-card">
        <div className="feature-card-body">
          <div className="feature-section-top">
            <div>
              <h2>Permission Audit</h2>
              <p>Recent sensitive actions and permission-related records.</p>
            </div>
          </div>
          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Performed By</th>
                  <th>Scope</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {permissionAuditRows.map((row) => (
                  <tr key={row.event}>
                    <td>{row.event}</td>
                    <td>{row.owner}</td>
                    <td>{row.scope}</td>
                    <td>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SuperAdminFeaturePage({ type }) {
  const content = featureContent[type] || featureContent.analytics;

  if (type === 'security') {
    return <SecurityPermissionsPage content={content} />;
  }

  if (type === 'audit') {
    return <AuditLogsPage content={content} />;
  }

  return (
    <div className="admin-page feature-page">
      <h1>{content.title}</h1>
      <p>{content.summary}</p>

      <div className="backup-grid">
        {content.items.map((item) => (
          <section className="feature-card" key={item}>
            <div className="feature-card-top" />
            <div className="feature-card-body">
              <h2>{item}</h2>
              <p>{content.summary}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
