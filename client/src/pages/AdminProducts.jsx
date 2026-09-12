import { useEffect, useState } from 'react';
import { adminProductApi, catalogApi } from '../api';

const emptyForm = { name: '', description: '', price: '', stock_quantity: 0, category_id: '', images: '', is_active: true };

function formFromProduct(product) {
  return { ...product, price: product.price ?? '', images: product.images?.join('\n') || '' };
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

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
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

  const removeProduct = async (product) => {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;
    try {
      await adminProductApi.remove(product.id);
      setNotice('Product deactivated.');
      await loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The product could not be deactivated.');
    }
  };

  let submitLabel = 'Create product';
  if (saving) submitLabel = 'Saving...';
  else if (editingId) submitLabel = 'Save changes';
  const formModeLabel = editingId ? 'Edit product' : 'New product';
  const formHeading = editingId ? 'Refine the record.' : 'Add to the collection.';
  let inventoryContent = <div className="admin-loading">No products in this view.</div>;
  if (loading) inventoryContent = <div className="admin-loading">Loading inventory...</div>;
  else if (products.length > 0) inventoryContent = <div className="admin-table">{products.map((product) => <article className="admin-product-row" key={product.id}><div className="admin-product-thumb">{product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span>No image</span>}</div><div className="admin-product-name"><strong>{product.name}</strong><span>{product.category?.name || 'Uncategorized'}</span></div><span className="admin-table-number">${Number(product.price).toFixed(2)}</span><span className={`admin-state-tag ${product.is_active ? 'is-active' : 'is-inactive'}`}>{product.is_active ? 'Active' : 'Inactive'}</span><span className="admin-table-number">{product.stock_quantity}</span><div className="admin-row-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button>{product.is_active && <button className="danger-text" type="button" onClick={() => removeProduct(product)}>Deactivate</button>}</div></article>)}</div>;

  return (
    <main className="admin-page admin-products-page">
      <div className="admin-page-heading"><div><p className="eyebrow">Inventory / catalog</p><h1>Products</h1></div><select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Product status"><option value="ALL">All products</option><option value="ACTIVE">Active only</option><option value="INACTIVE">Inactive only</option></select></div>
      {error && <div className="admin-notice" role="alert"><strong>{error}</strong></div>}
      {notice && <output className="admin-success">{notice}</output>}
      <section className="admin-product-workspace">
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-heading"><p className="eyebrow">{formModeLabel}</p><h2>{formHeading}</h2></div>
          <label>Name<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
          <div className="admin-form-row"><label>Price<input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} /></label><label>Stock<input required min="0" step="1" type="number" value={form.stock_quantity} onChange={(event) => updateField('stock_quantity', event.target.value)} /></label></div>
          <label>Category<select value={form.category_id || ''} onChange={(event) => updateField('category_id', event.target.value)}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Description<textarea rows="4" value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} /></label>
          <label>Image URLs <span className="admin-field-note">One URL per line</span><textarea rows="3" value={form.images} onChange={(event) => updateField('images', event.target.value)} /></label>
          {editingId && <label className="admin-check"><input type="checkbox" checked={form.is_active} onChange={(event) => updateField('is_active', event.target.checked)} /> Product is active</label>}
          <div className="admin-form-actions"><button className="button button-dark" type="submit" disabled={saving}>{submitLabel}</button>{editingId && <button className="admin-quiet-button" type="button" onClick={resetForm}>Cancel edit</button>}</div>
        </form>
        <section className="admin-table-wrap" aria-label="Product inventory"><div className="admin-table-head"><span>{products.length} records</span><button className="admin-quiet-button" type="button" onClick={loadProducts}>Refresh</button></div>{inventoryContent}</section>
      </section>
    </main>
  );
}
