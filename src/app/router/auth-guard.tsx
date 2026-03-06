import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import {
  getStoredAuthAccessKey,
  setStoredAuthAccessKey,
  setStoredAuthUserName,
  getStoredRefreshToken,
  setStoredRefreshToken,
  authService,
} from '@/services/api/auth.service';

const BOOTSTRAP_KEY = 'auto-bootstrap';

function loginWithUserAuth() {
  return authService
    .login({ username: 'Admin', password: 'Kosuru@1234' })
    .then((envelope) => {
      const token =
        (envelope.data?.accessToken as string | undefined) ??
        (envelope.data?.accessKey as string | undefined);
      if (token) {
        setStoredAuthUserName('Admin');
        setStoredAuthAccessKey(token);
      }
    })
    .catch(() => {
      // API unreachable — keep bootstrap key so interceptor doesn't hard-redirect
    });
}

/**
 * Auto-logs in silently in the background. Always renders children immediately
 * so there is no loading flash or blink.
 */
export function AuthGuard() {
  useEffect(() => {
    const current = getStoredAuthAccessKey();
    if (current && current !== BOOTSTRAP_KEY) return; // real token already stored

    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      // Try to restore Kite session from refresh token
      authService
        .refreshSession(refreshToken)
        .then((envelope) => {
          const token =
            (envelope.data?.accessToken as string | undefined) ??
            (envelope.data?.accessKey as string | undefined);
          const newRefreshToken = envelope.data?.refreshToken as string | undefined;
          if (token) {
            setStoredAuthAccessKey(token);
            if (newRefreshToken) setStoredRefreshToken(newRefreshToken);
          }
        })
        .catch(() => {
          // Refresh token expired — clear it and fall back to UserAuth auto-login
          setStoredRefreshToken(null);
          loginWithUserAuth();
        });
    } else {
      loginWithUserAuth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always render children immediately — no loading state, no blink
  return <Outlet />;
}
