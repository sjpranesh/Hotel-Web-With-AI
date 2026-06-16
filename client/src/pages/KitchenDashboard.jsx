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
  const URGENT_THRESHOLD_MINS = 13; // Orders waiting beyond this jump to top

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
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('menu_updated');
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin} 
          className="bg-white p-10 rounded-[2rem] w-full max-w-[440px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100"
        >
          <div className="flex justify-center mb-6">
             <div className="bg-[#7c3aed] text-white p-2.5 rounded-2xl rounded-tr-none rounded-bl-sm shadow-md">
                 <ChefHat size={32} strokeWidth={2.5} />
             </div>
          </div>
          <h2 className="text-2xl font-black text-center text-[#282c3f] mb-2 tracking-tight">Partner Dashboard</h2>
          <p className="text-[#686b78] text-center text-[15px] mb-8 font-medium">Manage your restaurant operations.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Email ID</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-300 text-[#282c3f] p-3.5 rounded-xl outline-none focus:border-[#7c3aed] transition-colors font-medium shadow-sm"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 text-[#282c3f] p-3.5 rounded-xl outline-none focus:border-[#7c3aed] transition-colors font-medium shadow-sm"
              />
            </div>
            <button type="submit" className="w-full bg-[#7c3aed] text-white p-4 rounded-xl font-bold tracking-wide hover:bg-[#6d28d9] transition-colors mt-2 shadow-[0_4px_14px_rgba(255,82,0,0.3)]">
              LOGIN TO PORTAL
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  const preparingOrders = orders.filter(o => o.orderStatus === 'Preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'Ready');

  // Smart Queue Logic:
  // 1. Orders waiting > 13 min → URGENT (always on top, sorted oldest-first)
  // 2. Remaining orders → sorted by AI priority score (predictedTime + waitTime weighted)
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

  // urgent: oldest wait first
  urgentOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // normal: AI priority score
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
    const nameStr = item.name ? item.name.toLowerCase() : '';
    const catStr = item.category ? item.category.toLowerCase() : '';
    const searchStr = menuSearchTerm ? menuSearchTerm.toLowerCase() : '';
    return nameStr.includes(searchStr) || catStr.includes(searchStr);
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
        className={`bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all duration-300 ${
          isUrgent ? 'border-red-400 ring-2 ring-red-100 shadow-red-50' :
          isTopPriority ? 'border-[#7c3aed] ring-2 ring-violet-100' : 'border-gray-200'
        }`}
      >
        <div className={`px-5 py-3 border-b flex justify-between items-center ${
          isUrgent ? 'bg-red-50 border-red-200' :
          isTopPriority ? 'bg-violet-50 border-violet-100' :
          isDelayed ? 'bg-orange-50 border-orange-100' : 'bg-gray-50/80 border-gray-100'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
               <p className="text-[11px] font-bold text-[#686b78] uppercase tracking-wider">Order ID</p>
               {isUrgent && (
                 <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                   🔴 URGENT · {timeAgo}m wait
                 </span>
               )}
               {!isUrgent && isTopPriority && (
                 <span className="text-[9px] bg-[#7c3aed] text-white px-1.5 py-0.5 rounded-full font-black">
                   ⚡ NEXT UP
                 </span>
               )}
               {isDelayed && !isUrgent && (
                 <span className="text-[9px] bg-orange-400 text-white px-1.5 py-0.5 rounded-full font-black">SLOW</span>
               )}
            </div>
            <p className="font-bold text-[#282c3f]">{order.orderId} {order.tokenNumber && <span className="text-hotel-gold ml-2">#{order.tokenNumber}</span>}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#686b78] uppercase tracking-wider">Location</p>
            <p className={`font-black text-xl ${ isUrgent ? 'text-red-500' : 'text-[#7c3aed]' }`}>Table {order.tableNumber}</p>
          </div>
        </div>

        {order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending' && (
          <div className="px-5 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">
             ⚠️ Cash Payment Pending - Do Not Deliver
          </div>
        )}
        {order.paymentMethod === 'Cash' && order.paymentStatus === 'PendingSettlement' && (
          <div className="px-5 py-2 bg-hotel-gold text-hotel-dark text-[10px] font-black uppercase tracking-[0.2em] text-center">
             📋 Cash - Running Bill Open
          </div>
        )}

        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-xl border ${
              isUrgent ? 'bg-red-50 border-red-200 text-red-600' :
              isDelayed ? 'bg-orange-50 border-orange-100 text-orange-600' :
              'bg-gray-50 border-gray-100 text-[#686b78]'
            }`}>
               <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Waited</p>
               </div>
               <p className="font-black text-base">{timeAgo} min</p>
            </div>
            <div className="p-3 rounded-xl border bg-gray-50 border-gray-100 text-[#282c3f]">
               <div className="flex items-center gap-1.5 mb-1">
                  <Bell size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Prio Score</p>
               </div>
               <p className="font-black text-base">{priorityScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="mb-4">
             <div className="flex justify-between items-center mb-2">
               <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Ordered Items</p>
               <p className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">ETA: {order.predictedTime}m</p>
             </div>
             <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#f0f0f5] rounded text-[#282c3f] font-bold text-[11px] flex items-center justify-center mt-0.5">
                      {item.quantity}
                    </div>
                    <div>
                        <p className="font-bold text-[#3d4152] text-sm leading-snug">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.categoryType || 'MAIN'}</p>
                    </div>
                  </div>
                </div>
              ))}
             </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            {order.orderStatus === 'Paid' ? (
             <button 
              onClick={() => updateStatus(order.orderId, 'Preparing')}
              className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs ${
                isUrgent
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 animate-pulse'
                  : 'bg-white border-2 border-[#7c3aed] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white'
              }`}
            >
              <ChefHat size={16} /> {isUrgent ? '🔴 START URGENT ORDER' : 'Accept & Start Prep'}
            </button>
            ) : order.orderStatus === 'Preparing' ? (
              <button 
                onClick={() => updateStatus(order.orderId, 'Ready')}
                className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs shadow-lg shadow-green-100"
              >
                <CheckCircle2 size={16} /> Mark Food Ready
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
                className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs ${
                  (order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending')
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-300'
                    : 'bg-[#282c3f] text-white hover:bg-black'
                }`}
              >
                {order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending' ? 'Waiting for Cash...' : 'Served & Delivered'} <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-[#f9fafb]">
      {/* Partner Navbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 h-[72px] flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-[#7c3aed] text-white p-1.5 rounded-xl">
                 <ChefHat size={24} strokeWidth={2.5} />
             </div>
             <div>
             <h1 className="font-black text-xl text-[#282c3f] tracking-tight">Smart Kitchen</h1>
                <p className="text-[10px] text-[#7c3aed] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap size={10} /> AI Queue · Urgent after 13 min
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-[#282c3f] flex items-center gap-2 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
            >
              <Utensils size={16} /> Stock
            </button>
            <div className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2 font-bold text-gray-600 text-xs">
               <span className="text-[#7c3aed] font-black">{orders.length}</span> active
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        
        {/* Preparing Column */}
        <div className="flex flex-col bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                 <ChefHat size={20} />
               </div>
               <div>
                  <h3 className="font-black text-[#282c3f]">Now Preparing</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">In the Kitchen</p>
               </div>
             </div>
             <span className="bg-orange-500 text-white font-black px-3 py-1 rounded-full text-xs">
               {preparingOrders.length}
             </span>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-5">
            <AnimatePresence>
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ChefHat size={32} />
                   </div>
                   <p className="font-bold text-gray-500">Wait for next order</p>
                </div>
              ) : (
                preparingOrders.map(o => renderOrderCard(o, false))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Incoming/Queue Column */}
        <div className="flex flex-col bg-white rounded-[2rem] border border-[#7c3aed]/20 overflow-hidden shadow-sm">
          <div className="p-6 pb-4 flex justify-between items-center border-b bg-violet-50/40 border-violet-100/60">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#7c3aed] flex items-center justify-center">
                 <Zap size={20} />
               </div>
               <div>
                  <h3 className="font-black text-[#282c3f]">Next Orders</h3>
                  <p className="text-[10px] font-black text-[#7c3aed] uppercase tracking-wider">
                    ⚡ AI Queue · 🔴 Urgent after 13m
                  </p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               {urgentOrders.length > 0 && (
                 <span className="bg-red-500 text-white font-black px-2 py-1 rounded-full text-[10px] animate-pulse">
                   {urgentOrders.length} urgent
                 </span>
               )}
               <span className="bg-[#7c3aed] text-white font-black px-3 py-1 rounded-full text-xs">
                 {nextOrders.length}
               </span>
             </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-5">
            <AnimatePresence>
              {nextOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ListTodo size={32} />
                   </div>
                   <p className="font-bold text-gray-500">No pending orders</p>
                </div>
              ) : (
                nextOrders.map((o, idx) => renderOrderCard(o, idx === 0))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-100 bg-green-50/30">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                 <CheckCircle2 size={20} />
               </div>
               <div>
                  <h3 className="font-black text-[#282c3f]">Ready to Serve</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Quality Checked</p>
               </div>
             </div>
             <span className="bg-green-600 text-white font-black px-3 py-1 rounded-full text-xs">
               {readyOrders.length}
             </span>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-5">
            <AnimatePresence>
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ArrowRight size={32} />
                   </div>
                   <p className="font-bold text-gray-500">Nothing ready yet</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#7c3aed] text-white rounded-xl">
                      <Utensils size={20} />
                   </div>
                   <h3 className="font-black text-xl text-[#282c3f]">Menu Availability</h3>
                </div>
                <button onClick={() => setIsMenuModalOpen(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search menu items or categories..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#7c3aed] transition-colors font-medium"
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
                {filteredMenuItems.map(item => (

                  <div key={item._id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.name} className={`w-12 h-12 object-cover rounded-xl shadow-sm ${!item.isAvailable ? 'grayscale opacity-50' : ''}`} />
                      <div>
                        <p className={`font-bold text-sm ${!item.isAvailable ? 'text-gray-400 line-through' : 'text-[#282c3f]'}`}>{item.name}</p>
                        <p className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!item.isAvailable && (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded uppercase tracking-tighter border border-red-100">Hidden</span>
                      )}
                      <button 
                        onClick={() => toggleAvailability(item._id)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          item.isAvailable 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {item.isAvailable ? 'Hide Item' : 'Show Item'}
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
