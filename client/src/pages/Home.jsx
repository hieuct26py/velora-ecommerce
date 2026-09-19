import { useEffect, useState } from 'react';
import { catalogApi } from '../api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { useRoute } from '../router';

export default function Home() {
  const { query } = useRoute();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Discrete filter primitive states to prevent object reference churn
  const [searchKeyword, setSearchKeyword] = useState(() => query.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => query.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const urlQ = query.get('q') || '';
  const urlCategory = query.get('category') || '';
  const scrollTrigger = query.get('scroll') || '';

  // 1. Fetch categories EXACTLY ONCE on component mount
  useEffect(() => {
    let isMounted = true;
    catalogApi.categories()
      .then(({ data }) => {
        if (isMounted) setCategories(data?.data || []);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);

  // React 19 pattern for adjusting state when URL props change
  if (urlQ !== prevUrlQ || urlCategory !== prevUrlCategory) {
    setPrevUrlQ(urlQ);
    setPrevUrlCategory(urlCategory);
    setSearchKeyword(urlQ);
    setSelectedCategory(urlCategory);
    setCurrentPage(1);
  }

  // 3. Handle smooth scroll when navigating to catalog
  useEffect(() => {
    if (urlCategory || urlQ || scrollTrigger) {
      const timer = setTimeout(() => {
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
          setTimeout(() => {
            catalogEl.classList.remove('catalog-highlight-soft');
          }, 1400);
        }
      }, 80);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [urlCategory, urlQ, scrollTrigger]);

  // 4. Fetch products ONLY when filter primitives or currentPage change
  // Note: products and categories are NEVER in this dependency array
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {
        keyword: searchKeyword.trim() || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        page: currentPage,
        limit: 12,
      };

      catalogApi.products(params, controller.signal)
        .then(({ data }) => {
          setProducts(data?.data || []);
          setMeta(data?.meta || { totalItems: 0, total: 0, page: 1, totalPages: 1 });
          setError('');
        })
        .catch((requestError) => {
          if (requestError.code !== 'ERR_CANCELED') {
            setError('The collection could not be loaded.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentPage, selectedCategory, searchKeyword, minPrice, maxPrice, sortBy]);

  const updateKeyword = (value) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const updateCategory = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const updateMinPrice = (value) => {
    setMinPrice(value);
    setCurrentPage(1);
  };

  const updateMaxPrice = (value) => {
    setMaxPrice(value);
    setCurrentPage(1);
  };

  const updateSortBy = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const isFiltered = Boolean(
    searchKeyword.trim() ||
    selectedCategory ||
    minPrice ||
    maxPrice ||
    sortBy !== 'newest'
  );

  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Pagination page change: update currentPage cleanly without duplicate manual fetch
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const catalogEl = document.getElementById('catalog-section') || document.getElementById('catalog-heading');
    if (catalogEl) {
      const headerOffset = 118;
      const elementPosition = catalogEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
    }
  };

  // Load more products by appending to list
  const handleLoadMore = async () => {
    const totalItems = (meta.totalItems ?? meta.total) || 0;
    if (loadingMore || products.length >= totalItems) return;
    setLoadingMore(true);

    const nextPage = Math.floor(products.length / 12) + 1;
    try {
      const params = {
        keyword: searchKeyword.trim() || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        page: nextPage,
        limit: 12,
      };
      const { data } = await catalogApi.products(params);
      if (data?.data && data.data.length > 0) {
        setProducts((prev) => [...prev, ...data.data]);
        setMeta(data.meta || meta);
      }
    } catch (loadError) {
      console.error('Lỗi khi tải thêm sản phẩm:', loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  const totalItems = (meta.totalItems ?? meta.total) || 0;
  const totalPages = meta.totalPages || 1;

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

      <section className="catalog-section page-width" id="catalog-section" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Apple collection</p><h2 id="catalog-heading">Shop devices</h2></div>
          <span className="result-count">{totalItems} pieces</span>
        </div>
        {/* Shop Devices Filter & Sort Suite */}
        <div className="catalog-filter-panel" role="search" aria-label="Bộ lọc thiết bị">
          <div className="catalog-filter-main-row">
            {/* Search Box */}
            <div className="catalog-search-wrap">
              <span className="catalog-search-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="catalog-search-input"
                value={searchKeyword}
                onChange={(event) => updateKeyword(event.target.value)}
                placeholder="Tìm kiếm iPhone, iPad, Mac, AirPods..."
                aria-label="Tìm kiếm sản phẩm"
              />
              {searchKeyword && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => updateKeyword('')}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Select */}
            <div className="catalog-select-wrap">
              <span className="catalog-select-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </span>
              <select
                className={`catalog-select-input ${selectedCategory ? 'is-active' : ''}`}
                value={selectedCategory}
                onChange={(event) => updateCategory(event.target.value)}
                aria-label="Lọc theo danh mục"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Price Sort Selector */}
            <div className="catalog-select-wrap catalog-sort-wrap">
              <span className="catalog-select-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
              </span>
              <select
                className={`catalog-select-input ${sortBy !== 'newest' ? 'is-active' : ''}`}
                value={sortBy}
                onChange={(event) => updateSortBy(event.target.value)}
                aria-label="Sắp xếp theo giá"
              >
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao ↑</option>
                <option value="price_desc">Giá: Cao đến Thấp ↓</option>
              </select>
            </div>
          </div>

          <div className="catalog-filter-sub-row">
            {/* Price Range Group */}
            <div className="catalog-price-group">
              <span className="catalog-price-label">Khoảng giá:</span>
              <div className="catalog-price-inputs">
                <div className="catalog-price-box">
                  <span className="catalog-price-currency">$</span>
                  <input
                    type="number"
                    min="0"
                    className="catalog-price-input"
                    value={minPrice}
                    onChange={(event) => updateMinPrice(event.target.value)}
                    placeholder="Tối thiểu"
                    aria-label="Giá tối thiểu"
                  />
                </div>
                <span className="catalog-price-dash" aria-hidden="true">–</span>
                <div className="catalog-price-box">
                  <span className="catalog-price-currency">$</span>
                  <input
                    type="number"
                    min="0"
                    className="catalog-price-input"
                    value={maxPrice}
                    onChange={(event) => updateMaxPrice(event.target.value)}
                    placeholder="Tối đa"
                    aria-label="Giá tối đa"
                  />
                </div>
              </div>
            </div>

            {/* Filter Status / Reset Action */}
            <div className="catalog-filter-meta">
              {isFiltered && (
                <button
                  type="button"
                  className="catalog-reset-button"
                  onClick={resetFilters}
                  aria-label="Đặt lại toàn bộ bộ lọc"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Thanh Sub-bar: Đặt Pagination ngay DƯỚI thanh filter và TRÊN danh sách sản phẩm */}
        {!loading && !error && products.length > 0 && (
          <div className="catalog-subbar">
            <div className="catalog-subbar-summary">
              <span>Hiển thị</span>
              <strong>{(currentPage - 1) * 12 + 1}–{Math.min((currentPage - 1) * 12 + products.length, totalItems)}</strong>
              <span>trên</span>
              <strong>{totalItems}</strong>
              <span>sản phẩm</span>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {loading && <div className="state-block"><span className="loader-line" /> Loading the collection</div>}
        {error && <div className="state-block state-error"><strong>{error}</strong><button className="text-button" type="button" onClick={() => setCurrentPage(1)}>Try again</button></div>}
        {!loading && !error && products.length === 0 && (
          <div className="state-block catalog-empty-panel">
            <strong>Không tìm thấy sản phẩm phù hợp.</strong>
            <span>Vui lòng thử từ khóa khác hoặc xóa bớt tiêu chí lọc.</span>
            {isFiltered && (
              <button className="small-button button-dark" type="button" onClick={resetFilters} style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
                Xóa toàn bộ bộ lọc
              </button>
            )}
          </div>
        )}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="product-grid">
              {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>

            {/* Nút Xem thêm (Show more) & Thanh tiến trình đặt ở CUỐI danh sách sản phẩm */}
            <div className="catalog-load-more-section">
              {products.length < totalItems ? (
                <div className="catalog-load-more-box">
                  <div className="catalog-progress-info">
                    <span>Đang xem <strong>{products.length}</strong> / <strong>{totalItems}</strong> sản phẩm</span>
                    <div className="catalog-progress-track">
                      <div
                        className="catalog-progress-fill"
                        style={{ width: `${Math.min(100, Math.round((products.length / totalItems) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="catalog-load-more-btn"
                  >
                    {loadingMore ? (
                      <>
                        <span className="load-more-spinner" aria-hidden="true" />
                        <span>Đang tải thêm sản phẩm...</span>
                      </>
                    ) : (
                      <>
                        <span>Xem thêm sản phẩm</span>
                        <span className="load-more-count">+{Math.min(12, totalItems - products.length)}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="catalog-completed-note">
                  <span className="catalog-completed-icon" aria-hidden="true">✓</span>
                  <span>Bạn đã xem toàn bộ <strong>{totalItems}</strong> sản phẩm của bộ sưu tập</span>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
