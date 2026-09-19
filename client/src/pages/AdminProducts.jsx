import { useCallback, useEffect, useState } from 'react';
import { adminProductApi, catalogApi } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock_quantity: 0,
  category_id: '',
  images: '',
  is_active: true,
};

function formFromProduct(product) {
  return {
    ...product,
    price: product.price ?? '',
    stock_quantity: product.stock_quantity ?? 0,
    images: product.images?.join('\n') || '',
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Task 11: Modals
  const [deactivateProduct, setDeactivateProduct] = useState(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status,
        keyword: search.trim() || undefined,
        category: selectedCategory || undefined,
        stockStatus: stockFilter !== 'ALL' ? stockFilter : undefined,
        sortBy,
        page: 1,
        limit: 200,
      };
      const { data } = await catalogApi.products(params);
      setProducts(data.data || []);
      setTotalCount(data.meta?.total || (data.data ? data.data.length : 0));
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Products could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [status, search, selectedCategory, stockFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 220);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    catalogApi.categories().then(({ data }) => setCategories(data.data)).catch(() => setCategories([]));
  }, []);

  const isFiltered = Boolean(
    search.trim() || selectedCategory || status !== 'ALL' || stockFilter !== 'ALL' || sortBy !== 'newest'
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStatus('ALL');
    setStockFilter('ALL');
    setSortBy('newest');
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleCancelEditClick = () => {
    if (editingId) {
      setIsCancelConfirmOpen(true);
    } else {
      resetForm();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      price: Number(form.price),
      stock_quantity: Math.max(0, parseInt(form.stock_quantity, 10) || 0),
      category_id: form.category_id || null,
      images: form.images.split('\n').map((image) => image.trim()).filter(Boolean),
      ...(editingId ? { is_active: form.is_active } : {}),
    };
    try {
      if (editingId) await adminProductApi.update(editingId, payload);
      else await adminProductApi.create(payload);
      await loadProducts();
      setNotice(editingId ? 'Product updated.' : 'Product created.');
      resetForm();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm(formFromProduct(product));
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeactivate = async () => {
    if (!deactivateProduct) return;
    try {
      await adminProductApi.remove(deactivateProduct.id);
      setNotice(`Product "${deactivateProduct.name}" deactivated.`);
      setDeactivateProduct(null);
      await loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The product could not be deactivated.');
      setDeactivateProduct(null);
    }
  };

  let submitLabel = 'Create product';
  if (saving) submitLabel = 'Saving...';
  else if (editingId) submitLabel = 'Save changes';

  return (
    <main className="admin-page admin-products-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Inventory management</p>
          <h1>Products</h1>
        </div>
        <button className="admin-refresh" type="button" onClick={loadProducts} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh list'}
        </button>
      </div>

      <div className="admin-intro-line">
        <span>{totalCount} total products in catalog</span>
        <span>Catalog & inventory management</span>
      </div>

      {error && <div className="admin-notice" role="alert"><strong>{error}</strong></div>}
      {notice && <output className="admin-success">{notice}</output>}

      <div className="admin-product-workspace">
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-heading">
            <p className="eyebrow">{editingId ? 'Editing product' : 'New entry'}</p>
            <h2>{editingId ? 'Edit details' : 'Add product'}</h2>
          </div>

          <label>
            Name *
            <input
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="e.g. MacBook Pro 16"
            />
          </label>

          <label>
            Description
            <textarea
              rows="3"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Chip, memory, storage specifications..."
            />
          </label>

          <div className="admin-form-row">
            <label>
              Price ($) *
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                placeholder="999.00"
              />
            </label>

            {/* Task 9: Allows setting stock to 0 */}
            <label>
              Stock count *
              <input
                required
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(event) => updateField('stock_quantity', event.target.value)}
                placeholder="0"
              />
              <span className="admin-field-note">Set 0 for out of stock</span>
            </label>
          </div>

          <label>
            Category
            <select
              value={form.category_id || ''}
              onChange={(event) => updateField('category_id', event.target.value)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            Images (one URL per line)
            <textarea
              rows="3"
              value={form.images}
              onChange={(event) => updateField('images', event.target.value)}
              placeholder="https://..."
            />
          </label>

          {editingId && (
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateField('is_active', event.target.checked)}
              />
              <span>Product is active and visible in store</span>
            </label>
          )}

          <div className="admin-form-actions">
            <button className="button button-signal" type="submit" disabled={saving}>
              {submitLabel}
            </button>
            {editingId && (
              <button
                className="button button-quiet"
                type="button"
                onClick={handleCancelEditClick}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="admin-table-wrap">
          {/* Enhanced Filter Toolbar */}
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
                  placeholder="Search name or #ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className={`admin-filter-select ${selectedCategory ? 'active-filter' : ''}`}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter products by category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <select
                className={`admin-filter-select ${status !== 'ALL' ? 'active-filter' : ''}`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter products by status"
              >
                <option value="ALL">All visibility</option>
                <option value="ACTIVE">Active only</option>
                <option value="INACTIVE">Inactive only</option>
              </select>

              <select
                className={`admin-filter-select ${stockFilter !== 'ALL' ? 'active-filter' : ''}`}
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                aria-label="Filter products by stock"
              >
                <option value="ALL">All stock</option>
                <option value="IN_STOCK">In stock (&gt;0)</option>
                <option value="LOW_STOCK">Low stock (≤3)</option>
                <option value="OUT_OF_STOCK">Out of stock (0)</option>
              </select>

              <select
                className="admin-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="newest">Newest added</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>

            <div className="admin-filter-meta">
              <span className="admin-filter-count">
                Showing <strong>{products.length}</strong> of {totalCount}
              </span>
              {isFiltered && (
                <button
                  type="button"
                  className="admin-filter-reset"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-head">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="admin-loading"><span className="loader-line" /> Loading products...</div>
          ) : products.length === 0 ? (
            <div className="admin-empty-box">
              <span>No products match the selected filters.</span>
              {isFiltered && (
                <button
                  type="button"
                  className="admin-quiet-button"
                  style={{ marginLeft: '12px' }}
                  onClick={resetFilters}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table">
              {products.map((product) => {
                const stock = Number(product.stock_quantity);
                const isZero = stock === 0;

                return (
                  <article className="admin-product-row" key={product.id}>
                    <div className="admin-product-thumb">
                      {product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span>No img</span>}
                    </div>

                    <div className="admin-product-name">
                      <strong>{product.name}</strong>
                      <span>#{product.id.slice(0, 8)}</span>
                    </div>

                    <span className="admin-muted">{product.category?.name || 'Unassigned'}</span>
                    <strong className="admin-table-number">${Number(product.price).toFixed(2)}</strong>

                    <span className={`admin-table-number ${isZero ? 'danger-text' : ''}`}>
                      {stock}
                    </span>

                    <span className={`admin-state-tag ${product.is_active ? 'is-active' : 'is-inactive'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>

                    <div className="admin-row-actions">
                      <button type="button" onClick={() => editProduct(product)}>Edit</button>
                      {product.is_active && (
                        <button
                          className="danger-text"
                          type="button"
                          onClick={() => setDeactivateProduct(product)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Task 11: Confirmation modals */}
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        title="Discard changes?"
        message={<p>Any unsaved edits made to this product form will be discarded.</p>}
        confirmLabel="Discard changes"
        cancelLabel="Continue editing"
        onConfirm={() => {
          resetForm();
          setIsCancelConfirmOpen(false);
        }}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(deactivateProduct)}
        title="Deactivate product?"
        message={
          <div>
            <p>Are you sure you want to deactivate <strong>"{deactivateProduct?.name}"</strong>?</p>
            <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>
              It will no longer appear on the public storefront.
            </p>
          </div>
        }
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        isDestructive={true}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateProduct(null)}
      />
    </main>
  );
}
