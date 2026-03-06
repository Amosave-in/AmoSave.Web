import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '@/services/api/portfolio.service';
import { queryKeys } from '@/shared/lib/query-keys';
import { AsyncState } from '@/shared/components/async-state';
import { mapHttpErrorFull } from '@/services/http/error-mapper';
import type { Dictionary } from '@/shared/types/api';

const INR = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pctStr = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

type SortKey = 'pnlPct' | 'pnl' | 'symbol' | 'currentValue';

type HoldingRow = Dictionary & {
  qty: number;
  avgCost: number;
  ltp: number;
  currentValue: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  dayChange: number;
  dayChangePct: number;
};

const thS: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  cursor: 'pointer',
  background: 'var(--bg-elevated)',
};
const tdS: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid var(--border)',
  fontSize: 13,
  verticalAlign: 'middle',
};

export function PortfolioHoldingsPage() {
  const query = useQuery({ queryKey: queryKeys.portfolioHoldings, queryFn: portfolioService.getHoldings });
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('pnlPct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    return ((query.data ?? []) as Dictionary[]).map((r) => {
      const qty = Number(r.quantity ?? 0);
      const avgCost = Number(r.averagePrice ?? 0);
      const ltp = Number(r.lastPrice ?? 0);
      const currentValue = ltp * qty;
      const invested = avgCost * qty;
      const pnl = Number(r.pnl ?? currentValue - invested);
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      const dayChange = Number(r.dayChange ?? 0);
      const dayChangePct = Number(r.dayChangePct ?? 0);
      return { ...r, qty, avgCost, ltp, currentValue, invested, pnl, pnlPct, dayChange, dayChangePct } as HoldingRow;
    });
  }, [query.data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => String(r.tradingsymbol ?? '').toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'symbol') {
        const sa = String(a.tradingsymbol ?? ''), sb = String(b.tradingsymbol ?? '');
        return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      const va = sortKey === 'pnlPct' ? a.pnlPct : sortKey === 'pnl' ? a.pnl : a.currentValue;
      const vb = sortKey === 'pnlPct' ? b.pnlPct : sortKey === 'pnl' ? b.pnl : b.currentValue;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [filtered, sortKey, sortDir]);

  const totalInvested = rows.reduce((s, r) => s + r.invested, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.currentValue, 0);
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const maxAbsPct = Math.max(...rows.map((r) => Math.abs(r.pnlPct)), 1);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const summaryCards = [
    { label: 'Total Investment', value: INR(totalInvested), color: 'inherit' as const },
    { label: 'Current Value', value: INR(totalCurrent), color: 'inherit' as const },
    { label: 'Total P&L', value: INR(totalPnl), color: totalPnl >= 0 ? 'var(--success)' : 'var(--danger)' },
    { label: 'Overall Return', value: pctStr(totalPnlPct), color: totalPnlPct >= 0 ? 'var(--success)' : 'var(--danger)' },
  ];

  const sortArrow = (k: SortKey) => (sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <AsyncState
      isLoading={query.isLoading}
      error={query.error ? mapHttpErrorFull(query.error) : null}
      isEmpty={!query.data || rows.length === 0}
      emptyText="No holdings found"
    >
      {/* Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summaryCards.map((c) => (
          <div key={c.label} className="page-card" style={{ padding: '16px 20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Search symbol…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220, height: 36, fontSize: 13 }}
        />
        <select
          className="input"
          value={`${sortKey}-${sortDir}`}
          onChange={(e) => {
            const parts = e.target.value.split('-');
            const d = parts.pop() as 'asc' | 'desc';
            setSortKey(parts.join('-') as SortKey);
            setSortDir(d);
          }}
          style={{ maxWidth: 220, height: 36, fontSize: 13 }}
        >
          <option value="pnlPct-desc">Sort: P&L% High → Low</option>
          <option value="pnlPct-asc">Sort: P&L% Low → High</option>
          <option value="pnl-desc">Sort: P&L High → Low</option>
          <option value="pnl-asc">Sort: P&L Low → High</option>
          <option value="currentValue-desc">Sort: Value High → Low</option>
          <option value="symbol-asc">Sort: Symbol A → Z</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {sorted.length} holding{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="page-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thS} onClick={() => toggleSort('symbol')}>Symbol{sortArrow('symbol')}</th>
                <th style={{ ...thS, textAlign: 'right' }}>Qty</th>
                <th style={{ ...thS, textAlign: 'right' }}>Avg Cost</th>
                <th style={{ ...thS, textAlign: 'right' }}>LTP</th>
                <th style={{ ...thS, textAlign: 'right' }} onClick={() => toggleSort('currentValue')}>
                  Curr. Value{sortArrow('currentValue')}
                </th>
                <th style={{ ...thS, textAlign: 'right' }}>Day Chg</th>
                <th style={{ ...thS, textAlign: 'right' }} onClick={() => toggleSort('pnl')}>
                  P&L{sortArrow('pnl')}
                </th>
                <th style={{ ...thS, minWidth: 150 }} onClick={() => toggleSort('pnlPct')}>
                  P&L%{sortArrow('pnlPct')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const isUp = r.pnl >= 0;
                const pnlColor = isUp ? 'var(--success)' : 'var(--danger)';
                const dayUp = r.dayChange >= 0;
                const dayColor = dayUp ? 'var(--success)' : 'var(--danger)';
                const barWidth = Math.min((Math.abs(r.pnlPct) / maxAbsPct) * 100, 100);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={tdS}>
                      <div style={{ fontWeight: 600 }}>{String(r.tradingsymbol ?? '')}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{String(r.exchange ?? '')}</div>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.qty}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{INR(r.avgCost)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{INR(r.ltp)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{INR(r.currentValue)}</td>
                    <td style={{ ...tdS, textAlign: 'right', color: dayColor, fontVariantNumeric: 'tabular-nums' }}>
                      {dayUp ? '+' : ''}{INR(r.dayChange)}
                      <div style={{ fontSize: 11 }}>{pctStr(r.dayChangePct)}</div>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right', color: pnlColor, fontVariantNumeric: 'tabular-nums' }}>
                      {isUp ? '+' : ''}{INR(r.pnl)}
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${barWidth}%`, height: '100%', background: pnlColor, borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ color: pnlColor, fontSize: 12, fontVariantNumeric: 'tabular-nums', minWidth: 58, textAlign: 'right' }}>
                          {pctStr(r.pnlPct)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AsyncState>
  );
}

