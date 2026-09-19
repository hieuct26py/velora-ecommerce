export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    // Nếu tổng số trang <= 7, hiển thị toàn bộ
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Nếu đang ở gần đầu trang (trang 1..4)
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    // Nếu đang ở gần cuối trang
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // Nếu đang ở khoảng giữa
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav className="pagination-pill-nav" aria-label="Phân trang sản phẩm">
      <div className="pagination-pill-cluster">
        
        {/* Nút Trang trước (Previous) */}
        <button
          type="button"
          onClick={() => !isFirst && onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={`pagination-pill-arrow ${isFirst ? 'pagination-pill-disabled' : ''}`}
          aria-label="Trang trước"
          title="Trang trước"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Các nút số trang và dấu ... */}
        <div className="pagination-pill-pages">
          {pages.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="pagination-pill-ellipsis"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`pagination-pill-item ${isActive ? 'pagination-pill-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Trang ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Nút Trang sau (Next) */}
        <button
          type="button"
          onClick={() => !isLast && onPageChange(currentPage + 1)}
          disabled={isLast}
          className={`pagination-pill-arrow ${isLast ? 'pagination-pill-disabled' : ''}`}
          aria-label="Trang sau"
          title="Trang sau"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

      </div>
    </nav>
  );
}
