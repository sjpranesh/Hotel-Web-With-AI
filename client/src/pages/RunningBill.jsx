import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { ArrowLeft, Clock, ShoppingBag, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

const RunningBill = () => {
  const { tableNumber, API_URL, socket } = useHotel();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSession();

    if (socket) {
      socket.on('session_updated', (updatedSession) => {
        if (updatedSession.tableNumber === parseInt(tableNumber)) {
          setSession(updatedSession);
        }
      });
      socket.on('session_closed', () => {
        navigate('/menu');
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
      setSession(data);
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestFinalBill = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/orders/session/${session.sessionId}/request-bill`, {
        method: 'POST'
      });
      const data = await res.json();
      setSession(data);
    } catch (err) {
      alert('Failed to request bill');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading bill...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Bill</h2>
        <p className="text-gray-500 mb-8">You don't have any active running bills for this table.</p>
        <button onClick={() => navigate('/menu')} className="bg-hotel-dark text-white px-8 py-3 rounded-xl font-bold">Return to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white/60 backdrop-blur-md px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 mr-2">
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold text-gray-800">Running Table Bill</span>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-hotel-dark text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-hotel-gold opacity-10 rounded-full blur-2xl"></div>
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Session ID</p>
                 <p className="font-mono text-sm text-hotel-gold">{session.sessionId}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Table</p>
                 <p className="font-black text-2xl">{session.tableNumber}</p>
              </div>
           </div>
           
           <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Payable</p>
           <h2 className="text-4xl font-black text-white mb-2">₹{session.runningTotal.toFixed(2)}</h2>
           
           <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <div className={`w-2 h-2 rounded-full ${session.billRequested ? 'bg-hotel-gold animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {session.billRequested ? 'Bill Requested - Please wait' : 'Active Dining Session'}
              </span>
           </div>
        </div>

        <h3 className="font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
          <Receipt size={18} /> Order History
        </h3>

        <div className="space-y-4 mb-8">
          {session.orders.map((order, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={order._id} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">Order #{idx + 1}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                   order.orderStatus === 'Ready' ? 'bg-green-100 text-green-600' : 
                   order.orderStatus === 'Preparing' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                 }`}>
                   {order.orderStatus}
                 </span>
              </div>
              
              <div className="space-y-2">
                 {order.items.map((item, i) => (
                   <div key={i} className="flex justify-between text-sm">
                      <p className="text-gray-600 font-medium">
                         <span className="font-bold text-gray-800 mr-2">{item.quantity}x</span> {item.name}
                      </p>
                      <p className="font-bold text-gray-800">₹{item.price * item.quantity}</p>
                   </div>
                 ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                 <p className="text-xs text-gray-400 font-bold">Subtotal</p>
                 <p className="font-black text-hotel-dark">₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-3 sticky bottom-0">
         <button 
           onClick={() => navigate('/menu')}
           className="w-full bg-hotel-dark text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
         >
           Add More Items
         </button>
         
         {!session.billRequested && (
           <button 
             onClick={requestFinalBill}
             className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-100"
           >
             Request Final Bill
           </button>
         )}
         
         {session.billRequested && (
           <div className="bg-hotel-gold/10 border border-hotel-gold text-hotel-dark p-4 rounded-xl text-center">
              <p className="font-bold text-sm">Bill has been requested!</p>
              <p className="text-xs opacity-70">Please proceed to the counter for payment.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default RunningBill;
