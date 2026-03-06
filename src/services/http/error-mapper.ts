import type { AxiosError } from 'axios';

export interface MappedError {
  message: string;
  code?: string;
  isKiteNotConnected: boolean;
}

function extractFromAxios(error: unknown): MappedError | null {
  const axiosErr = error as AxiosError<{
    error?: { code?: string; message?: string };
    message?: string;
  }>;

  if (axiosErr?.response?.data) {
    const data = axiosErr.response.data;
    const code = data?.error?.code;
    const message = data?.error?.message ?? data?.message ?? 'An error occurred.';
    return { message, code, isKiteNotConnected: code === 'KITE_NOT_CONNECTED' };
  }

  if (axiosErr?.request && !axiosErr?.response) {
    return {
      message: 'Cannot reach the server. Check that AmoSave.Api is running on port 5208.',
      code: 'NETWORK_ERROR',
      isKiteNotConnected: false,
    };
  }

  return null;
}

/** Returns readable error string — backward-compatible with all existing pages */
export function mapHttpError(error: unknown): string {
  const mapped = extractFromAxios(error);
  if (mapped) return mapped.message;
  return (error as { message?: string })?.message ?? 'Request failed. Please try again.';
}

/** Returns full structured error — use with AsyncState for rich error UI */
export function mapHttpErrorFull(error: unknown): MappedError {
  const mapped = extractFromAxios(error);
  if (mapped) return mapped;
  return {
    message: (error as { message?: string })?.message ?? 'Request failed. Please try again.',
    isKiteNotConnected: false,
  };
}
