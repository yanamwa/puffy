import {
  useEffect,
  useState,
} from 'react';

import Swal from 'sweetalert2';
import { API_BASE } from '../../../config.js';

import {
  FiBookOpen,
  FiCheck,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiSliders,
  FiTool,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';

import './SuperAdminSystemSettings.css';


/* =====================================================
   DEFAULT SETTINGS
===================================================== */

const defaultSettings = {
  systemName: 'PuffyBrain',
  academicYear: '2026-2027',
  semester: '1st Semester',

  maintenanceMode: false,

  requirePasswordChange: true,
  professorApproval: true,

  practiceQuizEnabled: true,
  mainQuizEnabled: true,
  recordPracticeQuiz: true,
  recordMainQuiz: true,
  adaptiveQuizEnabled: true,
  quizAnalysisEnabled: true,

  enrollmentApproval: true,
  enrollmentAcceptedEmail: true,
  enrollmentDeclinedEmail: true,
  enrollmentSystemNotification: true,

  professorApprovalNotification: true,
  announcementsEnabled: true,
};


/* =====================================================
   TOGGLE COMPONENT
===================================================== */

function SettingToggle({
  checked,
  onChange,
  label,
  description,
}) {
  return (
    <div className="super-setting-row">
      <div className="super-setting-row-text">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`super-setting-toggle ${
          checked ? 'is-active' : ''
        }`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}


/* =====================================================
   SETTINGS SECTION
===================================================== */

function SettingsSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section className="super-settings-card">
      <header className="super-settings-card-header">
        <span className="super-settings-card-icon">
          <Icon aria-hidden="true" />
        </span>

        <div>
          <span className="super-settings-card-eyebrow">
            {eyebrow}
          </span>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>
      </header>

      <div className="super-settings-card-body">
        {children}
      </div>
    </section>
  );
}

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
/* =====================================================
   SYSTEM SETTINGS PAGE
===================================================== */

  export default function SuperAdminSystemSettings() {  
    const [settings, setSettings] =
      useState(defaultSettings);

    const [savedSettings, setSavedSettings] =
      useState(defaultSettings);

    const [notice, setNotice] =
      useState('');

    const [loading, setLoading] =
      useState(true);

    const [saving, setSaving] =
      useState(false);

      /* =====================================================
        LOAD SETTINGS FROM DATABASE
      ===================================================== */

      useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
          const token = getAuthToken();

          if (!token) {
            setLoading(false);

            Swal.fire({
              icon: 'error',
              title: 'Authentication Required',
              text: 'Please log in again to access System Settings.',
            });

            return;
          }

          try {
            const response = await fetch(
              `${API_BASE}/system-settings`,
              {
                method: 'GET',
                credentials: 'include',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const data = await response
              .json()
              .catch(() => ({}));

            if (
              !response.ok ||
              !data.success ||
              !data.settings
            ) {
              throw new Error(
                data.message ||
                  'Failed to load system settings.'
              );
            }

            if (cancelled) {
              return;
            }

            const loadedSettings = {
              ...defaultSettings,
              ...data.settings,
            };

            setSettings(loadedSettings);
            setSavedSettings(loadedSettings);
          } catch (error) {
            console.error(
              'Load system settings error:',
              error
            );

            if (!cancelled) {
              Swal.fire({
                icon: 'error',
                title: 'Unable to Load Settings',
                text:
                  error?.message ||
                  'System settings could not be loaded.',
              });
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        }

        loadSettings();

        return () => {
          cancelled = true;
        };
      }, []);

  /* =====================================================
     UPDATE FIELD
  ===================================================== */

  const updateSetting = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setNotice('');
  };


  /* =====================================================
     CHECK FOR CHANGES
  ===================================================== */

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(savedSettings);


  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    if (!hasChanges || saving || loading) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      await Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in again before saving System Settings.',
      });

      return;
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Save System Settings?',
      text: 'These changes will update the PuffyBrain system configuration.',
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setSaving(true);
      setNotice('');

      Swal.fire({
        title: 'Saving Settings',
        text: 'Updating PuffyBrain system settings...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(
        `${API_BASE}/system-settings`,
        {
          method: 'PUT',
          credentials: 'include',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(settings),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to save system settings.'
        );
      }

      const updatedSettings = {
        ...defaultSettings,
        ...(data.settings || settings),
      };

      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);

      setNotice(
        'System settings were saved successfully.'
      );

      await Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text:
          data.message ||
          'System settings were updated successfully.',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error(
        'Save system settings error:',
        error
      );

      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text:
          error?.message ||
          'System settings could not be saved.',
        confirmButtonText: 'OK',
      });
    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = async () => {
    if (!hasChanges || saving || loading) {
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Reset Changes?',
      text: 'Your unsaved changes will be returned to the last saved settings.',
      showCancelButton: true,
      confirmButtonText: 'Reset Changes',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setSettings(savedSettings);
    setNotice('');
  };


  return (
    <div className="admin-page super-system-settings-page">

      {/* ===============================================
          PAGE HEADER
      =============================================== */}

      <section className="super-system-settings-heading">
        <div>
          <span className="super-system-settings-eyebrow">
            <FiSettings aria-hidden="true" />
            Platform configuration
          </span>

          <h1>System Settings</h1>

          <p>
            Configure the global behavior of PuffyBrain
            for accounts, quizzes, enrollment, and
            notifications.
          </p>
        </div>

        <div className="super-system-settings-actions">
          <button
              type="button"
              className="super-settings-reset-button"
              onClick={handleReset}
              disabled={
                !hasChanges ||
                loading ||
                saving
              }
            >
              <FiRefreshCw aria-hidden="true" />
              Reset
            </button>

          <button
              type="button"
              className="super-settings-save-button"
              onClick={handleSave}
              disabled={
                !hasChanges ||
                loading ||
                saving
              }
            >
              <FiSave aria-hidden="true" />

              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
        </div>
      </section>


      {/* ===============================================
          NOTICE
      =============================================== */}

      {notice && (
        <div
          className="super-settings-notice"
          role="status"
        >
          <FiCheck aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}


      {/* ===============================================
          GENERAL SYSTEM SETTINGS
      =============================================== */}

      <SettingsSection
        icon={FiSliders}
        eyebrow="General"
        title="General System Settings"
        description="Manage the basic academic and platform configuration used across PuffyBrain."
      >
        <div className="super-settings-form-grid">

          <label className="super-settings-field">
            <span>System Name</span>

            <input
              type="text"
              value={settings.systemName}
              onChange={(event) =>
                updateSetting(
                  'systemName',
                  event.target.value,
                )
              }
            />
          </label>


          <label className="super-settings-field">
            <span>Academic Year</span>

            <input
              type="text"
              value={settings.academicYear}
              onChange={(event) =>
                updateSetting(
                  'academicYear',
                  event.target.value,
                )
              }
            />
          </label>


          <label className="super-settings-field">
            <span>Semester</span>

            <select
              value={settings.semester}
              onChange={(event) =>
                updateSetting(
                  'semester',
                  event.target.value,
                )
              }
            >
              <option>1st Semester</option>
              <option>2nd Semester</option>
              <option>Summer</option>
            </select>
          </label>

        </div>
      </SettingsSection>


      {/* ===============================================
          ACCOUNT CONFIGURATION
      =============================================== */}

      <SettingsSection
        icon={FiUsers}
        eyebrow="Accounts"
        title="Account Configuration"
        description="Configure system-wide rules for newly created accounts and professor access."
      >
        <SettingToggle
          checked={settings.requirePasswordChange}
          onChange={(value) =>
            updateSetting(
              'requirePasswordChange',
              value,
            )
          }
          label="Require Password Change on First Login"
          description="Newly created accounts must create a new password before accessing other PuffyBrain pages."
        />

        <SettingToggle
          checked={settings.professorApproval}
          onChange={(value) =>
            updateSetting(
              'professorApproval',
              value,
            )
          }
          label="Require Professor Account Approval"
          description="Professor registration requests must be approved before the account receives full system access."
        />
      </SettingsSection>


      {/* ===============================================
          QUIZ AND LEARNING
      =============================================== */}

      <SettingsSection
        icon={FiBookOpen}
        eyebrow="Learning"
        title="Quiz & Learning Configuration"
        description="Control the quiz types and learning features available throughout PuffyBrain."
      >
        <SettingToggle
          checked={settings.practiceQuizEnabled}
          onChange={(value) =>
            updateSetting(
              'practiceQuizEnabled',
              value,
            )
          }
          label="Enable Practice Quiz"
          description="Allow professors to provide Practice Quizzes to students."
        />

        <SettingToggle
          checked={settings.mainQuizEnabled}
          onChange={(value) =>
            updateSetting(
              'mainQuizEnabled',
              value,
            )
          }
          label="Enable Main Quiz"
          description="Allow professors to provide Main Quizzes as part of course assessment."
        />

        <SettingToggle
          checked={settings.recordPracticeQuiz}
          onChange={(value) =>
            updateSetting(
              'recordPracticeQuiz',
              value,
            )
          }
          label="Record Practice Quiz Attempts"
          description="Store student Practice Quiz attempts and results for monitoring and analysis."
        />

        <SettingToggle
          checked={settings.recordMainQuiz}
          onChange={(value) =>
            updateSetting(
              'recordMainQuiz',
              value,
            )
          }
          label="Record Main Quiz Attempts"
          description="Store student Main Quiz attempts and results."
        />

        <SettingToggle
          checked={settings.adaptiveQuizEnabled}
          onChange={(value) =>
            updateSetting(
              'adaptiveQuizEnabled',
              value,
            )
          }
          label="Enable Adaptive Quiz Features"
          description="Allow supported quizzes to adjust learning or assessment behavior using PuffyBrain's adaptive features."
        />

        <SettingToggle
          checked={settings.quizAnalysisEnabled}
          onChange={(value) =>
            updateSetting(
              'quizAnalysisEnabled',
              value,
            )
          }
          label="Enable Quiz Analysis"
          description="Allow quiz results to be used for overall and question-level quiz analysis."
        />
      </SettingsSection>


      {/* ===============================================
          ENROLLMENT
      =============================================== */}

      <SettingsSection
        icon={FiUserCheck}
        eyebrow="Enrollment"
        title="Enrollment Configuration"
        description="Control how students request and receive access to courses."
      >
        <SettingToggle
          checked={settings.enrollmentApproval}
          onChange={(value) =>
            updateSetting(
              'enrollmentApproval',
              value,
            )
          }
          label="Require Professor Approval"
          description="Student enrollment requests must be accepted by the professor before the course appears in My Courses."
        />

        <SettingToggle
          checked={settings.enrollmentSystemNotification}
          onChange={(value) =>
            updateSetting(
              'enrollmentSystemNotification',
              value,
            )
          }
          label="Enrollment System Notifications"
          description="Notify students inside PuffyBrain when their enrollment request is accepted or declined."
        />
      </SettingsSection>


      {/* ===============================================
          EMAIL AND NOTIFICATIONS
      =============================================== */}

      <SettingsSection
        icon={FiMail}
        eyebrow="Communication"
        title="Email & Notification Settings"
        description="Choose which important PuffyBrain events should generate notifications."
      >
        <SettingToggle
          checked={settings.enrollmentAcceptedEmail}
          onChange={(value) =>
            updateSetting(
              'enrollmentAcceptedEmail',
              value,
            )
          }
          label="Enrollment Accepted Email"
          description="Send an email to the student when a professor accepts an enrollment request."
        />

        <SettingToggle
          checked={settings.enrollmentDeclinedEmail}
          onChange={(value) =>
            updateSetting(
              'enrollmentDeclinedEmail',
              value,
            )
          }
          label="Enrollment Declined Email"
          description="Send an email to the student when an enrollment request is declined."
        />

        <SettingToggle
          checked={settings.professorApprovalNotification}
          onChange={(value) =>
            updateSetting(
              'professorApprovalNotification',
              value,
            )
          }
          label="Professor Approval Notifications"
          description="Generate notifications related to pending and completed professor account approvals."
        />

        <SettingToggle
          checked={settings.announcementsEnabled}
          onChange={(value) =>
            updateSetting(
              'announcementsEnabled',
              value,
            )
          }
          label="System Announcements"
          description="Allow authorized administrators to publish system-wide announcements."
        />
      </SettingsSection>


      {/* ===============================================
          SYSTEM MAINTENANCE
      =============================================== */}

      <SettingsSection
        icon={FiTool}
        eyebrow="Maintenance"
        title="System Maintenance"
        description="Control system availability during maintenance or administrative operations."
      >
        <SettingToggle
          checked={settings.maintenanceMode}
          onChange={(value) =>
            updateSetting(
              'maintenanceMode',
              value,
            )
          }
          label="Maintenance Mode"
          description="Temporarily restrict normal access while system maintenance is being performed."
        />

        {settings.maintenanceMode && (
          <div className="super-settings-warning">
            <FiTool aria-hidden="true" />

            <div>
              <strong>
                Maintenance mode will be enabled.
              </strong>

              <p>
                This currently changes the setting in
                this page only. Backend enforcement will
                be connected separately.
              </p>
            </div>
          </div>
        )}
      </SettingsSection>

    </div>
  );
}