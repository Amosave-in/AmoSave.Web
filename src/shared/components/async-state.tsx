import { ReactNode } from 'react';
import type { MappedError } from '@/services/http/error-mapper';

type Props = {
  isLoading: boolean;
  error: string | MappedError | null;
  isEmpty?: boolean;
  emptyText?: string;
  children: ReactNode;
};

function resolveError(error: string | MappedError): MappedError {
  if (typeof error === 'string') return { message: error, isKiteNotConnected: false };
  return error;
}

export function AsyncState({
  isLoading,
  error,
  isEmpty = false,
  emptyText = 'No data found.',
  children,
}: Props) {
  if (isLoading) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
    );
  }

  if (error) {
    const { message, isKiteNotConnected } = resolveError(error);

    if (isKiteNotConnected) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            margin: '12px 16px',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 20 }}>🔌</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              Kite not connected
            </div>
            <div>Connect your Kite account to see live data. Cached data will appear once synced.</div>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: '14px 18px',
          margin: '12px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          color: '#f87171',
          fontSize: 13,
        }}
      >
        ⚠ {message}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
        {emptyText}
      </div>
    );
  }

  return <>{children}</>;
}
