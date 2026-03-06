import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ordersService } from '@/services/api/orders.service';
import { mapHttpError } from '@/services/http/error-mapper';
import { JsonView } from '@/shared/components/json-view';

export function ModifyOrderPage() {
  const [variety, setVariety] = useState('regular');
  const [orderId, setOrderId] = useState('1234');
  const [payload, setPayload] = useState('{"quantity":2,"price":620}');

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => ordersService.modifyOrder(variety, orderId, body),
  });

  const onSubmit = () => {
    try {
      mutation.mutate(JSON.parse(payload));
    } catch {
      mutation.reset();
    }
  };

  return (
    <div className="data-grid">
      <section className="page-card form-grid">
        <h2 className="section-title">Modify Order</h2>
        <input className="input" placeholder="Variety (regular, amo, co, iceberg, auction)" value={variety} onChange={(event) => setVariety(event.target.value)} />
        <input className="input" placeholder="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
        <textarea className="input" style={{ minHeight: 120, paddingTop: 10 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
        <button className="btn btn-primary" onClick={onSubmit} disabled={mutation.isPending}>
          Modify Order
        </button>
        {mutation.error ? <span className="error-text">{mapHttpError(mutation.error)}</span> : null}
      </section>
      {mutation.data ? <JsonView title="Modify Result" data={mutation.data} /> : null}
    </div>
  );
}
