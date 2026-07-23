import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHotel } from '../context/HotelContext';
import { ChefHat, Clock, Bell, ListTodo, CheckCircle2, ArrowRight, Utensils, X, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('kitchen@quickserve.com');
  const [password, setPassword] = useState('kitchen123');
  const { socket, API_URL } = useHotel();

  const [menuItems, setMenuItems] = useState([]);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  const [currentTime, setCurrentTime] = useState(Date.now());
  const URGENT_THRESHOLD_MINS = 13;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('kitchen_token', res.data.token);
      setIsLoggedIn(true);
      fetchOrders(res.data.token);
      fetchMenu();
      if (socket) socket.emit('join_kitchen');
    } catch (err) {
      alert('Login failed. Check credentials.');
    }
  };

  const fetchOrders = async (token) => {
    try {
      const t = token || localStorage.getItem('kitchen_token');
      const res = await axios.get(`${API_URL}/orders/kitchen/queue`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) setIsLoggedIn(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('kitchen_token');
      const res = await axios.get(`${API_URL}/admin/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(res.data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('kitchen_token');
    if (token) {
      setIsLoggedIn(true);
      fetchOrders(token);
      fetchMenu();
      if (socket) socket.emit('join_kitchen');
    }

    if (socket) {
      socket.on('new_order', (order) => {
        setOrders(prev => {
          const newOrders = [...prev, order];
          return newOrders.sort((a,b) => {
            if (a.orderStatus !== b.orderStatus) {
               return a.orderStatus === 'Paid' ? -1 : 1; 
            }
            return a.priorityScore - b.priorityScore;
          });
        });
        new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-back-2575.mp3').play().catch(e=>console.log(e));
      });

      socket.on('order_updated', (updatedOrder) => {
        if (updatedOrder.orderStatus === 'Delivered') {
          setOrders(prev => prev.filter(o => o.orderId !== updatedOrder.orderId));
        } else {
          setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
        }
      });

      socket.on('menu_updated', (updatedItem) => {
        setMenuItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
      });

      socket.on('waiter_called', (req) => {
        alert(`Table ${req.tableNumber} Request: ${req.requestType}`);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('menu_updated');
        socket.off('waiter_called');
      }
    };
  }, [socket]);

  const toggleAvailability = async (itemId) => {
    try {
      const token = localStorage.getItem('kitchen_token');
      await axios.patch(`${API_URL}/admin/menu/${itemId}/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('kitchen_token');
      await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#111]" style={{ backgroundImage: 'radial-gradient(circle at top, #2a2a2a, #111)' }}>
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin} 
          className="bg-[#1a1a1a] p-10 rounded-[2.5rem] w-full max-w-[440px] luxury-shadow border border-white/10"
        >
          <div className="flex justify-center mb-6">
             <div className="bg-gradient-to-br from-hotel-gold to-[#997a15] text-black p-4 rounded-full shadow-lg shadow-hotel-gold/20">
                 <ChefHat size={36} strokeWidth={2.5} />
             </div>
          </div>
          <h2 className="text-3xl font-playfair font-black text-center text-gradient-gold mb-2">Kitchen Portal</h2>
          <p className="text-gray-400 text-center text-sm font-outfit mb-8">Culinary Command Center</p>
          
          <div className="space-y-4 font-outfit">
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Kitchen ID</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl outline-none focus:border-hotel-gold transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl outline-none focus:border-hotel-gold transition-colors"
              />
            </div>
            <button type="submit" className="w-full bg-hotel-gold text-black p-4 rounded-xl font-bold tracking-widest uppercase hover:bg-[#b8952a] active:scale-95 transition-all mt-4 font-outfit shadow-xl shadow-hotel-gold/10">
              Enter Kitchen
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  const preparingOrders = orders.filter(o => o.orderStatus === 'Preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'Ready');

  const rawNextOrders = orders.filter(o => o.orderStatus === 'Paid');
  const now = Date.now();

  const urgentOrders = [];
  const normalOrders = [];

  rawNextOrders.forEach(order => {
    const waitMins = (now - new Date(order.createdAt).getTime()) / 60000;
    if (waitMins >= URGENT_THRESHOLD_MINS) {
      urgentOrders.push(order);
    } else {
      normalOrders.push(order);
    }
  });

  urgentOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  normalOrders.sort((a, b) => {
    const waitA = (now - new Date(a.createdAt).getTime()) / 60000;
    const waitB = (now - new Date(b.createdAt).getTime()) / 60000;
    const scoreA = (a.predictedTime * 0.6) + (waitA * 0.4);
    const scoreB = (b.predictedTime * 0.6) + (waitB * 0.4);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const nextOrders = [...urgentOrders, ...normalOrders];

  const filteredMenuItems = menuItems.filter(item => {
    const searchStr = menuSearchTerm.toLowerCase();
    return (item.name || '').toLowerCase().includes(searchStr) || (item.category || '').toLowerCase().includes(searchStr);
  });

  const renderOrderCard = (order, isTopPriority) => {
    const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : currentTime;
    const timeAgo = Math.floor((currentTime - orderTime) / 60000);
    const isUrgent = timeAgo >= URGENT_THRESHOLD_MINS && order.orderStatus === 'Paid';
    const priorityScore = (order.predictedTime * 0.6) + (timeAgo * 0.4);
    const isDelayed = timeAgo > order.predictedTime && order.orderStatus === 'Preparing';

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        key={order.orderId}
        className={`glass-card rounded-[2rem] overflow-hidden transition-all duration-500 font-outfit ${
          isUrgent ? 'border-red-500 ring-2 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
          isTopPriority ? 'border-hotel-gold ring-2 ring-hotel-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/10'
        }`}
      >
        <div className={`px-5 py-4 border-b flex justify-between items-center ${
          isUrgent ? 'bg-red-500/10 border-red-500/20' :
          isTopPriority ? 'bg-hotel-gold/10 border-hotel-gold/20' :
          isDelayed ? 'bg-orange-500/10 border-orange-500/20' : 'bg-black/40 border-white/10'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
               {isUrgent && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">🔴 URGENT · {timeAgo}m</span>}
               {!isUrgent && isTopPriority && <span className="text-[9px] bg-hotel-gold text-black px-2 py-0.5 rounded-full font-black">⚡ NEXT UP</span>}
               {isDelayed && !isUrgent && <span className="text-[9px] bg-orange-500 text-black px-2 py-0.5 rounded-full font-black">SLOW</span>}
            </div>
            <p className="font-bold text-white tracking-wide">{order.orderId} {order.tokenNumber && <span className="text-hotel-gold ml-2">#{order.tokenNumber}</span>}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Location</p>
            <p className={`font-playfair font-black text-2xl ${ isUrgent ? 'text-red-500' : 'text-hotel-gold' }`}>Table {order.tableNumber}</p>
          </div>
        </div>

        {order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending' && (
          <div className="px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center">
             ⚠️ Cash Pending - Hold Delivery
          </div>
        )}
        {order.paymentMethod === 'Cash' && order.paymentStatus === 'PendingSettlement' && (
          <div className="px-5 py-2 bg-hotel-gold text-black text-[10px] font-black uppercase tracking-widest text-center">
             📋 Open Session
          </div>
        )}

        <div className="p-5 bg-black/20">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className={`p-3 rounded-2xl border ${
              isUrgent ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              isDelayed ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
              'bg-white/5 border-white/5 text-gray-300'
            }`}>
               <div className="flex items-center gap-1.5 mb-1 opacity-80">
                  <Clock size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Waited</p>
               </div>
               <p className="font-playfair text-xl font-bold">{timeAgo} min</p>
            </div>
            <div className="p-3 rounded-2xl border bg-white/5 border-white/5 text-white">
               <div className="flex items-center gap-1.5 mb-1 opacity-80 text-hotel-gold">
                  <Bell size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Priority</p>
               </div>
               <p className="font-playfair text-xl font-bold">{priorityScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="mb-6">
             <div className="flex justify-between items-center mb-3">
               <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Ordered Items</p>
               <p className="text-[10px] font-bold text-hotel-gold bg-hotel-gold/10 px-2 py-1 rounded-md border border-hotel-gold/20">ETA: {order.predictedTime}m</p>
             </div>
             <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-white/10 rounded-lg text-hotel-gold font-black text-xs flex items-center justify-center border border-white/5">
                      {item.quantity}
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">{item.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{item.categoryType || 'MAIN'}</p>
                    </div>
                  </div>
                </div>
              ))}
             </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            {order.orderStatus === 'Paid' ? (
             <button 
              onClick={() => updateStatus(order.orderId, 'Preparing')}
              className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                isUrgent
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20'
                  : 'bg-hotel-gold text-black hover:bg-[#b8952a] luxury-shadow'
              }`}
            >
              <ChefHat size={18} /> {isUrgent ? 'Start Urgent Order' : 'Start Prep'}
            </button>
            ) : order.orderStatus === 'Preparing' ? (
              <button 
                onClick={() => updateStatus(order.orderId, 'Ready')}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-green-500/20"
              >
                <CheckCircle2 size={18} /> Mark Ready
              </button>
            ) : order.orderStatus === 'Ready' ? (
              <button 
                onClick={() => {
                  if (order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending') {
                    alert('Payment must be confirmed at counter before delivery!');
                    return;
                  }
                  updateStatus(order.orderId, 'Delivered');
                }}
                className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                  (order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending')
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                    : 'bg-white text-black hover:bg-gray-200 luxury-shadow'
                }`}
              >
                {order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending' ? 'Waiting for Cash' : 'Served & Delivered'} <ArrowRight size={18} />
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111] font-outfit text-white" style={{ backgroundImage: 'radial-gradient(circle at top left, #1a1a1a, #0b0b0b)' }}>
      {/* Partner Navbar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-gradient-to-br from-hotel-gold to-[#997a15] text-black p-3 rounded-2xl shadow-lg shadow-hotel-gold/10">
                 <ChefHat size={28} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="font-playfair font-black text-2xl text-gradient-gold tracking-wider">Smart Kitchen</h1>
               <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-[0.2em] mt-1">
                 <Zap size={10} className="text-hotel-gold" /> AI Queue Live
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuModalOpen(true)}
              className="px-5 py-3 bg-white/5 border border-white/10 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-hotel-gold hover:text-black transition-colors"
            >
              <Utensils size={18} /> Manage Stock
            </button>
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-full flex items-center gap-2 font-bold text-gray-300 text-sm">
               <span className="text-hotel-gold font-black">{orders.length}</span> Active
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
        
        {/* Preparing Column */}
        <div className="flex flex-col bg-black/40 rounded-[2.5rem] border border-white/10 overflow-hidden glass-card">
          <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
                 <ChefHat size={24} />
               </div>
               <div>
                  <h3 className="font-playfair font-bold text-xl text-white tracking-wide">Cooking</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In the Kitchen</p>
               </div>
             </div>
             <span className="bg-orange-500 text-black font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-orange-500/20">
               {preparingOrders.length}
             </span>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-6">
            <AnimatePresence>
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <ChefHat size={48} className="mb-4 text-hotel-gold" />
                   <p className="font-playfair text-xl tracking-widest uppercase">Waiting...</p>
                </div>
              ) : (
                preparingOrders.map(o => renderOrderCard(o, false))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Incoming Column */}
        <div className="flex flex-col bg-black/40 rounded-[2.5rem] border border-hotel-gold/30 overflow-hidden glass-card shadow-[0_0_30px_rgba(212,175,55,0.05)] relative">
          <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-hotel-gold/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="p-6 pb-4 flex justify-between items-center border-b border-hotel-gold/20 bg-gradient-to-r from-hotel-gold/10 to-transparent relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-hotel-gold/20 text-hotel-gold border border-hotel-gold/20 flex items-center justify-center">
                 <Zap size={24} />
               </div>
               <div>
                  <h3 className="font-playfair font-bold text-xl text-white tracking-wide">Next Up</h3>
                  <p className="text-[10px] font-bold text-hotel-gold uppercase tracking-widest">AI Priority Queue</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               {urgentOrders.length > 0 && (
                 <span className="bg-red-600 text-white font-black px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase animate-pulse shadow-lg shadow-red-500/20">
                   {urgentOrders.length} Urgent
                 </span>
               )}
               <span className="bg-hotel-gold text-black font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-hotel-gold/20">
                 {nextOrders.length}
               </span>
             </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-6 relative z-10">
            <AnimatePresence>
              {nextOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <ListTodo size={48} className="mb-4 text-hotel-gold" />
                   <p className="font-playfair text-xl tracking-widest uppercase">Clear Queue</p>
                </div>
              ) : (
                nextOrders.map((o, idx) => renderOrderCard(o, idx === 0))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col bg-black/40 rounded-[2.5rem] border border-white/10 overflow-hidden glass-card">
          <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-green-500/10 to-transparent">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center">
                 <CheckCircle2 size={24} />
               </div>
               <div>
                  <h3 className="font-playfair font-bold text-xl text-white tracking-wide">Dispatch</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ready to Serve</p>
               </div>
             </div>
             <span className="bg-green-600 text-white font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-green-500/20">
               {readyOrders.length}
             </span>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-6">
            <AnimatePresence>
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                   <ArrowRight size={48} className="mb-4 text-hotel-gold" />
                   <p className="font-playfair text-xl tracking-widest uppercase">Nothing Ready</p>
                </div>
              ) : (
                readyOrders.map(o => renderOrderCard(o, false))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Menu Management Modal */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] rounded-[2.5rem] w-full max-w-2xl border border-white/10 max-h-[85vh] flex flex-col luxury-shadow"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-hotel-gold text-black rounded-2xl">
                      <Utensils size={24} />
                   </div>
                   <h3 className="font-playfair font-bold text-2xl text-white tracking-wide">Stock Management</h3>
                </div>
                <button onClick={() => setIsMenuModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hotel-gold" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search menu catalogue..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-hotel-gold text-white font-medium transition-colors"
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                {filteredMenuItems.map(item => (
                  <div key={item._id} className="p-5 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between hover:border-hotel-gold/50 transition-colors glass-card">
                    <div className="flex items-center gap-5">
                      <img src={item.imageUrl} alt={item.name} className={`w-16 h-16 object-cover rounded-xl border border-white/10 ${!item.isAvailable ? 'grayscale opacity-40' : ''}`} />
                      <div>
                        <p className={`font-playfair font-bold text-lg ${!item.isAvailable ? 'text-gray-500 line-through' : 'text-white'}`}>{item.name}</p>
                        <p className="text-[10px] font-bold text-hotel-gold uppercase tracking-[0.2em]">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!item.isAvailable && (
                        <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1.5 rounded-md uppercase tracking-widest border border-red-500/20">Hidden</span>
                      )}
                      <button 
                        onClick={() => toggleAvailability(item._id)}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          item.isAvailable 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' 
                          : 'bg-hotel-gold text-black hover:bg-[#b8952a]'
                        }`}
                      >
                        {item.isAvailable ? 'Hide Item' : 'Restore'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KitchenDashboard;
