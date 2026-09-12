import { useEffect, useState } from 'react';
import { adminUserApi } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminUserApi.all({ status: status || undefined, page, limit: 12 });
      setUsers(data.data);
      setMeta(data.meta);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminUserApi.all({ status: status || undefined, page, limit: 12 })
      .then(({ data }) => { setUsers(data.data); setMeta(data.meta); setError(''); })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Users could not be loaded.'))
      .finally(() => setLoading(false));
  }, [status, page]);

  const toggleStatus = async (user) => {
    try {
      const { data } = await adminUserApi.toggleStatus(user.id);
      setNotice(data.message);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'User status could not be updated.');
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-page-heading"><div><p className="eyebrow">People / access</p><h1>Users</h1></div><select className="admin-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="User status"><option value="">All users</option><option value="active">Active users</option><option value="inactive">Inactive users</option></select></div>
      <div className="admin-intro-line"><span>{meta.total} accounts</span><button className="admin-quiet-button" type="button" onClick={loadUsers}>Refresh</button></div>
      {error && <div className="admin-notice" role="alert">{error}</div>}{notice && <output className="admin-success">{notice}</output>}
      <section className="admin-order-table"><div className="admin-user-head"><span>User</span><span>Role</span><span>Joined</span><span>Status</span><span>Action</span></div>{loading ? <div className="admin-loading">Loading users...</div> : users.map((user) => <article className="admin-user-row" key={user.id}><div><strong>{user.email}</strong><span>{user.id.slice(0, 8)}</span></div><span className="admin-muted">{user.role}</span><span className="admin-muted">{new Date(user.created_at).toLocaleDateString()}</span><span className={`admin-state-tag ${user.is_active ? 'is-active' : 'is-inactive'}`}>{user.is_active ? 'Active' : 'Inactive'}</span><button className="admin-action-button" type="button" onClick={() => toggleStatus(user)}>{user.is_active ? 'Deactivate' : 'Activate'}</button></article>)}</section>
      {meta.totalPages > 1 && <nav className="admin-pagination" aria-label="User pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {meta.totalPages}</span><button type="button" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</button></nav>}
    </main>
  );
}
