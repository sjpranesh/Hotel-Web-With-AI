import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useHotel();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="text-gray-300" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('Your cart is empty')}</h2>
        <p className="text-gray-500 mb-8 text-center max-w-xs">{t('Looks like you haven\'t added anything to your order yet.')}</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-hotel-dark text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotel-green transition-colors"
        >
          {t('Browse Menu')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white/60 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <button onClick={() => navigate('/menu')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">{t('Order Summary')}</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          {cart.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.menuItem} 
              className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4"
            >
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                <p className="text-sm font-semibold text-hotel-gold">₹{item.price}</p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button 
                  onClick={() => removeFromCart(item.menuItem)}
                  className="text-red-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <button onClick={() => updateQuantity(item._id || item.menuItem, -1)} className="px-2 py-1 hover:bg-gray-200"><Minus size={14} /></button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id || item.menuItem, 1)} className="px-2 py-1 hover:bg-gray-200"><Plus size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="mt-8 bg-white/60 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-50 mb-24">
          <h3 className="font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs">{t('Bill Details')}</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{t('Item Total')}</span>
              <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('Taxes (5% GST)')}</span>
              <span className="font-medium text-gray-900">₹{tax.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-lg mt-2">
              <span className="font-bold text-gray-900">{t('Grand Total')}</span>
              <span className="font-bold text-hotel-dark text-xl">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-20">
        <button 
          onClick={() => navigate('/payment')}
          className="w-full bg-hotel-dark text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-hotel-green transition-colors"
        >
          <CreditCard size={20} />
          {t('Proceed to Pay')} • ₹{grandTotal.toFixed(2)}
        </button>
      </div>
    </div>
  );
};


export default CartPage;
