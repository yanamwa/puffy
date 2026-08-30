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
import { API_BASE } from '../../../config.js';
import './AdminAccountPage.css';

/* =========================================
   TEMPORARY FALLBACK DATA
========================================= */

const temporaryAdminData = {
  name: 'Maria Santos',
  adminId: 'ADM-2026-0001',
  role: 'Administrator',
  department: 'Academic Administration',
  email: 'maria.santos@puffybrain.fun',
  accessLevel: 'Full Administrative Access',
  temporaryPassword: 'PuffyBrain@2026',
};

/* =========================================
   ADMIN PROFILE DATA
========================================= */

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

/* =========================================
   BUILD PROFILE IMAGE URL
========================================= */
function getBackendOrigin() {
  const apiBase = String(API_BASE || '')
    .trim()
    .replace(/\/+$/, '');

  // API_BASE already contains a complete URL
  // Example: http://localhost:5000/api
  if (
    apiBase.startsWith('http://') ||
    apiBase.startsWith('https://')
  ) {
    try {
      return new URL(apiBase).origin;
    } catch {
      // Continue to fallback below
    }
  }

  /*
    LOCAL DEVELOPMENT

    React/Vite:
    http://localhost:5173

    Express:
    http://localhost:5000
  */

  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return `http://${window.location.hostname}:5000`;
  }

  /*
    PRODUCTION

    https://puffybrain.fun
  */

  return window.location.origin;
}

function buildProfileImageUrl(image) {
  if (!image) {
    return '/images/temporaryimg.png';
  }

  const imageValue = String(image).trim();

  if (
    imageValue.startsWith('http://') ||
    imageValue.startsWith('https://') ||
    imageValue.startsWith('data:') ||
    imageValue.startsWith('blob:')
  ) {
    return imageValue;
  }

  const backendOrigin = getBackendOrigin();

  const cleanImagePath = imageValue
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  return `${backendOrigin}/${cleanImagePath}`;
}
/* =========================================
   GET USER PROFILE IMAGE
========================================= */

function getAdminProfileImage(user) {
  let savedLocalUser = {};

  try {
    savedLocalUser = JSON.parse(
      localStorage.getItem('puffy-user') || '{}',
    );
  } catch {
    savedLocalUser = {};
  }

  /*
    Prefer localStorage first because it is
    updated immediately after profile upload.

    AuthContext may still contain the old image.
  */

  const image =
    savedLocalUser?.profileImage ||
    savedLocalUser?.profile_image ||
    savedLocalUser?.profileImageUrl ||
    savedLocalUser?.profile_image_url ||
    savedLocalUser?.profilePicture ||
    savedLocalUser?.profile_picture ||

    user?.profileImage ||
    user?.profile_image ||
    user?.profileImageUrl ||
    user?.profile_image_url ||
    user?.profilePicture ||
    user?.profile_picture ||
    user?.avatar ||
    user?.image ||
    null;

  return buildProfileImageUrl(image);
}
/* =========================================
   GET TOKEN
========================================= */

function getAuthToken() {
  return (
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token')
  );
}

/* =========================================
   ADMIN ACCOUNT PAGE
========================================= */

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

  const [uploadingProfileImage, setUploadingProfileImage] =
    useState(false);

  /* =========================================
     UPDATE IMAGE FROM AUTH USER

     IMPORTANT:
     Only change the image if AuthContext
     actually contains a profile image.
  ========================================= */

useEffect(() => {
  let storedUser = {};

  try {
    storedUser = JSON.parse(
      localStorage.getItem('puffy-user') || '{}',
    );
  } catch {
    storedUser = {};
  }

  const storedImage =
    storedUser?.profileImage ||
    storedUser?.profile_image ||
    null;

  const authImage =
    user?.profileImage ||
    user?.profile_image ||
    null;

  const image =
    storedImage ||
    authImage;

  if (image) {
    setProfileImage(
      buildProfileImageUrl(image),
    );
  }
}, [user]);
  /* =========================================
     FETCH CURRENT USER FROM DATABASE
  ========================================= */

  const refreshProfilePicture = async () => {
    const token = getAuthToken();

    if (!token) {
      return null;
    }

    const cleanApiBase = API_BASE.replace(/\/$/, '');

    const meUrl = cleanApiBase.endsWith('/api')
      ? `${cleanApiBase}/users/me`
      : `${cleanApiBase}/api/users/me`;

    try {
      const response = await fetch(meUrl, {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(
          'Could not refresh user profile:',
          response.status,
        );

        return null;
      }

      const data = await response.json();

      console.log(
        'Current user response:',
        data,
      );

      const updatedUser =
        data.user ||
        data.data?.user ||
        data.data ||
        data;

      const savedImage =
        updatedUser?.profileImage ||
        updatedUser?.profile_image ||
        updatedUser?.profileImageUrl ||
        updatedUser?.profile_image_url ||
        updatedUser?.avatar ||
        updatedUser?.image ||
        null;

      if (!savedImage) {
        console.warn(
          'No profile image found in /users/me response.',
        );

        return null;
      }

      const finalImageUrl =
        buildProfileImageUrl(savedImage);

      setProfileImage(finalImageUrl);

      /* =====================================
         UPDATE LOCAL STORAGE
      ===================================== */

      try {
        const storedUser = JSON.parse(
          localStorage.getItem('puffy-user') || '{}',
        );

        const updatedStoredUser = {
          ...storedUser,
          ...updatedUser,

          profileImage: savedImage,
          profile_image: savedImage,
        };

        localStorage.setItem(
          'puffy-user',
          JSON.stringify(updatedStoredUser),
        );
      } catch (storageError) {
        console.warn(
          'Could not update saved user:',
          storageError,
        );
      }

      /* =====================================
         UPDATE HEADER / SIDEBAR
      ===================================== */

      window.dispatchEvent(
        new CustomEvent(
          'profile-image-updated',
          {
            detail: {
              profileImage: finalImageUrl,
              profile_image: finalImageUrl,
            },
          },
        ),
      );

      return finalImageUrl;
    } catch (error) {
      console.error(
        'Unable to refresh profile picture:',
        error,
      );

      return null;
    }
  };

  /* =========================================
     LOAD SAVED PROFILE IMAGE ON PAGE OPEN
  ========================================= */

  useEffect(() => {
    refreshProfilePicture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================
     CHANGE PROFILE PICTURE
  ========================================= */

  const changeProfilePicture = async (event) => {
    const selectedFile =
      event.target.files?.[0];

    /*
      Reset input so selecting the same
      image again will still trigger onChange.
    */

    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    /* =====================================
       VALIDATE IMAGE TYPE
    ===================================== */

    if (!selectedFile.type.startsWith('image/')) {
      window.alert(
        'Please select a valid image file.',
      );

      return;
    }

    /* =====================================
       VALIDATE FILE SIZE
    ===================================== */

    const maximumFileSize =
      5 * 1024 * 1024;

    if (
      selectedFile.size >
      maximumFileSize
    ) {
      window.alert(
        'The selected image is too large. Please choose an image smaller than 5 MB.',
      );

      return;
    }

    /* =====================================
       CHECK LOGIN TOKEN
    ===================================== */

    const token = getAuthToken();

    if (!token) {
      window.alert(
        'Your login session could not be found. Please log in again.',
      );

      return;
    }

    /* =====================================
       KEEP CURRENT IMAGE IN CASE
       UPLOAD FAILS
    ===================================== */

    const previousImage =
      profileImage;

    /* =====================================
       SHOW SELECTED IMAGE IMMEDIATELY
    ===================================== */

    const previewUrl =
      URL.createObjectURL(selectedFile);

    setProfileImage(previewUrl);

    try {
      setUploadingProfileImage(true);

      /* ===================================
         CREATE FORM DATA
      =================================== */

      const formData =
        new FormData();

      /*
        MUST MATCH BACKEND:

        uploadProfileImage.single(
          "profileImage"
        )
      */

      formData.append(
        'profileImage',
        selectedFile,
      );

      /* ===================================
         CREATE API URL
      =================================== */

      const cleanApiBase =
        API_BASE.replace(/\/$/, '');

      const uploadUrl =
        cleanApiBase.endsWith('/api')
          ? `${cleanApiBase}/users/me/profile-image`
          : `${cleanApiBase}/api/users/me/profile-image`;

      console.log(
        'Uploading profile image:',
        uploadUrl,
      );

      /* ===================================
         SEND IMAGE TO BACKEND
      =================================== */

      const response = await fetch(
        uploadUrl,
        {
          method: 'PUT',

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        },
      );

      /* ===================================
         READ BACKEND RESPONSE
      =================================== */

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        'Profile picture upload response:',
        data,
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Profile picture upload failed (${response.status}).`,
        );
      }

      /* ===================================
         FIND IMAGE RETURNED BY BACKEND
      =================================== */

      const uploadedImage =
        data.profileImage ||
        data.profile_image ||
        data.profileImageUrl ||
        data.profile_image_url ||
        data.imageUrl ||
        data.image_url ||
        data.avatar ||

        data.user?.profileImage ||
        data.user?.profile_image ||
        data.user?.profileImageUrl ||
        data.user?.profile_image_url ||
        data.user?.avatar ||

        data.data?.profileImage ||
        data.data?.profile_image ||
        data.data?.profileImageUrl ||
        data.data?.profile_image_url ||
        data.data?.avatar ||

        data.data?.user?.profileImage ||
        data.data?.user?.profile_image ||
        null;

      /* ===================================
         DISPLAY SAVED IMAGE
      =================================== */

      if (uploadedImage) {
        const finalImageUrl =
          buildProfileImageUrl(
            uploadedImage,
          );

        setProfileImage(
          finalImageUrl,
        );

        /* ===============================
           SAVE IMAGE LOCALLY
        =============================== */

        try {
          const savedUser = JSON.parse(
            localStorage.getItem(
              'puffy-user',
            ) || '{}',
          );

          const updatedUser = {
            ...savedUser,

            profileImage:
              uploadedImage,

            profile_image:
              uploadedImage,
          };

          localStorage.setItem(
            'puffy-user',
            JSON.stringify(updatedUser),
          );
        } catch (storageError) {
          console.warn(
            'Unable to update local user:',
            storageError,
          );
        }

        /* ===============================
           UPDATE OTHER COMPONENTS
        =============================== */

        window.dispatchEvent(
          new CustomEvent(
            'profile-image-updated',
            {
              detail: {
                profileImage:
                  finalImageUrl,

                profile_image:
                  finalImageUrl,
              },
            },
          ),
        );
      }

      /* ===================================
         FETCH USER AGAIN FROM DATABASE
      =================================== */

      const refreshedImage =
        await refreshProfilePicture();

      /*
        If /users/me doesn't return the
        profile image yet, DO NOT revert
        to default.

        Keep either:
        1. backend returned image
        2. selected preview
      */

      if (!refreshedImage) {
        if (uploadedImage) {
          setProfileImage(
            buildProfileImageUrl(
              uploadedImage,
            ),
          );
        } else {
          setProfileImage(
            previewUrl,
          );
        }
      }

      /* ===================================
         SUCCESS
      =================================== */

      window.alert(
        data.message ||
          'Profile picture updated successfully.',
      );
    } catch (error) {
      console.error(
        'Profile picture upload error:',
        error,
      );

      /* ===================================
         ONLY RESTORE OLD IMAGE IF
         THE UPLOAD ACTUALLY FAILED
      =================================== */

      setProfileImage(
        previousImage,
      );

      window.alert(
        error.message ||
          'Unable to update profile picture. Please try again.',
      );
    } finally {
      setUploadingProfileImage(
        false,
      );
    }
  };

  /* =========================================
     PAGE
  ========================================= */

  return (
    <div className="admin-profile-page">

      {/* =====================================
          PAGE HEADING
      ===================================== */}

      <section className="admin-profile-page-heading">
        <h1>Admin Profile</h1>
      </section>

      <section className="admin-profile-content">
        <div className="admin-profile-layout">

          {/* =================================
              LEFT: ADMIN ID CARD
          ================================= */}

          <article className="admin-identity-card">

            <div className="admin-identity-card-accent" />

            {/* =================================
                CARD HEADER
            ================================= */}

            <div className="admin-identity-header">

              <div className="admin-identity-brand">

                <img
                  src="/images/logo_solo.png"
                  alt="PuffyBrain"
                />

                <div>
                  <strong>
                    PuffyBrain
                  </strong>

                  <span>
                    Administrator Identification Card
                  </span>
                </div>

              </div>

              <span className="admin-identity-role">
                Admin
              </span>

            </div>

            {/* =================================
                PROFILE PHOTO
            ================================= */}

            <div className="admin-identity-photo-area">

              <div className="admin-id-photo-frame">

                <img
                    src={profileImage}
                    alt={`${adminData.name}'s profile`}
                    className="admin-id-photo"
                    onLoad={(event) => {
                      console.log(
                        'PROFILE IMAGE LOADED:',
                        event.currentTarget.src,
                      );
                    }}
                    onError={(event) => {
                      console.error(
                        'PROFILE IMAGE FAILED:',
                        event.currentTarget.src,
                      );

                      if (
                        !event.currentTarget.src.includes(
                          'temporaryimg.png',
                        )
                      ) {
                        event.currentTarget.src =
                          '/images/temporaryimg.png';
                      }
                    }}
                  />

                {/* =================================
                    CAMERA BUTTON
                ================================= */}

                <label
                  className="admin-photo-change-button"

                  title={
                    uploadingProfileImage
                      ? 'Uploading profile picture...'
                      : 'Change profile picture'
                  }

                  aria-label={
                    uploadingProfileImage
                      ? 'Uploading profile picture'
                      : 'Change profile picture'
                  }
                >

                  <FiCamera aria-hidden="true" />

                  <input
                    type="file"

                    accept="
                      image/png,
                      image/jpeg,
                      image/jpg,
                      image/webp
                    "

                    className="admin-photo-input"

                    onChange={
                      changeProfilePicture
                    }

                    disabled={
                      uploadingProfileImage
                    }
                  />

                </label>

              </div>

              {/* =================================
                  ADMIN MAIN INFO
              ================================= */}

              <div className="admin-identity-main">

                <span className="admin-identity-overline">
                  Official administrator profile
                </span>

                <h2>
                  {adminData.name}
                </h2>

                <strong className="admin-identity-number">
                  {adminData.adminId}
                </strong>

                <p>
                  {adminData.department}
                </p>

                <div className="admin-identity-access-row">

                  <span>
                    {adminData.role}
                  </span>

                  <i aria-hidden="true" />

                  <span>
                    {adminData.accessLevel}
                  </span>

                </div>

              </div>

            </div>

            {/* =================================
                CARD FOOTER
            ================================= */}

            <div className="admin-identity-footer">

              <div>

                <span>
                  Issued by
                </span>

                <strong>
                  PuffyBrain Learning System
                </strong>

              </div>

              <div
                className="admin-id-barcode"
                aria-hidden="true"
              />

            </div>

          </article>

          {/* =================================
              RIGHT SIDE
          ================================= */}

          <div className="admin-profile-details">

            {/* =================================
                INFORMATION HEADER
            ================================= */}

            <div className="admin-profile-details-header">

              <div>

                <span className="admin-profile-eyebrow">
                  Profile overview
                </span>

                <h2>
                  Administrator Information
                </h2>

                <p>
                  Your personal, administrative,
                  and account information.
                </p>

              </div>

            </div>

            {/* =================================
                PERSONAL INFORMATION
            ================================= */}

            <section className="admin-info-section">

              <div className="admin-info-section-heading">

                <span className="admin-info-section-icon">
                  <FiUser aria-hidden="true" />
                </span>

                <div>

                  <h3>
                    Personal Information
                  </h3>

                  <p>
                    Basic administrator account details
                  </p>

                </div>

              </div>

              <div className="admin-info-grid">

                {/* FULL NAME */}

                <div className="admin-info-item">

                  <span className="admin-info-label">
                    Full Name
                  </span>

                  <strong>
                    {adminData.name}
                  </strong>

                </div>

                {/* ADMIN ID */}

                <div className="admin-info-item">

                  <span className="admin-info-label">
                    Admin ID
                  </span>

                  <strong>
                    {adminData.adminId}
                  </strong>

                </div>

                {/* EMAIL */}

                <div className="admin-info-item admin-info-item-wide">

                  <span className="admin-info-label">
                    Email Address
                  </span>

                  <div className="admin-info-value-row">

                    <FiMail aria-hidden="true" />

                    <strong>
                      {adminData.email}
                    </strong>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================
                ADMINISTRATIVE INFORMATION
            ================================= */}

            <section className="admin-info-section">

              <div className="admin-info-section-heading">

                <span className="admin-info-section-icon">
                  <FiShield aria-hidden="true" />
                </span>

                <div>

                  <h3>
                    Administrative Information
                  </h3>

                  <p>
                    Role assignment and
                    administrative privileges
                  </p>

                </div>

              </div>

              <div className="admin-info-grid">

                {/* ROLE */}

                <div className="admin-info-item">

                  <span className="admin-info-label">
                    Role
                  </span>

                  <strong>
                    {adminData.role}
                  </strong>

                </div>

                {/* DEPARTMENT */}

                <div className="admin-info-item">

                  <span className="admin-info-label">
                    Department
                  </span>

                  <div className="admin-info-value-row">

                    <FiUsers aria-hidden="true" />

                    <strong>
                      {adminData.department}
                    </strong>

                  </div>

                </div>

                {/* ACCESS LEVEL */}

                <div className="admin-info-item admin-info-item-wide">

                  <span className="admin-info-label">
                    Access Level
                  </span>

                  <div className="admin-access-level-value">

                    <FiShield aria-hidden="true" />

                    <strong>
                      {adminData.accessLevel}
                    </strong>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================
                ACCOUNT SECURITY
            ================================= */}

            <section className="admin-info-section admin-security-section">

              <div className="admin-info-section-heading">

                <span className="admin-info-section-icon">
                  <FiLock aria-hidden="true" />
                </span>

                <div>

                  <h3>
                    Account Security
                  </h3>

                  <p>
                    Temporary account credentials
                  </p>

                </div>

              </div>

              {/* =================================
                  TEMPORARY PASSWORD
              ================================= */}

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

                {/* =================================
                    SHOW/HIDE PASSWORD
                ================================= */}

                <button
                  type="button"

                  className="admin-password-toggle"

                  onClick={() =>
                    setShowTemporaryPassword(
                      (currentValue) =>
                        !currentValue,
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

                  aria-pressed={
                    showTemporaryPassword
                  }
                >

                  {showTemporaryPassword ? (
                    <FiEyeOff aria-hidden="true" />
                  ) : (
                    <FiEye aria-hidden="true" />
                  )}

                  <span>
                    {showTemporaryPassword
                      ? 'Hide'
                      : 'Show'}
                  </span>

                </button>

              </div>

              <p className="admin-password-note">
                Keep this password private. Change it from
                the Settings page after your first
                successful login.
              </p>

            </section>

          </div>

        </div>
      </section>

    </div>
  );
}