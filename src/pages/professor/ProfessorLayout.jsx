import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import {
  FiBell,
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiPlusCircle,
  FiSearch,
  FiSettings,
  FiUser,
  FiBarChart2,
} from 'react-icons/fi';

import RoleNotificationMenu
  from '../../components/RoleNotificationMenu';

import HeaderProfileChip
  from '../../components/HeaderProfileChip';

import './ProfessorLayout.css';


/* =====================================================
   API CONFIG
===================================================== */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const SERVER_ORIGIN =
  API_BASE_URL.replace(/\/api\/?$/, '');

const DEFAULT_PROFILE_IMAGE =
  '/images/temporaryimg.png';


/* =====================================================
   MENU
===================================================== */

const menuItems = [
  {
    label: 'Dashboard',
    path: '/professor/dashboard',
    icon: FiGrid,
  },
  {
    label: 'Course Management',
    path: '/professor/courses',
    icon: FiBookOpen,
  },
  {
    label: 'Assessment Analysis',
    path: '/professor/students',
    icon: FiBarChart2,
  },
  {
    label: 'Notifications',
    path: '/professor/notifications',
    icon: FiBell,
  },
  {
    label: 'Profile',
    path: '/professor/profile',
    icon: FiUser,
  },
  {
    label: 'Settings',
    path: '/professor/settings',
    icon: FiSettings,
  },
];


/* =====================================================
   GET TOKEN
===================================================== */

function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken')
  );
}


/* =====================================================
   GET SAVED USER
===================================================== */

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem('puffy-user') ||
      localStorage.getItem('user') ||
      localStorage.getItem('currentUser');

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      'Unable to read stored professor:',
      error,
    );

    return null;
  }
}


/* =====================================================
   PROFILE IMAGE
===================================================== */

function resolveProfileImage(imagePath) {
  if (!imagePath) {
    return DEFAULT_PROFILE_IMAGE;
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

  /*
   * Fix older profile-image paths saved as:
   * /api/uploads/profile-images/...
   */
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

  return `${SERVER_ORIGIN}${fixedPath}`;
}


/* =====================================================
   DISPLAY NAME
===================================================== */

function getDisplayName(user) {
  const name =
    user?.displayName ||
    user?.display_name ||
    user?.name ||
    user?.fullName ||
    user?.full_name ||
    user?.username ||
    'Professor';

  return String(name).replace(/^@+/, '');
}


/* =====================================================
   COMPONENT
===================================================== */

export default function ProfessorLayout() {
  const {
    user: authUser,
    logout,
  } = useAuth();

  const navigate = useNavigate();


  /* ===================================================
     HEADER USER
  =================================================== */

  const [headerUser, setHeaderUser] =
    useState(() => {
      return (
        getStoredUser() ||
        authUser ||
        null
      );
    });


  /* ===================================================
     SIDEBAR
  =================================================== */

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(() => {
    return (
      localStorage.getItem(
        'professorSidebarCollapsed',
      ) === 'true'
    );
  });


  /* ===================================================
     FETCH LOGGED-IN PROFESSOR
  =================================================== */

  useEffect(() => {
    const fetchCurrentProfessor =
      async () => {
        try {
          const token =
            getStoredToken();

          if (!token) {
            return;
          }

          const response = await fetch(
            `${API_BASE_URL}/users/me`,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',

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
            console.error(
              'Unable to load header professor:',
              data.message,
            );

            return;
          }

          const loggedInUser =
            data.user ||
            data.data?.user ||
            data.data ||
            data;

          if (!loggedInUser) {
            return;
          }

          /*
           * Make sure this layout is using
           * a professor account.
           */
          if (
            loggedInUser.role &&
            loggedInUser.role !==
              'professor'
          ) {
            return;
          }

          setHeaderUser(
            loggedInUser,
          );

          const serializedUser =
            JSON.stringify(
              loggedInUser,
            );

          /*
           * Keep all current storage keys
           * synchronized.
           */
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
        } catch (error) {
          console.error(
            'Professor header loading error:',
            error,
          );
        }
      };

    fetchCurrentProfessor();
  }, []);


  /* ===================================================
     SYNC WITH AUTH USER
  =================================================== */

  useEffect(() => {
    if (!authUser) {
      return;
    }

    /*
     * Only use AuthContext as another source.
     * Stored/fetched data can still overwrite this.
     */
    setHeaderUser(
      (currentUser) => ({
        ...currentUser,
        ...authUser,
      }),
    );
  }, [authUser]);


  /* ===================================================
     LISTEN FOR PROFILE CHANGES
  =================================================== */

  useEffect(() => {
    const handleUserUpdated =
      (event) => {
        const updatedUser =
          event.detail ||
          getStoredUser();

        if (!updatedUser) {
          return;
        }

        setHeaderUser(
          (currentUser) => ({
            ...currentUser,
            ...updatedUser,
          }),
        );
      };


    const handleStorageChange =
      (event) => {
        if (
          event.key !==
            'puffy-user' &&
          event.key !==
            'user' &&
          event.key !==
            'currentUser'
        ) {
          return;
        }

        const updatedUser =
          getStoredUser();

        if (updatedUser) {
          setHeaderUser(
            updatedUser,
          );
        }
      };


    window.addEventListener(
      'puffy-user-updated',
      handleUserUpdated,
    );

    window.addEventListener(
      'storage',
      handleStorageChange,
    );


    return () => {
      window.removeEventListener(
        'puffy-user-updated',
        handleUserUpdated,
      );

      window.removeEventListener(
        'storage',
        handleStorageChange,
      );
    };
  }, []);


  /* ===================================================
     HEADER VALUES
  =================================================== */

  const profileImagePath =
    headerUser?.profileImage ||
    headerUser?.profile_image ||
    headerUser?.avatar ||
    headerUser?.image ||
    '';

  const avatarSrc =
    resolveProfileImage(
      profileImagePath,
    );

  const displayUsername =
    getDisplayName(headerUser);


  /* ===================================================
     TOGGLE SIDEBAR
  =================================================== */

  const toggleSidebar = () => {
    setSidebarCollapsed(
      (currentValue) => {
        const newValue =
          !currentValue;

        localStorage.setItem(
          'professorSidebarCollapsed',
          String(newValue),
        );

        return newValue;
      },
    );
  };


  /* ===================================================
     LOGOUT
  =================================================== */

  const handleLogout = () => {
    logout();

    navigate(
      '/login',
      {
        replace: true,
      },
    );
  };


  /* ===================================================
     PAGE
  =================================================== */

  return (
    <div
      className={`professor-layout ${
        sidebarCollapsed
          ? 'professor-sidebar-collapsed'
          : ''
      }`}
    >

      {/* ================================================
          SIDEBAR
      ================================================= */}

      <aside className="professor-sidebar">

        <div className="professor-brand">

          <button
            type="button"
            className="professor-logo-button"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed
                ? 'Expand professor sidebar'
                : 'Collapse professor sidebar'
            }
            aria-expanded={
              !sidebarCollapsed
            }
            title={
              sidebarCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >

            <img
              src="/images/logo_solo.png"
              alt="PuffyBrain logo"
            />

          </button>

          <span className="professor-brand-name">
            PuffyBrain
          </span>

        </div>


        <nav
          className="professor-menu"
          aria-label="Professor navigation"
        >

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({
                    isActive,
                  }) =>
                    `professor-link ${
                      isActive
                        ? 'active'
                        : ''
                    }`
                  }
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                >

                  <Icon
                    aria-hidden="true"
                  />

                  <span className="professor-nav-label">
                    {item.label}
                  </span>

                </NavLink>
              );
            },
          )}

        </nav>


        <button
          type="button"
          className="professor-logout"
          onClick={handleLogout}
          title={
            sidebarCollapsed
              ? 'Logout'
              : undefined
          }
        >

          <FiLogOut
            aria-hidden="true"
          />

          <span className="professor-logout-label">
            Logout
          </span>

        </button>

      </aside>


      {/* ================================================
          MAIN
      ================================================= */}

      <main className="professor-main">


        {/* ==============================================
            HEADER
        =============================================== */}

        <header className="professor-header">

          <label className="professor-search">

            <input
              type="search"
              placeholder="Search..."
              aria-label="Search professor pages"
            />

            <span
              className="professor-search-icon"
              aria-hidden="true"
            >
              <FiSearch />
            </span>

          </label>


          <div className="professor-header-actions">

            <RoleNotificationMenu
              role="professor"
            />


            <Link
              className="professor-create-course"
              to="/professor/courses/new"
            >

              <FiPlusCircle
                aria-hidden="true"
              />

              <span>
                Create Course
              </span>

            </Link>


            <HeaderProfileChip
              username={
                displayUsername
              }
              accountLabel="Professor account"
              avatarSrc={
                avatarSrc
              }
              profilePath="/professor/profile"
              menuItems={[
                {
                  label: 'Profile',
                  path:
                    '/professor/profile',
                  icon: 'user',
                },
                {
                  label: 'Settings',
                  path:
                    '/professor/settings',
                  icon: 'settings',
                },
              ]}
              onLogout={
                handleLogout
              }
            />

          </div>

        </header>


        {/* ==============================================
            PAGE CONTENT
        =============================================== */}

        <div className="professor-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

