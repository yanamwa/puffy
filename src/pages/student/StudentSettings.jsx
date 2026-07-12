import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import './EnrolledCourses.css';

export default function StudentSettings() {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  return localStorage.getItem("sidebarCollapsed") === "true";
});

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  return (
    <div
  className={`enrolled-dashboard striped-dashboard ${
    sidebarCollapsed ? 'sidebar-collapsed' : ''
  }`}
>
      <aside className="enrolled-sidebar">
          <div className="brand-lockup">
           <img
              src="/images/logo_solo.png"
              alt="PuffyBrain logo"
              className="sidebar-logo"
              onClick={() => {
                setSidebarCollapsed((prev) => {
                  const newValue = !prev;
                  localStorage.setItem("sidebarCollapsed", newValue);
                  return newValue;
                });
              }}
            />

            <span className="brand-name">PuffyBrain</span>

          </div>

          <nav className="side-nav" aria-label="Student navigation">
            <Link
              to="/student"
              className="side-nav-item"
              title={sidebarCollapsed ? 'Home' : undefined}
            >
              <Icon name="home" />
              <span className="nav-label">Home</span>
            </Link>

            <Link
              to="/student/enrolled-courses"
              className="side-nav-item "
              title={
                sidebarCollapsed
                  ? 'Enrolled Courses'
                  : undefined
              }
            >
              <Icon name="courses" />
              <span className="nav-label">
                Enrolled Courses
              </span>
              <span className="dropdown-mark">v</span>
            </Link>

            <Link
              to="/student/public-courses"
              className="side-nav-item plain-nav-item"
              title={
                sidebarCollapsed
                  ? 'Public Courses'
                  : undefined
              }
            >
              <Icon name="public" />
              <span className="nav-label">
                Public Courses
              </span>
            </Link>

            <Link
              to="/student/archived-courses"
              className="side-nav-item plain-nav-item"
              title={
                sidebarCollapsed
                  ? 'Archived Classes'
                  : undefined
              }
            >
              <Icon name="archive" />
              <span className="nav-label">
                Archived classes
              </span>
            </Link>

            <Link
              to="/student/settings"
              className="side-nav-item active"
              title={
                sidebarCollapsed ? 'Settings' : undefined
              }
            >
              <Icon name="settings" />
              <span className="nav-label">Settings</span>
            </Link>
          </nav>

          <button
            type="button"
            className="logout-button"
            title={sidebarCollapsed ? 'Log-out' : undefined}
          >
            <span
              className="logout-icon"
              aria-hidden="true"
            />

            <span className="logout-label">Log-out</span>
          </button>
        </aside>

      <main className="enrolled-main settings-main">
        <header className="enrolled-topbar transparent-topbar">
          <label className="search-input">
            <input type="search" placeholder="Search your course" />
            <span className="student-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4 4" />
              </svg>
            </span>
          </label>

          <div className="topbar-actions">
            <button className="notification-button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                <path d="M10 19.2h4" />
              </svg>
            </button>
            <button type="button" className="primary-button" onClick={() => setJoinModalOpen(true)}>
              + Join course
            </button>
            <div className="profile-chip">
              <Avatar />
              <strong>@meiko</strong>
              <span className="dropdown-mark">v</span>
            </div>
          </div>
        </header>

        <section className="settings-heading">
          <h1>Settings</h1>
        </section>

        <section className="student-settings-shell" aria-label="Student settings">
          <div className="settings-tabs" aria-hidden="true">
            <span className="settings-tab active">Personal Information</span>
            <span className="settings-tab">Settings</span>
          </div>

          <div className="settings-form-card">
            <form className="settings-form">
              <div className="settings-fields">
                <label>
                  <span>Username</span>
                  <input type="text" placeholder="enter your new username" />
                </label>

                <label>
                  <span>Email Address</span>
                  <input type="email" placeholder="username@gmail.com" disabled />
                </label>

                <label>
                  <span>Name of School</span>
                  <input type="text" placeholder="enter your name of school" />
                </label>

                <label>
                  <span>Year Level</span>
                  <input type="text" placeholder="enter your year level" />
                </label>
              </div>

              <div className="settings-photo-column">
                <button type="button" className="upload-photo-button">
                  Upload Photo
                </button>
                <p>Recommend ratio 1:1 and file less than 5mb</p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={courseCode}
        onCourseCodeChange={setCourseCode}
        onCancel={closeJoinModal}
        onJoin={closeJoinModal}
      />
    </div>
  );
}
