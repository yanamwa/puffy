export const APP_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROFESSOR: 'professor',
  STUDENT: 'student',
};

export function normalizeRole(role = '') {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (['super_admin', 'superadmin', 'superadministrator'].includes(normalized)) {
    return APP_ROLES.SUPER_ADMIN;
  }

  if (['admin', 'administrator'].includes(normalized)) {
    return APP_ROLES.ADMIN;
  }

  if (['professor', 'instructor', 'teacher', 'faculty'].includes(normalized)) {
    return APP_ROLES.PROFESSOR;
  }

  if (['student', 'learner'].includes(normalized)) {
    return APP_ROLES.STUDENT;
  }

  return '';
}

export function getUserRole(user = {}) {
  return normalizeRole(user?.role || user?.userRole || user?.user_role);
}

export function withNormalizedRole(user = {}) {
  const role = getUserRole(user);

  return role
    ? {
        ...user,
        role,
        userRole: role,
        user_role: role,
      }
    : user;
}

export function getHomePathForRole(role = '') {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === APP_ROLES.SUPER_ADMIN) return '/super-admin';
  if (normalizedRole === APP_ROLES.ADMIN) return '/admin';
  if (normalizedRole === APP_ROLES.PROFESSOR) return '/professor';
  if (normalizedRole === APP_ROLES.STUDENT) return '/student';

  return '/login';
}

