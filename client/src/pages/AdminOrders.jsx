import { useCallback, useEffect, useState } from 'react';
import { adminOrderApi, orderApi } from '../api';
import StatusLabel from '../components/StatusLabel';
import { Link } from '../router';

const statuses = [
  { value: '', label: 'All orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [amountTier, setAmountTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Task 12: Accordion state for expanded order details
  const [expandedId, setExpandedId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let minAmount;
      let maxAmount;
      if (amountTier === 'under_500') {
        maxAmount = 500;
      } else if (amountTier === '500_to_2000') {
        minAmount = 500;
        maxAmount = 2000;
      } else if (amountTier === 'over_2000') {
        minAmount = 2000;
      }

      const params = {
        status: status || undefined,
        search: search.trim() || undefined,
        minAmount,
        maxAmount,
        sortBy,
        page,
        limit: 12,
      };

      const { data } = await adminOrderApi.all(params);
      setOrders(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 1 });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [amountTier, status, search, sortBy, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 220);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const filterStatus = (value) => {
    setStatus(value);
    setPage(1);
    setExpandedId(null);
  };

  const isFiltered = Boolean(search.trim() || status || amountTier !== 'ALL' || sortBy !== 'newest');

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setAmountTier('ALL');
    setSortBy('newest');
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
        <button className="admin-refresh" type="button" onClick={loadOrders} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh queue'}
        </button>
      </div>

      <div className="admin-intro-line">
        <span>{meta.total} total orders in the system</span>
        <span>Order fulfillment & processing</span>
      </div>

      {error && <div className="admin-notice" role="alert"><strong>{error}</strong></div>}
      {notice && <output className="admin-success">{notice}</output>}

      {/* Orders Filter Toolbar */}
      <div className="admin-filter-toolbar">
        <div className="admin-filter-group">
          <div className="admin-search-box">
            <span className="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search #ID or customer email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => { setSearch(''); setPage(1); }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Segmented Pills */}
          <div className="admin-filter-pills" role="tablist" aria-label="Filter orders by status">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`admin-filter-pill ${status === s.value ? 'active' : ''}`}
                onClick={() => filterStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <select
            className={`admin-filter-select ${amountTier !== 'ALL' ? 'active-filter' : ''}`}
            value={amountTier}
            onChange={(e) => { setAmountTier(e.target.value); setPage(1); }}
            aria-label="Filter by order amount"
          >
            <option value="ALL">All amounts</option>
            <option value="under_500">Under $500</option>
            <option value="500_to_2000">$500 – $2,000</option>
            <option value="over_2000">Over $2,000</option>
          </select>

          <select
            className="admin-filter-select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            aria-label="Sort orders"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        <div className="admin-filter-meta">
          <span className="admin-filter-count">
            Showing <strong>{orders.length}</strong> of {meta.total}
          </span>
          {isFiltered && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

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
          <div className="admin-empty-box">
            <span>No orders found matching your search or filters.</span>
            {isFiltered && (
              <button
                type="button"
                className="admin-quiet-button"
                style={{ marginLeft: '12px' }}
                onClick={resetFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
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
