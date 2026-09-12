import { useEffect, useState } from 'react';
import { analyticsApi } from '../api';

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState({ sales: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [salesResponse, ordersResponse] = await Promise.all([
        analyticsApi.totalSales(),
        analyticsApi.totalOrders(),
      ]);
      setMetrics({ sales: Number(salesResponse.data.data) || 0, orders: Number(ordersResponse.data.data) || 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([analyticsApi.totalSales(), analyticsApi.totalOrders()])
      .then(([salesResponse, ordersResponse]) => {
        setMetrics({ sales: Number(salesResponse.data.data) || 0, orders: Number(ordersResponse.data.data) || 0 });
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Analytics could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="admin-page">
      <div className="admin-page-heading"><div><p className="eyebrow">Live store signal</p><h1>Overview</h1></div><button className="admin-refresh" type="button" onClick={loadMetrics} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh data'}</button></div>
      <div className="admin-intro-line"><span>Paid sales and order volume, read directly from the database.</span><span>Updated on request</span></div>
      {error && <div className="admin-notice" role="alert"><strong>{error}</strong><button type="button" onClick={loadMetrics}>Try again</button></div>}
      <section className="metric-grid" aria-label="Store analytics">
        <article className="metric-panel metric-panel-signal"><p className="eyebrow">Total sales</p><strong>{loading ? '—' : `$${metrics.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</strong><span>Paid orders only</span></article>
        <article className="metric-panel"><p className="eyebrow">Total orders</p><strong>{loading ? '—' : metrics.orders.toLocaleString('en-US')}</strong><span>All statuses</span></article>
      </section>
      <section className="admin-reading-block"><p className="eyebrow">Reading the numbers</p><h2>Revenue is counted when an order is marked PAID.</h2><p>The analytics API intentionally separates paid sales from total order volume, so operations can see the difference between demand and collected revenue.</p></section>
    </main>
  );
}
