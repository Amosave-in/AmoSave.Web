import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ordersService } from '@/services/api/orders.service';
import { queryKeys } from '@/shared/lib/query-keys';
import { AsyncState } from '@/shared/components/async-state';
import { DataTable } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/badge';
import { mapHttpErrorFull } from '@/services/http/error-mapper';
import type { Dictionary } from '@/shared/types/api';

type StatusTab = 'all' | 'pending' | 'executed' | 'cancelled' | 'rejected';

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'executed', label: 'Executed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
];

const PENDING_STATUSES = ['OPEN', 'PENDING', 'TRIGGER PENDING', 'AMO REQ RECEIVED'];

const statusVariant: Record<string, 'success' | 'danger' | 'default' | 'warning'> = {
  COMPLETE: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
};

function matchesTab(r: Dictionary, tab: StatusTab): boolean {
  const s = String(r.status ?? '').toUpperCase();
  if (tab === 'all') return true;
  if (tab === 'pending') return PENDING_STATUSES.includes(s);
  if (tab === 'executed') return s === 'COMPLETE';
  if (tab === 'cancelled') return s === 'CANCELLED';
  if (tab === 'rejected') return s === 'REJECTED';
  return true;
}

export function OrdersPage() {
  const [tab, setTab] = useState<StatusTab>('all');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.orders,
    queryFn: ordersService.getOrders,
    refetchInterval: tab === 'pending' ? 5000 : false,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ variety, orderId }: { variety: string; orderId: string }) =>
      ordersService.cancelOrder(variety, orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  });

  const all = (query.data ?? []) as Dictionary[];
  const rows = all.filter((r) => matchesTab(r, tab));

  const columns: ColumnDef<Dictionary>[] = [
    {
      id: 'time',
      header: 'Time',
      cell: ({ row }) => {
        const t = String(row.original.orderTimestamp ?? row.original.exchangeTimestamp ?? '');
        const parts = t.split('T');
        const time = parts.length > 1 ? parts[1]?.slice(0, 8) : t.slice(-8);
        return (
          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>
            {time || '—'}
          </span>
        );
      },
    },
    {
      id: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600 }}>{String(row.original.tradingsymbol ?? '')}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const v = String(row.original.transactionType ?? '');
        return <Badge variant={v === 'BUY' ? 'buy' : v === 'SELL' ? 'sell' : 'default'}>{v}</Badge>;
      },
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{String(row.original.product ?? '')}</span>
      ),
    },
    {
      id: 'orderType',
      header: 'Order Type',
      cell: ({ row }) => (
        <span style={{ fontSize: 12 }}>{String(row.original.orderType ?? '')}</span>
      ),
    },
    {
      id: 'qty',
      header: () => <div style={{ textAlign: 'right' }}>Qty</div>,
      cell: ({ row }) => (
        <div style={{ textAlign: 'right' }}>{String(row.original.quantity ?? '')}</div>
      ),
    },
    {
      id: 'price',
      header: () => <div style={{ textAlign: 'right' }}>Price</div>,
      cell: ({ row }) => {
        const orderType = String(row.original.orderType ?? '');
        const price = Number(row.original.price ?? 0);
        return (
          <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {orderType === 'MARKET' || price === 0 ? 'MKT' : `₹${price.toFixed(2)}`}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const v = String(row.original.status ?? '');
        return <Badge variant={statusVariant[v.toUpperCase()] ?? 'warning'}>{v}</Badge>;
      },
    },
    {
      id: 'cancel',
      header: '',
      cell: ({ row }) => {
        const s = String(row.original.status ?? '').toUpperCase();
        if (!PENDING_STATUSES.includes(s)) return null;
        const orderId = String(row.original.orderId ?? '');
        const variety = String(row.original.variety ?? 'regular');
        return (
          <button
            onClick={() => cancelMutation.mutate({ variety, orderId })}
            disabled={cancelMutation.isPending}
            style={{
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 4,
              border: '1px solid #f06161',
              background: 'transparent',
              color: '#f06161',
              cursor: 'pointer',
              opacity: cancelMutation.isPending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
        );
      },
    },
  ];

  return (
    <div className="page-card" style={{ padding: 0 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Orders</h2>
        <button
          style={{
            fontSize: 13,
            padding: '6px 18px',
            borderRadius: 20,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Place Order
        </button>
      </div>

      {/* Status tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
        }}
      >
        {STATUS_TABS.map((t) => {
          const count = t.key !== 'all' ? all.filter((r) => matchesTab(r, t.key)).length : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'transparent',
                color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {t.label}
              {count !== null && count > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    background: tab === t.key ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: tab === t.key ? '#fff' : 'var(--text-muted)',
                    borderRadius: 99,
                    padding: '0 5px',
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {tab === 'pending' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#35d18a' }}>
            ● Auto-refresh 5s
          </span>
        )}
      </div>

      <AsyncState
        isLoading={query.isLoading}
        error={query.error ? mapHttpErrorFull(query.error) : null}
        isEmpty={all.length === 0}
        emptyText="No orders today"
      >
        <DataTable columns={columns} data={rows} emptyText="No orders in this category" />
      </AsyncState>
    </div>
  );
}
