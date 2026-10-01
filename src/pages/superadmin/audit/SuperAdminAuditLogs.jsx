import { useMemo, useState } from 'react';

import {
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShield,
} from 'react-icons/fi';

import './SuperAdminAuditLogs.css';


/* =====================================================
   AUDIT LOG DATA
===================================================== */

const auditRows = [
  {
    id: 'LOG-1042',
    timestamp: '2026-07-14 10:42 AM',
    user: 'Super Admin',
    role: 'Super Admin',
    category: 'Security',
    action: 'Updated password policy',
    target: 'System Settings',
    ip: '192.168.1.10',
    status: 'Success',
  },
  {
    id: 'LOG-1041',
    timestamp: '2026-07-14 10:18 AM',
    user: 'Admin Meii',
    role: 'Administrator',
    category: 'User Management',
    action: 'Created student account',
    target: 'Meiko Santos',
    ip: '192.168.1.22',
    status: 'Success',
  },
  {
    id: 'LOG-1040',
    timestamp: '2026-07-14 09:57 AM',
    user: 'Super Admin',
    role: 'Super Admin',
    category: 'Professor Approval',
    action: 'Approved professor registration',
    target: 'Dr. Mina Cruz',
    ip: '192.168.1.10',
    status: 'Success',
  },
  {
    id: 'LOG-1039',
    timestamp: '2026-07-14 09:32 AM',
    user: 'System',
    role: 'System',
    category: 'Backup',
    action: 'Completed scheduled database backup',
    target: 'puffybrain_backup_0714.sql',
    ip: 'Localhost',
    status: 'Success',
  },
  {
    id: 'LOG-1038',
    timestamp: '2026-07-14 08:45 AM',
    user: 'Unknown',
    role: 'Guest',
    category: 'Authentication',
    action: 'Failed login attempt',
    target: 'admin@puffybrain.test',
    ip: '192.168.1.48',
    status: 'Failed',
  },
  {
    id: 'LOG-1037',
    timestamp: '2026-07-13 05:21 PM',
    user: 'Super Admin',
    role: 'Super Admin',
    category: 'Course Management',
    action: 'Archived course',
    target: 'Data Structures Review',
    ip: '192.168.1.10',
    status: 'Success',
  },
  {
    id: 'LOG-1036',
    timestamp: '2026-07-13 04:08 PM',
    user: 'Admin Meii',
    role: 'Administrator',
    category: 'Announcement',
    action: 'Published announcement',
    target: 'Scheduled maintenance',
    ip: '192.168.1.22',
    status: 'Success',
  },
  {
    id: 'LOG-1035',
    timestamp: '2026-07-13 03:44 PM',
    user: 'Super Admin',
    role: 'Super Admin',
    category: 'Permissions',
    action: 'Changed administrator permission',
    target: 'Course Management',
    ip: '192.168.1.10',
    status: 'Success',
  },
  {
    id: 'LOG-1034',
    timestamp: '2026-07-13 02:17 PM',
    user: 'Admin Meii',
    role: 'Administrator',
    category: 'User Management',
    action: 'Archived student account',
    target: 'Kei Navarro',
    ip: '192.168.1.22',
    status: 'Success',
  },
  {
    id: 'LOG-1033',
    timestamp: '2026-07-13 01:52 PM',
    user: 'System',
    role: 'System',
    category: 'Security',
    action: 'Blocked repeated login attempts',
    target: '192.168.1.61',
    ip: 'Localhost',
    status: 'Warning',
  },
  {
    id: 'LOG-1032',
    timestamp: '2026-07-13 11:31 AM',
    user: 'Super Admin',
    role: 'Super Admin',
    category: 'System Settings',
    action: 'Updated session timeout',
    target: 'Security Settings',
    ip: '192.168.1.10',
    status: 'Success',
  },
  {
    id: 'LOG-1031',
    timestamp: '2026-07-13 10:05 AM',
    user: 'Admin Meii',
    role: 'Administrator',
    category: 'Course Management',
    action: 'Updated course status',
    target: 'Adaptive Learning Foundations',
    ip: '192.168.1.22',
    status: 'Success',
  },
];


const auditCategories = [
  'All Categories',
  'Authentication',
  'User Management',
  'Professor Approval',
  'Course Management',
  'Announcement',
  'Backup',
  'Security',
  'Permissions',
  'System Settings',
];


const PAGE_SIZE = 7;


/* =====================================================
   AUDIT LOGS PAGE
===================================================== */

export default function SuperAdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());


  /* =====================================================
     FILTERED LOGS
  ===================================================== */

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return auditRows.filter((row) => {
      const matchesCategory =
        category === 'All Categories' ||
        row.category === category;

      const matchesSearch =
        !query ||
        [
          row.id,
          row.user,
          row.role,
          row.category,
          row.action,
          row.target,
          row.ip,
          row.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, category]);


  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / PAGE_SIZE),
  );

  const safePage = Math.min(page, totalPages);

  const visibleLogs = filteredLogs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );


  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = () => {
    setLastRefreshed(new Date());
    setPage(1);
  };


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="admin-page audit-log-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <section className="audit-log-header">
        <div>
          <span className="audit-log-kicker">
            <FiShield aria-hidden="true" />
            Security and accountability
          </span>

          <h1>Audit Logs</h1>

          <p>
            Review important system activities performed
            by administrators, users, and automated
            services.
          </p>
        </div>

        <button
          type="button"
          className="audit-refresh-button"
          onClick={handleRefresh}
        >
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </section>


      {/* ===============================================
          FILTERS
      =============================================== */}

      <section className="audit-toolbar">
        <div className="audit-search">
          <FiSearch aria-hidden="true" />

          <input
            type="search"
            value={searchTerm}
            placeholder="Search audit logs..."
            aria-label="Search audit logs"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
          />
        </div>


        <div className="audit-filter">
          <FiFilter aria-hidden="true" />

          <select
            value={category}
            aria-label="Filter audit logs by category"
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {auditCategories.map((item) => (
              <option
                value={item}
                key={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>


      {/* ===============================================
          SUMMARY
      =============================================== */}

      <div className="audit-result-summary">
        <span>
          Showing <strong>{filteredLogs.length}</strong>{' '}
          audit record
          {filteredLogs.length === 1 ? '' : 's'}
        </span>

        <span>
          Last refreshed:{' '}
          {lastRefreshed.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>


      {/* ===============================================
          TABLE
      =============================================== */}

      <section className="audit-table-card">
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Category</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {visibleLogs.length > 0 ? (
                visibleLogs.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.timestamp}</strong>
                      <span>{row.id}</span>
                    </td>

                    <td>
                      <strong>{row.user}</strong>
                      <span>{row.role}</span>
                    </td>

                    <td>
                      <span className="audit-category">
                        {row.category}
                      </span>
                    </td>

                    <td>{row.action}</td>

                    <td>{row.target}</td>

                    <td>
                      <code>{row.ip}</code>
                    </td>

                    <td>
                      <span
                        className={`audit-status is-${row.status.toLowerCase()}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="audit-empty"
                  >
                    No audit logs match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* =============================================
            PAGINATION
        ============================================== */}

        <div className="audit-pagination">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1),
              )
            }
          >
            Previous
          </button>

          <span>
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1),
              )
            }
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}