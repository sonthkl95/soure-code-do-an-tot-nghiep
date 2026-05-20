import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "", // ví dụ: http://localhost:8082
  withCredentials: true, // ✅ gửi cookie
  headers: { "Content-Type": "application/json" },
});

// Optional: interceptor xử lý 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // bạn có thể handle refresh token ở đây nếu backend support
    return Promise.reject(err);
  }
);
