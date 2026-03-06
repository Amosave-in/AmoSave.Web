import { useEffect, useRef, useState } from 'react';
import { authService, getKiteConnected, setKiteUserId, setKiteConnected } from '@/services/api/auth.service';

type ModalStep = 'loading' | 'ready' | 'waiting' | 'success' | 'error';

type Props = {
  onConnected: () => void;
  onClose:     () => void;
};

/**
 * Modal dialog for linking a Zerodha Kite account.
 *
 * Flow:
 *  1. Fetch the Kite login URL from the API.
 *  2. "Open Kite Login" → opens kite.zerodha.com in a popup window.
 *  3. After user logs in, Kite redirects the popup to /kite-callback?request_token=XXX.
 *  4. kite-callback exchanges the token (still using UserAuth JWT), sets kiteConnected=true.
 *  5. This modal detects the storage event → calls onConnected() → closes itself.
 */
export function KiteConnectModal({ onConnected, onClose }: Props) {
  const [step, setStep]         = useState<ModalStep>('loading');
  const [loginUrl, setLoginUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const popupRef                = useRef<Window | null>(null);

  // Fetch login URL on mount
  useEffect(() => {
    authService.getKiteLoginUrl()
      .then((url) => { setLoginUrl(url); setStep('ready'); })
      .catch(() => { setErrorMsg('Failed to fetch Kite login URL. Check API connection.'); setStep('error'); });
  }, []);

  // Listen for localStorage change from the kite-callback popup
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'amo.kiteConnected' && event.newValue === 'true') {
        setStep('success');
        onConnected();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [onConnected]);

  // Poll popup window in case it's from the same origin (storage events don't fire in same tab)
  useEffect(() => {
    if (step !== 'waiting') return;
    const interval = setInterval(() => {
      if (getKiteConnected()) {
        setStep('success');
        onConnected();
        clearInterval(interval);
      }
      // Auto-close if popup was closed manually without completing auth
      if (popupRef.current?.closed) {
        clearInterval(interval);
        if (!getKiteConnected()) setStep('ready'); // let user retry
      }
    }, 800);
    return () => clearInterval(interval);
  }, [step, onConnected]);

  const openKiteLogin = () => {
    const width  = 900;
    const height = 650;
    const left   = Math.round(window.screenX + (window.outerWidth  - width)  / 2);
    const top    = Math.round(window.screenY + (window.outerHeight - height) / 2);
    popupRef.current = window.open(
      loginUrl,
      'KiteLogin',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (!popupRef.current) {
      setErrorMsg('Popup was blocked. Please allow popups for this site and try again.');
      setStep('error');
      return;
    }
    setStep('waiting');
  };

  const handleRetry = () => {
    setErrorMsg('');
    setStep('ready');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect Kite"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e2028)',
          border: '1px solid var(--color-border, #2e3140)',
          borderRadius: 12,
          padding: '32px 36px',
          width: 420,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Connect Kite</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {step === 'loading' && (
          <p className="helper">Loading Kite login URL…</p>
        )}

        {/* Ready */}
        {step === 'ready' && (
          <>
            <p className="helper" style={{ marginBottom: 20, lineHeight: 1.6 }}>
              Click the button below to open the Zerodha Kite login page in a new window.
              After you log in, this modal will automatically detect the connection.
            </p>
            <button className="btn btn-primary" type="button" style={{ width: '100%' }} onClick={openKiteLogin}>
              Open Kite Login
            </button>
          </>
        )}

        {/* Waiting for callback */}
        {step === 'waiting' && (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--color-border, #2e3140)',
                borderTop: '3px solid var(--color-primary, #7c6af7)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p className="helper">Waiting for Kite authorization…</p>
              <p className="helper" style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>
                Complete the login in the popup window.
              </p>
            </div>
            <button
              className="btn"
              type="button"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => { popupRef.current?.close(); setStep('ready'); }}
            >
              Cancel
            </button>
          </>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h3 style={{ color: 'var(--color-success, #4caf50)', margin: '0 0 8px' }}>Kite Connected!</h3>
            <p className="helper">Your Zerodha account is now linked for live trading.</p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <>
            <p className="error-text" style={{ marginBottom: 16 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="button" style={{ flex: 1 }} onClick={handleRetry}>
                Retry
              </button>
              <button className="btn" type="button" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
