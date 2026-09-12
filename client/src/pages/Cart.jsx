import { useEffect, useState } from 'react';
import { Link, useNavigate } from '../router';
import QuantityControl from '../components/QuantityControl';
import StatusLabel from '../components/StatusLabel';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api';

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, error, isLoading, updateItem, removeItem, clear } = useCart();
  const [recentPaidOrders, setRecentPaidOrders] = useState([]);
  const isGuest = !cart.userId;

  useEffect(() => {
    if (!isAuthenticated) return;

    orderApi.mine()
      .then(({ data }) => {
        const paid = (data.data || []).filter((order) => order.status === 'PAID').slice(0, 3);
        setRecentPaidOrders(paid);
      })
      .catch(() => setRecentPaidOrders([]));
  }, [isAuthenticated]);

  const changeQuantity = async (item, quantity) => {
    const targetId = isGuest ? item.productId : item.id;
    try {
      if (quantity <= 0) {
        await removeItem(item);
      } else {
        await updateItem(targetId, quantity, item);
      }
    } catch {
      // Handled in context with error display
    }
  };

  return (
    <main className="page-width page-section cart-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your selection</p>
          <h1>Cart</h1>
        </div>
        <span>{cart.items.length} {cart.items.length === 1 ? 'line' : 'lines'}</span>
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          <strong>{error}</strong>
          <span>If an item is out of stock, please remove it to proceed with your order.</span>
        </div>
      )}

      {isLoading && <div className="state-block"><span className="loader-line" /> Updating your cart...</div>}

      {!isLoading && cart.items.length === 0 && (
        <div className="empty-panel">
          <p className="eyebrow">Nothing here yet</p>
          <h2>Start with your next device.</h2>
          <Link className="button button-dark" to="/">Browse the collection</Link>
        </div>
      )}

      {cart.items.length > 0 && (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {cart.items.map((item) => {
              const stock = item.stock_quantity ?? 10;
              const isOutOfStock = stock < 1;
              const isLowStock = stock > 0 && stock <= 3;

              return (
                <article className={`cart-line ${isOutOfStock ? 'cart-line-exhausted' : ''}`} key={item.id}>
                  <div className="cart-line-image">
                    {item.image ? <img src={item.image} alt={item.name} /> : <span>Product</span>}
                    {isOutOfStock && <span className="image-flag image-flag-danger">Sold out</span>}
                  </div>

                  <div className="cart-line-main">
                    <div>
                      <p className="eyebrow">{item.is_active ? 'In catalog' : 'Unavailable'}</p>
                      <h2>{item.name}</h2>
                    </div>

                    <div className="cart-line-pricing">
                      <p className="line-price">${Number(item.price).toFixed(2)}</p>
                      
                      {isOutOfStock && (
                        <span className="stock-badge stock-badge-zero">
                          Out of stock — please remove to checkout
                        </span>
                      )}
                      {isLowStock && (
                        <span className="stock-badge stock-badge-low">
                          Only {stock} available in stock
                        </span>
                      )}
                      {!isOutOfStock && !isLowStock && (
                        <span className="stock-badge stock-badge-ok">
                          Stock: {stock} available
                        </span>
                      )}
                    </div>

                    <div className="cart-line-controls">
                      <QuantityControl
                        quantity={item.quantity}
                        max={Math.max(1, stock)}
                        disabled={isOutOfStock}
                        onChange={(quantity) => changeQuantity(item, quantity)}
                      />
                      <button
                        className="text-button danger-button"
                        type="button"
                        onClick={() => removeItem(item)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="line-total">
                    ${Number(item.itemTotal).toFixed(2)}
                  </strong>
                </article>
              );
            })}

            <div className="cart-bulk-actions">
              <button className="text-button danger-button" type="button" onClick={clear}>
                Clear entire cart
              </button>
            </div>
          </section>

          <aside className="summary-block">
            <p className="eyebrow">Order summary</p>
            <div className="summary-row">
              <span>Items count</span>
              <strong>{cart.items.reduce((total, item) => total + item.quantity, 0)} units</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Subtotal</span>
              <strong>${Number(cart.totalAmount).toFixed(2)}</strong>
            </div>

            {isGuest ? (
              <button
                className="button button-dark button-full"
                type="button"
                onClick={() => navigate('/auth?returnTo=%2Fcheckout')}
              >
                Sign in to checkout
              </button>
            ) : (
              <Link className="button button-signal button-full" to="/checkout">
                Review and checkout
              </Link>
            )}

            <p className="summary-note">
              Final price, tax, and stock availability are confirmed atomically when the order is placed.
            </p>
          </aside>
        </div>
      )}

      {/* Task 4: Recent completed (PAID) orders shown below cart in muted editorial style */}
      {recentPaidOrders.length > 0 && (
        <section className="recent-completed-section" aria-labelledby="recent-purchases-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Past records</p>
              <h2 id="recent-purchases-heading">Recent completed purchases</h2>
            </div>
            <Link className="text-button" to="/orders">View all orders →</Link>
          </div>

          <div className="recent-completed-grid">
            {recentPaidOrders.map((order) => {
              const totalItems = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
              return (
                <article className="recent-completed-card" key={order.id}>
                  <div className="recent-card-top">
                    <span className="mono-code">#{order.id.slice(0, 8)}</span>
                    <StatusLabel status={order.status} />
                  </div>

                  <div className="recent-card-body">
                    <p className="recent-card-meta">
                      {new Date(order.created_at).toLocaleDateString()} · {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </p>
                    <strong className="recent-card-total">
                      ${Number(order.total_amount).toFixed(2)}
                    </strong>
                  </div>

                  <Link className="recent-card-link" to={`/orders/${order.id}`}>
                    Inspect order receipt →
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
