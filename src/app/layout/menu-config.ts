export type MainMenuKey = 'market' | 'trade' | 'analyse' | 'user' | 'app-settings' | 'algo' | 'strategy-builder' | 'options' | 'risk' | 'users';

export type MenuTab = {
  label: string;
  path: string;
};

export type MainMenuItem = {
  key: MainMenuKey;
  title: string;
  description: string;
  defaultPath: string;
};

export const mainMenuItems: MainMenuItem[] = [
  {
    key: 'market',
    title: 'Market',
    description: 'Watchlist, positions and order overview',
    defaultPath: '/app/watchlist',
  },
  {
    key: 'trade',
    title: 'Trade',
    description: 'Order placement and execution actions',
    defaultPath: '/app/orders/place',
  },
  {
    key: 'analyse',
    title: 'Analyse',
    description: 'Quotes, historical and trigger workflows',
    defaultPath: '/app/market/quotes',
  },
  {
    key: 'user',
    title: 'User',
    description: 'Profile and margins overview',
    defaultPath: '/app/user/profile',
  },
  {
    key: 'app-settings',
    title: 'App Settings',
    description: 'User and system-level configurations',
    defaultPath: '/app/settings/user',
  },
  {
    key: 'algo',
    title: 'Algo',
    description: 'Strategy builder and back testing tools',
    defaultPath: '/app/algo/strategy-builder',
  },
  {
    key: 'strategy-builder',
    title: 'Stragy Builder',
    description: 'Dedicated strategy builder workspace',
    defaultPath: '/app/strategy-builder',
  },
  {
    key: 'options',
    title: 'Options',
    description: 'Options chain, IV, PCR, Max Pain',
    defaultPath: '/app/options/chain',
  },
  {
    key: 'risk',
    title: 'Risk & Alerts',
    description: 'Risk settings, daily state, price alerts',
    defaultPath: '/app/risk/settings',
  },
  {
    key: 'users',
    title: 'Users',
    description: 'Manage Kite user logins and credentials',
    defaultPath: '/app/users/kite-logins',
  },
];

export const subMenuTabsByMainMenu: Record<MainMenuKey, MenuTab[]> = {
  market: [
    { label: 'Watchlist', path: '/app/watchlist' },
    { label: 'Positions', path: '/app/positions' },
    { label: 'Orders', path: '/app/orders' },
    { label: 'Order Book', path: '/app/orders/list' },
  ],
  trade: [
    { label: 'Place Order', path: '/app/orders/place' },
    { label: 'Modify Order', path: '/app/orders/modify' },
    { label: 'Cancel Order', path: '/app/orders/cancel' },
    { label: 'Convert Position', path: '/app/portfolio/convert-position' },
  ],
  analyse: [
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Quotes', path: '/app/market/quotes' },
    { label: 'Historical', path: '/app/market/historical' },
    { label: 'GTT', path: '/app/gtt/list' },
    { label: 'Mutual Funds', path: '/app/mf/orders' },
  ],
  user: [
    { label: 'Profile', path: '/app/user/profile' },
    { label: 'Margins', path: '/app/user/margins' },
  ],
  'app-settings': [
    { label: 'User Setting', path: '/app/settings/user' },
    { label: 'System Settings', path: '/app/settings/system' },
    { label: 'Connection Check', path: '/app/settings/connection-check' },
  ],
  algo: [
    { label: 'Strgy Builder', path: '/app/algo/strategy-builder' },
    { label: 'Back testing', path: '/app/algo/back-testing' },
  ],
  'strategy-builder': [
    { label: 'Stragy Builder', path: '/app/strategy-builder' },
    { label: 'Back testing', path: '/app/algo/back-testing' },
  ],
  options: [
    { label: 'Option Chain', path: '/app/options/chain' },
    { label: 'PCR', path: '/app/options/pcr' },
  ],
  risk: [
    { label: 'Risk Settings', path: '/app/risk/settings' },
    { label: 'Risk State', path: '/app/risk/state' },
    { label: 'Alerts', path: '/app/alerts' },
  ],
  users: [
    { label: 'Add Login with Kite', path: '/app/users/kite-logins' },
  ],
};

export function getActiveMainMenu(pathname: string): MainMenuKey {
  if (pathname.startsWith('/app/users')) return 'users';
  if (pathname.startsWith('/app/options')) return 'options';
  if (pathname.startsWith('/app/risk') || pathname.startsWith('/app/alerts')) return 'risk';

  if (pathname.startsWith('/app/settings')) {
    return 'app-settings';
  }

  if (pathname.startsWith('/app/user')) {
    return 'user';
  }

  if (pathname.startsWith('/app/algo')) {
    return 'algo';
  }

  if (pathname.startsWith('/app/strategy-builder')) {
    return 'strategy-builder';
  }

  if (pathname.startsWith('/app/orders/place') || pathname.startsWith('/app/orders/modify') || pathname.startsWith('/app/orders/cancel') || pathname.startsWith('/app/portfolio/convert-position')) {
    return 'trade';
  }

  if (pathname.startsWith('/app/market') || pathname.startsWith('/app/gtt') || pathname.startsWith('/app/mf')) {
    return 'analyse';
  }

  return 'market';
}
