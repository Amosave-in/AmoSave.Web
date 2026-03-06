import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ordersService } from '@/services/api/orders.service';
import { queryKeys } from '@/shared/lib/query-keys';
import { AsyncState } from '@/shared/components/async-state';
import { DataTable } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/badge';
import { mapHttpErrorFull } from '@/services/http/error-mapper';
import type { Dictionary } from '@/shared/types/api';

function formatRupees(value: number) {
  return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(ts: unknown): string {
  if (!ts) return '—';
  const str = String(ts);
  // ISO string check
  if (str.includes('T') || str.includes('-')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toTimeString().slice(0, 8); // HH:mm:ss
      }
    } catch {
      // fall through
    }
  }
  return str;
}

const columns: ColumnDef<Dictionary>[] = [
  {
    header: 'Trade ID',
    accessorKey: 'tradeId',
    cell: ({ getValue }) => {
      const v = String(getValue() ?? '');
      return <span style={{ fontFamily: 'monospace' }}>{v.slice(0, 8)}</span>;
    },
  },
  { header: 'Symbol', accessorKey: 'tradingsymbol' },
  {
    header: 'Type',
    accessorKey: 'transactionType',
    cell: ({ getValue }) => {
      const v = String(getValue() ?? '');
      return <Badge variant={v === 'BUY' ? 'buy' : v === 'SELL' ? 'sell' : 'default'}>{v}</Badge>;
    },
  },
  { header: 'Qty', accessorKey: 'quantity' },
  {
    header: 'Price',
    accessorKey: 'averagePrice',
    cell: ({ getValue }) => formatRupees(Number(getValue() ?? 0)),
  },
  {
    header: 'Value',
    id: 'value',
    cell: ({ row }) => {
      const price = Number(row.original['averagePrice'] ?? 0);
      const qty = Number(row.original['quantity'] ?? 0);
      return formatRupees(price * qty);
    },
  },
  {
    header: 'Time',
    accessorKey: 'fillTimestamp',
    cell: ({ getValue }) => formatTime(getValue()),
  },
];

export function TradesPage() {
  const query = useQuery({ queryKey: queryKeys.trades, queryFn: () => ordersService.getTrades() });

  return (
    <div className="data-grid">
      <section className="page-card">
        <h2 className="section-title" style={{ marginBottom: 16 }}>Trades</h2>
        <AsyncState
          isLoading={query.isLoading}
          error={query.error ? mapHttpErrorFull(query.error) : null}
          isEmpty={!query.data?.length}
          emptyText="No trades today"
        >
          <DataTable columns={columns} data={query.data ?? []} emptyText="No trades today" />
        </AsyncState>
      </section>
    </div>
  );
}

