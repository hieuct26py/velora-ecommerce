import { useEffect, useState } from 'react';
import { Link, useRoute } from '../router';
import { orderApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusLabel from '../components/StatusLabel';

export default function OrderDetail() {
  const { path } = useRoute();
  const orderId = path.replace(/^\/orders\//, '').split('?')[0];
  const { isAuthenticated, isBooting } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!orderId || !isAuthenticated || isBooting) return;

    orderApi.get(orderId)
      .then(({ data }) => {
        setOrder(data.data);
        setError('');
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Could not load order details.');
      })
      .finally(() => setLoading(false));
  }, [orderId, isAuthenticated, isBooting]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'PENDING') return;
    if (!window.confirm('Are you sure you want to cancel this order? Reserved stock will be returned.')) {
      return;
    }

    setIsCancelling(true);
    setError('');
    try {
      await orderApi.cancel(order.id);
      setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
      setCancelMessage('Order cancelled successfully. Reserved items have been returned to stock.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isBooting) {
    return (
      <main className="page-width page-section">
        <div className="state-block">
          <span className="loader-line" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-width page-section">
        <div className="empty-panel">
          <p className="eyebrow">Authentication required</p>
          <h1>Please sign in to view this order.</h1>
          <Link className="button button-dark" to={`/auth?returnTo=${encodeURIComponent(path)}`}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-width page-section">
        <div className="state-block">
          <span className="loader-line" />
          <span>Loading order details...</span>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="page-width page-section">
        <Link className="back-link" to="/orders">← Back to orders</Link>
        <div className="empty-panel">
          <p className="eyebrow">Order notice</p>
          <h2>{error || 'Order not found'}</h2>
          <p>The requested order could not be accessed or does not exist.</p>
          <Link className="button button-dark" to="/orders">View all orders</Link>
        </div>
      </main>
    );
  }

  const items = order.items || [];
  const orderDate = new Date(order.created_at).toLocaleString();

  return (
    <main className="page-width page-section order-detail-page">
      <Link className="back-link" to="/orders">← Back to orders</Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">Order reference / #{order.id.slice(0, 8)}</p>
          <h1>Order details</h1>
          <span className="order-timestamp">Placed on {orderDate}</span>
        </div>
        <StatusLabel status={order.status} />
      </div>

      {cancelMessage && (
        <div className="notice notice-success" role="status">
          <strong>{cancelMessage}</strong>
        </div>
      )}

      {error && (
        <div className="notice notice-error" role="alert">
          <strong>{error}</strong>
        </div>
      )}

      <div className="order-detail-layout">
        <section className="order-items-column" aria-label="Purchased items">
          <div className="order-items-head">
            <span>Items ({items.length})</span>
            <span>Total</span>
          </div>

          <div className="order-items-list">
            {items.map((item) => {
              const image = item.product?.images?.[0];
              const lineTotal = Number(item.price_at_purchase) * item.quantity;

              return (
                <article className="order-item-row" key={item.id}>
                  <div className="order-item-thumb">
                    {image ? (
                      <img src={image} alt={item.product?.name || 'Product image'} />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="order-item-content">
                    <h3>
                      {item.product_id ? (
                        <Link to={`/product/${item.product_id}`}>
                          {item.product?.name || 'Product'}
                        </Link>
                      ) : (
                        <span>{item.product?.name || 'Product'}</span>
                      )}
                    </h3>
                    <p className="item-meta">
                      ${Number(item.price_at_purchase).toFixed(2)} × {item.quantity}
                    </p>
                  </div>

                  <strong className="item-line-total">
                    ${lineTotal.toFixed(2)}
                  </strong>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="summary-block order-summary-sidebar">
          <p className="eyebrow">Order summary</p>

          <div className="summary-row">
            <span>Order ID</span>
            <strong className="mono-code">#{order.id.slice(0, 8)}</strong>
          </div>

          <div className="summary-row">
            <span>Total units</span>
            <strong>{items.reduce((total, item) => total + item.quantity, 0)}</strong>
          </div>

          <div className="summary-row">
            <span>Status</span>
            <StatusLabel status={order.status} />
          </div>

          <div className="summary-row summary-total">
            <span>Total amount</span>
            <strong>${Number(order.total_amount).toFixed(2)}</strong>
          </div>

          {order.status === 'PENDING' && (
            <div className="order-action-box">
              <button
                className="button button-danger button-full"
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling order...' : 'Cancel order'}
              </button>
              <p className="summary-note">
                Order is awaiting fulfillment. Cancelling will immediately return inventory to stock.
              </p>
            </div>
          )}

          {order.status === 'PAID' && (
            <p className="summary-note">
              Order confirmed and paid. Items are being prepared for dispatch.
            </p>
          )}

          {order.status === 'CANCELLED' && (
            <p className="summary-note">
              This order has been cancelled and items were restored to inventory.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
