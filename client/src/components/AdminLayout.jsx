import { Link, useNavigate, useRoute } from '../router';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/admin/analytics', label: 'Overview', index: '01' },
  { path: '/admin/products', label: 'Products', index: '02' },
  { path: '/admin/orders', label: 'Orders', index: '03' },
  { path: '/admin/categories', label: 'Categories', index: '04' },
  { path: '/admin/users', label: 'Users', index: '05' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { path } = useRoute();
  const { user, isAuthenticated, isBooting, logout } = useAuth();

  if (isBooting) return <main className="admin-state">Checking administrator access...</main>;
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <main className="admin-state">
        <p className="eyebrow">Restricted area</p>
        <h1>Administrator access required.</h1>
        <Link className="button button-dark" to={isAuthenticated ? '/' : '/auth'}>{isAuthenticated ? 'Return to shop' : 'Sign in'}</Link>
      </main>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><Link to="/">VELORA<span>/</span></Link><p>Operations desk</p></div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => <Link key={item.path} className={path === item.path ? 'active' : ''} to={item.path}><span>{item.index}</span>{item.label}</Link>)}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/">View storefront</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><span className="admin-breadcrumb">Admin / {navItems.find((item) => item.path === path)?.label || 'Workspace'}</span><span className="admin-identity">{user.email}</span></header>
        {children}
      </section>
    </div>
  );
}
