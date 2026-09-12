import { useState } from 'react';
import { Link, useNavigate } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [query, setQuery] = useState('');

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/?q=${encodeURIComponent(trimmedQuery)}` : '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Account';
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';

  return (
    <header className="site-header">
      <div className="header-bar">
        <Link className="wordmark" to="/" aria-label="Velora home">
          VELORA<span className="wordmark-mark">/</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link to="/">Shop</Link>
          {isAuthenticated && <Link to="/orders">Orders</Link>}
        </nav>
        <form className="search-form" onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="site-search">Search products</label>
          <input
            id="site-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search iPhone, iPad, Mac..."
          />
          <button className="text-button" type="submit" aria-label="Search">Search</button>
        </form>
        <div className="header-actions">
          {isAuthenticated ? (
            <div className="account-menu">
              <button className="account-trigger" type="button" aria-label="Open account menu">
                <span className="account-avatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span className="default-avatar" aria-hidden="true"><span /></span>}
                </span>
                <span className="account-name">{displayName}</span>
                <span className="account-chevron" aria-hidden="true">+</span>
              </button>
              <div className="account-dropdown" role="menu">
                <Link to="/profile" role="menuitem">My account</Link>
                <Link to="/orders" role="menuitem">My purchase</Link>
                {isAdmin && <Link to="/admin/analytics" role="menuitem">Admin dashboard</Link>}
                <button type="button" onClick={handleLogout} role="menuitem">Logout</button>
              </div>
            </div>
          ) : (
            <Link className="text-button" to="/auth">Sign in</Link>
          )}
          <Link className="cart-link" to="/cart" aria-label={`Cart, ${cartCount} items`}>
            Cart <span className="cart-count">{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
