import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();

  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot",
    "/forgot-username",
    "/cant-signin",
    "/otp",
    "/recover-account",
  ].includes(location.pathname);

  const isStudentDashboard =
    location.pathname.startsWith("/student");

  const isSuperAdminArea =
    location.pathname.startsWith("/super-admin");

  const isAdminArea =
    location.pathname.startsWith("/admin");

  const isProfessorArea =
    location.pathname.startsWith("/professor");

  const isCourseArea = [
    "/learning",
    "/introduction",
    "/lesson",
    "/review",
  ].some((path) =>
    location.pathname.startsWith(path)
  );

  const isOnboardingPage = [
    "/welcome",
    "/how-it-works",
    "/name",
    "/year",
    "/section",
    "/profile",
  ].includes(location.pathname);

  if (
    isAuthPage ||
    isStudentDashboard ||
    isSuperAdminArea ||
    isAdminArea ||
    isProfessorArea ||
    isCourseArea ||
    isOnboardingPage
  ) {
    return <Outlet />;
  }

  return (
    <div className="app-shell">
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}