import { useState } from 'react';
import Swal from 'sweetalert2';

import { API_BASE } from '../../../config.js';
import '../../admin/Features/AdminFeaturePages.css';

/* =====================================================
   HELPERS
===================================================== */

function getAuthToken() {
  return (
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    ''
  );
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getBackupFilename(response) {
  const disposition =
    response.headers.get('content-disposition') || '';

  const match = disposition.match(
    /filename="?([^"]+)"?/i
  );

  if (match?.[1]) {
    return match[1];
  }

  const today =
    new Date().toISOString().slice(0, 10);

  return `puffybrain-database-backup-${today}.json`;
}

/* =====================================================
   BACKUP PAGE
===================================================== */

export default function BackupPage() {
  const [restoreFile, setRestoreFile] =
    useState(null);

  const [backingUp, setBackingUp] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  /* ===================================================
     DOWNLOAD DATABASE BACKUP
  =================================================== */

  const handleBackup = async () => {
    if (backingUp || restoring) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      await Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in again before creating a database backup.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const confirmation =
      await Swal.fire({
        icon: 'question',
        title: 'Download Database Backup?',
        text:
          'A backup of the current PuffyBrain database will be downloaded.',
        showCancelButton: true,
        confirmButtonText: 'Download Backup',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setBackingUp(true);

      Swal.fire({
        title: 'Creating Backup',
        text:
          'Preparing the PuffyBrain database backup...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(
        `${API_BASE}/backup`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          errorData.message ||
            'Failed to create database backup.'
        );
      }

      const blob = await response.blob();

      const filename =
        getBackupFilename(response);

      downloadBlob(
        filename,
        blob
      );

      await Swal.fire({
        icon: 'success',
        title: 'Backup Created',
        text:
          'The PuffyBrain database backup was downloaded successfully.',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error(
        'Database backup error:',
        error
      );

      await Swal.fire({
        icon: 'error',
        title: 'Backup Failed',
        text:
          error?.message ||
          'Could not create the database backup.',
        confirmButtonText: 'OK',
      });
    } finally {
      setBackingUp(false);
    }
  };

  /* ===================================================
     SELECT RESTORE FILE
  =================================================== */

  const handleRestoreFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    setRestoreFile(file);
  };

  /* ===================================================
     RESTORE DATABASE
  =================================================== */

  const handleRestore = async () => {
    if (restoring || backingUp) {
      return;
    }

    if (!restoreFile) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Backup Selected',
        text:
          'Please choose a PuffyBrain JSON backup file first.',
        confirmButtonText: 'OK',
      });

      return;
    }

    if (
      !restoreFile.name
        .toLowerCase()
        .endsWith('.json')
    ) {
      await Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text:
          'Please select a valid PuffyBrain JSON backup file.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const token = getAuthToken();

    if (!token) {
      await Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text:
          'Please log in again before restoring a database backup.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const confirmation =
      await Swal.fire({
        icon: 'warning',
        title: 'Restore Database?',
        html: `
          <p>
            You are about to restore the PuffyBrain database using:
          </p>

          <strong>${restoreFile.name}</strong>

          <p style="margin-top: 16px;">
            Existing database records contained in this backup may be replaced.
          </p>

          <p>
            This action should only be performed with a trusted PuffyBrain backup.
          </p>
        `,
        showCancelButton: true,
        confirmButtonText:
          'Yes, Restore Database',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true,
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setRestoring(true);

      const text =
        await restoreFile.text();

      let payload;

      try {
        payload =
          JSON.parse(text);
      } catch {
        throw new Error(
          'The selected file does not contain valid JSON.'
        );
      }

      /*
       * Frontend validation before sending
       * anything destructive to the server.
       */
      if (
        !payload ||
        payload.app !== 'PuffyBrain' ||
        payload.format !==
          'puffybrain-database-backup' ||
        !payload.tables ||
        typeof payload.tables !== 'object' ||
        Array.isArray(payload.tables)
      ) {
        throw new Error(
          'This is not a valid PuffyBrain database backup file.'
        );
      }

      Swal.fire({
        title: 'Restoring Database',
        text:
          'Please do not close or refresh this page while the database is being restored.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(
        `${API_BASE}/backup/restore`,
        {
          method: 'POST',
          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(payload),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to restore database backup.'
        );
      }

      setRestoreFile(null);

      /*
       * Reset the file input so the same
       * backup can be selected again later.
       */
      const fileInput =
        document.getElementById(
          'puffybrain-restore-file'
        );

      if (fileInput) {
        fileInput.value = '';
      }

      await Swal.fire({
        icon: 'success',
        title: 'Database Restored',
        html: `
          <p>
            The PuffyBrain database was restored successfully.
          </p>

          ${
            data.restoredTables
              ? `<p><strong>${data.restoredTables}</strong> database tables were restored.</p>`
              : ''
          }

          <p>
            Refresh the application to load the restored data.
          </p>
        `,
        confirmButtonText:
          'Refresh Application',
        allowOutsideClick: false,
      });

      window.location.reload();
    } catch (error) {
      console.error(
        'Database restore error:',
        error
      );

      await Swal.fire({
        icon: 'error',
        title: 'Restore Failed',
        text:
          error?.message ||
          'Could not restore this database backup.',
        confirmButtonText: 'OK',
      });
    } finally {
      setRestoring(false);
    }
  };

  /* ===================================================
     UI
  =================================================== */

  return (
    <div className="admin-page feature-page">
      <h1>Backup & Restore</h1>

      <p>
        Create and restore backups of the
        PuffyBrain database.
      </p>

      <div className="backup-grid">
        {/* BACKUP */}

        <section className="feature-card">
          <div className="feature-card-top" />

          <div className="feature-card-body">
            <h2>Backup Database</h2>

            <p>
              Download a JSON backup of the
              current PuffyBrain database.
            </p>

            <button
              className="primary-feature-btn"
              type="button"
              onClick={handleBackup}
              disabled={
                backingUp ||
                restoring
              }
            >
              {backingUp
                ? 'Creating Backup...'
                : 'Download Backup'}
            </button>
          </div>
        </section>

        {/* RESTORE */}

        <section className="feature-card">
          <div className="feature-card-top" />

          <div className="feature-card-body">
            <h2>Restore Database</h2>

            <p>
              Upload a PuffyBrain JSON database
              backup to restore saved system data.
            </p>

            <input
              id="puffybrain-restore-file"
              type="file"
              accept=".json,application/json"
              className="restore-file-input"
              onChange={
                handleRestoreFileChange
              }
              disabled={
                restoring ||
                backingUp
              }
            />

            {restoreFile && (
              <p className="restore-file-name">
                Selected:{' '}
                <strong>
                  {restoreFile.name}
                </strong>
              </p>
            )}

            <button
              className="restore-feature-btn"
              type="button"
              onClick={handleRestore}
              disabled={
                restoring ||
                backingUp
              }
            >
              {restoring
                ? 'Restoring...'
                : 'Restore Database'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}