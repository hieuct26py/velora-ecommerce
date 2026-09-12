import { useEffect, useState } from 'react';
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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Task 11: Modals
  const [deactivateProduct, setDeactivateProduct] = useState(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await catalogApi.products({ status, page: 1, limit: 100 });
      setProducts(data.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Products could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    catalogApi.products({ status, page: 1, limit: 100 })
      .then(({ data }) => {
        setProducts(data.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Products could not be loaded.'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    catalogApi.categories().then(({ data }) => setCategories(data.data)).catch(() => setCategories([]));
  }, []);

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
        <select
          className="admin-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter products by status"
        >
          <option value="ALL">All products</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
        </select>
      </div>

      <div className="admin-intro-line">
        <span>{products.length} products listed in database</span>
        <button className="admin-quiet-button" type="button" onClick={loadProducts}>
          Refresh list
        </button>
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
