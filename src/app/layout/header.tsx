import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  getKiteConnected,
  getStoredAuthAccessKey,
  getStoredAuthUserName,
  authService,
  setKiteConnected,
  setStoredAuthAccessKey,
  setStoredAuthUserName,
} from '@/services/api/auth.service';
import { apiClient } from '@/services/http/axios-client';
import { KiteConnectModal } from '@/features/auth/components/kite-connect-modal';

export function Header() {
  const navigate = useNavigate();
  const profileName = getStoredAuthUserName() ?? 'Guest';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [kiteConnected, setKiteConnectedState] = useState(getKiteConnected);
  const [showKiteModal, setShowKiteModal]       = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Verify actual Kite connectivity from server on mount
  useEffect(() => {
    const accessKey = getStoredAuthAccessKey();
    if (!accessKey || accessKey === 'auto-bootstrap') return;
    apiClient
      .get<{ data: { isKiteConnected?: boolean } }>('/auth/kite-status')
      .then((res) => {
        const connected = res.data?.data?.isKiteConnected === true;
        setKiteConnectedState(connected);
        if (connected) {
          setKiteConnected(true);
        } else {
          try { window.localStorage.removeItem('amo.kiteConnected'); } catch { /* no-op */ }
        }
      })
      .catch(() => {
        // Silently ignore — server may be unreachable
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync Kite status when storage changes (e.g., after callback redirect)
  useEffect(() => {
    const onStorage = () => setKiteConnectedState(getKiteConnected());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      setIsMenuOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isMenuOpen]);

  const handleLogout = () => {
    setStoredAuthUserName(null);
    setStoredAuthAccessKey(null);
    setKiteConnected(false);
    setKiteConnectedState(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleConnectKite = () => {
    const accessKey = getStoredAuthAccessKey();
    if (!accessKey) { navigate('/'); return; }
    setShowKiteModal(true);
  };

  const handleDisconnectKite = async () => {
    setIsMenuOpen(false);
    try {
      await authService.destroyKiteSession();
    } finally {
      setKiteConnected(false);
      setKiteConnectedState(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">AmoSave</div>
        <div className="app-header__status" aria-label="Market status">
          <span className="status-dot" />
          Market Open · NIFTY 50
        </div>

      {/* Kite connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', marginRight: 12 }}>
        {kiteConnected ? (
          <span
            style={{ fontSize: 12, color: 'var(--color-success, #4caf50)', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Kite Connected"
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            Kite Live
          </span>
        ) : (
          <button
            className="btn"
            style={{ fontSize: 12, padding: '2px 10px' }}
            type="button"
            onClick={handleConnectKite}
            title="Connect Zerodha Kite for live trading"
          >
            Connect Kite
          </button>
        )}
      </div>

      <div className="app-header__profile-wrap" ref={menuRef}>
        <button
          className="app-header__profile"
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          {profileName}
        </button>
        {isMenuOpen ? (
          <div className="app-header__profile-menu" role="menu" aria-label="Profile menu">
            <NavLink className="app-header__profile-menu-item" to="/app/settings/user" role="menuitem" onClick={() => setIsMenuOpen(false)}>
              User Setting
            </NavLink>
            <NavLink className="app-header__profile-menu-item" to="/app/settings/system" role="menuitem" onClick={() => setIsMenuOpen(false)}>
              System Setting
            </NavLink>
            {kiteConnected && (
              <button className="app-header__profile-menu-item" type="button" role="menuitem" onClick={handleDisconnectKite}>
                Disconnect Kite
              </button>
            )}
            <button className="app-header__profile-menu-item" type="button" role="menuitem" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>

    {showKiteModal && (
      <KiteConnectModal
        onConnected={() => {
          setKiteConnectedState(true);
          setKiteConnected(true);
          setShowKiteModal(false);
        }}
        onClose={() => setShowKiteModal(false)}
      />
    )}
    </>
  );
}
