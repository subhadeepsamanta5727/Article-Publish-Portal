import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
const getCookie = (name) => document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=")[1];
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("seo_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCookie("seo_csrf_token");
  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  return config;
});
api.interceptors.response.use(
  (response) => {
    // For blob responses (file downloads), return the blob directly
    if (response.data instanceof Blob) {
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      getCookie("seo_csrf_token")
    ) {
      original._retry = true;
      try {
        const result = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true, headers: { "X-CSRF-Token": getCookie("seo_csrf_token") } },
        );
        localStorage.setItem(
          "seo_access_token",
          result.data.data.accessToken,
        );
        original.headers.Authorization = `Bearer ${result.data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("seo_access_token");
      }
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";
export default api;
