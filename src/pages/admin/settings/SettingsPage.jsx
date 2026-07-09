import './Settings.css';

export default function SettingsPage() {
  return (
    <div className="admin-page">
      <h1>System Settings</h1>
      <p>Configure system preferences, notifications, and advanced options.</p>
      <div className="settings-grid">
        <div className="setting-card">
          <h3>General</h3>
          <p>Site name, timezone, and language preferences.</p>
        </div>
        <div className="setting-card">
          <h3>Security</h3>
          <p>Password policies, two-factor authentication, and access control.</p>
        </div>
        <div className="setting-card">
          <h3>Notifications</h3>
          <p>Email alerts, system notifications, and notification preferences.</p>
        </div>
        <div className="setting-card">
          <h3>Backup & Restore</h3>
          <p>Database backups, data recovery, and export options.</p>
        </div>
      </div>
    </div>
  );
}
