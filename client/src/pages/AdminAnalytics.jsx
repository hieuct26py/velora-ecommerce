import { useEffect, useState } from 'react';
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
            <h3>Inventory Watchlist (Stock ≤ 3)</h3>
            <span>{metrics.lowStockList.length} items requiring attention</span>
          </div>

          {metrics.lowStockList.length === 0 ? (
            <div className="admin-empty-box">
              <span>All products currently have healthy inventory levels.</span>
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
              {metrics.lowStockList.map((product) => {
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
