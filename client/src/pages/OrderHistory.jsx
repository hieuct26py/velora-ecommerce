import { useEffect, useState } from 'react';
import { Link } from '../router';
import { orderApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusLabel from '../components/StatusLabel';
import Pagination from '../components/Pagination';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Discrete filter primitive states to prevent object reference churn
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch orders when filter primitives or currentPage change
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {
        search: searchKeyword.trim() || undefined,
        status: selectedStatus || undefined,
        minAmount: minPrice || undefined,
        maxAmount: maxPrice || undefined,
        sortBy,
        page: currentPage,
        limit: 10,
      };

      orderApi.mine(params, controller.signal)
        .then(({ data }) => {
          setOrders(data?.data || []);
          setMeta(data?.meta || { totalItems: 0, total: 0, page: 1, totalPages: 1 });
          setError('');
        })
        .catch((requestError) => {
          if (requestError.code !== 'ERR_CANCELED') {
            setError('Không thể tải lịch sử đơn hàng.');
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
  }, [user, currentPage, selectedStatus, searchKeyword, minPrice, maxPrice, sortBy]);

  const updateKeyword = (value) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const updateStatus = (value) => {
    setSelectedStatus(value);
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
    selectedStatus ||
    minPrice ||
    maxPrice ||
    sortBy !== 'newest'
  );

  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Pagination page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load more orders by appending to list
  const handleLoadMore = async () => {
    const totalItems = (meta.totalItems ?? meta.total) || 0;
    if (loadingMore || orders.length >= totalItems) return;
    setLoadingMore(true);

    const nextPage = Math.floor(orders.length / 10) + 1;
    try {
      const params = {
        search: searchKeyword.trim() || undefined,
        status: selectedStatus || undefined,
        minAmount: minPrice || undefined,
        maxAmount: maxPrice || undefined,
        sortBy,
        page: nextPage,
        limit: 10,
      };
      const { data } = await orderApi.mine(params);
      if (data?.data && data.data.length > 0) {
        setOrders((prev) => [...prev, ...data.data]);
        setMeta(data.meta || meta);
      }
    } catch (loadError) {
      console.error('Lỗi khi tải thêm đơn hàng:', loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  const totalItems = (meta.totalItems ?? meta.total) || 0;
  const totalPages = meta.totalPages || 1;

  if (!user) {
    return (
      <main className="page-width page-section">
        <div className="empty-panel">
          <h1>Your orders live here.</h1>
          <Link className="button button-dark" to="/auth">Sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-width page-section order-history-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tài khoản / Lịch sử</p>
          <h1>Đơn hàng</h1>
        </div>
        <span className="admin-truncate">{user.email}</span>
      </div>

      {/* Order Filter & Sort Suite - Copied from Shop devices */}
      <div className="catalog-filter-panel" role="search" aria-label="Bộ lọc đơn hàng">
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
              placeholder="Tìm kiếm mã đơn hàng hoặc tên sản phẩm..."
              aria-label="Tìm kiếm đơn hàng"
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

          {/* Status Select */}
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
              className={`catalog-select-input ${selectedStatus ? 'is-active' : ''}`}
              value={selectedStatus}
              onChange={(event) => updateStatus(event.target.value)}
              aria-label="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý (Pending)</option>
              <option value="PAID">Đã thanh toán (Paid)</option>
              <option value="CANCELLED">Đã hủy (Cancelled)</option>
            </select>
          </div>

          {/* Sort Selector */}
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
              aria-label="Sắp xếp đơn hàng"
            >
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="oldest">Sắp xếp: Cũ nhất</option>
              <option value="amount_desc">Tổng tiền: Cao đến Thấp ↓</option>
              <option value="amount_asc">Tổng tiền: Thấp đến Cao ↑</option>
            </select>
          </div>
        </div>

        <div className="catalog-filter-sub-row">
          {/* Price Range Group */}
          <div className="catalog-price-group">
            <span className="catalog-price-label">Khoảng tiền:</span>
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
                  aria-label="Số tiền tối thiểu"
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
                  aria-label="Số tiền tối đa"
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

      {/* Subbar: Đặt Pagination ngay DƯỚI thanh filter và TRÊN danh sách đơn hàng */}
      {!loading && !error && orders.length > 0 && (
        <div className="catalog-subbar">
          <div className="catalog-subbar-summary">
            <span>Hiển thị</span>
            <strong>{(currentPage - 1) * 10 + 1}–{Math.min((currentPage - 1) * 10 + orders.length, totalItems)}</strong>
            <span>trên</span>
            <strong>{totalItems}</strong>
            <span>đơn hàng</span>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {loading && <div className="state-block"><span className="loader-line" /> Đang tải danh sách đơn hàng...</div>}
      {error && <div className="notice notice-error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        isFiltered ? (
          <div className="state-block catalog-empty-panel">
            <strong>Không tìm thấy đơn hàng phù hợp.</strong>
            <span>Vui lòng thử từ khóa khác hoặc xóa bớt tiêu chí lọc.</span>
            <button className="small-button button-dark" type="button" onClick={resetFilters} style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
              Xóa toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="empty-panel">
            <h2>Chưa có đơn hàng nào.</h2>
            <p>Khi bạn tìm thấy sản phẩm yêu thích và thanh toán, đơn hàng sẽ hiển thị tại đây.</p>
            <Link className="button button-dark" to="/">Khám phá bộ sưu tập</Link>
          </div>
        )
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="order-list">
            {orders.map((order) => {
              const items = order.items || [];
              const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

              return (
                <article className="order-row" key={order.id}>
                  <div>
                    <p className="eyebrow">
                      #{order.id.slice(0, 8)} / {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    <h2>
                      {totalUnits} {totalUnits === 1 ? 'mục' : 'mục'}
                      {items.length > 1 ? ` · ${items.length} sản phẩm` : (items[0]?.product?.name ? ` · ${items[0].product.name}` : '')}
                    </h2>
                  </div>
                  <StatusLabel status={order.status} />
                  <strong className="order-total-amount">
                    ${Number(order.total_amount).toFixed(2)}
                  </strong>
                  <Link className="button button-quiet" to={`/orders/${order.id}`}>
                    Xem đơn hàng →
                  </Link>
                </article>
              );
            })}
          </div>

          {/* Nút Xem thêm đơn hàng & Thanh tiến trình đặt ở CUỐI danh sách */}
          <div className="catalog-load-more-section">
            {orders.length < totalItems ? (
              <div className="catalog-load-more-box">
                <div className="catalog-progress-info">
                  <span>Đang xem <strong>{orders.length}</strong> / <strong>{totalItems}</strong> đơn hàng</span>
                  <div className="catalog-progress-track">
                    <div
                      className="catalog-progress-fill"
                      style={{ width: `${Math.min(100, Math.round((orders.length / totalItems) * 100))}%` }}
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
                      <span>Đang tải thêm đơn hàng...</span>
                    </>
                  ) : (
                    <>
                      <span>Xem thêm đơn hàng</span>
                      <span className="load-more-count">+{Math.min(10, totalItems - orders.length)}</span>
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
                <span>Bạn đã xem toàn bộ <strong>{totalItems}</strong> đơn hàng</span>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
