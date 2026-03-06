import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/api/user.service';
import { mapHttpErrorFull } from '@/services/http/error-mapper';
import { AsyncState } from '@/shared/components/async-state';

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toTextValue(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return typeof value === 'string' && value.trim() ? value : '—';
}

export function MarginsPage() {
  const [segment, setSegment] = useState('equity');
  const query = useQuery({ queryKey: ['user', 'margins', segment], queryFn: () => userService.getMargins(segment) });

  const margins = toRecord(query.data);
  const available = toRecord(margins.available);
  const utilised = toRecord(margins.utilised);

  const availableEntries = Object.entries(available);
  const utilisedEntries = Object.entries(utilised);

  return (
    <div className="data-grid">
      <section className="page-card">
        <h2 className="section-title">User Margins</h2>
        <select className="select" value={segment} onChange={(event) => setSegment(event.target.value)}>
          <option value="equity">Equity</option>
          <option value="commodity">Commodity</option>
        </select>
      </section>
      <AsyncState isLoading={query.isLoading} error={query.error ? mapHttpErrorFull(query.error) : null} isEmpty={!query.data}>
        <section className="page-card user-page-card">
          <h2 className="section-title">Margins Summary</h2>
          <div className="user-kv-grid">
            <div className="user-kv-item">
              <span className="helper">Segment</span>
              <strong>{toTextValue(margins.segment)}</strong>
            </div>
            <div className="user-kv-item">
              <span className="helper">Enabled</span>
              <strong>{toTextValue(margins.enabled)}</strong>
            </div>
            <div className="user-kv-item">
              <span className="helper">Net</span>
              <strong>{toTextValue(margins.net)}</strong>
            </div>
          </div>

          <div className="user-chip-block">
            <h3 className="section-title">Available</h3>
            <ul className="user-kv-list">
              {availableEntries.length ? availableEntries.map(([key, value]) => (
                <li key={key}>
                  <span>{key}</span>
                  <strong>{toTextValue(value)}</strong>
                </li>
              )) : <li><span className="helper">No available margin details</span></li>}
            </ul>
          </div>

          <div className="user-chip-block">
            <h3 className="section-title">Utilised</h3>
            <ul className="user-kv-list">
              {utilisedEntries.length ? utilisedEntries.map(([key, value]) => (
                <li key={key}>
                  <span>{key}</span>
                  <strong>{toTextValue(value)}</strong>
                </li>
              )) : <li><span className="helper">No utilised margin details</span></li>}
            </ul>
          </div>
        </section>
      </AsyncState>
    </div>
  );
}

