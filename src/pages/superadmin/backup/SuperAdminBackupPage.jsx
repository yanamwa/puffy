import { useState } from 'react';
import '../../admin/Features/AdminFeaturePages.css';

function downloadBlob(filename, data) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createBackupPayload() {
  const localData = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    localData[key] = localStorage.getItem(key);
  }

  return {
    app: 'PuffyBrain',
    exportedAt: new Date().toISOString(),
    localStorage: localData,
  };
}

export default function BackupPage() {
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const handleBackup = () => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = JSON.stringify(createBackupPayload(), null, 2);

    downloadBlob(`puffybrain-backup-${today}.json`, payload);
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      window.alert('Please choose a backup file first.');
      return;
    }

    const ok = window.confirm('Restore this backup? Current local app data may be overwritten.');
    if (!ok) return;

    try {
      setRestoring(true);
      const text = await restoreFile.text();
      const payload = JSON.parse(text);

      if (!payload || typeof payload.localStorage !== 'object') {
        throw new Error('Invalid PuffyBrain backup file.');
      }

      Object.entries(payload.localStorage).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });

      window.alert('Backup restored successfully. Refresh the page to see restored data.');
      setRestoreFile(null);
    } catch (error) {
      window.alert(error.message || 'Could not restore this backup file.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="admin-page feature-page">
      <h1>Backup & Restore</h1>
      <p>Manage database backups and restore your PuffyBrain system safely.</p>

      <div className="backup-grid">
        <section className="feature-card">
          <div className="feature-card-top" />
          <div className="feature-card-body">
            <h2>Backup Database</h2>
            <p>Download a copy of the current PuffyBrain local app data.</p>
            <button className="primary-feature-btn" type="button" onClick={handleBackup}>
              Download Backup
            </button>
          </div>
        </section>

        <section className="feature-card">
          <div className="feature-card-top" />
          <div className="feature-card-body">
            <h2>Restore Database</h2>
            <p>Upload a PuffyBrain backup file to restore saved data.</p>
            <input
              type="file"
              accept=".json,.sql"
              className="restore-file-input"
              onChange={(event) => setRestoreFile(event.target.files?.[0] || null)}
            />
            <button
              className="restore-feature-btn"
              type="button"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Restore Database'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
