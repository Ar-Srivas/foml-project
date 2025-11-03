const API_BASE_URL = typeof window !== "undefined"
  ? process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : `${window.location.protocol}//${window.location.hostname}:8000`
  : "http://localhost:8000";

export { API_BASE_URL };