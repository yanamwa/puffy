import { useEffect, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiBriefcase,
  FiCamera,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './ProfessorProfile.css';

const temporaryProfessorData = {
  name: 'Dr. Adrian Reyes',
  employeeId: 'FAC-2026-0017',
  department: 'Department of Computer Science',
  position: 'Associate Professor',
  email: 'adrian.reyes@puffybrain.fun',
  specialization: 'Web Development and Database Systems',
  temporaryPassword: 'PuffyBrain@2026',
};

function getProfessorProfileData(user) {
  return {
    name:
      user?.displayName ||
      user?.display_name ||
      user?.fullName ||
      user?.full_name ||
      user?.name ||
      localStorage.getItem('username') ||
      temporaryProfessorData.name,

    employeeId:
      user?.employeeId ||
      user?.employee_id ||
      user?.professorId ||
      user?.professor_id ||
      temporaryProfessorData.employeeId,

    department:
      user?.department ||
      temporaryProfessorData.department,

    position:
      user?.position ||
      user?.academicPosition ||
      user?.academic_position ||
      temporaryProfessorData.position,

    email:
      user?.email ||
      temporaryProfessorData.email,

    specialization:
      user?.specialization ||
      user?.expertise ||
      temporaryProfessorData.specialization,

    temporaryPassword:
      user?.temporaryPassword ||
      user?.temporary_password ||
      temporaryProfessorData.temporaryPassword,
  };
}

function getProfessorImage(user) {
  return (
    user?.profileImage ||
    user?.profile_image ||
    user?.avatar ||
    '/images/temporaryimg.png'
  );
}

export default function ProfessorProfile() {
  const { user } = useAuth();

  const professorData = useMemo(
    () => getProfessorProfileData(user),
    [user],
  );

  const [showTemporaryPassword, setShowTemporaryPassword] =
    useState(false);

  const [profileImage, setProfileImage] = useState(() =>
    getProfessorImage(user),
  );

  useEffect(() => {
    setProfileImage(getProfessorImage(user));
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
    <div className="professor-profile-page">
      <section className="professor-profile-page-heading">
        <h1>Professor Profile</h1>
      </section>

      <section className="professor-profile-content">
        <div className="professor-profile-layout">
          {/* LEFT: PROFESSOR ID CARD */}
          <article className="professor-identity-card">
            <div className="professor-identity-card-accent" />

            <div className="professor-identity-header">
              <div className="professor-identity-brand">
                <img
                  src="/images/logo_solo.png"
                  alt="PuffyBrain"
                />

                <div>
                  <strong>PuffyBrain</strong>
                  <span>Professor Identification Card</span>
                </div>
              </div>

              <span className="professor-identity-role">
                Professor
              </span>
            </div>

            <div className="professor-identity-photo-area">
              <div className="professor-id-photo-frame">
                <img
                  src={profileImage}
                  alt={`${professorData.name}'s profile`}
                  className="professor-id-photo"
                />

                <label
                  className="professor-photo-change-button"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <FiCamera aria-hidden="true" />

                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="professor-photo-input"
                    onChange={changeProfilePicture}
                  />
                </label>
              </div>

              <div className="professor-identity-main">
                <span className="professor-identity-overline">
                  Official faculty profile
                </span>

                <h2>{professorData.name}</h2>

                <strong className="professor-identity-number">
                  {professorData.employeeId}
                </strong>

                <p>{professorData.department}</p>

                <div className="professor-identity-professional-row">
                  <span>{professorData.position}</span>
                </div>
              </div>
            </div>

            <div className="professor-identity-footer">
              <div>
                <span>Issued by</span>

                <strong>PuffyBrain Learning System</strong>
              </div>

              <div
                className="professor-id-barcode"
                aria-hidden="true"
              />
            </div>
          </article>

          {/* RIGHT: PROFESSOR INFORMATION */}
          <div className="professor-profile-details">
            <div className="professor-profile-details-header">
              <div>
                <span className="professor-profile-eyebrow">
                  Profile overview
                </span>

                <h2>Professor Information</h2>

                <p>
                  Your personal, professional, and account
                  information.
                </p>
              </div>
            </div>

            {/* PERSONAL INFORMATION */}
            <section className="professor-info-section">
              <div className="professor-info-section-heading">
                <span className="professor-info-section-icon">
                  <FiUser aria-hidden="true" />
                </span>

                <div>
                  <h3>Personal Information</h3>

                  <p>Basic professor account details</p>
                </div>
              </div>

              <div className="professor-info-grid">
                <div className="professor-info-item">
                  <span className="professor-info-label">
                    Full Name
                  </span>

                  <strong>{professorData.name}</strong>
                </div>

                <div className="professor-info-item">
                  <span className="professor-info-label">
                    Employee ID
                  </span>

                  <strong>{professorData.employeeId}</strong>
                </div>

                <div className="professor-info-item professor-info-item-wide">
                  <span className="professor-info-label">
                    Email Address
                  </span>

                  <div className="professor-info-value-row">
                    <FiMail aria-hidden="true" />

                    <strong>{professorData.email}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* PROFESSIONAL INFORMATION */}
            <section className="professor-info-section">
              <div className="professor-info-section-heading">
                <span className="professor-info-section-icon">
                  <FiBriefcase aria-hidden="true" />
                </span>

                <div>
                  <h3>Professional Information</h3>

                  <p>Faculty assignment and academic expertise</p>
                </div>
              </div>

              <div className="professor-info-grid">
                <div className="professor-info-item professor-info-item-wide">
                  <span className="professor-info-label">
                    Department
                  </span>

                  <div className="professor-info-value-row">
                    <FiBookOpen aria-hidden="true" />

                    <strong>{professorData.department}</strong>
                  </div>
                </div>

                <div className="professor-info-item">
                  <span className="professor-info-label">
                    Position
                  </span>

                  <strong>{professorData.position}</strong>
                </div>

                <div className="professor-info-item">
                  <span className="professor-info-label">
                    Role
                  </span>

                  <strong>Professor</strong>
                </div>

                <div className="professor-info-item professor-info-item-wide">
                  <span className="professor-info-label">
                    Specialization
                  </span>

                  <strong>{professorData.specialization}</strong>
                </div>
              </div>
            </section>

            {/* ACCOUNT SECURITY */}
            <section className="professor-info-section professor-security-section">
              <div className="professor-info-section-heading">
                <span className="professor-info-section-icon">
                  <FiLock aria-hidden="true" />
                </span>

                <div>
                  <h3>Account Security</h3>

                  <p>Temporary account credentials</p>
                </div>
              </div>

              <div className="professor-password-card">
                <div className="professor-password-copy">
                  <span className="professor-info-label">
                    Temporary Password
                  </span>

                  <strong
                    className={
                      showTemporaryPassword
                        ? 'professor-password-visible'
                        : 'professor-password-hidden'
                    }
                  >
                    {showTemporaryPassword
                      ? professorData.temporaryPassword
                      : '••••••••••••••'}
                  </strong>
                </div>

                <button
                  type="button"
                  className="professor-password-toggle"
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

              <p className="professor-password-note">
                Keep this password private. You can change it from
                the Settings page.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}