import axios from "axios";

export const API_BASE_URL =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? "" // Always use relative path on HTTPS (Vercel) to route through reverse proxy
    : (import.meta.env.VITE_API_URL ||
       (typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
         ? "http://localhost:5000"
         : ""));

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || fallback;

export default api;
