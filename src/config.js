const configuredApiBase =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api";

export const API_BASE = configuredApiBase.replace(/\/+$/, "");
