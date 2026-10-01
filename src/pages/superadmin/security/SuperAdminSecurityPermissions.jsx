import { Link } from 'react-router-dom';

import {
  FiClock,
  FiLock,
  FiRefreshCw,
  FiShield,
} from 'react-icons/fi';

import './SuperAdminSecurityPermissions.css';


/* =====================================================
   SECURITY POLICY CARDS
===================================================== */

const securityPolicyCards = [
  {
    label: 'Temporary Password Reset',
    value: 'Required',
    status: 'Active',
    icon: FiRefreshCw,
  },
  {
    label: 'Professor Approval',
    value: 'Super Admin review',
    status: 'Protected',
    icon: FiShield,
  },
  {
    label: 'Sensitive Actions',
    value: 'Audit logged',
    status: 'Tracked',
    icon: FiLock,
  },
  {
    label: 'Registration Requests',
    value: 'Proof required',
    status: 'Required',
    icon: FiClock,
  },
];


/* =====================================================
   ROLE ACCESS MATRIX
===================================================== */

const roleAccessRows = [
  {
    role: 'Super Admin',
    access: 'Full access',
    controls:
      'Administrators, approvals, roles, backup, audit logs, system settings',
  },
  {
    role: 'Admin',
    access: 'Operational access',
    controls:
      'Approved professors, students, courses, modules, reports, notifications',
  },
  {
    role: 'Professor',
    access: 'Course access',
    controls:
      'Owned courses, modules, quizzes, enrolled students, class performance',
  },
  {
    role: 'Student',
    access: 'Learning access',
    controls:
      'Enrolled courses, study modules, quizzes, progress, announcements',
  },
];


/* =====================================================
   PERMISSION AUDIT
===================================================== */

const permissionAuditRows = [
  {
    event: 'Professor approval rule updated',
    owner: 'Super Admin',
    scope: 'Registration approval',
    time: 'Today',
  },
  {
    event:
      'Student temporary password policy enforced',
    owner: 'System',
    scope: 'Account requirements',
    time: 'Today',
  },
  {
    event:
      'Administrator account management restricted',
    owner: 'Super Admin',
    scope: 'Role access',
    time: 'Yesterday',
  },
];


/* =====================================================
   PAGE
===================================================== */

export default function SuperAdminSecurityPermissions() {
  return (
    <div className="admin-page feature-page security-permissions-page">

      {/* =============================================
          PAGE HEADER
      ============================================== */}

      <div className="feature-page-top">
        <div>
          <h1>Security and Permissions</h1>

          <p>
            Manage role access, account requirements,
            password policies, and sensitive actions.
          </p>
        </div>

        <Link
          className="secondary-feature-btn security-log-link"
          to="/super-admin/audit-logs"
        >
          View Audit Logs
        </Link>
      </div>


      {/* =============================================
          SECURITY POLICY OVERVIEW
      ============================================== */}

      <div className="security-policy-grid">
        {securityPolicyCards.map((card) => {
          const Icon = card.icon;

          return (
            <section
              className="security-policy-card"
              key={card.label}
            >
              <span>
                <Icon />
              </span>

              <small>{card.status}</small>

              <h2>{card.label}</h2>

              <p>{card.value}</p>
            </section>
          );
        })}
      </div>


      {/* =============================================
          ROLE ACCESS MATRIX
      ============================================== */}

      <section className="feature-card security-role-card">
        <div className="feature-card-body">

          <div className="feature-section-top">
            <div>
              <h2>Role Access Matrix</h2>

              <p>
                Clear ownership boundaries for each
                PuffyBrain role.
              </p>
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

                    <td>
                      <span>{row.access}</span>
                    </td>

                    <td>{row.controls}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>
      </section>


      {/* =============================================
          PERMISSION AUDIT
      ============================================== */}

      <section className="feature-card security-role-card">
        <div className="feature-card-body">

          <div className="feature-section-top">
            <div>
              <h2>Permission Audit</h2>

              <p>
                Recent sensitive actions and
                permission-related records.
              </p>
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