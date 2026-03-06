import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { dashboardService } from '@/services/api/dashboard.service';
import { queryKeys } from '@/shared/lib/query-keys';
import { StatCard } from '@/shared/components/stat-card';
import type { Dictionary } from '@/shared/types/api';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface FeatureCard {
  emoji: string;
  title: string;
  description: string;
  to: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  { emoji: '⚡', title: 'Easy Options', description: 'Buy & sell options in one click with simple payoff view', to: '/app/trade/easy-options' },
  { emoji: '🧙', title: 'Strategy Wizard', description: 'Pick a market view and get ready-made strategies', to: '/app/trade/strategies' },
  { emoji: '🔧', title: 'Strategy Builder', description: 'Build, visualise & analyse custom multi-leg strategies', to: '/app/strategy-builder' },
  { emoji: '📋', title: 'Draft Portfolios', description: 'Save and manage option strategy drafts', to: '/app/trade/drafts' },
  { emoji: '🌡️', title: 'Options Heatmap', description: 'Spot high-OI strikes across the options chain at a glance', to: '/app/analyse/screener' },
  { emoji: '📤', title: 'Share P&L', description: 'Generate and share your positions P&L snapshot', to: '/app/portfolio/positions' },
];

interface AdvancedTool {
  emoji: string;
  label: string;
  to: string;
}

const ADVANCED_TOOLS: AdvancedTool[] = [
  { emoji: '📊', label: 'OI Chart', to: '/app/analyse/open-interest' },
  { emoji: '📈', label: 'IV Chart', to: '/app/analyse/iv-chart' },
  { emoji: '🏦', label: 'FII / DII', to: '/app/analyse/fii-dii' },
  { emoji: '🕯️', label: 'Candlestick', to: '/app/analyse/candlestick' },
  { emoji: '📅', label: 'Calendar', to: '/app/analyse/calendar' },
];

function FeatureCardItem({ card }: { card: FeatureCard }) {
  return (
    <NavLink to={card.to} className="dash-feature-card">
      <div className="dash-feature-card__emoji">{card.emoji}</div>
      <div className="dash-feature-card__row">
        <span className="dash-feature-card__title">{card.title}</span>
        <span className="dash-feature-card__arrow">›</span>
      </div>
      <div className="dash-feature-card__desc">{card.description}</div>
    </NavLink>
  );
}

function AdvancedToolItem({ tool }: { tool: AdvancedTool }) {
  return (
    <NavLink to={tool.to} className="dash-tool-item">
      <span className="dash-tool-item__emoji">{tool.emoji}</span>
      <span className="dash-tool-item__label">{tool.label}</span>
    </NavLink>
  );
}

export function DashboardPage() {
  const query = useQuery({ queryKey: queryKeys.dashboardSummary, queryFn: dashboardService.getDashboardSummary });
  const data = query.data as Dictionary | undefined;

  const dayPnl     = Number(data?.dayPnl   ?? data?.todayPnl   ?? 0);
  const netPnl     = Number(data?.netPnl   ?? data?.totalPnl   ?? 0);
  const margin     = Number(data?.marginUsed ?? data?.usedMargin ?? 0);
  const openOrders = Number(data?.openOrders ?? data?.pendingOrders ?? 0);

  const pnlColor = (v: number) => (v > 0 ? 'green' : v < 0 ? 'red' : 'default') as 'green' | 'red' | 'default';

  return (
    <div className="dashboard-page">

      {/* Welcome header */}
      <div className="dashboard-page__hero">
        <div>
          <h1 className="dashboard-page__greeting">{greeting()} 👋</h1>
          <div className="dashboard-page__date">{todayLabel()}</div>
        </div>
        <NavLink to="/app/trade/easy-options" className="btn btn-primary">
          Option Chain →
        </NavLink>
      </div>

      {/* Portfolio summary stats */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Portfolio Summary</h2>
        </div>
        <div className="dashboard-page__stats">
          <StatCard
            title="Day P&L"
            value={query.isLoading ? '—' : fmt(dayPnl)}
            color={pnlColor(dayPnl)}
            sub={query.isLoading ? 'Loading…' : undefined}
          />
          <StatCard
            title="Net P&L"
            value={query.isLoading ? '—' : fmt(netPnl)}
            color={pnlColor(netPnl)}
            sub={query.isLoading ? 'Loading…' : undefined}
          />
          <StatCard
            title="Margin Used"
            value={query.isLoading ? '—' : fmt(margin)}
            sub={query.isLoading ? 'Loading…' : undefined}
          />
          <StatCard
            title="Open Orders"
            value={query.isLoading ? '—' : openOrders}
            sub={query.isLoading ? 'Loading…' : undefined}
          />
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Quick Access</h2>
        </div>
        <div className="dashboard-page__features">
          {FEATURE_CARDS.map(card => <FeatureCardItem key={card.to} card={card} />)}
        </div>
      </section>

      {/* Advanced Tools */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Advanced Tools</h2>
        </div>
        <div className="dashboard-page__tools">
          {ADVANCED_TOOLS.map(tool => <AdvancedToolItem key={tool.to} tool={tool} />)}
        </div>
      </section>

    </div>
  );
}
