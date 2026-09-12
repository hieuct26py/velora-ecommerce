import { Link, useNavigate } from '../router';
import QuantityControl from '../components/QuantityControl';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, error, isLoading, updateItem, removeItem, clear } = useCart();
  const isGuest = !cart.userId;

  const changeQuantity = async (item, quantity) => {
    try {
      await updateItem(isGuest ? item.productId : item.id, quantity);
    } catch {
      // Context keeps the confirmed state and exposes the API error.
    }
  };

  return (
    <main className="page-width page-section">
      <div className="page-heading">
        <p className="eyebrow">Your selection</p>
        <h1>Cart</h1>
        <span>{cart.items.length} {cart.items.length === 1 ? 'line' : 'lines'}</span>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {isLoading && <div className="state-block">Updating your cart</div>}
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
            {cart.items.map((item) => (
              <article className="cart-line" key={item.id}>
                <div className="cart-line-image">{item.image ? <img src={item.image} alt="" /> : <span>Product</span>}</div>
                <div className="cart-line-main">
                  <div><p className="eyebrow">{item.is_active ? 'Available' : 'Unavailable'}</p><h2>{item.name}</h2></div>
                  <p className="line-price">${Number(item.price).toFixed(2)}</p>
                  <div className="cart-line-controls">
                    <QuantityControl quantity={item.quantity} max={99} onChange={(quantity) => changeQuantity(item, quantity)} />
                    <button className="text-button danger-button" type="button" onClick={() => removeItem(item)}>Remove</button>
                  </div>
                </div>
                <strong className="line-total">${Number(item.itemTotal).toFixed(2)}</strong>
              </article>
            ))}
            <button className="text-button danger-button" type="button" onClick={clear}>Clear cart</button>
          </section>
          <aside className="summary-block">
            <p className="eyebrow">Order summary</p>
            <div className="summary-row"><span>Items</span><strong>{cart.items.reduce((total, item) => total + item.quantity, 0)}</strong></div>
            <div className="summary-row summary-total"><span>Total</span><strong>${Number(cart.totalAmount).toFixed(2)}</strong></div>
            {isGuest ? (
              <button className="button button-dark button-full" type="button" onClick={() => navigate('/auth?returnTo=%2Fcheckout')}>Sign in to continue</button>
            ) : (
              <Link className="button button-signal button-full" to="/checkout">Review order</Link>
            )}
            <p className="summary-note">Final price and stock are confirmed by Velora when the order is placed.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
