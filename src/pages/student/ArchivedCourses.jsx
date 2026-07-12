import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon, SortDropdown } from './EnrolledCourses';
import './EnrolledCourses.css';

const archivedCourses = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  code: index % 2 === 0 ? 'ITEC 106' : 'ITEC 80',
  title:
    index % 2 === 0
      ? 'Web Systems and Technologies 2'
      : 'Introduction to Computing',
  instructor: 'Name of the prof',
}));

export default function ArchivedCourses() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  return localStorage.getItem("sidebarCollapsed") === "true";
});

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
            className="side-nav-item"
            title={sidebarCollapsed ? 'Enrolled Courses' : undefined}
          >
            <Icon name="courses" />
            <span className="nav-label">Enrolled Courses</span>
            <span className="dropdown-mark">v</span>
          </Link>

          <Link
            to="/student/public-courses"
            className="side-nav-item plain-nav-item"
            title={sidebarCollapsed ? 'Public Courses' : undefined}
          >
            <Icon name="public" />
            <span className="nav-label">Public Courses</span>
          </Link>

          <Link
            to="/student/archived-courses"
            className="side-nav-item  active"
            title={sidebarCollapsed ? 'Archived Classes' : undefined}
          >
            <Icon name="archive" />
            <span className="nav-label">Archived Classes</span>
          </Link>

          <Link
            to="/student/settings"
            className="side-nav-item plain-nav-item"
            title={sidebarCollapsed ? 'Settings' : undefined}
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
          <span className="logout-icon" aria-hidden="true" />
          <span className="logout-label">Log-out</span>
        </button>
      </aside>

      <main className="enrolled-main archived-main">
        <header className="enrolled-topbar transparent-topbar">
          <label className="search-input">
            <input
              type="search"
              placeholder="Search archived course"
              aria-label="Search archived courses"
            />

            <span className="student-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4 4" />
              </svg>
            </span>
          </label>

          <div className="topbar-actions">
            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                <path d="M10 19.2h4" />
              </svg>
            </button>

            <div className="profile-chip">
              <Avatar />
              <strong>@meiko</strong>
              <span className="dropdown-mark">v</span>
            </div>
          </div>
        </header>

        <section className="public-heading archived-heading">
          <h1>Archived Courses</h1>

          <div className="filter-actions">
            <SortDropdown
              label="Recent"
              options={['Recent', 'Oldest']}
            />

            <SortDropdown
              label="A to Z"
              options={['A to Z', 'Z to A']}
            />
          </div>
        </section>

        <div className="archive-notice" role="status">
          Course has been archived by your teacher. You cannot add or edit
          anything.
        </div>

        <section
          className="public-courses-grid archived-courses-grid"
          aria-label="Archived courses"
        >
          {archivedCourses.map((course) => (
            <article
              key={course.id}
              className="course-folder archived-course-folder"
            >
              <span className="archived-course-badge">Archived</span>

              <div className="course-card-body">
                <h2>
                  {course.code} - {course.title}
                </h2>
              </div>

              <div className="course-card-footer">
                <Avatar />
                <span>{course.instructor}</span>

                <button
                  type="button"
                  className="archived-view-button"
                  disabled
                >
                  View only
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}