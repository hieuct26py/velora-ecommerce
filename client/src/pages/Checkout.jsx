import { useState } from 'react';
import { Link } from '../router';
import { orderApi } from '../api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import QuantityControl from '../components/QuantityControl';
import ConfirmModal from '../components/ConfirmModal';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await orderApi.create();
      setOrder(data.order);
      setIsModalOpen(false);
      await refresh();
    } catch (requestError) {
      setIsModalOpen(false);
      setError(requestError.response?.data?.message || 'We could not place this order. Your cart is still here.');
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="page-width page-section">
        <div className="empty-panel">
          <p className="eyebrow">Account required</p>
          <h1>Sign in before checkout.</h1>
          <Link className="button button-dark" to="/auth?returnTo=%2Fcheckout">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (order) {
    return (
      <main className="page-width page-section">
        <div className="confirmation-panel">
          <p className="eyebrow">Order received</p>
          <h1>That is on its way.</h1>
          <p>
            Your order <strong>#{order.id.slice(0, 8)}</strong> is now pending confirmation. We have reserved the items in one transaction.
          </p>
          <div className="confirmation-actions">
            <Link className="button button-dark" to={`/orders/${order.id}`}>
              View order receipt
            </Link>
            <Link className="button button-quiet" to="/">
              Keep shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-width page-section checkout-page">
      <Link className="back-link checkout-back" to="/cart">
        ← Back to edit cart
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">Final review</p>
          <h1>Checkout</h1>
        </div>
        <span>One order from your cart</span>
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          <strong>{error}</strong>
          <span>Review your cart for stock or availability changes.</span>
        </div>
      )}

      {!cart.items.length ? (
        <div className="empty-panel">
          <h2>Your cart is empty.</h2>
          <Link className="button button-dark" to="/">Return to shop</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <section className="review-list">
            <div className="review-header">
              <span>Item</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            {cart.items.map((item) => (
              <div className="review-row" key={item.id}>
                <span>
                  {item.name}
                  <small>${Number(item.price).toFixed(2)} each</small>
                </span>
                <QuantityControl quantity={item.quantity} disabled onChange={() => {}} />
                <strong>${Number(item.itemTotal).toFixed(2)}</strong>
              </div>
            ))}

            <div className="review-actions">
              <Link className="button button-quiet checkout-edit-btn" to="/cart">
                ← Edit items in cart
              </Link>
            </div>
          </section>

          <aside className="summary-block checkout-summary">
            <p className="eyebrow">Confirm and place</p>
            <div className="summary-row">
              <span>Customer</span>
              <strong className="admin-truncate">{user.email}</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Server total</span>
              <strong>${Number(cart.totalAmount).toFixed(2)}</strong>
            </div>

            <button
              className="button button-signal button-full checkout-submit-btn"
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isSubmitting}
            >
              Place order (${Number(cart.totalAmount).toFixed(2)})
            </button>

            <p className="summary-note">
              Velora verifies stock, price, and inventory atomically on the server.
            </p>
          </aside>
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title="Confirm order placement"
        message={
          <div>
            <p>You are about to place this order with <strong>{cart.items.reduce((acc, it) => acc + it.quantity, 0)} items</strong> for a total of <strong>${Number(cart.totalAmount).toFixed(2)}</strong>.</p>
            <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>Items will be reserved immediately upon confirmation.</p>
          </div>
        }
        confirmLabel="Confirm & place order"
        cancelLabel="Review cart"
        isLoading={isSubmitting}
        onConfirm={handlePlaceOrder}
        onCancel={() => setIsModalOpen(false)}
      />
    </main>
  );
}
