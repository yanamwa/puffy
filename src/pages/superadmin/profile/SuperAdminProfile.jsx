import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  FiCamera,
  FiLayers,
  FiMail,
  FiShield,
  FiUser,
} from 'react-icons/fi';

import { API_BASE } from '../../../config.js';
import { useAuth } from '../../../context/AuthContext';

import './SuperAdminProfile.css';


/* =====================================================
   DEFAULT PROFILE IMAGE
===================================================== */

const DEFAULT_SUPER_ADMIN_PROFILE_IMAGE =
  '/images/temporaryimg.png';


/* =====================================================
   AUTH HELPERS
===================================================== */

function getStoredToken() {
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


function getUserRole(user) {
  return (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    ''
  );
}


function isSuperAdminUser(user) {
  return getUserRole(user) === 'super_admin';
}


function getHomePath(role) {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'professor') {
    return '/professor';
  }

  if (role === 'student') {
    return '/student';
  }

  return '/super-admin';
}


function formatRole(role) {
  if (!role) {
    return 'Super Admin';
  }

  return String(role)
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}


/* =====================================================
   PROFILE IMAGE
===================================================== */

function resolveSuperAdminProfileImage(imagePath) {
  if (!imagePath) {
    return DEFAULT_SUPER_ADMIN_PROFILE_IMAGE;
  }

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  let fixedPath = imagePath;

  if (
    fixedPath.startsWith(
      '/api/uploads/profile-images/',
    )
  ) {
    fixedPath = fixedPath.replace(
      '/api/uploads/profile-images/',
      '/uploads/profile-images/',
    );
  }

  if (!fixedPath.startsWith('/')) {
    fixedPath = `/${fixedPath}`;
  }

  const serverOrigin = API_BASE.replace(
    /\/api\/?$/,
    '',
  );

  return `${serverOrigin}${fixedPath}`;
}


function getSuperAdminProfileImage(user) {
  return resolveSuperAdminProfileImage(
    user?.profileImage ||
      user?.profile_image ||
      user?.avatar ||
      '',
  );
}


/* =====================================================
   PROFILE DATA
===================================================== */

function getSuperAdminProfileData(user) {
  return {
    name:
      user?.displayName ||
      user?.display_name ||
      user?.fullName ||
      user?.full_name ||
      user?.name ||
      'Super Admin',

    email:
      user?.email ||
      'Not available',

    role: formatRole(
      getUserRole(user) || 'super_admin',
    ),

    accountId:
      user?.superAdminId ||
      user?.super_admin_id ||
      user?.adminId ||
      user?.admin_id ||
      user?.verificationId ||
      user?.verification_id ||
      (
        user?.userId ||
        user?.id
          ? `SA-${user.userId || user.id}`
          : ''
      ) ||
      'Not assigned',

    department:
      user?.department ||
      user?.assignedDepartment ||
      user?.assigned_department ||
      'System Administration',

    accessLevel:
      user?.accessLevel ||
      user?.access_level ||
      user?.permissionLevel ||
      user?.permission_level ||
      'Full System Access',
  };
}


/* =====================================================
   LOCAL USER STORAGE FALLBACK
===================================================== */

function storeUpdatedUser(updatedUser) {
  const serializedUser =
    JSON.stringify(updatedUser);

  localStorage.setItem(
    'puffy-user',
    serializedUser,
  );

  localStorage.setItem(
    'user',
    serializedUser,
  );

  localStorage.setItem(
    'currentUser',
    serializedUser,
  );

  localStorage.setItem(
    'user_role',
    updatedUser.role || 'super_admin',
  );

  localStorage.setItem(
    'user_email',
    updatedUser.email || '',
  );

  localStorage.setItem(
    'username',
    updatedUser.displayName ||
      updatedUser.display_name ||
      updatedUser.name ||
      '',
  );

  window.dispatchEvent(
    new CustomEvent(
      'puffy-user-updated',
      {
        detail: updatedUser,
      },
    ),
  );
}


/* =====================================================
   SUPER ADMIN PROFILE
===================================================== */

export default function SuperAdminProfile() {
  const navigate = useNavigate();

  const {
    user,
    updateUser,
  } = useAuth();


  /* ===================================================
     STATE
  =================================================== */

  const [
    profileUser,
    setProfileUser,
  ] = useState(() =>
    isSuperAdminUser(user)
      ? user
      : null,
  );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    profileError,
    setProfileError,
  ] = useState('');

  const [
    profileImageUploading,
    setProfileImageUploading,
  ] = useState(false);

  const [
    profileImage,
    setProfileImage,
  ] = useState(() =>
    getSuperAdminProfileImage(
      isSuperAdminUser(user)
        ? user
        : null,
    ),
  );


  /* ===================================================
     PROFILE
  =================================================== */

  const profile = useMemo(
    () =>
      getSuperAdminProfileData(
        profileUser,
      ),
    [profileUser],
  );


  /* ===================================================
     SYNC AUTH USER
  =================================================== */

  useEffect(() => {
    if (isSuperAdminUser(user)) {
      setProfileUser(user);

      setProfileImage(
        getSuperAdminProfileImage(user),
      );
    }
  }, [user]);


  /* ===================================================
     LOAD CURRENT USER
  =================================================== */

  useEffect(() => {
    let active = true;


    async function loadSuperAdminProfile() {
      try {
        setProfileLoading(true);
        setProfileError('');

        const token = getStoredToken();

        if (!token) {
          throw new Error(
            'Your login session was not found. Please log in again.',
          );
        }


        const response = await fetch(
          `${API_BASE}/users/me`,
          {
            method: 'GET',

            headers: {
              Accept: 'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          },
        );


        const data =
          await response
            .json()
            .catch(() => ({}));


        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to load super administrator information.',
          );
        }


        const loggedInUser =
          data.user ||
          data.data?.user ||
          data.data ||
          data;


        if (!loggedInUser) {
          throw new Error(
            'Super administrator account information was not found.',
          );
        }


        const loggedInRole =
          getUserRole(loggedInUser);


        if (
          loggedInRole &&
          loggedInRole !== 'super_admin'
        ) {
          if (active) {
            navigate(
              getHomePath(loggedInRole),
              {
                replace: true,
              },
            );
          }

          return;
        }


        if (!active) {
          return;
        }


        setProfileUser(
          loggedInUser,
        );

        setProfileImage(
          getSuperAdminProfileImage(
            loggedInUser,
          ),
        );


        if (updateUser) {
          updateUser(loggedInUser);
        } else {
          storeUpdatedUser(
            loggedInUser,
          );
        }
      } catch (error) {
        console.error(
          'Super admin profile loading error:',
          error,
        );

        if (active) {
          setProfileError(
            error.message ||
              'Unable to load super administrator profile.',
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }


    loadSuperAdminProfile();


    return () => {
      active = false;
    };
  }, [navigate]);


  /* ===================================================
     CLEAN BLOB URL
  =================================================== */

  useEffect(() => {
    return () => {
      if (
        profileImage?.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          profileImage,
        );
      }
    };
  }, [profileImage]);


  /* ===================================================
     CHANGE PROFILE PICTURE
  =================================================== */

  const changeProfilePicture =
    async (event) => {

      const selectedFile =
        event.target.files?.[0];

      event.target.value = '';


      if (!selectedFile) {
        return;
      }


      if (
        !selectedFile.type.startsWith(
          'image/',
        )
      ) {
        window.alert(
          'Please select a valid image file.',
        );

        return;
      }


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


      const token =
        getStoredToken();


      if (!token) {
        window.alert(
          'Your login session was not found. Please log in again.',
        );

        return;
      }


      const previousImage =
        profileImage;

      const previewUrl =
        URL.createObjectURL(
          selectedFile,
        );


      setProfileImage(
        (currentImage) => {

          if (
            currentImage?.startsWith(
              'blob:',
            )
          ) {
            URL.revokeObjectURL(
              currentImage,
            );
          }

          return previewUrl;
        },
      );


      setProfileImageUploading(
        true,
      );


      try {
        const formData =
          new FormData();

        formData.append(
          'profileImage',
          selectedFile,
        );


        const response =
          await fetch(
            `${API_BASE}/users/me/profile-image`,
            {
              method: 'PUT',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            },
          );


        const data =
          await response
            .json()
            .catch(() => ({}));


        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to update your profile picture.',
          );
        }


        const returnedUser =
          data.user ||
          data.data?.user ||
          data.data ||
          {};


        const returnedRole =
          getUserRole(
            returnedUser,
          ) ||
          getUserRole(
            profileUser,
          );


        if (
          returnedRole &&
          returnedRole !==
            'super_admin'
        ) {
          throw new Error(
            'The logged-in account is not a super administrator.',
          );
        }


        const returnedImage =
          returnedUser.profileImage ||
          returnedUser.profile_image ||
          data.profileImage ||
          data.profile_image;


        if (!returnedImage) {
          throw new Error(
            'The server updated the photo but did not return its saved path.',
          );
        }


        const updatedUser = {
          ...(profileUser || {}),
          ...returnedUser,

          role:
            returnedRole ||
            'super_admin',

          profileImage:
            returnedImage,

          profile_image:
            returnedImage,
        };


        URL.revokeObjectURL(
          previewUrl,
        );


        setProfileImage(
          resolveSuperAdminProfileImage(
            returnedImage,
          ),
        );

        setProfileUser(
          updatedUser,
        );


        if (updateUser) {
          updateUser(
            updatedUser,
          );
        } else {
          storeUpdatedUser(
            updatedUser,
          );
        }
      } catch (error) {
        console.error(
          'Super admin profile picture update error:',
          error,
        );


        URL.revokeObjectURL(
          previewUrl,
        );

        setProfileImage(
          previousImage,
        );


        window.alert(
          error.message ||
            'Unable to update your profile picture.',
        );
      } finally {
        setProfileImageUploading(
          false,
        );
      }
    };


  /* ===================================================
     PAGE
  =================================================== */

  return (
    <div className="admin-page superadmin-profile-page">

      {/* =============================================
          PAGE HEADER
      ============================================== */}

      <section className="superadmin-profile-header">
        <div>
          <span className="superadmin-profile-header-kicker">
            <FiShield aria-hidden="true" />
            Super administrator
          </span>

          <h1>Super Admin Profile</h1>

          <p>
            Review super administrator identity,
            access level, and account ownership
            details.
          </p>
        </div>
      </section>


      {/* =============================================
          LOADING
      ============================================== */}

      {profileLoading && (
        <section className="superadmin-profile-status">
          Loading super administrator
          information...
        </section>
      )}


      {/* =============================================
          ERROR
      ============================================== */}

      {!profileLoading &&
        profileError && (
          <section className="superadmin-profile-status superadmin-profile-error">
            {profileError}
          </section>
        )}


      {/* =============================================
          PROFILE
      ============================================== */}

      {!profileLoading &&
        !profileError && (
          <section className="superadmin-profile-card">

            <div className="superadmin-profile-card-body">

              {/* PHOTO */}

              <div className="superadmin-profile-photo-column">

                <div className="superadmin-profile-photo-frame">

                  <img
                    src={profileImage}
                    alt={`${profile.name}'s profile`}
                    onError={(event) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        DEFAULT_SUPER_ADMIN_PROFILE_IMAGE;
                    }}
                  />


                  <label
                    className="superadmin-profile-photo-button"
                    title="Change profile picture"
                    aria-label="Change profile picture"
                  >

                    {profileImageUploading ? (
                      <span>...</span>
                    ) : (
                      <FiCamera
                        aria-hidden="true"
                      />
                    )}


                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={
                        changeProfilePicture
                      }
                      disabled={
                        profileImageUploading
                      }
                    />

                  </label>

                </div>


                <strong>
                  {profile.accountId}
                </strong>

                <span>
                  {profile.accessLevel}
                </span>

              </div>


              {/* INFORMATION */}

              <div className="superadmin-profile-info">

                <span className="superadmin-profile-kicker">
                  <FiShield
                    aria-hidden="true"
                  />

                  Current database account
                </span>


                <h2>
                  {profile.name}
                </h2>


                <p className="superadmin-profile-email">
                  <FiMail
                    aria-hidden="true"
                  />

                  {profile.email}
                </p>


                <dl className="superadmin-profile-details-grid">

                  <div>
                    <dt>
                      <FiUser
                        aria-hidden="true"
                      />
                      Role
                    </dt>

                    <dd>
                      {profile.role}
                    </dd>
                  </div>


                  <div>
                    <dt>
                      <FiLayers
                        aria-hidden="true"
                      />
                      Department
                    </dt>

                    <dd>
                      {profile.department}
                    </dd>
                  </div>


                  <div>
                    <dt>
                      <FiShield
                        aria-hidden="true"
                      />
                      Access Level
                    </dt>

                    <dd>
                      {profile.accessLevel}
                    </dd>
                  </div>

                </dl>

              </div>

            </div>

          </section>
        )}

    </div>
  );
}