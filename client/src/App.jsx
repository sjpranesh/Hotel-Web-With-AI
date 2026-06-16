import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HotelProvider } from './context/HotelContext';
import { LanguageProvider } from './context/LanguageContext';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import RunningBill from './pages/RunningBill';
import KitchenDashboard from './pages/KitchenDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <HotelProvider>
      <Router>
        <div className="min-h-screen text-[#1a1a1a] font-sans selection:bg-hotel-gold selection:text-white">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/running-bill" element={<RunningBill />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
      </HotelProvider>
    </LanguageProvider>
  );
}

export default App;
