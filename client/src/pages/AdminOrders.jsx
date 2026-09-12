import { useEffect, useState } from 'react';
import { adminOrderApi, orderApi } from '../api';
import StatusLabel from '../components/StatusLabel';
import { Link } from '../router';

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

  // Task 12: Accordion state for expanded order details
  const [expandedId, setExpandedId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

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
    setExpandedId(null);
  };

  const toggleOrderExpand = async (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(orderId);

    // Fetch details if not yet cached
    if (!orderDetails[orderId]) {
      setLoadingDetailId(orderId);
      try {
        const { data } = await orderApi.get(orderId);
        setOrderDetails((prev) => ({ ...prev, [orderId]: data.data }));
      } catch {
        // Failed to load details
      } finally {
        setLoadingDetailId(null);
      }
    }
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
    return (
      <button
        className="admin-action-button"
        type="button"
        disabled={updatingId === order.id}
        onClick={() => markPaid(order)}
      >
        {label}
      </button>
    );
  };

  return (
    <main className="admin-page admin-orders-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Fulfilment / queue</p>
          <h1>Orders</h1>
        </div>
        <select
          className="admin-select"
          value={status}
          onChange={(event) => filterStatus(event.target.value)}
          aria-label="Order status filter"
        >
          {statuses.map((value) => (
            <option key={value} value={value}>{value || 'All statuses'}</option>
          ))}
        </select>
      </div>

      <div className="admin-intro-line">
        <span>{meta.total} orders in the system</span>
        <button className="admin-quiet-button" type="button" onClick={loadOrders}>
          Refresh queue
        </button>
      </div>

      {error && <div className="admin-notice" role="alert"><strong>{error}</strong></div>}
      {notice && <output className="admin-success">{notice}</output>}

      <section className="admin-order-table" aria-label="All orders">
        <div className="admin-order-head">
          <span>Order</span>
          <span>Customer</span>
          <span>Date</span>
          <span>Status</span>
          <span>Total</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div className="admin-loading"><span className="loader-line" /> Loading order queue...</div>
        ) : orders.length === 0 ? (
          <div className="admin-loading">No orders match this filter.</div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const detail = orderDetails[order.id];
            const isLoadingDetail = loadingDetailId === order.id;

            return (
              <div className="admin-order-group" key={order.id}>
                <article className={`admin-order-row ${isExpanded ? 'row-expanded' : ''}`}>
                  <div>
                    <strong>#{order.id.slice(0, 8)}</strong>
                    <button
                      className="admin-expand-btn"
                      type="button"
                      onClick={() => toggleOrderExpand(order.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? '▲ Hide items' : '▼ Inspect items'}
                    </button>
                  </div>
                  <span className="admin-truncate">{order.user?.email || 'Customer'}</span>
                  <span className="admin-muted">{new Date(order.created_at).toLocaleDateString()}</span>
                  <div>
                    <StatusLabel status={order.status} />
                  </div>
                  <strong className="admin-table-number">${Number(order.total_amount).toFixed(2)}</strong>
                  <div className="admin-order-actions-cell">
                    {orderAction(order)}
                  </div>
                </article>

                {/* Task 12: Expandable drawer inside order row */}
                {isExpanded && (
                  <div className="admin-order-drawer" role="region" aria-label={`Items for order ${order.id}`}>
                    {isLoadingDetail ? (
                      <div className="admin-drawer-loading">
                        <span className="loader-line" /> Fetching items in order...
                      </div>
                    ) : detail ? (
                      <div className="admin-drawer-content">
                        <div className="admin-drawer-header">
                          <p className="eyebrow">Order contents / #{order.id}</p>
                          <span className="drawer-customer-email">Customer: {detail.user?.email}</span>
                        </div>

                        <div className="admin-drawer-items">
                          {(detail.items || []).map((item) => {
                            const img = item.product?.images?.[0];
                            const lineTotal = Number(item.price_at_purchase) * item.quantity;
                            return (
                              <div className="admin-drawer-item" key={item.id}>
                                <div className="admin-drawer-thumb">
                                  {img ? <img src={img} alt="" /> : <span>Item</span>}
                                </div>
                                <div className="admin-drawer-item-info">
                                  <strong>
                                    {item.product_id ? (
                                      <Link to={`/product/${item.product_id}`}>
                                        {item.product?.name || 'Product'}
                                      </Link>
                                    ) : (
                                      item.product?.name || 'Product'
                                    )}
                                  </strong>
                                  <span className="admin-muted">
                                    ${Number(item.price_at_purchase).toFixed(2)} × {item.quantity}
                                  </span>
                                </div>
                                <span className="admin-table-number">${lineTotal.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="admin-drawer-footer">
                          <span>Total Units: {(detail.items || []).reduce((acc, it) => acc + it.quantity, 0)}</span>
                          <strong>Order Total: ${Number(detail.total_amount).toFixed(2)}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-drawer-loading">Could not load items for this order.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {meta.totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Order pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>Page {page} of {meta.totalPages}</span>
          <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
