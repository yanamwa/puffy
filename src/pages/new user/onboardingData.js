export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SECTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("puffy-user") || "null") || {};
  } catch {
    return {};
  }
}

export function updateStoredUser(updates) {
  const currentUser = getStoredUser();
  const nextUser = {
    ...currentUser,
    ...updates,
  };

  localStorage.setItem("puffy-user", JSON.stringify(nextUser));

  if (nextUser.email) localStorage.setItem("user_email", nextUser.email);
  if (nextUser.role) localStorage.setItem("user_role", nextUser.role);
  if (nextUser.name || nextUser.displayName) {
    localStorage.setItem("username", nextUser.displayName || nextUser.name);
  }
  if (nextUser.yearLevel || nextUser.year_level) {
    localStorage.setItem("year_level", nextUser.yearLevel || nextUser.year_level);
  }
  if (nextUser.sectionName || nextUser.section_name) {
    localStorage.setItem(
      "section_name",
      nextUser.sectionName || nextUser.section_name
    );
  }

  return nextUser;
}

export function getCurrentEmail() {
  return localStorage.getItem("user_email") || getStoredUser().email || "";
}

export function getCurrentRole() {
  return localStorage.getItem("user_role") || getStoredUser().role || "student";
}

export function getCurrentYear() {
  const storedUser = getStoredUser();
  return (
    localStorage.getItem("year_level") ||
    storedUser.yearLevel ||
    storedUser.year_level ||
    ""
  );
}

export function getYearNumber(yearLevel) {
  return String(yearLevel || "").match(/[1-4]/)?.[0] || "";
}

export function getSectionOptions(yearLevel) {
  const yearNumber = getYearNumber(yearLevel);
  const years = yearNumber ? [yearNumber] : ["1", "2", "3", "4"];

  return years.flatMap((year) =>
    SECTION_LETTERS.map((letter) => `${year}${letter}`)
  );
}

export function getDashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "professor") return "/professor";
  return "/student";
}
