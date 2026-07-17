export default function AdminAccountPage() {
  return (
    <div className="admin-page">
      <h1>Admin Profile</h1>
      <p>Review the current administrator account details.</p>

      <div className="settings-grid">
        <div className="setting-card">
          <h3>Profile</h3>
          <p>Admin identity, display name, email, and account information.</p>
        </div>
        <div className="setting-card">
          <h3>Access</h3>
          <p>Operational permissions for courses, users, reports, and notifications.</p>
        </div>
      </div>
    </div>
  );
}
