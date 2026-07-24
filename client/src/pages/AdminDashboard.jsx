import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useHotel } from '../context/HotelContext';
import { ShieldCheck, Plus, Trash2, Edit, Save, X, Search, Utensils, QrCode, Download, ListTodo, Clock, Bell, Receipt, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@quickserve.com');
  const [password, setPassword] = useState('admin123');
  const [localMenuItems, setLocalMenuItems] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'categories', 'tables', 'cash', 'waiter', 'reviews'
  const [activeOrders, setActiveOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableHistory, setTableHistory] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableCount, setTableCount] = useState(15);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrTableNum, setQrTableNum] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [analytics, setAnalytics] = useState({ avgPrepTime: 0, delayedCount: 0, delayedOrders: [], peakHours: [] });

  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'North Indian', imageUrl: '', preparationTime: 10 });
  const [catFormData, setCatFormData] = useState({ name: '', imageUrl: '', order: 0 });

  const [activeSessions, setActiveSessions] = useState([]);
  const [waiterRequests, setWaiterRequests] = useState([]);
  const [reviews, setReviews] = useState([]);

  const { API_URL, fetchMenu, fetchCategories, socket } = useHotel();

  const getHeaders = () => {
    return { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.user.role !== 'admin') throw new Error('Not an admin');
      localStorage.setItem('admin_token', res.data.token);
      setIsLoggedIn(true);
      loadItems();
    } catch (err) {
      alert('Admin login failed. Check credentials.');
    }
  };

  const loadItems = async () => {
    try {
      const [menuRes, catRes, orderRes, sessionRes, waiterRes, reviewRes] = await Promise.all([
        axios.get(`${API_URL}/admin/menu`, getHeaders()),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/orders/kitchen/queue`, getHeaders()),
        axios.get(`${API_URL}/orders/admin/active-sessions`, getHeaders()),
        axios.get(`${API_URL}/tables/waiter-calls/active`, getHeaders()).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/reviews`, getHeaders()).catch(() => ({ data: [] }))
      ]);
      setLocalMenuItems(menuRes.data);
      setLocalCategories(catRes.data);
      setActiveOrders(orderRes.data);
      setActiveSessions(sessionRes.data);
      setWaiterRequests(waiterRes.data);
      setReviews(reviewRes.data);
    } catch (err) {
      console.error('loadItems error:', err);
    }

    try {
      const analyticsRes = await axios.get(`${API_URL}/admin/analytics`, getHeaders());
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.warn('Analytics failed to load (non-critical):', err.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      loadItems();
    }

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const editId = params.get('edit');

    if (tabParam) setActiveTab(tabParam);

    if (editId) {
      const checkAndEdit = async () => {
        const menuItems = await axios.get(`${API_URL}/menu`);
        const catItems = await axios.get(`${API_URL}/categories`);

        if (tabParam === 'categories') {
          const cat = catItems.data.find(c => c._id === editId);
          if (cat) startEditCat(cat);
        } else {
          const item = menuItems.data.find(i => i._id === editId);
          if (item) startEdit(item);
        }
      };
      checkAndEdit();
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('waiter_called', (req) => {
        setWaiterRequests(prev => [...prev, req]);
        new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-back-2575.mp3').play().catch(e => console.log(e));
      });
      socket.on('waiter_call_updated', (req) => {
        if (req.status === 'Completed') {
          setWaiterRequests(prev => prev.filter(r => r._id !== req._id));
        } else {
          setWaiterRequests(prev => prev.map(r => r._id === req._id ? req : r));
        }
      });
      socket.on('bill_requested', (session) => {
        setActiveSessions(prev => prev.map(s => s.sessionId === session.sessionId ? session : s));
        new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-back-2575.mp3').play().catch(e => console.log(e));
      });
      socket.on('new_review', (review) => {
        setReviews(prev => [review, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('waiter_called');
        socket.off('waiter_call_updated');
        socket.off('bill_requested');
        socket.off('new_review');
      }
    };
  }, [socket]);

  // General Actions
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/admin/menu/${id}`, getHeaders());
      loadItems();
      fetchMenu();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/menu/${editingId}`, formData, getHeaders());
      } else {
        await axios.post(`${API_URL}/admin/menu`, formData, getHeaders());
      }
      setIsAdding(false);
      setEditingId(null);
      loadItems();
      fetchMenu();
      alert('Menu item updated successfully! ✨');
      setFormData({ name: '', description: '', price: '', category: 'North Indian', imageUrl: '', preparationTime: 10 });
    } catch (err) {
      alert('Failed to save item.');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`${API_URL}/admin/categories/${id}`, getHeaders());
      loadItems();
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/admin/categories/${editingId}`, catFormData, getHeaders());
      } else {
        await axios.post(`${API_URL}/admin/categories`, catFormData, getHeaders());
      }
      setIsAddingCat(false);
      setEditingId(null);
      loadItems();
      fetchCategories();
      alert('Category updated successfully! ✨');
      setCatFormData({ name: '', imageUrl: '', order: 0 });
    } catch (err) {
      alert('Failed to save category.');
    }
  };

  const fetchTableHistory = async (tableNum) => {
    try {
      const res = await axios.get(`${API_URL}/orders/table-history/${tableNum}`, getHeaders());
      setTableHistory(res.data);
      setSelectedTable(tableNum);
      setIsHistoryOpen(true);
    } catch (err) {
      alert('Failed to fetch table history');
    }
  };

  const confirmCashPayment = async (orderId) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/confirm-payment`, {}, getHeaders());
      alert('Payment confirmed! Kitchen notified.');
      loadItems();
    } catch (err) {
      alert('Failed to confirm payment');
    }
  };

  const settleSession = async (sessionId) => {
    try {
      await axios.post(`${API_URL}/orders/session/${sessionId}/confirm-payment`, {}, getHeaders());
      alert('Session settled and closed successfully! ✨');
      loadItems();
    } catch (err) {
      alert('Failed to settle session');
    }
  };

  const completeWaiterRequest = async (id) => {
    try {
      await axios.put(`${API_URL}/tables/waiter-call/${id}/status`, { status: 'Completed' }, getHeaders());
      setWaiterRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to update request');
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await axios.delete(`${API_URL}/reviews/${id}`, getHeaders());
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const startEdit = (item) => {
    setFormData(item);
    setEditingId(item._id);
    setIsAdding(true);
  };

  const startEditCat = (cat) => {
    setCatFormData(cat);
    setEditingId(cat._id);
    setIsAddingCat(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-[#111]">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="bg-[#1a1a1a] p-10 rounded-[2.5rem] w-full max-w-[440px] luxury-shadow border border-white/10"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-hotel-gold to-[#997a15] text-black p-4 rounded-full shadow-lg shadow-hotel-gold/20">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-playfair font-black text-center text-gradient-gold mb-2">Admin Portal</h2>
          <p className="text-gray-400 text-center text-[15px] mb-8 font-medium">Headquarters</p>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl outline-none focus:border-hotel-gold font-medium transition-colors" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Admin Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl outline-none focus:border-hotel-gold font-medium transition-colors" />
            </div>
            <button type="submit" className="w-full bg-hotel-gold text-black p-4 rounded-xl font-bold tracking-widest uppercase hover:bg-[#b8952a] transition-all mt-4 font-outfit shadow-xl shadow-hotel-gold/10">
              SECURE LOGIN
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  const filteredItems = localMenuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCategories = localCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#111] text-white font-outfit pb-20" style={{ backgroundImage: 'radial-gradient(circle at top right, #1a1a1a, #0b0b0b)' }}>
      {/* Navbar */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col lg:flex-row justify-between items-center gap-4">

          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hotel-gold to-[#997a15] text-black p-3 rounded-2xl shadow-lg">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h1 className="font-playfair font-black text-2xl text-gradient-gold">
                Admin Control
              </h1>

              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                System Online
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">

            <div className="w-full lg:w-auto overflow-x-auto">
              <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex w-max">
                {[
                  { id: "items", label: "Food Items" },
                  { id: "categories", label: "Categories" },
                  { id: "tables", label: "Tables" },
                  { id: "cash", label: "Bills & Cash" },
                  { id: "waiter", label: "Waiter Req" },
                  { id: "reviews", label: "Reviews" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id
                      ? "bg-hotel-gold text-black"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "tables" ? (
              <button
                onClick={() => setTableCount(prev => prev + 1)}
                className="w-full lg:w-auto bg-white/10 px-5 py-3 rounded-xl"
              >
                <Plus size={16} /> Add Table
              </button>
            ) : (
              <button
                onClick={loadItems}
                className="w-full lg:w-auto bg-white/10 px-5 py-3 rounded-xl"
              >
                Refresh
              </button>
            )}

          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-10">
        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center">
            <div className="w-12 h-12 bg-hotel-gold/10 text-hotel-gold rounded-full flex items-center justify-center mb-4"><Utensils size={24} /></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Total Items</p>
            <p className="text-4xl font-playfair font-black text-white">{localMenuItems.length}</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center">
            <div className="w-12 h-12 bg-hotel-gold/10 text-hotel-gold rounded-full flex items-center justify-center mb-4"><Receipt size={24} /></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Active Bills</p>
            <p className="text-4xl font-playfair font-black text-white">{activeSessions.length}</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center border-orange-500/30">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4"><Clock size={24} /></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Delayed Orders</p>
            <p className="text-4xl font-playfair font-black text-orange-500">{analytics.delayedCount}</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-center">
            <div className="w-12 h-12 bg-hotel-gold/10 text-hotel-gold rounded-full flex items-center justify-center mb-4"><Star size={24} /></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Avg Rating</p>
            <p className="text-4xl font-playfair font-black text-white">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.overall, 0) / reviews.length).toFixed(1) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden relative">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="text-2xl font-playfair font-bold text-white">
              {activeTab === 'items' ? 'Menu Database' : activeTab === 'categories' ? 'Category Setup' : activeTab === 'tables' ? 'Table Manager' : activeTab === 'cash' ? 'Billing & Cash Desk' : activeTab === 'waiter' ? 'Waiter Requests' : 'Customer Reviews'}
            </h2>
            {(activeTab === 'items' || activeTab === 'categories') && (
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hotel-gold" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-hotel-gold text-sm text-white transition-colors"
                />
              </div>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-auto min-h-[500px]">
            {/* Render Content Based on Active Tab */}
            {activeTab === 'items' && (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest pl-8">Image</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest">Details</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest">Category</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest">Pricing & Status</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-5 pl-8">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                      </td>
                      <td className="p-5">
                        <p className="font-playfair font-bold text-white text-lg">{item.name}</p>
                        <p className="text-gray-400 text-sm truncate max-w-[200px]">{item.description}</p>
                      </td>
                      <td className="p-5 text-gray-300 font-medium text-sm">{item.category}</td>
                      <td className="p-5">
                        <p className="font-playfair text-xl text-hotel-gold font-bold">₹{item.price}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${item.isAvailable ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right space-x-3">
                        <button onClick={() => startEdit(item)} className="p-2.5 bg-white/5 text-hotel-gold rounded-xl hover:bg-hotel-gold hover:text-black border border-white/10 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'categories' && (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest pl-8">Image</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest">Name</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest">Order</th>
                    <th className="p-5 text-xs font-bold text-hotel-gold uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(cat => (
                    <tr key={cat._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-5 pl-8">
                        <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 object-cover rounded-full border border-white/10" />
                      </td>
                      <td className="p-5 font-playfair font-bold text-white text-lg">{cat.name}</td>
                      <td className="p-5"><span className="bg-white/10 px-3 py-1 rounded-lg text-sm">#{cat.order}</span></td>
                      <td className="p-5 pr-8 text-right space-x-3">
                        <button onClick={() => startEditCat(cat)} className="p-2.5 bg-white/5 text-hotel-gold rounded-xl hover:bg-hotel-gold hover:text-black border border-white/10 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteCat(cat._id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tables' && (
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(tableCount)].map((_, i) => {
                  const tableNum = i + 1;
                  const session = activeSessions.find(s => s.tableNumber === tableNum);
                  return (
                    <div key={tableNum} className={`p-6 rounded-[2rem] border transition-all relative text-center flex flex-col items-center justify-center ${session ? 'bg-hotel-gold/10 border-hotel-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${session ? 'text-hotel-gold' : 'text-gray-400'}`}>Table</span>
                      <span className={`text-4xl font-playfair font-black mb-4 ${session ? 'text-hotel-gold text-gradient-gold' : 'text-white'}`}>{tableNum}</span>
                      {session ? (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-black bg-hotel-gold px-2 py-0.5 rounded uppercase tracking-widest inline-block mb-1">Occupied</p>
                          <p className="text-white font-bold text-sm mt-1">₹{session.runningTotal}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Available</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setQrTableNum(tableNum); setIsQRModalOpen(true); }} className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-hotel-gold transition-colors" title="View QR"><QrCode size={16} /></button>
                        <button onClick={() => fetchTableHistory(tableNum)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-hotel-gold transition-colors" title="History"><ListTodo size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'cash' && (
              <div className="p-8 space-y-12">
                <div>
                  <h3 className="font-playfair text-2xl text-hotel-gold mb-6 border-b border-white/10 pb-4">Bill Requests & Active Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.length === 0 ? <p className="text-gray-500 col-span-full">No active sessions.</p> : activeSessions.map(session => (
                      <div key={session._id} className={`p-6 rounded-[2rem] border flex flex-col relative overflow-hidden ${session.billRequested ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'border-white/10 bg-white/5'}`}>
                        {session.billRequested && <div className="absolute top-0 right-0 bg-orange-500 text-black px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl animate-pulse">Bill Requested</div>}
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Session</p>
                            <p className="font-mono text-sm text-white">{session.sessionId}</p>
                          </div>
                          <div className="w-12 h-12 bg-black text-hotel-gold border border-hotel-gold/30 rounded-full flex items-center justify-center font-playfair font-bold text-xl">{session.tableNumber}</div>
                        </div>
                        <div className="mb-6">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Running Total</p>
                          <p className="font-playfair text-3xl font-bold text-white">₹{session.runningTotal.toFixed(2)}</p>
                          <p className="text-sm text-gray-500 mt-1">{session.orders.length} orders placed</p>
                        </div>
                        <button onClick={() => settleSession(session.sessionId)} className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest mt-auto transition-colors ${session.billRequested ? 'bg-orange-500 text-black hover:bg-orange-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                          Settle & Close session
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'waiter' && (
              <div className="p-8">
                <div className="grid grid-cols-1 gap-4">
                  {waiterRequests.length === 0 ? <p className="text-gray-500 text-center py-10">No pending waiter requests.</p> : waiterRequests.map(req => (
                    <div key={req._id} className="p-6 rounded-[2rem] border border-red-500/30 bg-red-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center font-playfair font-black text-2xl shadow-lg shadow-red-500/30">
                          {req.tableNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-white text-lg">{req.requestType}</p>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse border border-red-500/50 px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          <p className="text-gray-400 text-sm">Requested at {new Date(req.requestedAt).toLocaleTimeString()}</p>
                          {req.message && <p className="text-gray-300 mt-2 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-sm">"{req.message}"</p>}
                        </div>
                      </div>
                      <button onClick={() => completeWaiterRequest(req._id)} className="bg-green-500 text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all text-xs">
                        Mark Completed
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.length === 0 ? <p className="col-span-full text-center py-10 text-gray-500">No reviews yet.</p> : reviews.map(rev => (
                    <div key={rev._id} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col">
                      <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className={i <= rev.overall ? 'text-hotel-gold fill-hotel-gold' : 'text-gray-700'} />)}
                        </div>
                        <p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-bold text-gray-400 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p>Food: <span className="text-white ml-2">{rev.foodQuality}/5</span></p>
                        <p>Taste: <span className="text-white ml-2">{rev.taste}/5</span></p>
                        <p>Service: <span className="text-white ml-2">{rev.service}/5</span></p>
                        <p>Ambiance: <span className="text-white ml-2">{rev.ambience}/5</span></p>
                      </div>
                      <div className="flex-1 mb-6">
                        <p className="text-gray-300 text-sm italic">"{rev.comment || 'No comment provided'}"</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        {rev.tableNumber && <span className="text-[10px] text-gray-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">Table {rev.tableNumber}</span>}
                        <button onClick={() => deleteReview(rev._id)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Item Modal Settings Form (Shortened for brevity) */}
      <AnimatePresence>
        {(isAdding || isAddingCat) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] rounded-[2.5rem] w-full max-w-2xl border border-white/10 luxury-shadow"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-playfair font-bold text-2xl text-white">{editingId ? 'Edit Record' : 'Create Record'}</h3>
                <button onClick={() => { setIsAdding(false); setIsAddingCat(false); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={isAdding ? handleSave : handleSaveCat} className="p-8 space-y-5">
                {isAdding ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                        <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                        <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Price</label>
                        <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Image URL</label>
                        <input required type="text" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category Name</label>
                      <input required type="text" value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Image URL</label>
                      <input required type="text" value={catFormData.imageUrl} onChange={e => setCatFormData({ ...catFormData, imageUrl: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Order Index</label>
                      <input required type="number" value={catFormData.order} onChange={e => setCatFormData({ ...catFormData, order: e.target.value })} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-hotel-gold" />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-hotel-gold text-black p-4 rounded-xl font-bold uppercase tracking-widest mt-6 hover:bg-[#b8952a] active:scale-95 transition-all">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal left minimal */}
      <AnimatePresence>
        {isQRModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-[#1a1a1a] p-10 rounded-[3rem] border border-hotel-gold/30 text-center relative luxury-shadow">
              <button onClick={() => setIsQRModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={20} /></button>
              <h3 className="font-playfair text-3xl text-hotel-gold mb-2">Table {qrTableNum}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-8">Scan to order Menu</p>
              <div className="bg-white p-4 rounded-3xl inline-block mb-8">
                <QRCodeCanvas id="table-qr" value={`${window.location.origin}/menu?table=${qrTableNum}`} size={200} />
              </div>
              <button onClick={() => {
                const canvas = document.getElementById('table-qr');
                const url = canvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.download = `Table_${qrTableNum}.png`;
                link.href = url;
                link.click();
              }} className="w-full bg-hotel-gold px-8 py-4 rounded-full font-bold text-black uppercase tracking-widest">Download QR</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col luxury-shadow">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-playfair text-2xl text-hotel-gold">Table {selectedTable} Daily Log</h3>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 hidden-scrollbar">
                {tableHistory.length === 0 ? <p className="text-gray-500 text-center py-10">No orders for today.</p> : tableHistory.map(order => (
                  <div key={order._id} className="p-5 border border-white/10 rounded-2xl bg-white/5">
                    <div className="flex justify-between mb-3 border-b border-white/5 pb-2">
                      <p className="text-white font-bold text-sm">Order {order.orderId}</p>
                      <p className="text-hotel-gold font-bold">₹{order.totalAmount}</p>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-400">
                          <p>{item.quantity}x {item.name}</p>
                          <p>₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Sales</p>
                  <p className="font-playfair text-2xl font-bold text-white">₹{tableHistory.reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
