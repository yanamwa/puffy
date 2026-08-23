import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiClock,
  FiFileText,
  FiLayers,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import '../admin/Features/AdminFeaturePages.css';

const featureContent = {
  analytics: {
    title: 'System Analytics',
    summary: 'Monitor platform performance, user engagement, academic activity, and overall system usage.',
    items: ['User Growth', 'Course Activity', 'Quiz Usage', 'Learning Progress'],
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
  profile: {
    title: 'Super Admin Profile',
    summary: 'Review super administrator identity, access level, and account ownership details.',
    items: ['Profile details', 'Access level', 'Account ownership', 'Security status'],
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

const systemAnalyticsOverview = [
  {
    label: 'Platform Performance',
    value: '98%',
    detail: 'Average uptime this month',
    icon: FiActivity,
  },
  {
    label: 'User Engagement',
    value: '287',
    detail: 'Active users this week',
    icon: FiUsers,
  },
  {
    label: 'Academic Activity',
    value: '41',
    detail: 'Courses with recent learning activity',
    icon: FiBookOpen,
  },
  {
    label: 'System Usage',
    value: '5.6k',
    detail: 'Quiz and module interactions',
    icon: FiBarChart2,
  },
];

const systemAnalyticsSections = [
  {
    title: 'User Growth',
    description:
      'Track student, professor, and administrator registrations, active users, and account trends over time.',
    icon: FiTrendingUp,
    metrics: [
      { label: 'Student Registrations', value: '342', trend: '+18%' },
      { label: 'Professor Registrations', value: '28', trend: '+6%' },
      { label: 'Administrator Accounts', value: '5', trend: 'Stable' },
      { label: 'Active Users', value: '287', trend: '+12%' },
    ],
    bars: [
      { label: 'Students', value: 86 },
      { label: 'Professors', value: 64 },
      { label: 'Administrators', value: 36 },
      { label: 'Active accounts', value: 78 },
    ],
  },
  {
    title: 'Course Activity',
    description:
      'Monitor course creation, enrollments, module distribution, and overall course engagement.',
    icon: FiBookOpen,
    metrics: [
      { label: 'Courses Created', value: '41', trend: '+9%' },
      { label: 'Enrollments', value: '1,248', trend: '+21%' },
      { label: 'Modules Published', value: '176', trend: '+14%' },
      { label: 'Course Engagement', value: '84%', trend: '+7%' },
    ],
    bars: [
      { label: 'Course creation', value: 72 },
      { label: 'Enrollments', value: 92 },
      { label: 'Module distribution', value: 80 },
      { label: 'Engagement', value: 84 },
    ],
  },
  {
    title: 'Quiz Usage',
    description:
      'Analyze quiz attempts, completion rates, average scores, adaptive quiz usage, and assessment trends.',
    icon: FiFileText,
    metrics: [
      { label: 'Quiz Attempts', value: '5,680', trend: '+25%' },
      { label: 'Completion Rate', value: '88%', trend: '+8%' },
      { label: 'Average Score', value: '82%', trend: '+5%' },
      { label: 'Adaptive Quiz Usage', value: '64%', trend: '+16%' },
    ],
    bars: [
      { label: 'Attempts', value: 90 },
      { label: 'Completions', value: 88 },
      { label: 'Average scores', value: 82 },
      { label: 'Adaptive usage', value: 64 },
    ],
  },
  {
    title: 'Learning Progress',
    description:
      'Monitor student achievement, module completion, learning performance, and adaptive learning outcomes.',
    icon: FiTarget,
    metrics: [
      { label: 'Students at Mastery', value: '214', trend: '+11%' },
      { label: 'Module Completion', value: '79%', trend: '+10%' },
      { label: 'Performance Growth', value: '+12%', trend: 'Improving' },
      { label: 'Adaptive Outcomes', value: '91%', trend: '+9%' },
    ],
    bars: [
      { label: 'Achievement', value: 76 },
      { label: 'Module completion', value: 79 },
      { label: 'Performance growth', value: 68 },
      { label: 'Adaptive outcomes', value: 91 },
    ],
  },
];

function SystemAnalyticsPage({ content }) {
  return (
    <div className="admin-page feature-page system-analytics-page">
      <section className="system-analytics-header">
        <div>
          <span className="system-analytics-kicker">
            <FiBarChart2 aria-hidden="true" />
            System overview
          </span>
          <h1>{content.title}</h1>
          <p>{content.summary}</p>
        </div>
      </section>

      <section className="system-analytics-overview" aria-label="System analytics overview">
        {systemAnalyticsOverview.map((item) => {
          const Icon = item.icon;

          return (
            <article className="system-analytics-stat" key={item.label}>
              <span aria-hidden="true">
                <Icon />
              </span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="system-analytics-grid" aria-label="System analytics categories">
        {systemAnalyticsSections.map((section) => {
          const Icon = section.icon;

          return (
            <article className="system-analytics-card" key={section.title}>
              <div className="system-analytics-card-header">
                <span aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="system-analytics-metrics">
                {section.metrics.map((metric) => (
                  <div className="system-analytics-metric" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.trend}</small>
                  </div>
                ))}
              </div>

              <div className="system-analytics-bars">
                {section.bars.map((bar) => (
                  <div className="system-analytics-bar" key={bar.label}>
                    <div>
                      <span>{bar.label}</span>
                      <strong>{bar.value}%</strong>
                    </div>
                    <i>
                      <b style={{ width: `${bar.value}%` }} />
                    </i>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

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
