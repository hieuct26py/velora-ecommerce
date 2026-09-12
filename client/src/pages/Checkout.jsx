import { useState } from 'react';
import { Link } from '../router';
import { orderApi } from '../api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import QuantityControl from '../components/QuantityControl';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const placeOrder = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await orderApi.create();
      setOrder(data.order);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not place this order. Your cart is still here.');
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <main className="page-width page-section"><div className="empty-panel"><p className="eyebrow">Account required</p><h1>Sign in before checkout.</h1><Link className="button button-dark" to="/auth?returnTo=%2Fcheckout">Sign in</Link></div></main>;
  }

  if (order) {
    return (
      <main className="page-width page-section">
        <div className="confirmation-panel">
          <p className="eyebrow">Order received</p>
          <h1>That is on its way.</h1>
          <p>Your order <strong>#{order.id.slice(0, 8)}</strong> is now pending confirmation. We have reserved the items in one transaction.</p>
          <div className="confirmation-actions"><Link className="button button-dark" to="/orders">View orders</Link><Link className="text-button" to="/">Keep shopping</Link></div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-width page-section">
      <div className="page-heading"><p className="eyebrow">Final review</p><h1>Checkout</h1><span>One order from your cart</span></div>
      {error && <div className="notice notice-error" role="alert"><strong>{error}</strong><span>Review your cart for stock or availability changes.</span></div>}
      {!cart.items.length ? (
        <div className="empty-panel"><h2>Your cart is empty.</h2><Link className="button button-dark" to="/">Return to shop</Link></div>
      ) : (
        <div className="checkout-layout">
          <section className="review-list">
            <div className="review-header"><span>Item</span><span>Quantity</span><span>Total</span></div>
            {cart.items.map((item) => <div className="review-row" key={item.id}><span>{item.name}<small>${Number(item.price).toFixed(2)} each</small></span><QuantityControl quantity={item.quantity} disabled onChange={() => {}} /><strong>${Number(item.itemTotal).toFixed(2)}</strong></div>)}
            <Link className="text-button" to="/cart">Edit cart</Link>
          </section>
          <aside className="summary-block checkout-summary"><p className="eyebrow">Confirm and place</p><div className="summary-row"><span>Customer</span><strong>{user.email}</strong></div><div className="summary-row summary-total"><span>Server total</span><strong>${Number(cart.totalAmount).toFixed(2)}</strong></div><button className="button button-signal button-full" type="button" onClick={placeOrder} disabled={isSubmitting}>{isSubmitting ? 'Placing order...' : 'Place order'}</button><p className="summary-note">Velora verifies stock, price, and inventory atomically on the server.</p></aside>
        </div>
      )}
    </main>
  );
}
