import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { CheckCircle, Clock, ChefHat, CheckSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const SuccessPage = () => {
  const { currentOrder, socket, tableNumber, API_URL } = useHotel();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState(currentOrder?.orderStatus || 'Paid');
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!currentOrder) {
      navigate('/');
      return;
    }

    if (currentOrder.paymentMethod === 'Cash') {
      fetchSession();
    }

    if (socket) {
      socket.on('order_status_changed', (updatedOrder) => {
        if (updatedOrder.orderId === currentOrder.orderId) {
          setOrderStatus(updatedOrder.orderStatus);
        }
      });
      socket.on('session_updated', (updatedSession) => {
        if (updatedSession.tableNumber === parseInt(tableNumber)) {
          setSession(updatedSession);
        }
      });
      socket.on('session_closed', () => {
        setSession(null);
        navigate('/review');
      });
    }

    return () => {
      if (socket) {
        socket.off('order_status_changed');
        socket.off('session_updated');
        socket.off('session_closed');
      }
    };
  }, [currentOrder, socket, navigate, tableNumber]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/table-session/${tableNumber}`);
      const data = await res.json();
      if (data) setSession(data);
    } catch (err) {
      console.error('Failed to fetch session:', err);
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
      localStorage.removeItem('quickserve_table');
      navigate('/');
    } catch (err) {
      alert('Failed to request bill');
    }
  };

  if (!currentOrder) return null;

  const steps = [
    { status: 'Paid', title: 'Order Placed', icon: CheckCircle },
    { status: 'Preparing', title: 'Preparing Food', icon: ChefHat },
    { status: 'Ready', title: 'Ready to Serve', icon: CheckSquare }
  ];

  const currentStepIndex = steps.findIndex(s => s.status === orderStatus);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="min-h-screen bg-hotel-dark/80 backdrop-blur-sm text-white p-6 flex flex-col items-center justify-center relative">
      <div className="w-full max-w-sm relative z-10">
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="w-24 h-24 bg-hotel-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(45,74,34,0.6)]"
        >
          <CheckCircle size={48} className="text-white" strokeWidth={2.5} />
        </motion.div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {currentOrder.paymentMethod === 'Cash' ? 'Order Placed!' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-400">
            {currentOrder.paymentMethod === 'Cash' 
              ? 'This item has been added to your running bill.' 
              : 'Order successfully sent to kitchen.'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Token / Order ID</p>
              <p className="font-mono font-bold text-lg text-hotel-gold">
                #{currentOrder.tokenNumber} <span className="text-xs text-gray-500 ml-2">({currentOrder.orderId})</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Table</p>
              <p className="font-bold text-xl">{currentOrder.tableNumber}</p>
            </div>
          </div>

          {currentOrder.paymentMethod === 'Cash' && session && (
            <div className="mb-6 p-4 bg-hotel-gold/10 border border-hotel-gold/30 rounded-2x">
               <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold text-hotel-gold uppercase tracking-widest">Running Bill Total</p>
                  {session.billRequested && (
                    <span className="text-[8px] bg-hotel-gold text-hotel-dark px-1.5 py-0.5 rounded font-black animate-pulse">BILL REQUESTED</span>
                  )}
               </div>
               <p className="text-3xl font-black text-white">₹{session.runningTotal.toFixed(2)}</p>
               <p className="text-[10px] text-gray-400 mt-1">{session.orders.length} orders in this session</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-hotel-gold/10 border border-hotel-gold/30 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-hotel-gold text-hotel-dark rounded-xl">
                <Clock size={20} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-hotel-gold uppercase tracking-widest">Estimated Wait</p>
                <p className="text-lg font-black text-white">~ {currentOrder.predictedTime || 10} minutes</p>
             </div>
          </div>

          <div className="space-y-6 mt-6">
            <h3 className="font-bold text-sm tracking-wide text-gray-300">LIVE STATUS</h3>
            
            <div className="relative border-l-2 border-gray-700 ml-3 space-y-8 pl-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === activeIndex;
                const isPassed = idx < activeIndex;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-colors ${
                      isActive || isPassed ? 'bg-hotel-gold border-hotel-gold text-hotel-dark' : 'bg-hotel-dark border-gray-600 text-gray-600'
                    }`}>
                      {isPassed ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <div>
                      <p className={`font-bold ${isActive ? 'text-white text-lg' : 'text-gray-500'}`}>{step.title}</p>
                      {isActive && idx !== 2 && (
                        <p className="text-xs text-hotel-gold flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-hotel-gold animate-ping"></div> In Progress...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/menu')}
            className="w-full bg-hotel-gold text-hotel-dark py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-hotel-gold/20"
          >
            Add More Items
          </button>
          
          {currentOrder.paymentMethod === 'Cash' && session && (
            <>
              <button 
                onClick={() => navigate('/running-bill')}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors border border-white/20 text-sm uppercase tracking-widest"
              >
                View Running Bill
              </button>
              
              {!session.billRequested && (
                <button 
                  onClick={requestFinalBill}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-4 rounded-xl font-bold transition-colors border border-red-500/20 text-sm uppercase tracking-widest"
                >
                  Request Final Bill
                </button>
              )}
            </>
          )}

          <button 
            onClick={() => navigate('/review')}
            className="w-full bg-white/10 hover:bg-white/20 text-hotel-gold py-4 rounded-xl font-bold transition-colors border border-hotel-gold/30 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Star size={18} className="fill-hotel-gold text-hotel-gold" />
            Rate Experience / Leave Review
          </button>

          {(!session || currentOrder.paymentMethod !== 'Cash') && (
             <button 
              onClick={() => navigate('/menu')}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors border border-white/20"
            >
              Order Something Else
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SuccessPage;
