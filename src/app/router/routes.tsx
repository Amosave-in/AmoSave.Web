import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/app/layout/app-shell';
import { LoginPage } from '@/features/auth/pages/login-page';
import { KiteCallbackPage } from '@/features/auth/pages/kite-callback-page';
import { WatchlistPage } from '@/features/system/pages/watchlist-page';
import { PositionsHomePage } from '@/features/system/pages/positions-home-page';
import { OrdersHomePage } from '@/features/system/pages/orders-home-page';
import { UserSettingsPage } from '@/features/system/pages/user-settings-page';
import { SystemSettingsPage } from '@/features/system/pages/system-settings-page';
import { ConnectionCheckPage } from '@/features/system/pages/connection-check-page';
// Analyse pages
import { OpenInterestPage } from '@/features/analyse/pages/open-interest-page';
import { MultistrikeOiPage } from '@/features/analyse/pages/multistrike-oi-page';
import { FiiDiiPage } from '@/features/analyse/pages/fii-dii-page';
import { LiveChartsPage } from '@/features/analyse/pages/live-charts-page';
import { StraddleChartsPage } from '@/features/analyse/pages/straddle-charts-page';
import { FuturesDataPage } from '@/features/analyse/pages/futures-data-page';
import { OptionsScreenerPage } from '@/features/analyse/pages/options-screener-page';
import { IvChartPage } from '@/features/analyse/pages/iv-chart-page';
import { CandlestickPage } from '@/features/analyse/pages/candlestick-page';
import { DailyAnalysisPage } from '@/features/analyse/pages/daily-analysis-page';
import { CalendarPage } from '@/features/analyse/pages/calendar-page';
// Trade pages
import { TradeStrategiesPage } from '@/features/trade/pages/trade-strategies-page';
import { ExpiryTradesPage } from '@/features/trade/pages/expiry-trades-page';
import { EasyOptionsPage } from '@/features/trade/pages/easy-options-page';
import { DraftPortfoliosPage } from '@/features/trade/pages/draft-portfolios-page';
import { StrategyBuilderPage } from '@/features/algo/pages/strategy-builder-page';
import { BackTestingPage } from '@/features/algo/pages/back-testing-page';
import { ProfilePage } from '@/features/user/pages/profile-page';
import { MarginsPage } from '@/features/user/pages/margins-page';
import { PortfolioPositionsPage } from '@/features/portfolio/pages/portfolio-positions-page';
import { PortfolioHoldingsPage } from '@/features/portfolio/pages/portfolio-holdings-page';
import { PortfolioAuctionsPage } from '@/features/portfolio/pages/portfolio-auctions-page';
import { ConvertPositionPage } from '@/features/portfolio/pages/convert-position-page';
import { OrdersPage } from '@/features/orders/pages/orders-page';
import { OrderHistoryPage } from '@/features/orders/pages/order-history-page';
import { TradesPage } from '@/features/orders/pages/trades-page';
import { PlaceOrderPage } from '@/features/orders/pages/place-order-page';
import { ModifyOrderPage } from '@/features/orders/pages/modify-order-page';
import { CancelOrderPage } from '@/features/orders/pages/cancel-order-page';
import { InstrumentsPage } from '@/features/market/pages/instruments-page';
import { QuotesPage } from '@/features/market/pages/quotes-page';
import { HistoricalPage } from '@/features/market/pages/historical-page';
import { TriggerRangePage } from '@/features/market/pages/trigger-range-page';
import { OrderMarginPage } from '@/features/margins/pages/order-margin-page';
import { BasketMarginPage } from '@/features/margins/pages/basket-margin-page';
import { ContractNotesPage } from '@/features/margins/pages/contract-notes-page';
import { GttListPage } from '@/features/gtt/pages/gtt-list-page';
import { GttDetailPage } from '@/features/gtt/pages/gtt-detail-page';
import { GttCreatePage } from '@/features/gtt/pages/gtt-create-page';
import { GttModifyPage } from '@/features/gtt/pages/gtt-modify-page';
import { GttCancelPage } from '@/features/gtt/pages/gtt-cancel-page';
import { MfInstrumentsPage } from '@/features/mutual-funds/pages/mf-instruments-page';
import { MfHoldingsPage } from '@/features/mutual-funds/pages/mf-holdings-page';
import { MfOrdersPage } from '@/features/mutual-funds/pages/mf-orders-page';
import { MfOrderDetailPage } from '@/features/mutual-funds/pages/mf-order-detail-page';
import { MfPlaceOrderPage } from '@/features/mutual-funds/pages/mf-place-order-page';
import { MfCancelOrderPage } from '@/features/mutual-funds/pages/mf-cancel-order-page';
import { MfSipsPage } from '@/features/mutual-funds/pages/mf-sips-page';
import { MfSipDetailPage } from '@/features/mutual-funds/pages/mf-sip-detail-page';
import { MfCreateSipPage } from '@/features/mutual-funds/pages/mf-create-sip-page';
import { MfModifySipPage } from '@/features/mutual-funds/pages/mf-modify-sip-page';
import { MfCancelSipPage } from '@/features/mutual-funds/pages/mf-cancel-sip-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { OptionsChainPage } from '@/features/options/pages/options-chain-page';
import { OptionsPcrPage } from '@/features/options/pages/options-pcr-page';
import { RiskSettingsPage } from '@/features/risk/pages/risk-settings-page';
import { RiskStatePage } from '@/features/risk/pages/risk-state-page';
import { AlertsPage } from '@/features/alerts/pages/alerts-page';
import { KiteLoginsPage } from '@/features/users/pages/kite-logins-page';
import { AuthGuard } from '@/app/router/auth-guard';

import { Navigate } from 'react-router-dom';

export const routes = [
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/kite-callback', element: <KiteCallbackPage /> },
  {
    path: '/app',
    element: <AuthGuard />,
    children: [
      {
        path: '',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'watchlist', element: <WatchlistPage /> },
          { path: 'positions', element: <PositionsHomePage /> },
          { path: 'orders', element: <OrdersHomePage /> },
      { path: 'settings/user', element: <UserSettingsPage /> },
      { path: 'settings/system', element: <SystemSettingsPage /> },
      { path: 'settings/connection-check', element: <ConnectionCheckPage /> },
      // Analyse
      { path: 'analyse/open-interest', element: <OpenInterestPage /> },
      { path: 'analyse/multistrike-oi', element: <MultistrikeOiPage /> },
      { path: 'analyse/fii-dii', element: <FiiDiiPage /> },
      { path: 'analyse/live-charts', element: <LiveChartsPage /> },
      { path: 'analyse/straddle-charts', element: <StraddleChartsPage /> },
      { path: 'analyse/futures-data', element: <FuturesDataPage /> },
      { path: 'analyse/screener', element: <OptionsScreenerPage /> },
      { path: 'analyse/iv-chart', element: <IvChartPage /> },
      { path: 'analyse/candlestick', element: <CandlestickPage /> },
      { path: 'analyse/daily-analysis', element: <DailyAnalysisPage /> },
      { path: 'analyse/calendar', element: <CalendarPage /> },
      // Trade
      { path: 'trade/strategies', element: <TradeStrategiesPage /> },
      { path: 'trade/expiry-trades', element: <ExpiryTradesPage /> },
      { path: 'trade/easy-options', element: <EasyOptionsPage /> },
      { path: 'trade/drafts', element: <DraftPortfoliosPage /> },
      { path: 'algo/strategy-builder', element: <StrategyBuilderPage /> },
      { path: 'algo/back-testing', element: <BackTestingPage /> },
      { path: 'strategy-builder', element: <StrategyBuilderPage /> },
      { path: 'user/profile', element: <ProfilePage /> },
      { path: 'user/margins', element: <MarginsPage /> },
      { path: 'portfolio/positions', element: <PortfolioPositionsPage /> },
      { path: 'portfolio/holdings', element: <PortfolioHoldingsPage /> },
      { path: 'portfolio/auctions', element: <PortfolioAuctionsPage /> },
      { path: 'portfolio/convert-position', element: <ConvertPositionPage /> },
      { path: 'orders/list', element: <OrdersPage /> },
      { path: 'orders/history', element: <OrderHistoryPage /> },
      { path: 'orders/trades', element: <TradesPage /> },
      { path: 'orders/place', element: <PlaceOrderPage /> },
      { path: 'orders/modify', element: <ModifyOrderPage /> },
      { path: 'orders/cancel', element: <CancelOrderPage /> },
      { path: 'market/instruments', element: <InstrumentsPage /> },
      { path: 'market/quotes', element: <QuotesPage /> },
      { path: 'market/historical', element: <HistoricalPage /> },
      { path: 'market/trigger-range', element: <TriggerRangePage /> },
      { path: 'margins/order', element: <OrderMarginPage /> },
      { path: 'margins/basket', element: <BasketMarginPage /> },
      { path: 'margins/contract-notes', element: <ContractNotesPage /> },
      { path: 'gtt/list', element: <GttListPage /> },
      { path: 'gtt/detail', element: <GttDetailPage /> },
      { path: 'gtt/create', element: <GttCreatePage /> },
      { path: 'gtt/modify', element: <GttModifyPage /> },
      { path: 'gtt/cancel', element: <GttCancelPage /> },
      { path: 'mf/instruments', element: <MfInstrumentsPage /> },
      { path: 'mf/holdings', element: <MfHoldingsPage /> },
      { path: 'mf/orders', element: <MfOrdersPage /> },
      { path: 'mf/orders/detail', element: <MfOrderDetailPage /> },
      { path: 'mf/orders/place', element: <MfPlaceOrderPage /> },
      { path: 'mf/orders/cancel', element: <MfCancelOrderPage /> },
      { path: 'mf/sips', element: <MfSipsPage /> },
      { path: 'mf/sips/detail', element: <MfSipDetailPage /> },
      { path: 'mf/sips/create', element: <MfCreateSipPage /> },
      { path: 'mf/sips/modify', element: <MfModifySipPage /> },
      { path: 'mf/sips/cancel', element: <MfCancelSipPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'options/chain', element: <OptionsChainPage /> },
      { path: 'options/pcr', element: <OptionsPcrPage /> },
      { path: 'risk/settings', element: <RiskSettingsPage /> },
      { path: 'risk/state', element: <RiskStatePage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'users/kite-logins', element: <KiteLoginsPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});
