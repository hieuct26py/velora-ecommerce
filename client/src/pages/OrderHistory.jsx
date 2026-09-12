import { useEffect, useState } from 'react';
import { Link } from '../router';
import { orderApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusLabel from '../components/StatusLabel';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    orderApi.mine()
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setError('Your order history could not be loaded.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <main className="page-width page-section">
        <div className="empty-panel">
          <h1>Your orders live here.</h1>
          <Link className="button button-dark" to="/auth">Sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-width page-section order-history-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account / history</p>
          <h1>Orders</h1>
        </div>
        <span className="admin-truncate">{user.email}</span>
      </div>

      {loading && <div className="state-block"><span className="loader-line" /> Loading your orders...</div>}
      {error && <div className="notice notice-error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-panel">
          <h2>No orders yet.</h2>
          <p>When you find something worth keeping, it will appear here.</p>
          <Link className="button button-dark" to="/">Shop the collection</Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => {
            const items = order.items || [];
            const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

            return (
              <article className="order-row" key={order.id}>
                <div>
                  <p className="eyebrow">
                    #{order.id.slice(0, 8)} / {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <h2>
                    {totalUnits} {totalUnits === 1 ? 'item' : 'items'}
                    {items.length > 1 ? ` · ${items.length} products` : ''}
                  </h2>
                </div>
                <StatusLabel status={order.status} />
                <strong className="order-total-amount">
                  ${Number(order.total_amount).toFixed(2)}
                </strong>
                <Link className="button button-quiet" to={`/orders/${order.id}`}>
                  Open order →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
