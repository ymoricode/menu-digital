import { Routes, Route, Navigate } from 'react-router-dom';

// Customer Pages
import ScanQR from './pages/customer/ScanQR';
import MenuList from './pages/customer/MenuList';
import MenuDetail from './pages/customer/MenuDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import PaymentResult from './pages/customer/PaymentResult';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Barcodes from './pages/admin/Barcodes';
import Transactions from './pages/admin/Transactions';

// Layout
import LayoutAdmin from './components/layout/LayoutAdmin';

// Auth Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<ScanQR />} />
      <Route path="/menu" element={<MenuList />} />
      <Route path="/menu/:id" element={<MenuDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment/success" element={<PaymentResult status="success" />} />
      <Route path="/payment/failed" element={<PaymentResult status="failed" />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <LayoutAdmin />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="barcodes" element={<Barcodes />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
