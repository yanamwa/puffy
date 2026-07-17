import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/Forgotpassword';
import ForgotUsernamePage from '../pages/auth/forgotuser';
import CannotSignInPage from '../pages/auth/Cant_sign';
import OtpPage from '../pages/auth/Otp';
import RecoverAccountPage from '../pages/auth/RecoverAccount';

import AdminHome from '../pages/admin/AdminHome';
import AdminLayout from '../pages/admin/shared/AdminLayout';
import DashboardPage from '../pages/admin/dashboard/DashboardPage';
import UserManagementPage from '../pages/admin/users/UserManagementPage';
import ModuleManagementPage from '../pages/admin/modules/ModuleManagementPage';
import NotificationPage from '../pages/admin/notification/NotificationPage';
import ModePage from '../pages/admin/mode/ModePage';
import DecksPage from '../pages/admin/decks/DecksPage';
import SuperAdminHome from '../pages/superadmin/SuperAdminHome';
import SuperAdminLayout from '../pages/superadmin/shared/SuperAdminLayout';
import SuperAdminUserManagementPage from '../pages/superadmin/users/SuperAdminUserManagementPage';
import SuperAdminFeaturePage from '../pages/superadmin/SuperAdminFeaturePage';
import SuperAdminBackupPage from '../pages/superadmin/backup/SuperAdminBackupPage';

import ProfessorHome from '../pages/professor/ProfessorHome';
import ProfessorLayout from '../pages/professor/ProfessorLayout';
import ProfessorFeaturePage from '../pages/professor/ProfessorFeaturePage';
import ModuleManagement from '../pages/professor/modulemanagement';
import AddModule from '../pages/professor/AddModule';
import ProfessorNotifications from '../pages/professor/ProfessorNotifications';

import StudentHome from '../pages/student/StudentHome';
import EnrolledCourses from '../pages/student/EnrolledCourses';
import PublicCourses from '../pages/student/PublicCourses';
import ArchivedCourses from '../pages/student/ArchivedCourses';
import StudentSettings from '../pages/student/StudentSettings';
import StudentCourseDetail from '../pages/student/StudentCourseDetail';
import StudentJoinCourse from '../pages/student/StudentJoinCourse';
import StudentProfile from '../pages/student/StudentProfile';

import Introduction from '../pages/course/Introduction';
import Lesson from '../pages/course/Lesson';
import LessonResult from '../pages/course/LessonResult';

import Welcome from '../pages/new user/Welcome';
import HowItWorks from '../pages/new user/HowItWorks';
import Name from '../pages/new user/Name';
import Year from '../pages/new user/Year';
import Section from '../pages/new user/Section';
import Profile from '../pages/new user/Profile';

function LearningRedirect() {
  const { lessonId } = useParams();
  return <Navigate to={`/introduction/${lessonId}`} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>

        {/* ==========================
            PUBLIC ROUTES (Guest)
        ========================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/forgot-username" element={<ForgotUsernamePage />} />
        <Route path="/cant-signin" element={<CannotSignInPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/recover-account" element={<RecoverAccountPage />} />

        {/* ==========================
            PROTECTED ROUTES
            (Authenticated Users Only)
        ========================== */}
        <Route element={<ProtectedRoute />}>

          {/* ==========================
              NEW USER ONBOARDING
          ========================== */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/name" element={<Name />} />
          <Route path="/year" element={<Year />} />
          <Route path="/section" element={<Section />} />
          <Route path="/profile" element={<Profile />} />

          {/* ==========================
              SUPER ADMIN
          ========================== */}
          <Route
            path="/super-admin"
            element={
              <SuperAdminLayout>
                <SuperAdminHome />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/dashboard"
            element={
              <SuperAdminLayout>
                <SuperAdminHome />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/users"
            element={
              <SuperAdminLayout>
                <SuperAdminUserManagementPage />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/analytics"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="analytics" />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/courses"
            element={
              <SuperAdminLayout>
                <ModuleManagementPage />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/announcements"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="announcements" />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/audit-logs"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="audit" />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/archives"
            element={<Navigate to="/super-admin/users" replace />}
          />

          <Route
            path="/super-admin/backup"
            element={
              <SuperAdminLayout>
                <SuperAdminBackupPage />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/settings"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="settings" />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/security"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="security" />
              </SuperAdminLayout>
            }
          />

          {/* ==========================
              ADMIN
          ========================== */}
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminHome />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminLayout>
                <UserManagementPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/courses"
            element={
              <AdminLayout>
                <ModuleManagementPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/modules"
            element={<Navigate to="/admin/courses" replace />}
          />

          <Route
            path="/admin/settings"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route
            path="/admin/notification"
            element={
              <AdminLayout>
                <NotificationPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/mode"
            element={
              <AdminLayout>
                <ModePage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/modes"
            element={<Navigate to="/admin/mode" replace />}
          />

          <Route
            path="/admin/decks"
            element={
              <AdminLayout>
                <DecksPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/backup"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* ==========================
              PROFESSOR
          ========================== */}
          <Route path="/professor" element={<ProfessorLayout />}>
            <Route index element={<Navigate to="/professor/dashboard" replace />} />
            <Route path="dashboard" element={<ProfessorHome />} />
            <Route path="courses" element={<ModuleManagement />} />
            <Route path="courses/new" element={<AddModule />} />
            <Route path="courses/edit/:id" element={<AddModule />} />
            <Route path="students" element={<ProfessorFeaturePage path="/professor/students" />} />
            <Route path="notifications" element={<ProfessorNotifications />} />
            <Route path="profile" element={<ProfessorFeaturePage path="/professor/profile" />} />
            <Route path="change-password" element={<ProfessorFeaturePage path="/professor/change-password" />} />
          </Route>

          {/* ==========================
              STUDENT
          ========================== */}
          <Route
            path="/student"
            element={<StudentHome />}
          />

          <Route
            path="/student/enrolled-courses"
            element={<EnrolledCourses />}
          />

          <Route
            path="/student/enrolled-courses/:courseId"
            element={<StudentCourseDetail />}
          />

          <Route
            path="/student/join"
            element={<StudentJoinCourse />}
          />

          <Route
            path="/student/public-courses"
            element={<PublicCourses />}
          />

          <Route
            path="/student/archived-courses"
            element={<ArchivedCourses />}
          />

          <Route
            path="/student/settings"
            element={<StudentSettings />}
          />

          <Route path="/student/profile" 
          element={<StudentProfile />} 
          />

          {/* ==========================
              COURSE STUDY FLOW
          ========================== */}
          <Route path="/learning/:lessonId" element={<LearningRedirect />} />
          <Route path="/introduction/:lessonId" element={<Introduction />} />
          <Route path="/lesson/:lessonId" element={<Lesson />} />
          <Route path="/review/:lessonId" element={<LessonResult />} />
        </Route>

        {/* ==========================
            DEFAULT ROUTE
        ========================== */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Route>
    </Routes>
  );
}
