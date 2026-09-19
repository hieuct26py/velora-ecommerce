import { useEffect, useState, useMemo } from 'react';
import { analyticsApi, catalogApi } from '../api';
import { Link } from '../router';

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState({
    sales: 0,
    orders: 0,
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalInventoryUnits: 0,
    totalInventoryValue: 0,
    lowStockList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inventory Watchlist Filters
  const [watchlistSearch, setWatchlistSearch] = useState('');
  const [watchlistCategory, setWatchlistCategory] = useState('');
  const [watchlistSeverity, setWatchlistSeverity] = useState('all');
  const [watchlistSort, setWatchlistSort] = useState('stock_asc');

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [salesResponse, ordersResponse, productsResponse] = await Promise.all([
        analyticsApi.totalSales(),
        analyticsApi.totalOrders(),
        catalogApi.products({ status: 'ALL', page: 1, limit: 100 }),
      ]);

      const prods = productsResponse.data.data || [];
      const activeCount = prods.filter((p) => p.is_active).length;
      const inactiveCount = prods.filter((p) => !p.is_active).length;
      const totalUnits = prods.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);
      const totalValue = prods.reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock_quantity) || 0),
        0
      );
      const lowStock = prods.filter((p) => Number(p.stock_quantity) <= 3);

      setMetrics({
        sales: Number(salesResponse.data.data) || 0,
        orders: Number(ordersResponse.data.data) || 0,
        totalProducts: prods.length,
        activeProducts: activeCount,
        inactiveProducts: inactiveCount,
        totalInventoryUnits: totalUnits,
        totalInventoryValue: totalValue,
        lowStockList: lowStock,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      analyticsApi.totalSales(),
      analyticsApi.totalOrders(),
      catalogApi.products({ status: 'ALL', page: 1, limit: 100 }),
    ])
      .then(([salesResponse, ordersResponse, productsResponse]) => {
        const prods = productsResponse.data.data || [];
        const activeCount = prods.filter((p) => p.is_active).length;
        const inactiveCount = prods.filter((p) => !p.is_active).length;
        const totalUnits = prods.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);
        const totalValue = prods.reduce(
          (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock_quantity) || 0),
          0
        );
        const lowStock = prods.filter((p) => Number(p.stock_quantity) <= 3);

        setMetrics({
          sales: Number(salesResponse.data.data) || 0,
          orders: Number(ordersResponse.data.data) || 0,
          totalProducts: prods.length,
          activeProducts: activeCount,
          inactiveProducts: inactiveCount,
          totalInventoryUnits: totalUnits,
          totalInventoryValue: totalValue,
          lowStockList: lowStock,
        });
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Analytics could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const watchlistCategories = useMemo(() => {
    const map = new Map();
    metrics.lowStockList.forEach((p) => {
      const cat = p.category;
      if (cat && typeof cat === 'object' && cat.name) {
        map.set(cat.id || cat.name, cat.name);
      } else if (typeof cat === 'string') {
        map.set(cat, cat);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [metrics.lowStockList]);

  const filteredWatchlist = useMemo(() => {
    return metrics.lowStockList.filter((product) => {
      if (watchlistSearch.trim()) {
        const q = watchlistSearch.trim().toLowerCase().replace(/^#/, '');
        const matchName = product.name?.toLowerCase().includes(q);
        const matchId = product.id?.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      if (watchlistCategory) {
        const catId = product.category?.id || product.category_id;
        const catName = product.category?.name || product.category;
        if (catId !== watchlistCategory && catName !== watchlistCategory) return false;
      }
      if (watchlistSeverity === 'sold_out') {
        if (Number(product.stock_quantity) !== 0) return false;
      } else if (watchlistSeverity === 'low_stock') {
        if (Number(product.stock_quantity) === 0) return false;
      }
      return true;
    }).sort((a, b) => {
      if (watchlistSort === 'stock_asc') return Number(a.stock_quantity) - Number(b.stock_quantity);
      if (watchlistSort === 'stock_desc') return Number(b.stock_quantity) - Number(a.stock_quantity);
      if (watchlistSort === 'price_desc') return Number(b.price) - Number(a.price);
      if (watchlistSort === 'price_asc') return Number(a.price) - Number(b.price);
      if (watchlistSort === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [metrics.lowStockList, watchlistSearch, watchlistCategory, watchlistSeverity, watchlistSort]);

  const isWatchlistFiltered = Boolean(
    watchlistSearch.trim() || watchlistCategory || watchlistSeverity !== 'all' || watchlistSort !== 'stock_asc'
  );

  const resetWatchlistFilters = () => {
    setWatchlistSearch('');
    setWatchlistCategory('');
    setWatchlistSeverity('all');
    setWatchlistSort('stock_asc');
  };

  return (
    <main className="admin-page admin-analytics-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Live store signal</p>
          <h1>Overview</h1>
        </div>
        <button className="admin-refresh" type="button" onClick={loadMetrics} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh data'}
        </button>
      </div>

      <div className="admin-intro-line">
        <span>Comprehensive operational telemetry: revenue, orders, and live inventory.</span>
        <span>Updated on request</span>
      </div>

      {error && (
        <div className="admin-notice" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={loadMetrics}>Try again</button>
        </div>
      )}

      {/* Primary Financial & Fulfillment Metrics */}
      <section className="metric-grid" aria-label="Store financial analytics">
        <article className="metric-panel metric-panel-signal">
          <p className="eyebrow">Total sales</p>
          <strong>
            {loading ? '—' : `$${metrics.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </strong>
          <span>Paid orders only</span>
        </article>

        <article className="metric-panel">
          <p className="eyebrow">Total orders</p>
          <strong>{loading ? '—' : metrics.orders.toLocaleString('en-US')}</strong>
          <span>All statuses</span>
        </article>
      </section>

      {/* Task 10: Rich Product & Inventory Signals */}
      <section className="admin-inventory-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catalog & stock</p>
            <h2>Inventory intelligence</h2>
          </div>
          <Link className="admin-quiet-button" to="/admin/products">
            Manage catalog →
          </Link>
        </div>

        <div className="inventory-stats-grid">
          <div className="inventory-stat-card">
            <span className="stat-label">Total catalog items</span>
            <strong className="stat-number">{loading ? '—' : metrics.totalProducts}</strong>
            <span className="stat-sub">
              {metrics.activeProducts} active · {metrics.inactiveProducts} inactive
            </span>
          </div>

          <div className="inventory-stat-card">
            <span className="stat-label">Total units in stock</span>
            <strong className="stat-number">
              {loading ? '—' : metrics.totalInventoryUnits.toLocaleString('en-US')}
            </strong>
            <span className="stat-sub">Across all catalog products</span>
          </div>

          <div className="inventory-stat-card">
            <span className="stat-label">Inventory valuation</span>
            <strong className="stat-number">
              {loading ? '—' : `$${metrics.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </strong>
            <span className="stat-sub">Retail replacement value</span>
          </div>

          <div className="inventory-stat-card">
            <span className="stat-label">Low stock items</span>
            <strong className={`stat-number ${metrics.lowStockList.length > 0 ? 'danger-text' : ''}`}>
              {loading ? '—' : metrics.lowStockList.length}
            </strong>
            <span className="stat-sub">Stock ≤ 3 units</span>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="low-stock-watchlist">
          <div className="watchlist-head">
            <div>
              <h3>Inventory Watchlist (Stock ≤ 3)</h3>
              <span>{metrics.lowStockList.length} items requiring attention</span>
            </div>
          </div>

          {/* Filter Toolbar for Watchlist */}
          {metrics.lowStockList.length > 0 && (
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
                    placeholder="Search product or #ID..."
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                  />
                  {watchlistSearch && (
                    <button
                      type="button"
                      className="admin-search-clear"
                      onClick={() => setWatchlistSearch('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {watchlistCategories.length > 0 && (
                  <select
                    className={`admin-filter-select ${watchlistCategory ? 'active-filter' : ''}`}
                    value={watchlistCategory}
                    onChange={(e) => setWatchlistCategory(e.target.value)}
                    aria-label="Filter watchlist by category"
                  >
                    <option value="">All categories</option>
                    {watchlistCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}

                <select
                  className={`admin-filter-select ${watchlistSeverity !== 'all' ? 'active-filter' : ''}`}
                  value={watchlistSeverity}
                  onChange={(e) => setWatchlistSeverity(e.target.value)}
                  aria-label="Filter watchlist by severity"
                >
                  <option value="all">All levels (≤ 3)</option>
                  <option value="sold_out">Sold out (0 units)</option>
                  <option value="low_stock">Low stock (1–3 units)</option>
                </select>

                <select
                  className="admin-filter-select"
                  value={watchlistSort}
                  onChange={(e) => setWatchlistSort(e.target.value)}
                  aria-label="Sort watchlist items"
                >
                  <option value="stock_asc">Stock: Lowest first</option>
                  <option value="stock_desc">Stock: Highest first</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>

              <div className="admin-filter-meta">
                <span className="admin-filter-count">
                  Showing <strong>{filteredWatchlist.length}</strong> of {metrics.lowStockList.length}
                </span>
                {isWatchlistFiltered && (
                  <button
                    type="button"
                    className="admin-filter-reset"
                    onClick={resetWatchlistFilters}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {metrics.lowStockList.length === 0 ? (
            <div className="admin-empty-box">
              <span>All products currently have healthy inventory levels.</span>
            </div>
          ) : filteredWatchlist.length === 0 ? (
            <div className="admin-empty-box">
              <span>No watchlist items match your filter criteria.</span>
              <button
                type="button"
                className="admin-quiet-button"
                style={{ marginLeft: '12px' }}
                onClick={resetWatchlistFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-head">
                <span>Product</span>
                <span>Category</span>
                <span>Stock quantity</span>
                <span>Unit price</span>
                <span>Action</span>
              </div>
              {filteredWatchlist.map((product) => {
                const isZero = Number(product.stock_quantity) === 0;
                return (
                  <div className="admin-watchlist-row" key={product.id}>
                    <div className="admin-product-name">
                      <strong>{product.name}</strong>
                      <span>#{product.id.slice(0, 8)}</span>
                    </div>
                    <span className="admin-muted">{product.category?.name || 'Unassigned'}</span>
                    <div>
                      <span className={`stock-badge ${isZero ? 'stock-badge-zero' : 'stock-badge-low'}`}>
                        {isZero ? '0 units (Sold out)' : `${product.stock_quantity} units remaining`}
                      </span>
                    </div>
                    <strong className="admin-table-number">${Number(product.price).toFixed(2)}</strong>
                    <Link className="admin-action-button" to="/admin/products">
                      Restock →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="admin-reading-block">
        <p className="eyebrow">Reading the numbers</p>
        <h2>Revenue is counted when an order is marked PAID.</h2>
        <p>
          The analytics API intentionally separates paid sales from total order volume, so operations can see the difference between demand and collected revenue.
        </p>
      </section>
    </main>
  );
}
