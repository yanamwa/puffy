import { useState } from 'react';

import './SuperAdminBackupPage.css';


/* =====================================================
   DOWNLOAD BACKUP
===================================================== */

function downloadBlob(filename, data) {
  const blob = new Blob(
    [data],
    {
      type: 'application/json',
    },
  );

  const url = URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}


/* =====================================================
   CREATE BACKUP PAYLOAD
===================================================== */

function createBackupPayload() {
  const localData = {};

  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const key =
      localStorage.key(index);

    if (key) {
      localData[key] =
        localStorage.getItem(key);
    }
  }

  return {
    app: 'PuffyBrain',
    exportedAt:
      new Date().toISOString(),
    localStorage: localData,
  };
}


/* =====================================================
   PAGE
===================================================== */

export default function SuperAdminBackupPage() {
  const [
    restoreFile,
    setRestoreFile,
  ] = useState(null);

  const [
    restoring,
    setRestoring,
  ] = useState(false);


  /* ===================================================
     BACKUP
  =================================================== */

  const handleBackup = () => {
    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const payload =
      JSON.stringify(
        createBackupPayload(),
        null,
        2,
      );

    downloadBlob(
      `puffybrain-backup-${today}.json`,
      payload,
    );
  };


  /* ===================================================
     RESTORE
  =================================================== */

  const handleRestore = async () => {
    if (!restoreFile) {
      window.alert(
        'Please choose a backup file first.',
      );

      return;
    }


    const ok = window.confirm(
      'Restore this backup? Current local app data may be overwritten.',
    );

    if (!ok) {
      return;
    }


    try {
      setRestoring(true);

      const text =
        await restoreFile.text();

      const payload =
        JSON.parse(text);


      if (
        !payload ||
        payload.app !== 'PuffyBrain' ||
        !payload.localStorage ||
        typeof payload.localStorage !==
          'object'
      ) {
        throw new Error(
          'Invalid PuffyBrain backup file.',
        );
      }


      Object.entries(
        payload.localStorage,
      ).forEach(
        ([key, value]) => {
          localStorage.setItem(
            key,
            String(value),
          );
        },
      );


      window.alert(
        'Backup restored successfully. Refresh the page to see restored data.',
      );

      setRestoreFile(null);
    } catch (error) {
      window.alert(
        error.message ||
          'Could not restore this backup file.',
      );
    } finally {
      setRestoring(false);
    }
  };


  return (
    <div className="admin-page superadmin-backup-page">

      {/* =============================================
          PAGE HEADER
      ============================================== */}

      <div className="superadmin-backup-header">
        <div>
          <h1>Backup & Restore</h1>

          <p>
            Create and restore backups of PuffyBrain
            local application data.
          </p>
        </div>
      </div>


      {/* =============================================
          BACKUP CARDS
      ============================================== */}

      <div className="superadmin-backup-grid">

        {/* BACKUP */}

        <section className="superadmin-backup-card">

          <div className="superadmin-backup-card-accent" />

          <div className="superadmin-backup-card-body">

            <span className="superadmin-backup-label">
              Backup
            </span>

            <h2>
              Download System Data
            </h2>

            <p>
              Download a JSON copy of the current
              PuffyBrain local application data.
            </p>

            <div className="superadmin-backup-note">
              The downloaded backup contains data
              currently stored in this browser.
            </div>

            <button
              className="superadmin-backup-primary"
              type="button"
              onClick={handleBackup}
            >
              Download Backup
            </button>

          </div>

        </section>


        {/* RESTORE */}

        <section className="superadmin-backup-card">

          <div className="superadmin-backup-card-accent" />

          <div className="superadmin-backup-card-body">

            <span className="superadmin-backup-label">
              Restore
            </span>

            <h2>
              Restore System Data
            </h2>

            <p>
              Select a PuffyBrain JSON backup file
              previously downloaded from this page.
            </p>


            <label className="superadmin-restore-file">

              <span>
                Backup File
              </span>

              <input
                type="file"
                accept=".json,application/json"
                onChange={(event) =>
                  setRestoreFile(
                    event.target.files?.[0] ||
                      null,
                  )
                }
              />

            </label>


            {restoreFile && (
              <div className="superadmin-selected-file">
                Selected: {restoreFile.name}
              </div>
            )}


            <button
              className="superadmin-backup-restore"
              type="button"
              onClick={handleRestore}
              disabled={
                restoring ||
                !restoreFile
              }
            >
              {restoring
                ? 'Restoring...'
                : 'Restore Backup'}
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}