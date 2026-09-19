import { useEffect, useState, useMemo } from 'react';
import { adminCategoryApi, catalogApi } from '../api';

const emptyForm = { name: '', description: '', image_url: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await catalogApi.categories();
      setCategories(data.data || []);
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
        setCategories(data.data || []);
        setError('');
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Categories could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchName = cat.name?.toLowerCase().includes(q);
          const matchDesc = cat.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        if (mediaFilter === 'WITH_IMAGE' && !cat.image_url) return false;
        if (mediaFilter === 'WITHOUT_IMAGE' && cat.image_url) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        return a.name.localeCompare(b.name);
      });
  }, [categories, search, mediaFilter, sortBy]);

  const isFiltered = Boolean(search.trim() || mediaFilter !== 'ALL' || sortBy !== 'name_asc');

  const resetFilters = () => {
    setSearch('');
    setMediaFilter('ALL');
    setSortBy('name_asc');
  };

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
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Taxonomy / catalog</p>
          <h1>Categories</h1>
        </div>
        <button className="admin-refresh" type="button" onClick={loadCategories} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="admin-intro-line">
        <span>{categories.length} total categories registered</span>
        <span>Store taxonomy & organization</span>
      </div>

      {error && <div className="admin-notice" role="alert">{error}</div>}
      {notice && <output className="admin-success">{notice}</output>}

      <section className="admin-product-workspace">
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-heading">
            <p className="eyebrow">{formModeLabel}</p>
            <h2>{formHeading}</h2>
          </div>
          <label>
            Name
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            Description
            <textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </label>
          <label>
            Image URL
            <input type="url" value={form.image_url} onChange={(event) => updateField('image_url', event.target.value)} />
          </label>
          <div className="admin-form-actions">
            <button className="button button-dark" type="submit" disabled={saving}>
              {submitLabel}
            </button>
            {editingId && (
              <button className="admin-quiet-button" type="button" onClick={reset}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="admin-table-wrap">
          {/* Categories Filter Toolbar */}
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
                  placeholder="Search categories..."
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
                className={`admin-filter-select ${mediaFilter !== 'ALL' ? 'active-filter' : ''}`}
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
                aria-label="Filter by media"
              >
                <option value="ALL">All media</option>
                <option value="WITH_IMAGE">With image</option>
                <option value="WITHOUT_IMAGE">No image</option>
              </select>

              <select
                className="admin-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort categories"
              >
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>

            <div className="admin-filter-meta">
              <span className="admin-filter-count">
                Showing <strong>{filteredCategories.length}</strong> of {categories.length}
              </span>
              {isFiltered && (
                <button
                  type="button"
                  className="admin-filter-reset"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-head">
            <span>{filteredCategories.length} categories</span>
          </div>

          {loading ? (
            <div className="admin-loading">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="admin-empty-box">
              <span>No categories match your search or filter criteria.</span>
              {isFiltered && (
                <button
                  type="button"
                  className="admin-quiet-button"
                  style={{ marginLeft: '12px' }}
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <article className="admin-category-row" key={category.id}>
                <div className="admin-category-swatch">
                  {category.image_url && <img src={category.image_url} alt="" />}
                </div>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.description || 'No description'}</span>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(category.id);
                      setForm(category);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-text"
                    type="button"
                    onClick={() => remove(category)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
