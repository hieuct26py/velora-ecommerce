import { useCallback, useEffect, useState } from 'react';
import { adminUserApi } from '../api';

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'ADMIN', label: 'Administrators' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest joined' },
  { value: 'oldest', label: 'Oldest joined' },
  { value: 'email_asc', label: 'Email: A to Z' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminUserApi.all({
        search: search.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
        sortBy,
        page,
        limit: 12,
      });
      setUsers(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, totalPages: 1 });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [search, role, status, sortBy, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 220);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const toggleStatus = async (user) => {
    try {
      const { data } = await adminUserApi.toggleStatus(user.id);
      setNotice(data.message);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'User status could not be updated.');
    }
  };

  const isFiltered = Boolean(search.trim() || role || status || sortBy !== 'newest');

  const resetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">People / access</p>
          <h1>Users</h1>
        </div>
        <button className="admin-refresh" type="button" onClick={loadUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh users'}
        </button>
      </div>

      <div className="admin-intro-line">
        <span>{meta.total} registered accounts</span>
        <span>Role permissions & authentication status</span>
      </div>

      {error && <div className="admin-notice" role="alert">{error}</div>}
      {notice && <output className="admin-success">{notice}</output>}

      {/* Users Filter Toolbar */}
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
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => { setSearch(''); setPage(1); }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            className={`admin-filter-select ${role ? 'active-filter' : ''}`}
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            aria-label="Filter by role"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            className={`admin-filter-select ${status ? 'active-filter' : ''}`}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            aria-label="Filter by status"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            aria-label="Sort users"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-filter-meta">
          <span className="admin-filter-count">
            Showing <strong>{users.length}</strong> of <strong>{meta.total}</strong>
          </span>
          {isFiltered && (
            <button type="button" className="admin-filter-reset" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </div>

      <section className="admin-order-table">
        <div className="admin-user-head">
          <span>User</span>
          <span>Role</span>
          <span>Joined</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <p>No users found matching your search or filters.</p>
            {isFiltered && (
              <button type="button" className="admin-filter-reset" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          users.map((user) => {
            const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
            const initial = displayName.charAt(0).toUpperCase() || 'U';

            return (
              <article className="admin-user-row" key={user.id}>
                <div className="admin-user-cell">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={displayName}
                      className="admin-user-avatar-thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'grid';
                        }
                      }}
                    />
                  ) : null}
                  <span
                    className="admin-user-avatar-fallback"
                    style={{ display: user.avatar_url ? 'none' : 'grid' }}
                  >
                    {initial}
                  </span>
                  <div className="admin-user-details">
                    <strong>{displayName}</strong>
                    <span>{user.email} &middot; #{user.id.slice(0, 8)}</span>
                  </div>
                </div>
                <span className="admin-muted">
                  <span className={`admin-state-tag ${user.role === 'ADMIN' ? 'is-active' : ''}`} style={{ fontSize: '0.65rem' }}>
                    {user.role}
                  </span>
                </span>
                <span className="admin-muted">{new Date(user.created_at).toLocaleDateString()}</span>
                <span className={`admin-state-tag ${user.is_active ? 'is-active' : 'is-inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="admin-action-button"
                  type="button"
                  onClick={() => toggleStatus(user)}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </article>
            );
          })
        )}
      </section>

      {meta.totalPages > 1 && (
        <nav className="admin-pagination" aria-label="User pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {meta.totalPages}
          </span>
          <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
