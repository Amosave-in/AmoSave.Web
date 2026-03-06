import { apiClient } from '@/services/http/axios-client';
import { ApiEnvelope, Dictionary } from '@/shared/types/api';

export const AUTH_USER_NAME_STORAGE_KEY = 'amo.authUserName';
export const AUTH_ACCESS_KEY_STORAGE_KEY = 'amo.authAccessKey';
export const KITE_CONNECTED_STORAGE_KEY = 'amo.kiteConnected';
export const KITE_USER_ID_STORAGE_KEY = 'amo.kiteUserId';
export const REFRESH_TOKEN_STORAGE_KEY = 'amo.refreshToken';

export type LoginRequest = {
  username: string;
  password: string;
};

export type CreateSessionRequest = {
  requestToken: string;
};

export type KiteConnectResponse = {
  isKiteConnected: boolean;
  kiteUserId:      string;
  kiteUserName:    string;
  email:           string;
  expiresAt:       string; // ISO date — Kite token expires at 6 AM IST next day
};

// ── Username / Password Auth ─────────────────────────────────────────────────

export function getStoredAuthUserName(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(AUTH_USER_NAME_STORAGE_KEY); } catch { return null; }
}

export function setStoredAuthUserName(value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!value) { window.localStorage.removeItem(AUTH_USER_NAME_STORAGE_KEY); return; }
    window.localStorage.setItem(AUTH_USER_NAME_STORAGE_KEY, value);
  } catch { return; }
}

export function getStoredAuthAccessKey(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(AUTH_ACCESS_KEY_STORAGE_KEY); } catch { return null; }
}

export function setStoredAuthAccessKey(value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!value) { window.localStorage.removeItem(AUTH_ACCESS_KEY_STORAGE_KEY); return; }
    window.localStorage.setItem(AUTH_ACCESS_KEY_STORAGE_KEY, value);
  } catch { return; }
}

// ── Refresh Token ────────────────────────────────────────────────────────────

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY); } catch { return null; }
}

export function setStoredRefreshToken(value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!value) { window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY); return; }
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, value);
  } catch { return; }
}

// ── Kite Connect Session ─────────────────────────────────────────────────────

export function getKiteConnected(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(KITE_CONNECTED_STORAGE_KEY) === 'true'; } catch { return false; }
}

export function setKiteConnected(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (!value) {
      window.localStorage.removeItem(KITE_CONNECTED_STORAGE_KEY);
      window.localStorage.removeItem(KITE_USER_ID_STORAGE_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(KITE_CONNECTED_STORAGE_KEY, 'true');
  } catch { return; }
}

export function setKiteUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!userId) { window.localStorage.removeItem(KITE_USER_ID_STORAGE_KEY); return; }
    window.localStorage.setItem(KITE_USER_ID_STORAGE_KEY, userId);
  } catch { return; }
}

export function getKiteUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(KITE_USER_ID_STORAGE_KEY); } catch { return null; }
}

// ── API Calls ────────────────────────────────────────────────────────────────

export const authService = {
  async login(payload: LoginRequest) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/user-auth/login', payload);
    return response.data;
  },

  async getKiteLoginUrl(): Promise<string> {
    const response = await apiClient.get<ApiEnvelope<{ loginUrl: string }>>('/auth/login-url');
    return response.data.data.loginUrl;
  },

  async createKiteSession(requestToken: string) {
    const response = await apiClient.post<ApiEnvelope<KiteConnectResponse>>('/auth/session', { requestToken } as CreateSessionRequest);
    return response.data;
  },

  async destroyKiteSession() {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/auth/logout');
    return response.data;
  },

  async refreshSession(refreshToken: string) {
    const response = await apiClient.post<ApiEnvelope<Dictionary>>('/auth/refresh', { refreshToken });
    return response.data;
  },
};
