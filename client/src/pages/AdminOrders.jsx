import { useEffect, useState } from 'react';
import { adminOrderApi } from '../api';
import StatusLabel from '../components/StatusLabel';

const statuses = ['', 'PENDING', 'PAID', 'CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await adminOrderApi.all({ status: status || undefined, page, limit: 12 });
      setOrders(data.data);
      setMeta(data.meta);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminOrderApi.all({ status: status || undefined, page, limit: 12 })
      .then(({ data }) => {
        setOrders(data.data);
        setMeta(data.meta);
        setError('');
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Orders could not be loaded.'))
      .finally(() => setLoading(false));
  }, [status, page]);

  const filterStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const markPaid = async (order) => {
    setUpdatingId(order.id);
    setNotice('');
    try {
      await adminOrderApi.updateStatus(order.id, 'PAID');
      setNotice(`Order #${order.id.slice(0, 8)} marked as paid.`);
      await loadOrders();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Order status could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  };

  const orderAction = (order) => {
    if (order.status !== 'PENDING') return <span className="admin-muted">No action</span>;
    const label = updatingId === order.id ? 'Updating...' : 'Mark paid';
    return <button className="admin-action-button" type="button" disabled={updatingId === order.id} onClick={() => markPaid(order)}>{label}</button>;
  };

  let orderContent = <div className="admin-loading">No orders match this filter.</div>;
  if (loading) orderContent = <div className="admin-loading">Loading order queue...</div>;
  else if (orders.length > 0) orderContent = orders.map((order) => <article className="admin-order-row" key={order.id}><div><strong>#{order.id.slice(0, 8)}</strong><span>{order.items?.length || 0} line items</span></div><span className="admin-truncate">{order.user?.email || 'Unknown customer'}</span><span className="admin-muted">{new Date(order.created_at).toLocaleDateString()}</span><StatusLabel status={order.status} /><strong className="admin-table-number">${Number(order.total_amount).toFixed(2)}</strong><div>{orderAction(order)}</div></article>);

  return (
    <main className="admin-page admin-orders-page">
      <div className="admin-page-heading"><div><p className="eyebrow">Fulfilment / queue</p><h1>Orders</h1></div><select className="admin-select" value={status} onChange={(event) => filterStatus(event.target.value)} aria-label="Order status filter">{statuses.map((value) => <option key={value} value={value}>{value || 'All statuses'}</option>)}</select></div>
      <div className="admin-intro-line"><span>{meta.total} orders in the system</span><button className="admin-quiet-button" type="button" onClick={loadOrders}>Refresh queue</button></div>
      {error && <div className="admin-notice" role="alert"><strong>{error}</strong></div>}
      {notice && <output className="admin-success">{notice}</output>}
      <section className="admin-order-table" aria-label="All orders"><div className="admin-order-head"><span>Order</span><span>Customer</span><span>Date</span><span>Status</span><span>Total</span><span>Action</span></div>{orderContent}</section>
      {meta.totalPages > 1 && <nav className="admin-pagination" aria-label="Order pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {meta.totalPages}</span><button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</button></nav>}
    </main>
  );
}
