import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  authService,
  setKiteConnected,
  setKiteUserId,
} from '@/services/api/auth.service';

type Status = 'connecting' | 'success' | 'error';

export function KiteCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const didRun = useRef(false);

  useEffect(() => {
    // Strict-mode safe: only run once
    if (didRun.current) return;
    didRun.current = true;

    const requestToken = searchParams.get('request_token');
    const kiteStatus = searchParams.get('status');
    const action = searchParams.get('action');

    // Kite sends ?status=success&action=login&request_token=XXX on success
    // and ?status=failed on failure
    if (kiteStatus === 'failed' || !requestToken) {
      setStatus('error');
      setErrorMessage(kiteStatus === 'failed' ? 'Kite login was cancelled or failed.' : 'No request_token received from Kite.');
      return;
    }

    if (action && action !== 'login') {
      setStatus('error');
      setErrorMessage(`Unexpected Kite action: ${action}`);
      return;
    }

    const connect = async () => {
      try {
        const envelope = await authService.createKiteSession(requestToken);
        if (!envelope.success) {
          setStatus('error');
          setErrorMessage(envelope.error?.message ?? 'Failed to create Kite session.');
          return;
        }

        // Store Kite metadata ONLY — do NOT overwrite the UserAuth JWT
        const kiteUserId = envelope.data?.kiteUserId ?? null;
        setKiteConnected(true);
        setKiteUserId(kiteUserId);
        setStatus('success');

        // If opened as a popup window, close it so the parent tab regains focus.
        // The parent listens for localStorage storage events to detect kiteConnected=true.
        if (window.opener && !window.opener.closed) {
          setTimeout(() => window.close(), 1200);
        } else {
          setTimeout(() => navigate('/app/dashboard'), 1500);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error connecting to Kite.';
        setStatus('error');
        setErrorMessage(message);
      }
    };

    void connect();
  }, [searchParams, navigate]);

  return (
    <div className="login-layout">
      <section className="login-panel">
        <h1>Kite Connect</h1>
        <p>Connecting your Zerodha Kite account to AmoSave for live trading access.</p>
      </section>
      <aside className="login-card">
        {status === 'connecting' && (
          <>
            <h2 className="section-title">Connecting to Kite…</h2>
            <p className="helper" style={{ marginTop: 12 }}>Exchanging your login token. Please wait.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="section-title" style={{ color: 'var(--color-success, #4caf50)' }}>✓ Kite Connected</h2>
            <p className="helper" style={{ marginTop: 12 }}>Your Kite account is linked. This window will close automatically.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="section-title">Connection Failed</h2>
            <p className="error-text" style={{ marginTop: 12 }}>{errorMessage}</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              type="button"
              onClick={() => navigate('/app/watchlist')}
            >
              Continue without Kite
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
