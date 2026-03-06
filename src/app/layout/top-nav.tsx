import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  getKiteConnected,
  getStoredAuthUserName,
  authService,
  setKiteConnected,
  setStoredAuthAccessKey,
  setStoredAuthUserName,
} from '@/services/api/auth.service';

interface DropdownItem {
  label: string;
  to: string;
  badge?: string;
}

const TRADE_ITEMS: DropdownItem[] = [
  { label: 'Strategy Builder', to: '/app/strategy-builder' },
  { label: 'Trade Strategies', to: '/app/trade/strategies' },
  { label: 'Expiry Trades', to: '/app/trade/expiry-trades' },
  { label: 'Easy Options', to: '/app/trade/easy-options' },
  { label: 'Draft Portfolios', to: '/app/trade/drafts' },
];

const ANALYSE_ITEMS: DropdownItem[] = [
  { label: 'Open Interest', to: '/app/analyse/open-interest' },
  { label: 'Multi-Strike OI', to: '/app/analyse/multistrike-oi' },
  { label: 'FII / DII Data', to: '/app/analyse/fii-dii' },
  { label: 'Live Options Charts', to: '/app/analyse/live-charts' },
  { label: 'Straddle Charts', to: '/app/analyse/straddle-charts' },
  { label: 'Futures Data', to: '/app/analyse/futures-data' },
  { label: 'Options Screener', to: '/app/analyse/screener' },
  { label: 'IV Chart', to: '/app/analyse/iv-chart' },
  { label: 'Candlestick Signals', to: '/app/analyse/candlestick' },
  { label: 'Daily Analysis', to: '/app/analyse/daily-analysis' },
  { label: 'Economic Calendar', to: '/app/analyse/calendar' },
];

function NavDropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="top-nav__dropdown-wrap" ref={ref}>
      <button
        className="top-nav__btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label} <span className="top-nav__caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="top-nav__dropdown" role="menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                'top-nav__dropdown-item' + (isActive ? ' active' : '')
              }
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {item.label}
              {item.badge && <span className="top-nav__item-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopNav() {
  const navigate = useNavigate();
  const profileName = getStoredAuthUserName() ?? 'User';
  const [kiteConnected, setKiteConnectedState] = useState(getKiteConnected);
  const [kiteLoading, setKiteLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onStorage = () => setKiteConnectedState(getKiteConnected());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleLogout = () => {
    setStoredAuthUserName(null);
    setStoredAuthAccessKey(null);
    setKiteConnected(false);
    setKiteConnectedState(false);
    setProfileOpen(false);
    navigate('/login');
  };

  const handleConnectKite = async () => {
    setKiteLoading(true);
    try {
      const url = await authService.getKiteLoginUrl();
      window.location.href = url;
    } catch {
      setKiteLoading(false);
    }
  };

  const handleDisconnectKite = async () => {
    setProfileOpen(false);
    try {
      await authService.destroyKiteSession();
    } finally {
      setKiteConnected(false);
      setKiteConnectedState(false);
    }
  };

  return (
    <nav className="top-nav">
      {/* Brand */}
      <NavLink className="top-nav__brand" to="/app/dashboard">
        <span className="top-nav__brand-logo">⬡</span>
        AmoSave
      </NavLink>

      {/* Main nav items */}
      <div className="top-nav__items">
        <NavDropdown label="Trade" items={TRADE_ITEMS} />
        <NavDropdown label="Analyse" items={ANALYSE_ITEMS} />
        <NavLink
          className={({ isActive }) => 'top-nav__link' + (isActive ? ' active' : '')}
          to="/app/watchlist"
        >
          Watchlist <span className="top-nav__item-badge">New</span>
        </NavLink>
        <NavLink
          className={({ isActive }) => 'top-nav__link' + (isActive ? ' active' : '')}
          to="/app/portfolio/positions"
        >
          Positions
        </NavLink>
        <NavLink
          className={({ isActive }) => 'top-nav__link' + (isActive ? ' active' : '')}
          to="/app/orders/list"
        >
          Orders
        </NavLink>
        <NavLink
          className={({ isActive }) => 'top-nav__link' + (isActive ? ' active' : '')}
          to="/app/users/kite-logins"
        >
          Users
        </NavLink>
      </div>

      {/* Right side */}
      <div className="top-nav__right">
        {/* Kite status */}
        {kiteConnected ? (
          <span className="top-nav__kite-live" title="Kite Live">
            <span className="top-nav__kite-dot" />
            Live
          </span>
        ) : (
          <button
            className="top-nav__kite-btn"
            type="button"
            onClick={handleConnectKite}
            disabled={kiteLoading}
          >
            {kiteLoading ? 'Redirecting…' : 'Connect Kite'}
          </button>
        )}

        {/* Profile dropdown */}
        <div className="top-nav__dropdown-wrap" ref={profileRef}>
          <button
            className="top-nav__profile-btn"
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <span className="top-nav__avatar">{profileName.charAt(0).toUpperCase()}</span>
            <span className="top-nav__profile-name">{profileName}</span>
            <span className="top-nav__caret">▾</span>
          </button>
          {profileOpen && (
            <div className="top-nav__dropdown top-nav__dropdown--right" role="menu">
              <NavLink
                className="top-nav__dropdown-item"
                to="/app/options/chain"
                onClick={() => setProfileOpen(false)}
              >
                Option Chain
              </NavLink>
              <NavLink
                className="top-nav__dropdown-item"
                to="/app/dashboard"
                onClick={() => setProfileOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                className="top-nav__dropdown-item"
                to="/app/user/profile"
                onClick={() => setProfileOpen(false)}
              >
                Profile
              </NavLink>
              <NavLink
                className="top-nav__dropdown-item"
                to="/app/user/margins"
                onClick={() => setProfileOpen(false)}
              >
                Margins
              </NavLink>
              <NavLink
                className="top-nav__dropdown-item"
                to="/app/settings/user"
                onClick={() => setProfileOpen(false)}
              >
                Settings
              </NavLink>
              {kiteConnected && (
                <button
                  className="top-nav__dropdown-item"
                  type="button"
                  onClick={handleDisconnectKite}
                >
                  Disconnect Kite
                </button>
              )}
              <button
                className="top-nav__dropdown-item top-nav__dropdown-item--danger"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
