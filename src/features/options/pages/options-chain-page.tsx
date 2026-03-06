import { useState, useEffect, useMemo, CSSProperties } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { optionsService } from '@/services/api/options.service';
import { marketService } from '@/services/api/market.service';
import { mapHttpError } from '@/services/http/error-mapper';
import { extractOptionUnderlyings } from '@/shared/lib/options-underlyings';
import type { Dictionary } from '@/shared/types/api';

type ViewMode = 'ltp' | 'greeks' | 'all';

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtOI(val: number): string {
  if (val >= 1_00_00_000) return (val / 1_00_00_000).toFixed(2) + 'Cr';
  if (val >= 1_00_000) return (val / 1_00_000).toFixed(2) + 'L';
  return val.toLocaleString('en-IN');
}
function fmtPrice(val: number): string { return val.toFixed(2); }
function fmtIV(val: number): string { return val.toFixed(2) + '%'; }
function fmtChange(val: number): string { return (val >= 0 ? '+' : '') + val.toFixed(2); }
function fmtStrike(val: number): string { return val.toLocaleString('en-IN'); }
function fmtGreek(val: number): string { return val.toFixed(4); }
function findATM(chain: Dictionary[], ref: number): number {
  if (!chain.length) return 0;
  return chain.reduce<number>((best, row) => {
    const s = Number(row.strikePrice ?? 0);
    return Math.abs(s - ref) < Math.abs(best - ref) ? s : best;
  }, Number(chain[0].strikePrice ?? 0));
}

// ── Shared cell base styles ───────────────────────────────────────────────────
const TD: CSSProperties = { padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', fontSize: '12px' };
const TH: CSSProperties = { padding: '7px 10px', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' };

// ── Sub-components ────────────────────────────────────────────────────────────
function OIBarCell({ oi, maxOI, side, align }: { oi: number; maxOI: number; side: 'ce' | 'pe'; align: CSSProperties['textAlign'] }) {
  const pct = maxOI > 0 ? Math.min((oi / maxOI) * 100, 100) : 0;
  const barColor = side === 'ce' ? 'rgba(53,209,138,0.22)' : 'rgba(240,97,97,0.22)';
  return (
    <td style={{ ...TD, position: 'relative', minWidth: 90, textAlign: align }}>
      <div style={{
        position: 'absolute', top: 0, height: '100%', width: `${pct}%`,
        left: side === 'ce' ? 0 : 'auto', right: side === 'pe' ? 0 : 'auto',
        background: barColor, pointerEvents: 'none',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{fmtOI(oi)}</span>
    </td>
  );
}

function Dash({ align }: { align?: CSSProperties['textAlign'] }) {
  return <td style={{ ...TD, textAlign: align ?? 'center', color: 'var(--text-muted)' }}>–</td>;
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ display: 'block', animation: spinning ? 'oc-spin 0.9s linear infinite' : 'none' }}>
      <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OptionsChainPage() {
  const instrumentsQuery = useQuery({
    queryKey: ['market', 'instruments', 'option-underlyings'],
    queryFn: marketService.getInstruments,
  });

  const underlyings = useMemo(
    () => extractOptionUnderlyings((instrumentsQuery.data ?? []) as Dictionary[]),
    [instrumentsQuery.data],
  );

  const [underlying, setUnderlying] = useState('');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('ltp');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    if (!underlyings.length) {
      return;
    }

    if (!underlyings.includes(underlying)) {
      setUnderlying(underlyings[0]);
    }
  }, [underlyings, underlying]);

  const expiriesQuery = useQuery({
    queryKey: ['options', 'expiries', underlying],
    queryFn: () => optionsService.getExpiries(underlying),
    enabled: !!underlying,
  });

  const chainMutation = useMutation({
    mutationFn: (expiry: string) =>
      optionsService.getOptionChain({ underlying, expiry }),
  });

  useEffect(() => {
    const exps = expiriesQuery.data;
    if (exps && exps.length > 0) {
      const first = exps[0];
      setSelectedExpiry(first);
      chainMutation.mutate(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiriesQuery.data]);

  function handleUnderlyingChange(u: string) {
    setUnderlying(u);
    setSelectedExpiry('');
    chainMutation.reset();
  }
  function handleExpiryChange(e: string) {
    setSelectedExpiry(e);
    if (e) chainMutation.mutate(e);
  }
  function handleRefresh() {
    if (selectedExpiry) chainMutation.mutate(selectedExpiry);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const data       = chainMutation.data as Dictionary | undefined;
  const chain      = (data?.chain as Dictionary[] | undefined) ?? [];
  const pcr        = Number(data?.pcr ?? 0);
  const maxPain    = Number(data?.maxPain ?? 0);
  const uLtp       = Number(data?.underlyingLastPrice ?? data?.ltp ?? 0);
  const uChgPct    = Number(data?.underlyingChangePct ?? data?.ltpChange ?? 0);
  const atmRef     = uLtp > 0 ? uLtp : maxPain;
  const atm        = findATM(chain, atmRef);
  const expiries   = expiriesQuery.data ?? [];
  const isPending  = chainMutation.isPending;
  const hasChain   = chain.length > 0;
  const maxCeOI    = chain.reduce((m, r) => Math.max(m, Number((r.ce as Dictionary | null)?.oi ?? 0)), 1);
  const maxPeOI    = chain.reduce((m, r) => Math.max(m, Number((r.pe as Dictionary | null)?.oi ?? 0)), 1);
  const maxOI      = Math.max(maxCeOI, maxPeOI);

  // ── Table head per view mode ──────────────────────────────────────────────
  function renderHead() {
    const stickyHead: CSSProperties = { position: 'sticky', top: 0, zIndex: 10 };
    const rowBg: CSSProperties = { background: 'var(--bg-card)' };
    const thStrike: CSSProperties = { ...TH, textAlign: 'center', background: 'rgba(255,255,255,0.05)', minWidth: 90, borderBottom: '1px solid var(--border)', color: 'var(--text)' };

    if (viewMode === 'ltp') return (
      <thead style={stickyHead}>
        <tr style={rowBg}>
          <th colSpan={3} style={{ ...TH, textAlign: 'center', color: '#35d18a', borderBottom: '1px solid rgba(53,209,138,0.25)' }}>CALLS</th>
          <th style={thStrike}>STRIKE</th>
          <th colSpan={3} style={{ ...TH, textAlign: 'center', color: '#f06161', borderBottom: '1px solid rgba(240,97,97,0.25)' }}>PUTS</th>
        </tr>
        <tr style={rowBg}>
          {['OI', 'Chg%', 'LTP'].map(h => <th key={`ce-${h}`} style={{ ...TH, textAlign: 'right', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
          <th style={thStrike}>Strike</th>
          {['LTP', 'Chg%', 'OI'].map(h => <th key={`pe-${h}`} style={{ ...TH, textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
        </tr>
      </thead>
    );

    if (viewMode === 'greeks') return (
      <thead style={stickyHead}>
        <tr style={rowBg}>
          <th colSpan={6} style={{ ...TH, textAlign: 'center', color: '#35d18a', borderBottom: '1px solid rgba(53,209,138,0.25)' }}>CALLS</th>
          <th style={thStrike}>STRIKE</th>
          <th colSpan={6} style={{ ...TH, textAlign: 'center', color: '#f06161', borderBottom: '1px solid rgba(240,97,97,0.25)' }}>PUTS</th>
        </tr>
        <tr style={rowBg}>
          {['Gamma', 'Vega', 'Theta', 'Delta', 'OI', 'LTP'].map(h =>
            <th key={`ce-${h}`} style={{ ...TH, textAlign: 'right', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
          <th style={thStrike}>Strike</th>
          {['LTP', 'OI', 'Delta', 'Theta', 'Vega', 'Gamma'].map(h =>
            <th key={`pe-${h}`} style={{ ...TH, textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
        </tr>
      </thead>
    );

    // all columns
    return (
      <thead style={stickyHead}>
        <tr style={rowBg}>
          <th colSpan={8} style={{ ...TH, textAlign: 'center', color: '#35d18a', borderBottom: '1px solid rgba(53,209,138,0.25)' }}>CALLS</th>
          <th style={thStrike}>STRIKE</th>
          <th colSpan={8} style={{ ...TH, textAlign: 'center', color: '#f06161', borderBottom: '1px solid rgba(240,97,97,0.25)' }}>PUTS</th>
        </tr>
        <tr style={rowBg}>
          {['OI', 'OI Chg', 'Vol', 'IV%', 'LTP', 'Chg%', 'Bid', 'Ask'].map(h =>
            <th key={`ce-${h}`} style={{ ...TH, textAlign: 'right', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
          <th style={thStrike}>Strike</th>
          {['Bid', 'Ask', 'Chg%', 'LTP', 'IV%', 'Vol', 'OI Chg', 'OI'].map(h =>
            <th key={`pe-${h}`} style={{ ...TH, textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
        </tr>
      </thead>
    );
  }

  // ── Table row per view mode ───────────────────────────────────────────────
  function renderRow(row: Dictionary, idx: number) {
    const strike    = Number(row.strikePrice ?? 0);
    const ce        = row.ce as Dictionary | null;
    const pe        = row.pe as Dictionary | null;
    const isATM     = strike === atm;
    const isCeITM   = strike < atm;   // call is in-the-money
    const isPeITM   = strike > atm;   // put is in-the-money
    const ceOI      = Number(ce?.oi ?? 0);
    const peOI      = Number(pe?.oi ?? 0);
    const ceChgPct  = Number(ce?.changePct ?? 0);
    const peChgPct  = Number(pe?.changePct ?? 0);
    const ceOIChg   = Number(ce?.oiDayChange ?? 0);
    const peOIChg   = Number(pe?.oiDayChange ?? 0);

    let rowBg = 'transparent';
    if (isATM)       rowBg = 'var(--atm-bg, rgba(45,32,96,0.7))';
    else if (isCeITM) rowBg = 'var(--itm-ce-bg, rgba(30,20,40,0.6))';
    else if (isPeITM) rowBg = 'var(--itm-pe-bg, rgba(15,30,26,0.6))';

    const rowStyle: CSSProperties = {
      background: hoveredRow === idx ? 'rgba(255,255,255,0.035)' : rowBg,
      cursor: 'default',
    };

    const strikeTd = (
      <td style={{
        ...TD, textAlign: 'center', minWidth: 90,
        background: 'rgba(255,255,255,0.05)',
        fontWeight: isATM ? 700 : 600,
        fontSize: isATM ? '13px' : '12px',
        color: isATM ? 'var(--accent)' : 'var(--text)',
        borderLeft:  isATM ? '2px solid var(--accent)' : '2px solid transparent',
        borderRight: isATM ? '2px solid var(--accent)' : '2px solid transparent',
      }}>
        {fmtStrike(strike)}
        {isATM && <span style={{ display: 'block', fontSize: '9px', color: 'var(--accent)', fontWeight: 700, lineHeight: 1, marginTop: 1 }}>ATM</span>}
      </td>
    );

    const rowEvents = { onMouseEnter: () => setHoveredRow(idx), onMouseLeave: () => setHoveredRow(null) };

    if (viewMode === 'ltp') return (
      <tr key={strike} style={rowStyle} {...rowEvents}>
        {ce ? <OIBarCell oi={ceOI} maxOI={maxOI} side="ce" align="right" /> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: ceChgPct >= 0 ? '#35d18a' : '#f06161' }}>{fmtChange(ceChgPct)}%</td> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: isCeITM ? '#35d18a' : 'var(--text)' }}>{fmtPrice(Number(ce.lastPrice ?? 0))}</td> : <Dash align="right" />}
        {strikeTd}
        {pe ? <td style={{ ...TD, textAlign: 'left', fontWeight: 600, color: isPeITM ? '#f06161' : 'var(--text)' }}>{fmtPrice(Number(pe.lastPrice ?? 0))}</td> : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: peChgPct >= 0 ? '#35d18a' : '#f06161' }}>{fmtChange(peChgPct)}%</td> : <Dash align="left" />}
        {pe ? <OIBarCell oi={peOI} maxOI={maxOI} side="pe" align="left" /> : <Dash align="left" />}
      </tr>
    );

    if (viewMode === 'greeks') return (
      <tr key={strike} style={rowStyle} {...rowEvents}>
        {ce ? <td style={{ ...TD, textAlign: 'right', color: 'var(--text-muted)' }}>{fmtGreek(Number(ce.gamma ?? 0))}</td> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: 'var(--text-muted)' }}>{fmtGreek(Number(ce.vega ?? 0))}</td>  : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: '#f06161' }}>{fmtGreek(Number(ce.theta ?? 0))}</td>            : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: '#a78bfa' }}>{fmtGreek(Number(ce.delta ?? 0))}</td>            : <Dash align="right" />}
        {ce ? <OIBarCell oi={ceOI} maxOI={maxOI} side="ce" align="right" /> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{fmtPrice(Number(ce.lastPrice ?? 0))}</td>         : <Dash align="right" />}
        {strikeTd}
        {pe ? <td style={{ ...TD, textAlign: 'left', fontWeight: 600 }}>{fmtPrice(Number(pe.lastPrice ?? 0))}</td>          : <Dash align="left" />}
        {pe ? <OIBarCell oi={peOI} maxOI={maxOI} side="pe" align="left" /> : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: '#a78bfa' }}>{fmtGreek(Number(pe.delta ?? 0))}</td>             : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: '#f06161' }}>{fmtGreek(Number(pe.theta ?? 0))}</td>             : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: 'var(--text-muted)' }}>{fmtGreek(Number(pe.vega ?? 0))}</td>   : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: 'var(--text-muted)' }}>{fmtGreek(Number(pe.gamma ?? 0))}</td>  : <Dash align="left" />}
      </tr>
    );

    // all columns
    return (
      <tr key={strike} style={rowStyle} {...rowEvents}>
        {ce ? <OIBarCell oi={ceOI} maxOI={maxOI} side="ce" align="right" /> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: ceOIChg >= 0 ? '#35d18a' : '#f06161' }}>{fmtOI(Math.abs(ceOIChg))}</td> : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right' }}>{fmtOI(Number(ce.volume ?? 0))}</td>                                          : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: '#fb923c' }}>{fmtIV(Number(ce.impliedVolatility ?? 0))}</td>             : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{fmtPrice(Number(ce.lastPrice ?? 0))}</td>                   : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: ceChgPct >= 0 ? '#35d18a' : '#f06161' }}>{fmtChange(ceChgPct)}%</td>    : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: 'var(--text-muted)' }}>{fmtPrice(Number(ce.bidPrice ?? 0))}</td>         : <Dash align="right" />}
        {ce ? <td style={{ ...TD, textAlign: 'right', color: 'var(--text-muted)' }}>{fmtPrice(Number(ce.offerPrice ?? 0))}</td>       : <Dash align="right" />}
        {strikeTd}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: 'var(--text-muted)' }}>{fmtPrice(Number(pe.bidPrice ?? 0))}</td>          : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: 'var(--text-muted)' }}>{fmtPrice(Number(pe.offerPrice ?? 0))}</td>        : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: peChgPct >= 0 ? '#35d18a' : '#f06161' }}>{fmtChange(peChgPct)}%</td>     : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', fontWeight: 600 }}>{fmtPrice(Number(pe.lastPrice ?? 0))}</td>                    : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: '#fb923c' }}>{fmtIV(Number(pe.impliedVolatility ?? 0))}</td>              : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left' }}>{fmtOI(Number(pe.volume ?? 0))}</td>                                           : <Dash align="left" />}
        {pe ? <td style={{ ...TD, textAlign: 'left', color: peOIChg >= 0 ? '#35d18a' : '#f06161' }}>{fmtOI(Math.abs(peOIChg))}</td>  : <Dash align="left" />}
        {pe ? <OIBarCell oi={peOI} maxOI={maxOI} side="pe" align="left" /> : <Dash align="left" />}
      </tr>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* keyframes */}
      <style>{`@keyframes oc-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── TOP STICKY INSTRUMENT BAR ─────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {/* Row: pills + expiry + refresh + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

          {/* Underlying pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {underlyings.map(u => (
              <button key={u} onClick={() => handleUnderlyingChange(u)} style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid',
                borderColor: underlying === u ? 'var(--accent)' : 'var(--border)',
                background: underlying === u ? 'var(--accent)' : 'transparent',
                color: underlying === u ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: underlying === u ? 700 : 500,
                cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.15s',
              }}>{u}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

          {/* Expiry dropdown */}
          <select value={selectedExpiry} onChange={e => handleExpiryChange(e.target.value)}
            disabled={expiriesQuery.isLoading} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '5px 10px',
              fontSize: 13, cursor: 'pointer', minWidth: 120,
            }}>
            <option value="">{expiriesQuery.isLoading ? 'Loading…' : 'Select expiry'}</option>
            {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
          </select>

          {/* Refresh */}
          <button onClick={handleRefresh} disabled={!selectedExpiry || isPending} title="Refresh chain" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, color: isPending ? 'var(--text-muted)' : 'var(--text)',
            padding: '5px 10px', cursor: !selectedExpiry || isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
          }}>
            <RefreshIcon spinning={isPending} />
          </button>

          {/* Error */}
          {chainMutation.isError && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>{mapHttpError(chainMutation.error)}</span>
          )}

          {!underlyings.length && !instrumentsQuery.isLoading && !chainMutation.isError && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>No option underlyings available from API.</span>
          )}

          {/* Stats (right side) */}
          {data && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* Underlying LTP */}
              {uLtp > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                    {uLtp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: uChgPct >= 0 ? '#35d18a' : '#f06161', marginTop: 2 }}>
                    {uChgPct >= 0 ? '▲' : '▼'} {Math.abs(uChgPct).toFixed(2)}%
                  </span>
                </div>
              )}
              {/* PCR badge */}
              <div style={{
                background: pcr >= 1 ? 'rgba(53,209,138,0.1)' : 'rgba(240,97,97,0.1)',
                border: `1px solid ${pcr >= 1 ? 'rgba(53,209,138,0.35)' : 'rgba(240,97,97,0.35)'}`,
                borderRadius: 6, padding: '4px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>PCR</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: pcr >= 1 ? '#35d18a' : '#f06161' }}>{pcr.toFixed(2)}</div>
              </div>
              {/* Max Pain */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>MAX PAIN</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fb923c' }}>{maxPain.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHAIN TABLE (scrollable) ───────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {isPending && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 10 }}>
            <RefreshIcon spinning />
            Loading option chain…
          </div>
        )}
        {!isPending && !hasChain && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 14 }}>
            {chainMutation.isError ? 'Failed to load chain.' : 'Select an underlying and expiry to view the option chain.'}
          </div>
        )}
        {hasChain && (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            {renderHead()}
            <tbody>{chain.map((row, idx) => renderRow(row, idx))}</tbody>
          </table>
        )}
      </div>

      {/* ── BOTTOM VIEW MODE BAR ──────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        {/* View tabs */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3 }}>
          {([{ id: 'ltp', label: 'LTP View' }, { id: 'greeks', label: 'Greeks View' }, { id: 'all', label: 'All Columns' }] as { id: ViewMode; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setViewMode(tab.id)} style={{
              padding: '5px 16px', borderRadius: 6, border: 'none',
              background: viewMode === tab.id ? 'var(--accent)' : 'transparent',
              color: viewMode === tab.id ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: viewMode === tab.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Analysis links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['OI Analysis', 'IV', 'Live Charts'].map(link => (
            <button key={link} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {link}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
