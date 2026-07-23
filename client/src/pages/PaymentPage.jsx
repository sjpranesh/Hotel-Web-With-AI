import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useHotel } from '../context/HotelContext';
import { ArrowLeft, CheckCircle, Smartphone, CreditCard as CardIcon, Banknote } from 'lucide-react';

const PaymentPage = () => {
  const { cart, getCartTotal, tableNumber, setCurrentOrder, API_URL, clearCart } = useHotel();
  const navigate = useNavigate();
  const [method, setMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const total = getCartTotal() * 1.05; // with 5% tax

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      let transactionId = `CASH-${Date.now()}`;
      
      if (method !== 'Cash') {
        // 1. Process Mock Payment for UPI/Card
        const paymentRes = await axios.post(`${API_URL}/payments/process`, {
          orderId: `TEMP-${Date.now()}`,
          amount: total,
          method
        });
        
        if (!paymentRes.data.success) {
          throw new Error('Payment failed');
        }
        transactionId = paymentRes.data.transactionId;
      }

      // 2. Create Order
      const orderRes = await axios.post(`${API_URL}/orders`, {
        tableNumber: parseInt(tableNumber, 10),
        items: cart.map(item => ({
          menuItem: item.menuItem,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        transactionId: transactionId,
        paymentMethod: method
      });

      setCurrentOrder(orderRes.data);
      clearCart();
      navigate('/success');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111] text-white font-outfit" style={{ backgroundImage: 'radial-gradient(circle at top right, #1a1a1a, #0b0b0b)' }}>
      <div className="bg-black/80 backdrop-blur-xl px-6 py-6 sticky top-0 z-40 border-b border-white/10 flex items-center shadow-lg">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <span className="font-playfair text-2xl font-bold text-hotel-gold tracking-wide">Checkout</span>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-black rounded-[2rem] p-8 mb-8 relative overflow-hidden luxury-shadow border border-hotel-gold/20">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-hotel-gold opacity-20 rounded-full blur-2xl"></div>
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Amount to Pay</p>
          <h2 className="text-5xl font-playfair font-black text-hotel-gold">₹{total.toFixed(2)}</h2>
          <p className="text-xs text-gray-400 mt-3 uppercase tracking-widest font-bold bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10">Table {tableNumber}</p>
        </div>

        <h3 className="font-playfair text-xl font-bold text-white mb-6 px-2">Select Payment Method</h3>
        
        <div className="space-y-3">
          <label 
            onClick={() => setMethod('UPI')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'UPI' ? 'border-hotel-gold bg-hotel-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'UPI' ? 'border-hotel-gold' : 'border-white/20'}`}>
              {method === 'UPI' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400 mr-4 border border-blue-500/20"><Smartphone size={20} /></div>
            <span className="font-semibold flex-1">UPI (GPay, PhonePe, Paytm)</span>
          </label>

          <label 
            onClick={() => setMethod('Card')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'Card' ? 'border-hotel-gold bg-hotel-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'Card' ? 'border-hotel-gold' : 'border-white/20'}`}>
              {method === 'Card' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400 mr-4 border border-purple-500/20"><CardIcon size={20} /></div>
            <span className="font-semibold flex-1">Credit / Debit Card</span>
          </label>

          <label 
            onClick={() => setMethod('Cash')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'Cash' ? 'border-hotel-gold bg-hotel-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'Cash' ? 'border-hotel-gold' : 'border-white/20'}`}>
              {method === 'Cash' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl text-green-400 mr-4 border border-green-500/20"><Banknote size={20} /></div>
            <div className="flex-1">
               <span className="font-semibold block">Cash - Pay at End</span>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Settle total bill after dining</span>
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-medium border border-red-500/30">
            <p>{error}</p>
            <button
              onClick={() => { setError(''); handlePayment(); }}
              className="mt-3 w-full bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition-colors"
            >
              Retry Payment
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 z-20 sticky bottom-0">
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-hotel-gold text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#b8952a] transition-all disabled:opacity-50 flex justify-center items-center gap-3 luxury-shadow"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-hotel-gold border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Pay ₹{total.toFixed(2)} Securely
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
