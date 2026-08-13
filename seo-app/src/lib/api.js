import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("seo_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.getItem("seo_refresh_token")
    ) {
      original._retry = true;
      try {
        const result = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken: localStorage.getItem("seo_refresh_token") },
        );
        localStorage.setItem(
          "seo_access_token",
          result.data.data.accessToken,
        );
        original.headers.Authorization = `Bearer ${result.data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
      }
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";
export default api;
