import { useEffect, useState } from 'react';
import { catalogApi } from '../api';
import ProductCard from '../components/ProductCard';
import { useRoute } from '../router';

export default function Home() {
  const { query } = useRoute();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ keyword: query.get('q') || '', category: '', minPrice: '', maxPrice: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    catalogApi.categories().then(({ data }) => setCategories(data.data)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    catalogApi.products({ ...params, page: 1, limit: 12 }, controller.signal)
      .then(({ data }) => {
        setProducts(data.data);
        setMeta(data.meta);
        setError('');
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') setError('The collection could not be loaded.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters]);

  const updateFilter = (key, value) => {
    setLoading(true);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main>
      <section className="shop-intro page-width">
        <div className="intro-kicker"><span>01</span><span>Apple devices / Velora selection</span></div>
        <div className="intro-grid">
          <h1>Choose your next<br /><em>everyday essential.</em></h1>
          <div className="intro-note">
            <h2 className="hero-product-title">iPhone 18 Pro</h2>
            <figure className="hero-product-figure">
              <img src="/images/cherry.webp" alt="iPhone 18 Pro in a deep cherry finish" />
              <span className="hero-product-glow" aria-hidden="true" />
            </figure>
            <p>iPhone, iPad, Mac, and accessories selected for the way they fit into real life.</p>
            <span className="rule-label">Velora / Apple collection</span>
          </div>
        </div>
      </section>

      <section className="catalog-section page-width" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Apple collection</p><h2 id="catalog-heading">Shop devices</h2></div>
          <span className="result-count">{meta.total} pieces</span>
        </div>
        <div className="catalog-toolbar">
          <label>
            <span className="sr-only">Search products</span>
            <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="Search iPhone, iPad, Mac..." />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label><span className="sr-only">Minimum price</span><input type="number" min="0" value={filters.minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} placeholder="Min $" /></label>
          <label><span className="sr-only">Maximum price</span><input type="number" min="0" value={filters.maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} placeholder="Max $" /></label>
        </div>

        {loading && <div className="state-block"><span className="loader-line" /> Loading the collection</div>}
        {error && <div className="state-block state-error"><strong>{error}</strong><button className="text-button" type="button" onClick={() => setFilters({ ...filters })}>Try again</button></div>}
        {!loading && !error && products.length === 0 && <div className="state-block"><strong>Nothing matches that search.</strong><span>Try a broader term or remove a filter.</span></div>}
        {!loading && !error && products.length > 0 && <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>}
      </section>
    </main>
  );
}
