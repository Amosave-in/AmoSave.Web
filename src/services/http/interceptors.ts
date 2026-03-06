import axios, { AxiosInstance } from 'axios';
import {
  AUTH_ACCESS_KEY_STORAGE_KEY,
  AUTH_USER_NAME_STORAGE_KEY,
  KITE_CONNECTED_STORAGE_KEY,
  KITE_USER_ID_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getStoredRefreshToken,
  setStoredRefreshToken,
  setStoredAuthAccessKey,
} from '@/services/api/auth.service';

const BOOTSTRAP_KEY = 'auto-bootstrap';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

function clearAuthAndRedirect() {
  // Don't redirect if we're still in the bootstrap phase
  const current = (() => {
    try { return window.localStorage.getItem(AUTH_ACCESS_KEY_STORAGE_KEY); } catch { return null; }
  })();
  if (current === BOOTSTRAP_KEY) return;

  try {
    window.localStorage.removeItem(AUTH_ACCESS_KEY_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_NAME_STORAGE_KEY);
    window.localStorage.removeItem(KITE_CONNECTED_STORAGE_KEY);
    window.localStorage.removeItem(KITE_USER_ID_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // no-op
  }
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export function applyInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const headers = config.headers ?? {};
    headers['x-correlation-id'] = crypto.randomUUID();
    if (typeof window !== 'undefined') {
      try {
        const accessKey = window.localStorage.getItem('amo.authAccessKey');
        // Never send the bootstrap placeholder — it will cause a 401
        if (accessKey && accessKey !== BOOTSTRAP_KEY) {
          headers['X-Access-Key'] = accessKey;
          headers.Authorization = `Bearer ${accessKey}`;
        }


      } catch {
        // no-op
      }
    }
    config.headers = headers;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      type AxiosErrorShape = {
        response?: { status?: number; data?: { error?: { code?: string } } };
        config?: Record<string, unknown> & { headers?: Record<string, string> };
      };
      const axiosError = error as AxiosErrorShape;
      const status = axiosError?.response?.status;
      const originalRequest = axiosError?.config;

      if (status !== 401 || !originalRequest || originalRequest['_retry']) {
        return Promise.reject(error);
      }

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          const headers = originalRequest.headers ?? {};
          headers['Authorization'] = `Bearer ${token}`;
          headers['X-Access-Key'] = token;
          originalRequest.headers = headers;
          return client(originalRequest);
        });
      }

      originalRequest['_retry'] = true;
      isRefreshing = true;

      try {
        const baseURL = (client.defaults.baseURL as string | undefined) ?? '/api/v1';
        const response = await axios.post<{ data: { accessToken?: string; refreshToken?: string } }>(
          `${baseURL}/auth/refresh`,
          { refreshToken },
        );
        const newAccessToken = response.data?.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken;

        if (!newAccessToken) throw new Error('No access token in refresh response');

        setStoredAuthAccessKey(newAccessToken);
        if (newRefreshToken) setStoredRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        const headers = originalRequest.headers ?? {};
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        headers['X-Access-Key'] = newAccessToken;
        originalRequest.headers = headers;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
