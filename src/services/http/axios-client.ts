import axios from 'axios';
import { applyInterceptors } from '@/services/http/interceptors';

export const API_BASE_URL_STORAGE_KEY = 'amo.apiBaseUrl';
export const API_KEY_STORAGE_KEY = 'amo.apiKey';

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5208/api/v1';
const defaultApiKey = import.meta.env.VITE_API_KEY ?? 'ug5uugdjpf9ortiw';

export function getDefaultApiBaseUrl(): string {
  return defaultBaseUrl;
}

export function getDefaultApiKey(): string {
  return defaultApiKey;
}

export function getStoredApiBaseUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiBaseUrl(value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(API_KEY_STORAGE_KEY, value);
  } catch {
    return;
  }
}

export function getApiBaseUrl(): string {
  return getStoredApiBaseUrl() ?? defaultBaseUrl;
}

export function getApiKey(): string {
  return getStoredApiKey() ?? defaultApiKey;
}

/** Ensures a value from an API response is always a plain array. */
export function toSafeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
});

applyInterceptors(apiClient);
