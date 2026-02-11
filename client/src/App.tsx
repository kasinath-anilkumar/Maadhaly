import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Pages
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import MyOrders from '@/pages/MyOrders';
import OrderSuccess from '@/pages/OrderSuccess';
import Wishlist from '@/pages/Wishlist';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/wishlist" element={<Wishlist />} />
                
                {/* Static pages */}
                <Route path="/about" element={<div className="py-20 text-center">About Us - Coming Soon</div>} />
                <Route path="/contact" element={<div className="py-20 text-center">Contact Us - Coming Soon</div>} />
                <Route path="/categories" element={<div className="py-20 text-center">Categories - Coming Soon</div>} />
                <Route path="/terms" element={<div className="py-20 text-center">Terms of Service - Coming Soon</div>} />
                <Route path="/privacy" element={<div className="py-20 text-center">Privacy Policy - Coming Soon</div>} />
                <Route path="/shipping" element={<div className="py-20 text-center">Shipping Info - Coming Soon</div>} />
                <Route path="/returns" element={<div className="py-20 text-center">Returns Policy - Coming Soon</div>} />
                <Route path="/faqs" element={<div className="py-20 text-center">FAQs - Coming Soon</div>} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
