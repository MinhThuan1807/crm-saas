import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Dùng Next.js proxy (/api/*) thay vì gọi thẳng cross-origin
// Giúp cookie sameSite: 'lax' hoạt động vì FE và proxy cùng origin
const baseUrl = "/api/";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// refreshClient dùng cùng baseURL proxy, không cần timeout dài
const refreshClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    // Không phải lỗi 401, không có config, hoặc là request login/register -> reject bình thường
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest.url?.includes("auth/login") ||
      originalRequest.url?.includes("auth/register")
    ) {
      return Promise.reject(error);
    }

    // Nếu chính request refresh-token bị 401, hoặc đã retry rồi → logout
    if (
      originalRequest.url?.includes("auth/refresh-token") ||
      originalRequest._retry
    ) {
      isRefreshing = false;
      processQueue(error);
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Nếu đang refresh, đưa request vào queue chờ
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          // Đánh dấu _retry SAU khi đã được queue resolve
          // để tránh redirect nhầm nếu retry này cũng 401
          originalRequest._retry = true;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Bắt đầu refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshClient.post("auth/refresh-token", {});
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
