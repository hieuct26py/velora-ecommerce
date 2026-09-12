import { useEffect, useState } from 'react';
import { adminCategoryApi, catalogApi } from '../api';

const emptyForm = { name: '', description: '', image_url: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await catalogApi.categories();
      setCategories(data.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Categories could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    catalogApi.categories()
      .then(({ data }) => {
        setCategories(data.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Categories could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await adminCategoryApi.update(editingId, form);
      else await adminCategoryApi.create(form);
      await loadCategories();
      setNotice(editingId ? 'Category updated.' : 'Category created.');
      reset();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The category could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try {
      await adminCategoryApi.remove(category.id);
      setNotice('Category deleted.');
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The category could not be deleted.');
    }
  };

  const formModeLabel = editingId ? 'Edit category' : 'New category';
  const formHeading = editingId ? 'Tune the label.' : 'Create a grouping.';
  let submitLabel = 'Create category';
  if (saving) submitLabel = 'Saving...';
  else if (editingId) submitLabel = 'Save changes';

  return (
    <main className="admin-page">
      <div className="admin-page-heading"><div><p className="eyebrow">Taxonomy / catalog</p><h1>Categories</h1></div><button className="admin-refresh" type="button" onClick={loadCategories}>Refresh</button></div>
      {error && <div className="admin-notice" role="alert">{error}</div>}{notice && <output className="admin-success">{notice}</output>}
      <section className="admin-product-workspace">
        <form className="admin-form" onSubmit={submit}><div className="admin-form-heading"><p className="eyebrow">{formModeLabel}</p><h2>{formHeading}</h2></div><label>Name<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label><label>Description<textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label><label>Image URL<input type="url" value={form.image_url} onChange={(event) => updateField('image_url', event.target.value)} /></label><div className="admin-form-actions"><button className="button button-dark" type="submit" disabled={saving}>{submitLabel}</button>{editingId && <button className="admin-quiet-button" type="button" onClick={reset}>Cancel edit</button>}</div></form>
        <section className="admin-table-wrap"><div className="admin-table-head"><span>{categories.length} categories</span></div>{loading ? <div className="admin-loading">Loading categories...</div> : categories.map((category) => <article className="admin-category-row" key={category.id}><div className="admin-category-swatch">{category.image_url && <img src={category.image_url} alt="" />}</div><div><strong>{category.name}</strong><span>{category.description || 'No description'}</span></div><div className="admin-row-actions"><button type="button" onClick={() => { setEditingId(category.id); setForm(category); }}>Edit</button><button className="danger-text" type="button" onClick={() => remove(category)}>Delete</button></div></article>)}</section>
      </section>
    </main>
  );
}
