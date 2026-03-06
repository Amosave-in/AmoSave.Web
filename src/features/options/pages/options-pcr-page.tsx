import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { optionsService } from '@/services/api/options.service';
import { marketService } from '@/services/api/market.service';
import { mapHttpError } from '@/services/http/error-mapper';
import { extractOptionUnderlyings } from '@/shared/lib/options-underlyings';
import type { Dictionary } from '@/shared/types/api';

function fmtOI(val: number): string {
  if (val >= 1_00_00_000) return (val / 1_00_00_000).toFixed(2) + 'Cr';
  if (val >= 1_00_000) return (val / 1_00_000).toFixed(2) + 'L';
  return val.toLocaleString('en-IN');
}

export function OptionsPcrPage() {
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

  useEffect(() => {
    if (!underlyings.length) {
      return;
    }

    if (!underlyings.includes(underlying)) {
      setUnderlying(underlyings[0]);
      setSelectedExpiry('');
      mutation.reset();
    }
  }, [underlyings, underlying]);

  const expiriesQuery = useQuery({
    queryKey: ['options', 'expiries', underlying],
    queryFn: () => optionsService.getExpiries(underlying),
    enabled: !!underlying,
  });

  const mutation = useMutation({
    mutationFn: (expiry: string) => optionsService.getPcr({ underlying, expiry }),
  });

  useEffect(() => {
    const exps = expiriesQuery.data;
    if (exps && exps.length > 0) {
      setSelectedExpiry(exps[0]);
    }
  }, [expiriesQuery.data]);

  function handleUnderlyingChange(value: string) {
    setUnderlying(value);
    setSelectedExpiry('');
    mutation.reset();
  }

  function handleLoad() {
    if (selectedExpiry) mutation.mutate(selectedExpiry);
  }

  const data = mutation.data as Dictionary | undefined;
  const callOI = Number(data?.callOi ?? data?.callOI ?? data?.totalCallOI ?? 0);
  const putOI = Number(data?.putOi ?? data?.putOI ?? data?.totalPutOI ?? 0);
  const pcr = Number(data?.pcr ?? data?.pcRatio ?? 0);
  const totalOI = callOI + putOI;
  const callPct = totalOI > 0 ? (callOI / totalOI) * 100 : 50;
  const putPct = totalOI > 0 ? (putOI / totalOI) * 100 : 50;

  const pcrLabel = pcr > 1.2 ? 'Bullish' : pcr < 0.8 ? 'Bearish' : 'Neutral';
  const pcrColor = pcr > 1.2 ? '#35d18a' : pcr < 0.8 ? '#f06161' : '#f4c94a';
  const pcrDesc = pcr > 1.2 ? 'High put writing' : pcr < 0.8 ? 'High call writing' : 'Balanced market';

  const expiries = expiriesQuery.data ?? [];

  const statCard = (title: string, value: string, color: string, sub?: string) => (
    <div className="page-card" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{title}</div>
      <div style={{ color, fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Toolbar */}
      <div className="page-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Put-Call Ratio</h2>

        <select className="select" value={underlying} onChange={(e) => handleUnderlyingChange(e.target.value)}>
          {underlyings.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>

        <select className="select" value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)} disabled={expiriesQuery.isLoading}>
          <option value="">{expiriesQuery.isLoading ? 'Loading...' : 'Select expiry'}</option>
          {expiries.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
        </select>

        <button className="btn btn-primary" onClick={handleLoad} disabled={!selectedExpiry || mutation.isPending}>
          {mutation.isPending ? 'Loading...' : 'Get PCR'}
        </button>

        {mutation.isError && (
          <span className="helper" style={{ color: 'var(--danger)' }}>{mapHttpError(mutation.error)}</span>
        )}

        {!underlyings.length && !instrumentsQuery.isLoading && !mutation.isError && (
          <span className="helper" style={{ color: 'var(--danger)' }}>No option underlyings available from API.</span>
        )}
      </div>

      {/* Stat Cards */}
      {data && (
        <>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {statCard('Call OI', fmtOI(callOI), '#35d18a', 'Total call open interest')}
            {statCard('Put OI', fmtOI(putOI), '#f06161', 'Total put open interest')}
            {statCard('PCR', pcr.toFixed(2), pcrColor, 'Put / Call ratio')}
            <div className="page-card" style={{ flex: 1, minWidth: '140px', textAlign: 'center', border: `1px solid ${pcrColor}` }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>Sentiment</div>
              <div style={{ color: pcrColor, fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>{pcrLabel}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>{pcrDesc}</div>
            </div>
          </div>

          {/* OI Bar Visualization */}
          {totalOI > 0 && (
            <div className="page-card">
              <div style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>OI Distribution</div>
              <div style={{ display: 'flex', height: '40px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
                <div style={{
                  width: `${callPct}%`,
                  background: 'rgba(53,209,138,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#35d18a', fontWeight: 600, fontSize: '12px',
                  transition: 'width 0.4s ease',
                  minWidth: '0',
                }}>
                  {callPct.toFixed(1)}% CE
                </div>
                <div style={{
                  width: `${putPct}%`,
                  background: 'rgba(240,97,97,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f06161', fontWeight: 600, fontSize: '12px',
                  transition: 'width 0.4s ease',
                  minWidth: '0',
                }}>
                  PE {putPct.toFixed(1)}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: '#35d18a' }}>Calls: {fmtOI(callOI)}</span>
                <span style={{ color: '#f06161' }}>Puts: {fmtOI(putOI)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
