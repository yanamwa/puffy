import { useEffect, useMemo, useState } from 'react';
import {
  FiCamera,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './AdminAccountPage.css';

const temporaryAdminData = {
  name: 'Maria Santos',
  adminId: 'ADM-2026-0001',
  role: 'Administrator',
  department: 'Academic Administration',
  email: 'maria.santos@puffybrain.fun',
  accessLevel: 'Full Administrative Access',
  temporaryPassword: 'PuffyBrain@2026',
};

function getAdminProfileData(user) {
  return {
    name:
      user?.displayName ||
      user?.display_name ||
      user?.fullName ||
      user?.full_name ||
      user?.name ||
      localStorage.getItem('username') ||
      temporaryAdminData.name,

    adminId:
      user?.adminId ||
      user?.admin_id ||
      user?.employeeId ||
      user?.employee_id ||
      temporaryAdminData.adminId,

    role:
      user?.role ||
      user?.userRole ||
      user?.user_role ||
      temporaryAdminData.role,

    department:
      user?.department ||
      user?.assignedDepartment ||
      user?.assigned_department ||
      temporaryAdminData.department,

    email:
      user?.email ||
      localStorage.getItem('user_email') ||
      temporaryAdminData.email,

    accessLevel:
      user?.accessLevel ||
      user?.access_level ||
      user?.permissionLevel ||
      user?.permission_level ||
      temporaryAdminData.accessLevel,

    temporaryPassword:
      user?.temporaryPassword ||
      user?.temporary_password ||
      temporaryAdminData.temporaryPassword,
  };
}

function getAdminProfileImage(user) {
  return (
    user?.profileImage ||
    user?.profile_image ||
    user?.avatar ||
    '/images/temporaryimg.png'
  );
}

export default function AdminAccountPage() {
  const { user } = useAuth();

  const adminData = useMemo(
    () => getAdminProfileData(user),
    [user],
  );

  const [showTemporaryPassword, setShowTemporaryPassword] =
    useState(false);

  const [profileImage, setProfileImage] = useState(() =>
    getAdminProfileImage(user),
  );

  useEffect(() => {
    setProfileImage(getAdminProfileImage(user));
  }, [user]);

  useEffect(() => {
    return () => {
      if (profileImage?.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  const changeProfilePicture = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      window.alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (selectedFile.size > maximumFileSize) {
      window.alert(
        'The selected image is too large. Please choose an image smaller than 5 MB.',
      );

      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setProfileImage((currentImage) => {
      if (currentImage?.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }

      return previewUrl;
    });

    event.target.value = '';
  };

  return (
    <div className="admin-profile-page">
      <section className="admin-profile-page-heading">
        <h1>Admin Profile</h1>
      </section>

      <section className="admin-profile-content">
        <div className="admin-profile-layout">
          {/* LEFT: ADMIN ID CARD */}
          <article className="admin-identity-card">
            <div className="admin-identity-card-accent" />

            <div className="admin-identity-header">
              <div className="admin-identity-brand">
                <img
                  src="/images/logo_solo.png"
                  alt="PuffyBrain"
                />

                <div>
                  <strong>PuffyBrain</strong>
                  <span>Administrator Identification Card</span>
                </div>
              </div>

              <span className="admin-identity-role">
                Admin
              </span>
            </div>

            <div className="admin-identity-photo-area">
              <div className="admin-id-photo-frame">
                <img
                  src={profileImage}
                  alt={`${adminData.name}'s profile`}
                  className="admin-id-photo"
                />

                <label
                  className="admin-photo-change-button"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <FiCamera aria-hidden="true" />

                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="admin-photo-input"
                    onChange={changeProfilePicture}
                  />
                </label>
              </div>

              <div className="admin-identity-main">
                <span className="admin-identity-overline">
                  Official administrator profile
                </span>

                <h2>{adminData.name}</h2>

                <strong className="admin-identity-number">
                  {adminData.adminId}
                </strong>

                <p>{adminData.department}</p>

                <div className="admin-identity-access-row">
                  <span>{adminData.role}</span>
                  <i aria-hidden="true" />
                  <span>{adminData.accessLevel}</span>
                </div>
              </div>
            </div>

            <div className="admin-identity-footer">
              <div>
                <span>Issued by</span>

                <strong>PuffyBrain Learning System</strong>
              </div>

              <div
                className="admin-id-barcode"
                aria-hidden="true"
              />
            </div>
          </article>

          {/* RIGHT: ADMIN INFORMATION */}
          <div className="admin-profile-details">
            <div className="admin-profile-details-header">
              <div>
                <span className="admin-profile-eyebrow">
                  Profile overview
                </span>

                <h2>Administrator Information</h2>

                <p>
                  Your personal, administrative, and account
                  information.
                </p>
              </div>
            </div>

            {/* PERSONAL INFORMATION */}
            <section className="admin-info-section">
              <div className="admin-info-section-heading">
                <span className="admin-info-section-icon">
                  <FiUser aria-hidden="true" />
                </span>

                <div>
                  <h3>Personal Information</h3>

                  <p>Basic administrator account details</p>
                </div>
              </div>

              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">
                    Full Name
                  </span>

                  <strong>{adminData.name}</strong>
                </div>

                <div className="admin-info-item">
                  <span className="admin-info-label">
                    Admin ID
                  </span>

                  <strong>{adminData.adminId}</strong>
                </div>

                <div className="admin-info-item admin-info-item-wide">
                  <span className="admin-info-label">
                    Email Address
                  </span>

                  <div className="admin-info-value-row">
                    <FiMail aria-hidden="true" />

                    <strong>{adminData.email}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* ADMINISTRATIVE INFORMATION */}
            <section className="admin-info-section">
              <div className="admin-info-section-heading">
                <span className="admin-info-section-icon">
                  <FiShield aria-hidden="true" />
                </span>

                <div>
                  <h3>Administrative Information</h3>

                  <p>
                    Role assignment and administrative privileges
                  </p>
                </div>
              </div>

              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">
                    Role
                  </span>

                  <strong>{adminData.role}</strong>
                </div>

                <div className="admin-info-item">
                  <span className="admin-info-label">
                    Department
                  </span>

                  <div className="admin-info-value-row">
                    <FiUsers aria-hidden="true" />

                    <strong>{adminData.department}</strong>
                  </div>
                </div>

                <div className="admin-info-item admin-info-item-wide">
                  <span className="admin-info-label">
                    Access Level
                  </span>

                  <div className="admin-access-level-value">
                    <FiShield aria-hidden="true" />

                    <strong>{adminData.accessLevel}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* ACCOUNT SECURITY */}
            <section className="admin-info-section admin-security-section">
              <div className="admin-info-section-heading">
                <span className="admin-info-section-icon">
                  <FiLock aria-hidden="true" />
                </span>

                <div>
                  <h3>Account Security</h3>

                  <p>Temporary account credentials</p>
                </div>
              </div>

              <div className="admin-password-card">
                <div className="admin-password-copy">
                  <span className="admin-info-label">
                    Temporary Password
                  </span>

                  <strong
                    className={
                      showTemporaryPassword
                        ? 'admin-password-visible'
                        : 'admin-password-hidden'
                    }
                  >
                    {showTemporaryPassword
                      ? adminData.temporaryPassword
                      : '••••••••••••••'}
                  </strong>
                </div>

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowTemporaryPassword(
                      (currentValue) => !currentValue,
                    )
                  }
                  title={
                    showTemporaryPassword
                      ? 'Hide temporary password'
                      : 'Show temporary password'
                  }
                  aria-label={
                    showTemporaryPassword
                      ? 'Hide temporary password'
                      : 'Show temporary password'
                  }
                  aria-pressed={showTemporaryPassword}
                >
                  {showTemporaryPassword ? (
                    <FiEyeOff aria-hidden="true" />
                  ) : (
                    <FiEye aria-hidden="true" />
                  )}

                  <span>
                    {showTemporaryPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>

              <p className="admin-password-note">
                Keep this password private. Change it from the
                Settings page after your first successful login.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}