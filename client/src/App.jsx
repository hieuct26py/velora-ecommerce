import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { useRoute } from './router';
import AuthPage from './pages/AuthPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import AdminLayout from './components/AdminLayout';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';

function RoutedApp() {
  const { path } = useRoute();
  let page = <Home />;
  if (path === '/cart') page = <Cart />;
  if (path === '/checkout') page = <Checkout />;
  if (path === '/auth') page = <AuthPage />;
  if (path === '/profile') page = <Profile />;
  if (path === '/orders') page = <OrderHistory />;
  if (path.startsWith('/orders/')) page = <OrderDetail />;
  if (path.startsWith('/product/')) page = <ProductDetail />;
  if (path === '/admin/analytics') page = <AdminLayout><AdminAnalytics /></AdminLayout>;
  if (path === '/admin/products') page = <AdminLayout><AdminProducts /></AdminLayout>;
  if (path === '/admin/orders') page = <AdminLayout><AdminOrders /></AdminLayout>;
  if (path === '/admin/categories') page = <AdminLayout><AdminCategories /></AdminLayout>;
  if (path === '/admin/users') page = <AdminLayout><AdminUsers /></AdminLayout>;

  return (
    <div className="app-shell">
      <Navbar />
      {page}
      <footer className="site-footer page-width"><span>VELORA / Apple devices and accessories</span><span>Technology, considered.</span></footer>
    </div>
  );
}

export default function App() {
  return <AuthProvider><CartProvider><RoutedApp /></CartProvider></AuthProvider>;
}