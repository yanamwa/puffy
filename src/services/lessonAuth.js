export function lessonAuthHeaders() {
  const token = localStorage.getItem('puffy-token') || localStorage.getItem('token') ||
    localStorage.getItem('authToken') || sessionStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
