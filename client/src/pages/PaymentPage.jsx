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
    <div className="min-h-screen flex flex-col">
      <div className="bg-white/60 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center">
        <button onClick={() => navigate('/cart')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 mr-2">
          <ArrowLeft size={24} />
        </button>
        <span className="font-medium text-gray-500 text-sm">Checkout</span>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-hotel-dark text-white rounded-3xl p-6 mb-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-hotel-gold opacity-20 rounded-full blur-2xl"></div>
          <p className="text-gray-400 text-sm mb-1">Amount to Pay</p>
          <h2 className="text-4xl font-bold font-mono">₹{total.toFixed(2)}</h2>
          <p className="text-xs text-gray-400 mt-2">Table {tableNumber}</p>
        </div>

        <h3 className="font-bold text-gray-800 mb-4 px-2">Select Payment Method</h3>
        
        <div className="space-y-3">
          <label 
            onClick={() => setMethod('UPI')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'UPI' ? 'border-hotel-gold bg-hotel-gold/10' : 'border-gray-200 bg-white/60 backdrop-blur-sm'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'UPI' ? 'border-hotel-gold' : 'border-gray-300'}`}>
              {method === 'UPI' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3"><Smartphone size={20} /></div>
            <span className="font-semibold flex-1">UPI (GPay, PhonePe, Paytm)</span>
          </label>

          <label 
            onClick={() => setMethod('Card')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'Card' ? 'border-hotel-gold bg-hotel-gold/10' : 'border-gray-200 bg-white'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'Card' ? 'border-hotel-gold' : 'border-gray-300'}`}>
              {method === 'Card' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mr-3"><CardIcon size={20} /></div>
            <span className="font-semibold flex-1">Credit / Debit Card</span>
          </label>

          <label 
            onClick={() => setMethod('Cash')}
            className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${method === 'Cash' ? 'border-hotel-gold bg-hotel-gold/10' : 'border-gray-200 bg-white'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${method === 'Cash' ? 'border-hotel-gold' : 'border-gray-300'}`}>
              {method === 'Cash' && <div className="w-2.5 h-2.5 bg-hotel-gold rounded-full"></div>}
            </div>
            <div className="bg-green-100 p-2 rounded-lg text-green-600 mr-3"><Banknote size={20} /></div>
            <div className="flex-1">
               <span className="font-semibold block">Cash - Pay at End</span>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Settle total bill after dining</span>
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-600 rounded-xl text-sm font-medium border border-red-200">
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

      <div className="p-4 bg-white border-t border-gray-100">
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-hotel-dark text-hotel-gold py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
