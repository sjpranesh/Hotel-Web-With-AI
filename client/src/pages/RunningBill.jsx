import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { ArrowLeft, Clock, ShoppingBag, Receipt, CheckCircle, CreditCard, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RunningBill = () => {
  const { tableNumber, API_URL, socket } = useHotel();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => {
    fetchSession();

    if (socket) {
      socket.on('session_updated', (updatedSession) => {
        if (updatedSession.tableNumber === parseInt(tableNumber)) {
          setSession(updatedSession);
        }
      });
      socket.on('session_closed', () => {
        navigate('/review');
      });
    }

    return () => {
      if (socket) {
        socket.off('session_updated');
        socket.off('session_closed');
      }
    };
  }, [tableNumber, socket, navigate]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/table-session/${tableNumber}`);
      const data = await res.json();
      if (data && data.sessionStatus === 'Active') {
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestFinalBill = async (paymentMethod) => {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/orders/session/${session.sessionId}/request-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMode: paymentMethod })
      });
      const data = await res.json();
      setSession(data);
      setShowConfirmPopup(false);
      localStorage.removeItem('quickserve_table');
      navigate('/');
    } catch (err) {
      alert('Failed to request bill');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#111] text-hotel-gold">
       <span className="font-playfair text-xl tracking-widest uppercase animate-pulse">Loading Bill...</span>
    </div>
  );

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#111] text-center" style={{ backgroundImage: 'radial-gradient(circle at top, #2a2a2a, #111)' }}>
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 text-hotel-gold/50 luxury-shadow">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-3xl font-playfair text-gradient-gold mb-3">No Active Orders</h2>
        <p className="text-gray-400 font-outfit mb-8 max-w-sm leading-relaxed">Your table doesn't have any running orders. Explore our culinary collections or rate your experience.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => navigate('/menu')} className="bg-hotel-gold text-black px-10 py-4 rounded-full font-bold font-outfit uppercase tracking-widest luxury-shadow hover:bg-[#b8952a] transition-all">
            Explore Menu
          </button>
          <button onClick={() => navigate('/review')} className="bg-white/5 text-hotel-gold border border-hotel-gold/30 px-10 py-4 rounded-full font-bold font-outfit uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs">
            <Star size={16} className="fill-hotel-gold text-hotel-gold" /> Rate Experience
          </button>
        </div>
      </div>
    );
  }

  const tax = session.runningTotal * 0.05;
  const grandTotal = session.runningTotal + tax;

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col font-outfit" style={{ backgroundImage: 'radial-gradient(circle at top right, #1a1a1a, #0b0b0b)' }}>
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-md px-6 py-5 sticky top-0 z-10 border-b border-white/10 flex items-center shadow-2xl">
        <button onClick={() => navigate('/menu')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-300 mr-3 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="font-playfair text-xl text-gradient-gold tracking-wider">Running Bill</span>
      </div>

      <div className="p-6 flex-1 max-w-2xl mx-auto w-full">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-[2rem] p-8 mb-8 border border-white/10 luxury-shadow relative overflow-hidden">
           <div className="absolute top-[-30%] right-[-20%] w-64 h-64 bg-hotel-gold/10 rounded-full blur-[80px]"></div>
           <div className="flex justify-between items-start mb-6">
              <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Session ID</p>
                 <p className="font-mono text-sm text-hotel-gold">{session.sessionId}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1">Table</p>
                 <p className="font-playfair font-black text-3xl text-white">{session.tableNumber}</p>
              </div>
           </div>
           
           <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Item Total</p>
           <h2 className="text-5xl font-playfair text-gradient-gold mb-1 leading-none">₹{session.runningTotal.toFixed(2)}</h2>
           <p className="text-xs text-gray-400 mb-6">+ 5% Taxes and Charges applicable</p>
           
           <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
              <div className={`w-2.5 h-2.5 rounded-full ${session.billRequested ? 'bg-hotel-gold animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'}`}></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
                {session.billRequested ? 'Waiter is preparing your bill' : 'Active Dining Session'}
              </span>
           </div>
        </div>

        <h3 className="font-playfair text-2xl text-white mb-6 flex items-center gap-3">
          <Receipt size={24} className="text-hotel-gold" /> Order Journal
        </h3>

        <div className="space-y-6 mb-12">
          {session.orders.map((order, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={order._id} 
              className="bg-white/5 p-6 rounded-3xl border border-white/10 glass-card"
            >
              <div className="flex justify-between items-center mb-5">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-hotel-gold/20 text-hotel-gold border border-hotel-gold/30 px-3 py-1 rounded-full uppercase tracking-wider">Order #{idx + 1}</span>
                    <span className="text-[11px] text-gray-500 font-mono">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                 <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                   order.orderStatus === 'Ready' || order.orderStatus === 'Delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                   order.orderStatus === 'Preparing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                 }`}>
                   {order.orderStatus}
                 </span>
              </div>
              
              <div className="space-y-4">
                 {order.items.map((item, i) => (
                   <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-hotel-gold font-bold text-xs">{item.quantity}</span>
                        <p className="text-gray-300 font-medium">{item.name}</p>
                      </div>
                      <p className="font-playfair text-white text-lg">₹{item.price * item.quantity}</p>
                   </div>
                 ))}
              </div>
              
              <div className="mt-5 pt-4 border-t border-dashed border-white/10 flex justify-between items-center">
                 <p className="text-xs text-gray-500 uppercase tracking-widest">Subtotal</p>
                 <p className="font-playfair font-bold text-xl text-hotel-gold">₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 space-y-4 sticky bottom-0 z-20">
         <button 
           onClick={() => navigate('/menu')}
           className="w-full bg-white/5 text-white py-4 rounded-full font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors"
         >
           Add More Delicacies
         </button>
         
         {!session.billRequested && (
           <button 
             onClick={() => setShowConfirmPopup(true)}
             className="w-full bg-gradient-to-r from-hotel-gold to-[#997a15] text-black py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] luxury-shadow hover:scale-[1.02] transition-transform"
           >
             Request Final Bill
           </button>
         )}
         
         {session.billRequested && (
           <div className="bg-hotel-gold/10 border border-hotel-gold/50 text-hotel-gold p-5 rounded-3xl text-center glass-card">
              <p className="font-playfair text-lg mb-1 flex items-center justify-center gap-2"><CheckCircle size={20} /> Waiter is preparing your bill</p>
              <p className="text-xs opacity-70 font-outfit">Please wait at your table. It will be served shortly.</p>
           </div>
         )}

         <button 
           onClick={() => navigate('/review')}
           className="w-full bg-white/5 text-hotel-gold py-4 rounded-full font-bold uppercase tracking-widest border border-hotel-gold/30 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs"
         >
           <Star size={16} className="fill-hotel-gold text-hotel-gold" /> Rate Dining Experience
         </button>
      </div>

      {/* Bill Confirmation Popup */}
      <AnimatePresence>
        {showConfirmPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 luxury-shadow relative"
            >
              <h3 className="font-playfair text-3xl text-white mb-6 text-center">Confirm Bill</h3>
              
              <div className="bg-white/5 p-5 rounded-2xl mb-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Item Total</span>
                  <span className="text-white">₹{session.runningTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Tax (5% GST)</span>
                  <span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between text-lg">
                  <span className="text-hotel-gold uppercase tracking-widest text-xs self-center">Grand Total</span>
                  <span className="font-playfair text-2xl text-gradient-gold font-bold">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-4">Payment Method</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => requestFinalBill('Cash')}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl text-gray-300 hover:border-hotel-gold/50 hover:bg-hotel-gold/10 transition-all flex flex-col items-center gap-2 group"
                >
                  <Receipt size={24} className="group-hover:text-hotel-gold transition-colors" />
                  <span className="text-sm font-medium tracking-wide">Pay Cash</span>
                </button>
                <button
                  onClick={() => requestFinalBill('Online')}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl text-gray-300 hover:border-hotel-gold/50 hover:bg-hotel-gold/10 transition-all flex flex-col items-center gap-2 group"
                >
                  <CreditCard size={24} className="group-hover:text-hotel-gold transition-colors" />
                  <span className="text-sm font-medium tracking-wide">Online Pay</span>
                </button>
              </div>

              <button 
                onClick={() => setShowConfirmPopup(false)}
                className="w-full py-3 text-sm text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RunningBill;
