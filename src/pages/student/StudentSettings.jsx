import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import { API_BASE } from '../../config';
import './EnrolledCourses.css';

export default function StudentSettings() {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    const email = localStorage.getItem('user_email') || '';

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice('Complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordNotice('');

      const response = await fetch(`${API_BASE}/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not update password.');
      }

      const savedUser = JSON.parse(localStorage.getItem('puffy-user') || '{}');
      localStorage.setItem(
        'puffy-user',
        JSON.stringify({
          ...savedUser,
          mustChangePassword: false,
          must_change_password: 0,
        })
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice('Password updated successfully.');
    } catch (error) {
      setPasswordNotice(error.message || 'Could not update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="enrolled-dashboard student-settings-dashboard striped-dashboard">
      <aside className="enrolled-sidebar">
        <div className="brand-lockup">
          <img src="/images/logo_solo.png" alt="" />
          <span>PuffyBrain</span>
        </div>

        <nav className="side-nav" aria-label="Student navigation">
          <Link to="/student" className="side-nav-item">
            <Icon name="home" />
            <span>Home</span>
          </Link>
          <Link to="/student/enrolled-courses" className="side-nav-item">
            <Icon name="courses" />
            <span>Enrolled Courses</span>
            <span className="dropdown-mark">v</span>
          </Link>
          <Link to="/student/public-courses" className="side-nav-item plain-nav-item">
            <Icon name="public" />
            <span>Public Courses</span>
          </Link>
          <Link to="/student/archived-courses" className="side-nav-item plain-nav-item">
            <Icon name="archive" />
            <span>Archived classes</span>
          </Link>
          <Link to="/student/settings" className="side-nav-item plain-nav-item active settings-active">
            <Icon name="settings" />
            <span>Settings</span>
          </Link>
        </nav>

        <button className="logout-button">
          <span className="logout-icon" aria-hidden="true">&lt;</span>
          <span>Log-out</span>
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

            <form className="settings-form" onSubmit={handlePasswordChange}>
              <div className="settings-fields">
                <label>
                  <span>Current Password</span>
                  <input
                    type="password"
                    placeholder="enter current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>

                <label>
                  <span>New Password</span>
                  <input
                    type="password"
                    placeholder="enter new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>

                <label>
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    placeholder="re-type new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              </div>

              <div className="settings-photo-column">
                <button
                  type="submit"
                  className="upload-photo-button"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating...' : 'Change Password'}
                </button>
                <p>{passwordNotice || 'Use this after logging in with a temporary password.'}</p>
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
