import './users/Users.css';

const adminCapabilities = [
  'Manage approved professors and registered students',
  'Manage courses',
  'Manage learning modules',
  'Manage quiz modes',
  'Manage course quizzes',
  'Manage notifications and announcements',
  'Monitor reports and system statistics',
  'View user activity',
  'Archive or restore records',
];

export default function AdminHome() {
  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Course operations, learning content, notifications, reports, and approved users.</p>

      <div className="users-stat-grid" style={{ marginTop: 24 }}>
        {adminCapabilities.map((capability) => (
          <div className="users-stat-card" key={capability}>
            <span>Admin</span>
            <strong style={{ fontSize: 15, lineHeight: 1.35 }}>{capability}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
