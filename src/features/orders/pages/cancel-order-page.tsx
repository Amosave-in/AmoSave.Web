import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ordersService } from '@/services/api/orders.service';
import { mapHttpError } from '@/services/http/error-mapper';
import { JsonView } from '@/shared/components/json-view';

export function CancelOrderPage() {
  const [variety, setVariety] = useState('regular');
  const [orderId, setOrderId] = useState('1234');

  const mutation = useMutation({ mutationFn: () => ordersService.cancelOrder(variety, orderId) });

  return (
    <div className="data-grid">
      <section className="page-card form-grid">
        <h2 className="section-title">Cancel Order</h2>
        <input className="input" placeholder="Variety (regular, amo, co, iceberg, auction)" value={variety} onChange={(event) => setVariety(event.target.value)} />
        <input className="input" placeholder="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
        <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Cancel Order
        </button>
        {mutation.error ? <span className="error-text">{mapHttpError(mutation.error)}</span> : null}
      </section>
      {mutation.data ? <JsonView title="Cancel Result" data={mutation.data} /> : null}
    </div>
  );
}
