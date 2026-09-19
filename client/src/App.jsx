import { useEffect } from 'react';
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

const ROUTE_TITLES = {
  '/': 'Trang chủ | Velora',
  '/cart': 'Giỏ hàng | Velora',
  '/checkout': 'Thanh toán | Velora',
  '/auth': 'Đăng nhập & Đăng ký | Velora',
  '/profile': 'Tài khoản của tôi | Velora',
  '/orders': 'Lịch sử đơn hàng | Velora',
  '/admin/analytics': 'Tổng quan | Velora Admin',
  '/admin/products': 'Quản lý sản phẩm | Velora Admin',
  '/admin/orders': 'Quản lý đơn hàng | Velora Admin',
  '/admin/categories': 'Quản lý danh mục | Velora Admin',
  '/admin/users': 'Quản lý người dùng | Velora Admin',
};

function RoutedApp() {
  const { path } = useRoute();

  useEffect(() => {
    if (ROUTE_TITLES[path]) {
      document.title = ROUTE_TITLES[path];
    } else if (path.startsWith('/product/')) {
      document.title = 'Chi tiết sản phẩm | Velora';
    } else if (path.startsWith('/orders/')) {
      document.title = 'Chi tiết đơn hàng | Velora';
    } else {
      document.title = 'Velora - Premium Tech';
    }
  }, [path]);

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
      <footer className="site-footer page-width">
        <div className="site-footer-brand">
          <img src="/images/velora-v-mark.png" alt="V" className="site-footer-v" />
          <span>ELORA / Apple devices and accessories</span>
        </div>
        <span>Technology, considered.</span>
      </footer>
    </div>
  );
}


export default function App() {
  return <AuthProvider><CartProvider><RoutedApp /></CartProvider></AuthProvider>;
}