import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseUrl = "http://localhost:3001/";

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

const refreshClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

let refreshPromise: Promise<unknown> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh-token") || originalRequest._retry) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshClient.post("/auth/refresh-token", {});
      await refreshPromise;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);