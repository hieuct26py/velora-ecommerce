import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useRoute } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { catalogApi } from '../api';

const DEFAULT_CATEGORIES = [
  { name: 'iPhone', slug: 'iphone' },
  { name: 'iPad', slug: 'ipad' },
  { name: 'Mac', slug: 'mac' },
  { name: 'Watch', slug: 'watch' },
  { name: 'Âm thanh', slug: 'airpods' },
  { name: 'Phụ kiện', slug: 'accessories' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { query: urlQuery } = useRoute();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();

  const urlQ = urlQuery.get('q') || '';
  const [query, setQuery] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);

  const [categories, setCategories] = useState([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [prevAvatarUrl, setPrevAvatarUrl] = useState(user?.avatar_url);

  const serviceRef = useRef(null);
  const accountRef = useRef(null);
  const accountHoverTimer = useRef(null);

  // Sync search input with URL q param without cascading effect (React 19 pattern)
  if (prevUrlQ !== urlQ) {
    setPrevUrlQ(urlQ);
    setQuery(urlQ);
  }

  if (user?.avatar_url !== prevAvatarUrl) {
    setPrevAvatarUrl(user?.avatar_url);
    setAvatarError(false);
  }

  // Fetch categories from backend API and harmonize with standard ShopDunk Apple categories
  useEffect(() => {
    let isMounted = true;
    catalogApi.categories()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.data?.length > 0) {
          // Sort or match with preferred Apple lineup order
          const apiCategories = data.data;
          const order = ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods', 'Accessories'];
          const sorted = [...apiCategories].sort((a, b) => {
            const idxA = order.indexOf(a.name);
            const idxB = order.indexOf(b.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });
          setCategories(sorted);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      })
      .catch(() => {
        if (isMounted) setCategories(DEFAULT_CATEGORIES);
      });
    return () => { isMounted = false; };
  }, []);

  // Click outside listener for popovers & hover timer cleanup
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (serviceRef.current && !serviceRef.current.contains(e.target)) {
        setServiceOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      if (accountHoverTimer.current) {
        clearTimeout(accountHoverTimer.current);
      }
    };
  }, []);

  const handleAccountMouseEnter = () => {
    if (accountHoverTimer.current) {
      clearTimeout(accountHoverTimer.current);
      accountHoverTimer.current = null;
    }
    setAccountOpen(true);
  };

  const handleAccountMouseLeave = () => {
    if (accountHoverTimer.current) {
      clearTimeout(accountHoverTimer.current);
    }
    accountHoverTimer.current = setTimeout(() => {
      setAccountOpen(false);
    }, 200);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/?q=${encodeURIComponent(trimmedQuery)}&scroll=catalog` : '/');
  };

  const handleLogout = async () => {
    if (accountHoverTimer.current) {
      clearTimeout(accountHoverTimer.current);
    }
    setAccountOpen(false);
    await logout();
    navigate('/');
  };

  const handleCategoryClick = (category) => {
    const targetParam = category.id
      ? `category=${encodeURIComponent(category.id)}`
      : `q=${encodeURIComponent(category.name)}`;
    navigate(`/?${targetParam}&scroll=catalog`);

    // Kích hoạt cuộn mượt xuống danh mục ngay lập tức nếu đang ở trang chủ
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog-section') || document.getElementById('catalog-heading');
      if (catalogEl) {
        const headerOffset = 118;
        const elementPosition = catalogEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
        catalogEl.classList.remove('catalog-highlight-soft');
        void catalogEl.offsetWidth;
        catalogEl.classList.add('catalog-highlight-soft');
        setTimeout(() => catalogEl.classList.remove('catalog-highlight-soft'), 1400);
      }
    }, 60);
  };

  const emailPrefix = user?.email && typeof user.email === 'string' && user.email.includes('@')
    ? user.email.split('@')[0]
    : (user?.email || '');
  const rawName = user?.name ? String(user.name).trim() : '';
  const isNameValid = rawName && rawName.toLowerCase() !== 'null' && rawName.toLowerCase() !== 'undefined';
  const displayName = isNameValid ? rawName : (emailPrefix || 'Tài khoản');
  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const activeCategoryId = urlQuery.get('category');

  return (
    <header className="shopdunk-header">
      {/* Tầng 1 (Top Bar - Nền #333333 xám đậm, Logo VELORA, Search Bar bo tròn, Giỏ hàng, Tài khoản) */}
      <div className="sd-tier1">
        <div className="sd-tier1-container">
          
          {/* Brand Logo: V logo mark + ELORA/ wordmark */}
          <Link
            to="/"
            className="sd-brand"
            aria-label="Velora Home"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/images/velora-v-mark.png"
              alt="V"
              className="sd-brand-v"
            />
            <span className="sd-brand-text">ELORA</span>
            <span className="sd-brand-mark">/</span>
          </Link>

          {/* Search Bar bo tròn (rounded-full), nền trắng, icon kính lúp, placeholder "Bạn tìm gì..." */}
          <form className="sd-search-form" onSubmit={submitSearch} role="search">
            <label htmlFor="sd-site-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <div className="sd-search-box">
              <span className="sd-search-glass" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                id="sd-site-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bạn tìm gì..."
                className="sd-search-input"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="sd-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Action Group: Giỏ hàng + Tài khoản */}
          <div className="sd-actions">
            
            {/* Giỏ hàng */}
            <Link to="/cart" className="sd-action-item sd-cart-action" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              <span className="sd-action-icon-wrap">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="sd-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </span>
              <span className="sd-action-label">Giỏ hàng</span>
            </Link>

            {/* Tài khoản */}
            <div
              className="sd-account-wrapper"
              ref={accountRef}
              onMouseEnter={handleAccountMouseEnter}
              onMouseLeave={handleAccountMouseLeave}
            >
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="sd-action-item sd-account-trigger"
                    onClick={() => setAccountOpen(!accountOpen)}
                    aria-expanded={accountOpen}
                    aria-haspopup="true"
                    aria-label="Menu tài khoản"
                  >
                    <span className="sd-action-icon-wrap">
                      {user?.avatar_url && !avatarError ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="sd-avatar-round"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </span>
                    <span className="sd-action-label sd-user-name">{displayName}</span>
                    <svg className={`sd-chevron ${accountOpen ? 'sd-chevron-open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {accountOpen && (
                    <div className="sd-dropdown" role="menu">
                      <div className="sd-dropdown-header">
                        <span className="sd-dropdown-sub">Đăng nhập với</span>
                        <strong className="sd-dropdown-email">{user?.email}</strong>
                      </div>
                      <Link to="/profile" className="sd-dropdown-link" onClick={() => setAccountOpen(false)} role="menuitem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span>Tài khoản của tôi</span>
                      </Link>
                      <Link to="/orders" className="sd-dropdown-link" onClick={() => setAccountOpen(false)} role="menuitem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        <span>Đơn mua</span>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/analytics" className="sd-dropdown-link sd-admin-link" onClick={() => setAccountOpen(false)} role="menuitem">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                          <span>Admin dashboard</span>
                        </Link>
                      )}
                      <div className="sd-dropdown-divider" />
                      <button type="button" className="sd-dropdown-link sd-logout-btn" onClick={handleLogout} role="menuitem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/auth" className="sd-action-item" aria-label="Đăng nhập">
                  <span className="sd-action-icon-wrap">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className="sd-action-label">Tài khoản</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Tầng 2 (Navigation Bar - Nền #1d1d1f tối hơn, Nút "Dịch vụ" bên trái, Categories chính) */}
      <div className="sd-tier2">
        <div className="sd-tier2-container">
          
          {/* Nút "Dịch vụ" bên trái ngoài cùng (nền xám nhạt hơn, bo góc, icon menu/hamburger) */}
          <div className="sd-service-wrapper" ref={serviceRef}>
            <button
              type="button"
              className="sd-service-btn"
              onClick={() => setServiceOpen(!serviceOpen)}
              aria-expanded={serviceOpen}
              aria-haspopup="true"
              aria-label="Dịch vụ Velora Apple"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Dịch vụ</span>
            </button>

            {serviceOpen && (
              <div className="sd-service-popover" role="menu">
                <div className="sd-service-title">Chính sách & Dịch vụ Apple</div>
                <div className="sd-service-items">
                  <div className="sd-service-card">
                    <div className="sd-service-card-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div className="sd-service-card-text">
                      <strong>AppleCare+ & Bảo hành</strong>
                      <span>Bảo vệ toàn diện, linh kiện chính hãng</span>
                    </div>
                  </div>
                  <div className="sd-service-card">
                    <div className="sd-service-card-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </div>
                    <div className="sd-service-card-text">
                      <strong>Thu cũ đổi mới (Trade-in)</strong>
                      <span>Trợ giá lên đời máy mới tiết kiệm</span>
                    </div>
                  </div>
                  <div className="sd-service-card">
                    <div className="sd-service-card-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <div className="sd-service-card-text">
                      <strong>Trả góp 0% lãi suất</strong>
                      <span>Kỳ hạn linh hoạt qua 25+ ngân hàng</span>
                    </div>
                  </div>
                  <div className="sd-service-card">
                    <div className="sd-service-card-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                    <div className="sd-service-card-text">
                      <strong>Trung tâm Dịch vụ Kỹ thuật</strong>
                      <span>Kiểm tra, vệ sinh & chuẩn đoán máy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Danh mục Categories chính (iPhone, iPad, Mac, Watch, Âm thanh, Phụ kiện) */}
          <nav className="sd-categories-nav" aria-label="Danh mục thiết bị Apple">
            {categories.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              // Map display labels nicely
              let label = cat.name;
              if (cat.name === 'Apple Watch') label = 'Watch';
              if (cat.name === 'AirPods') label = 'Âm thanh';
              if (cat.name === 'Accessories') label = 'Phụ kiện';

              return (
                <button
                  key={cat.id || cat.slug || cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className={`sd-category-item ${isActive ? 'sd-category-active' : ''}`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
