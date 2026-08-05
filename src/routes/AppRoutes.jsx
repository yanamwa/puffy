import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/Forgotpassword';
import ChangePasswordPage from '../pages/auth/Changepassword';
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
import ReportsPage from '../pages/admin/reports/ReportsPage';
import AdminAccountPage from '../pages/admin/settings/AdminAccountPage';
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
import ProfessorProfile from '../pages/professor/ProfessorProfile';
import ProfessorSetting from '../pages/professor/ProfessorSetting';

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

import FlashcardsTutorial from '../pages/quizzes/inQuiz/tutorials/flashcards-tutorial';
import MatchingTutorial from '../pages/quizzes/inQuiz/tutorials/matching-tutorial';
import MultipleChoiceTutorial from '../pages/quizzes/inQuiz/tutorials/multipleChoice-Tutorial';
import QandATutorial from '../pages/quizzes/inQuiz/tutorials/QandA-tutorial';
import SurvivalTutorial from '../pages/quizzes/inQuiz/tutorials/survival-tutorial';
import TimedQuizTutorial from '../pages/quizzes/inQuiz/tutorials/timedquiz-tutorial';
import FlashcardQuiz from '../pages/quizzes/inQuiz/inQuiz/realFlashcard';
import MatchingQuiz from '../pages/quizzes/inQuiz/inQuiz/matching';
import MultipleChoiceQuiz from '../pages/quizzes/inQuiz/inQuiz/multiplechoice';
import QandAQuiz from '../pages/quizzes/inQuiz/inQuiz/qanda';
import SurvivalQuiz from '../pages/quizzes/inQuiz/inQuiz/survival';
import TimedQuiz from '../pages/quizzes/inQuiz/inQuiz/timedinquiz';

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
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/recover-account" element={<RecoverAccountPage />} />

        {/* ==========================
            APP ROUTES
            Temporarily public while link-only account flows are tested.
        ========================== */}

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
                <NotificationPage variant="announcement" />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/mode"
            element={
              <SuperAdminLayout>
                <ModePage />
              </SuperAdminLayout>
            }
          />

          <Route
            path="/super-admin/modes"
            element={<Navigate to="/super-admin/mode" replace />}
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
            path="/super-admin/profile"
            element={
              <SuperAdminLayout>
                <SuperAdminFeaturePage type="profile" />
              </SuperAdminLayout>
            }
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
                <ReportsPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/modules"
            element={<Navigate to="/admin/courses" replace />}
          />

          <Route
            path="/admin/profile"
            element={
              <AdminLayout>
                <AdminAccountPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/settings"
            element={<Navigate to="/admin/profile" replace />}
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
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route
            path="/admin/modes"
            element={<Navigate to="/admin/dashboard" replace />}
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

          <Route element={<ProtectedRoute />}>

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
            <Route path="profile" element={<ProfessorProfile />}/>
            <Route path="change-password" element={<ProfessorFeaturePage path="/professor/change-password" />} />
            <Route path="settings" element={<ProfessorSetting />} />
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

        </Route>

          {/* ==========================
              COURSE STUDY FLOW
          ========================== */}
          <Route path="/learning/:lessonId" element={<LearningRedirect />} />
          <Route path="/introduction/:lessonId" element={<Introduction />} />
          <Route path="/lesson/:lessonId" element={<Lesson />} />
          <Route path="/review/deck/:deckId" element={<LessonResult />} />
          <Route path="/review/:lessonId" element={<LessonResult />} />

          {/* ==========================
              QUIZ MODE TUTORIALS
          ========================== */}
          <Route path="/flashcards-tutorial" element={<FlashcardsTutorial />} />
          <Route path="/flashcards-tutorial/lesson/:lessonId" element={<FlashcardsTutorial />} />
          <Route path="/flashcards-tutorial/deck/:deckId" element={<FlashcardsTutorial />} />
          <Route path="/QandA-tutorial" element={<QandATutorial />} />
          <Route path="/QandA-tutorial/lesson/:lessonId" element={<QandATutorial />} />
          <Route path="/QandA-tutorial/deck/:deckId" element={<QandATutorial />} />
          <Route path="/qna-tutorial" element={<QandATutorial />} />
          <Route path="/qna-tutorial/lesson/:lessonId" element={<QandATutorial />} />
          <Route path="/qna-tutorial/deck/:deckId" element={<QandATutorial />} />
          <Route path="/multipleChoice-tutorial" element={<MultipleChoiceTutorial />} />
          <Route path="/multipleChoice-tutorial/lesson/:lessonId" element={<MultipleChoiceTutorial />} />
          <Route path="/multipleChoice-tutorial/deck/:deckId" element={<MultipleChoiceTutorial />} />
          <Route path="/multiple-choice-tutorial" element={<MultipleChoiceTutorial />} />
          <Route path="/multiple-choice-tutorial/lesson/:lessonId" element={<MultipleChoiceTutorial />} />
          <Route path="/multiple-choice-tutorial/deck/:deckId" element={<MultipleChoiceTutorial />} />
          <Route path="/Matching-tutorial" element={<MatchingTutorial />} />
          <Route path="/Matching-tutorial/lesson/:lessonId" element={<MatchingTutorial />} />
          <Route path="/Matching-tutorial/deck/:deckId" element={<MatchingTutorial />} />
          <Route path="/matching-tutorial" element={<MatchingTutorial />} />
          <Route path="/matching-tutorial/lesson/:lessonId" element={<MatchingTutorial />} />
          <Route path="/matching-tutorial/deck/:deckId" element={<MatchingTutorial />} />
          <Route path="/timedquiz-tutorial" element={<TimedQuizTutorial />} />
          <Route path="/timedquiz-tutorial/lesson/:lessonId" element={<TimedQuizTutorial />} />
          <Route path="/timedquiz-tutorial/deck/:deckId" element={<TimedQuizTutorial />} />
          <Route path="/survival-tutorial" element={<SurvivalTutorial />} />
          <Route path="/survival-tutorial/lesson/:lessonId" element={<SurvivalTutorial />} />
          <Route path="/survival-tutorial/deck/:deckId" element={<SurvivalTutorial />} />

          {/* ==========================
              QUIZ MODE PLAYERS
          ========================== */}
          <Route path="/flashcard/lesson/:lessonId" element={<FlashcardQuiz />} />
          <Route path="/flashcard/deck/:deckId" element={<FlashcardQuiz />} />
          <Route path="/qna/lesson/:lessonId" element={<QandAQuiz />} />
          <Route path="/qna/deck/:deckId" element={<QandAQuiz />} />
          <Route path="/multiple-choice/lesson/:lessonId" element={<MultipleChoiceQuiz />} />
          <Route path="/multiple-choice/deck/:deckId" element={<MultipleChoiceQuiz />} />
          <Route path="/matching-type/lesson/:lessonId" element={<MatchingQuiz />} />
          <Route path="/matching-type/deck/:deckId" element={<MatchingQuiz />} />
          <Route path="/timedquiz/lesson/:lessonId" element={<TimedQuiz />} />
          <Route path="/timedquiz/deck/:deckId" element={<TimedQuiz />} />
          <Route path="/survival/lesson/:lessonId" element={<SurvivalQuiz />} />
          <Route path="/survival/deck/:deckId" element={<SurvivalQuiz />} />

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
