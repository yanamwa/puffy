import { APP_ROLES, getUserRole } from './roles.js';

export function requiresStudentPasswordChange(user) {
  const flag = user?.mustChangePassword ?? user?.must_change_password;
  return getUserRole(user) === APP_ROLES.STUDENT &&
    (flag === true || flag === 1 || flag === '1' || flag === 'true');
}
