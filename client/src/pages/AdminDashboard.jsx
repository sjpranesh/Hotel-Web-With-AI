import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useHotel } from '../context/HotelContext';
import { ShieldCheck, Plus, Trash2, Edit, Save, X, Search, Utensils, QrCode, Download, ListTodo, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@quickserve.com');
  const [password, setPassword] = useState('admin123');
  const [localMenuItems, setLocalMenuItems] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'categories', 'tables', or 'cash'
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

  const { API_URL, fetchMenu, fetchCategories } = useHotel();

  // Login handler
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
      const token = localStorage.getItem('admin_token');
      const [menuRes, catRes, orderRes, sessionRes] = await Promise.all([
        axios.get(`${API_URL}/admin/menu`, getHeaders()),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/orders/kitchen/queue`, getHeaders()),
        axios.get(`${API_URL}/orders/admin/active-sessions`, getHeaders())
      ]);
      setLocalMenuItems(menuRes.data);
      setLocalCategories(catRes.data);
      setActiveOrders(orderRes.data);
      setActiveSessions(sessionRes.data);
    } catch (err) {
      console.error('loadItems error:', err);
    }

    // Load analytics separately so a failure doesn't break the whole dashboard
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

    // Handle incoming edit requests from Menu Page
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const editId = params.get('edit');

    if (tabParam) setActiveTab(tabParam);
    
    if (editId) {
      const checkAndEdit = async () => {
        // Wait for items to load if they haven't yet
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

  const getHeaders = () => {
    return { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } };
  };

  const handleDelete = async (id) => {


    if(!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/admin/menu/${id}`, getHeaders());
      loadItems();
      fetchMenu(); // update context
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
      await loadItems();
      await fetchMenu(); // update context
      alert('Menu item updated successfully! ✨');
      setFormData({ name: '', description: '', price: '', category: 'South Indian', imageUrl: '', preparationTime: 10 });
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save item. Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCat = async (id) => {
    if(!window.confirm('Are you sure you want to delete this category?')) return;
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
      await loadItems();
      await fetchCategories();
      alert('Category updated successfully! ✨');
      setCatFormData({ name: '', imageUrl: '', order: 0 });
    } catch (err) {
      console.error('Save category error:', err);
      alert('Failed to save category. Error: ' + (err.response?.data?.message || err.message));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin} 
          className="bg-white p-10 rounded-[2rem] w-full max-w-[440px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100"
        >
          <div className="flex justify-center mb-6">
             <div className="bg-black text-white p-3 rounded-2xl shadow-md border-b-4 border-gray-700">
                 <ShieldCheck size={36} strokeWidth={2.5} />
             </div>
          </div>
          <h2 className="text-2xl font-black text-center text-[#282c3f] mb-2 tracking-tight">Admin Portal</h2>
          <p className="text-[#686b78] text-center text-[15px] mb-8 font-medium">Manage catalog and operations.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-gray-300 text-[#282c3f] p-3.5 rounded-xl outline-none focus:border-black font-medium shadow-sm" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Admin Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-gray-300 text-[#282c3f] p-3.5 rounded-xl outline-none focus:border-black font-medium shadow-sm" />
            </div>
            <button type="submit" className="w-full bg-black text-white p-4 rounded-xl font-bold tracking-wide hover:bg-gray-800 transition-colors mt-2">
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
    <div className="min-h-screen bg-[#f3f4f6] font-sans pb-20">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-black text-white p-1.5 rounded-xl">
                 <ShieldCheck size={28} />
             </div>
             <div>
                <h1 className="font-black text-xl text-[#282c3f] tracking-tight">Admin Control Center</h1>
                <p className="text-[11px] text-[#60b246] font-bold uppercase tracking-wide">System Online</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="bg-gray-100 p-1 rounded-xl flex mr-4">
               <button 
                onClick={() => setActiveTab('items')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'items' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Food Items
               </button>
               <button 
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Categories
               </button>
               <button 
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tables' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Tables
               </button>
               <button 
                onClick={() => setActiveTab('cash')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'cash' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Cash Desk
               </button>
            </div>
            
             {activeTab === 'tables' ? (
               <button 
                 onClick={() => setTableCount(prev => prev + 1)}
                 className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide hover:bg-[#6d28d9] flex items-center gap-2 shadow-lg transition-transform active:scale-95"
               >
                 <Plus size={18} /> Add New Table
               </button>
             ) : activeTab === 'cash' ? (
               <button 
                 onClick={loadItems}
                 className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide hover:bg-green-700 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
               >
                 Refresh Queue
               </button>
             ) : (
               <button 
                 onClick={() => {
                   setEditingId(null);
                   if (activeTab === 'items') {
                     setIsAdding(true);
                     setFormData({ name: '', description: '', price: '', category: 'North Indian', imageUrl: '', preparationTime: 10 });
                   } else {
                     setIsAddingCat(true);
                     setCatFormData({ name: '', imageUrl: '', order: localCategories.length + 1 });
                   }
                 }}
                 className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide hover:bg-[#6d28d9] flex items-center gap-2 shadow-lg transition-transform active:scale-95"
               >
                 <Plus size={18} /> New {activeTab === 'items' ? 'Menu Item' : 'Category'}
               </button>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 mt-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-violet-50 text-[#7c3aed] rounded-xl"><Utensils size={28} /></div>
              <div>
                <p className="text-[#686b78] font-bold text-sm uppercase tracking-wide mb-1">Total Items</p>
                <p className="text-3xl font-black text-[#282c3f]">{localMenuItems.length}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-[#7c3aed] transition-colors" onClick={() => setActiveTab('categories')}>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Search size={28} /></div>
              <div>
                <p className="text-[#686b78] font-bold text-sm uppercase tracking-wider mb-1">Categories</p>
                <p className="text-3xl font-black text-[#282c3f]">{localCategories.length}</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><Clock size={28} /></div>
              <div>
                <p className="text-[#686b78] font-bold text-sm uppercase tracking-wider mb-1">Avg Prep Time</p>
                <p className="text-3xl font-black text-[#282c3f]">{analytics.avgPrepTime} <small className="text-sm">min</small></p>
              </div>
           </div>
        </div>

        {/* AI Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
           {/* Delayed Orders */}
           <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="font-black text-xl text-[#282c3f]">Delay Analysis</h3>
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Efficiency Bottlenecks</p>
                 </div>
                 <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs">
                   {analytics.delayedCount} Delayed
                 </span>
              </div>
              
              <div className="space-y-4 flex-1">
                 {analytics.delayedOrders.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <ShieldCheck size={40} className="mb-2 text-green-500" />
                      <p className="font-bold">No delays detected!</p>
                   </div>
                 ) : (
                   analytics.delayedOrders.map(order => (
                     <div key={order.orderId} className="flex justify-between items-center p-4 bg-red-50/50 border border-red-50 rounded-2xl">
                        <div>
                           <p className="font-bold text-[#282c3f] text-sm">{order.orderId}</p>
                           <p className="text-[10px] font-bold text-gray-400">Target: {order.predicted}m | Actual: {order.actual}m</p>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-red-600">+{order.delay} min</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>

           {/* Peak Hours */}
           <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="font-black text-xl text-[#282c3f]">Peak Traffic</h3>
                   <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Hourly Popularity</p>
                 </div>
                 <Bell size={20} className="text-gray-300" />
              </div>

              <div className="space-y-4">
                 {analytics.peakHours.map((hour, idx) => (
                   <div key={idx} className="relative">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-bold text-gray-600">{hour._id}:00 - {hour._id + 1}:00</span>
                         <span className="text-sm font-black text-[#282c3f]">{hour.count} orders</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: analytics.peakHours.length > 0
                                ? `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                                : '0%'
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-[#7c3aed]"
                          />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Database Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden relative">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-black text-[#282c3f]">
              {activeTab === 'items' ? 'Menu Database' : activeTab === 'categories' ? 'Category Database' : 'Table Monitoring'}
            </h2>
            {activeTab !== 'tables' && (
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-black font-medium text-sm"
                />
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            {activeTab === 'items' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider pl-6">Image</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider">Item Details</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider">Category & Prep</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider">Price/Status</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 pl-6">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-200" />
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#282c3f] text-[15px]">{item.name}</p>
                        <p className="text-[#686b78] text-sm truncate max-w-xs">{item.description}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[#282c3f] font-bold text-sm">{item.category}</p>
                        <p className="text-[#686b78] text-xs font-medium">Prep: {item.preparationTime} mins</p>
                      </td>
                      <td className="p-4">
                        <p className="font-black text-[#7c3aed] text-base">₹{item.price}</p>
                        {item.isAvailable ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Available</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Out of Stock</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                         <button onClick={() => startEdit(item)} className="p-2 bg-gray-100 text-[#282c3f] rounded-lg hover:bg-gray-200 transition"><Edit size={16} /></button>
                         <button onClick={() => handleDelete(item._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeTab === 'categories' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider pl-6">Image</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider">Category Name</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider">Display Order</th>
                    <th className="p-4 text-[12px] font-bold text-[#686b78] uppercase tracking-wider text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(cat => (
                    <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 pl-6">
                        <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-200" />
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#282c3f] text-[15px]">{cat.name}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-bold text-sm">#{cat.order}</span>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                         <button onClick={() => startEditCat(cat)} className="p-2 bg-gray-100 text-[#282c3f] rounded-lg hover:bg-gray-200 transition"><Edit size={16} /></button>
                         <button onClick={() => handleDeleteCat(cat._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeTab === 'tables' ? (
              <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(tableCount)].map((_, i) => {
                  const tableNum = i + 1;
                  const tableOrder = activeOrders.find(o => o.tableNumber === tableNum);
                  return (
                    <div key={tableNum} className={`p-6 rounded-[2.5rem] border-2 transition-all relative group ${tableOrder ? 'border-[#7c3aed] bg-violet-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <div className="flex flex-col items-center text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${tableOrder ? 'text-[#7c3aed]' : 'text-gray-400'}`}>Table</span>
                        <span className={`text-4xl font-black mb-4 ${tableOrder ? 'text-[#7c3aed]' : 'text-gray-800'}`}>{tableNum}</span>
                        
                        {tableOrder ? (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">Active Order</p>
                            <p className="text-[#1a1a1b] font-black text-sm">₹{tableOrder.totalAmount}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</p>
                        )}
                        
                        <div className="mt-6 flex gap-2">
                           <button onClick={() => { setQrTableNum(tableNum); setIsQRModalOpen(true); }} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#7c3aed] hover:border-[#7c3aed] transition-colors shadow-sm" title="View QR Code">
                              <QrCode size={14} />
                           </button>
                           <button onClick={() => fetchTableHistory(tableNum)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#7c3aed] hover:border-[#7c3aed] transition-colors shadow-sm" title="Table History">
                              <ListTodo size={14} />
                           </button>
                           {tableOrder && (
                             <button onClick={() => navigate(`/kitchen`)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#7c3aed] hover:border-[#7c3aed] transition-colors shadow-sm" title="Go to Kitchen">
                               <Clock size={14} />
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'cash' ? (
                <div className="p-8">
                   <div className="mb-8">
                      <h3 className="font-black text-lg text-[#282c3f] mb-4 flex items-center gap-2">
                         <div className="w-2 h-6 bg-hotel-gold rounded-full"></div> Running Table Bills (Dining Sessions)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeSessions.length === 0 ? (
                          <div className="col-span-full py-10 text-center text-gray-400 font-bold bg-white rounded-3xl border-2 border-dashed border-gray-100">
                             No active dining sessions.
                          </div>
                        ) : (
                          activeSessions.filter(s => 
                            s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.tableNumber.toString().includes(searchTerm)
                          ).map(session => (
                            <div key={session._id} className={`bg-white border-2 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${session.billRequested ? 'border-orange-200 ring-4 ring-orange-50' : 'border-gray-100'}`}>
                               {session.billRequested && (
                                 <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest animate-pulse">
                                    BILL REQUESTED
                                 </div>
                               )}
                               <div className="flex justify-between items-start mb-6">
                                  <div>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session ID</p>
                                     <p className="font-mono font-bold text-hotel-dark">{session.sessionId}</p>
                                  </div>
                                  <div className="bg-hotel-dark text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">
                                     {session.tableNumber}
                                  </div>
                               </div>
                               
                               <div className="space-y-3 mb-6">
                                  <div className="flex justify-between items-center text-sm">
                                     <span className="font-bold text-gray-500">Orders placed:</span>
                                     <span className="font-black text-gray-800">{session.orders.length}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                     <span className="text-sm font-bold text-gray-500">Running Total:</span>
                                     <span className="text-2xl font-black text-green-600">₹{session.runningTotal.toFixed(2)}</span>
                                  </div>
                               </div>

                               <button 
                                  onClick={() => settleSession(session.sessionId)}
                                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all ${
                                    session.billRequested 
                                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100' 
                                      : 'bg-[#282c3f] text-white hover:bg-black'
                                  }`}
                               >
                                  <ShieldCheck size={18} /> Settle & Close Session
                               </button>
                            </div>
                          ))
                        )}
                      </div>
                   </div>

                   <div>
                      <h3 className="font-black text-lg text-[#282c3f] mb-4 flex items-center gap-2">
                         <div className="w-2 h-6 bg-red-400 rounded-full"></div> Direct Cash Orders (Pending)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeOrders.filter(o => o.paymentMethod === 'Cash' && o.paymentStatus === 'Pending').filter(o => 
                          o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.tableNumber.toString().includes(searchTerm)
                        ).length === 0 ? (
                          <div className="col-span-full py-10 text-center text-gray-400 font-bold bg-white rounded-3xl border-2 border-dashed border-gray-100">
                             No pending direct cash orders. ✨
                          </div>
                        ) : (
                          activeOrders.filter(o => o.paymentMethod === 'Cash' && o.paymentStatus === 'Pending').filter(o => 
                            o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            o.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.tableNumber.toString().includes(searchTerm)
                          ).map(order => (
                            <div key={order.orderId} className="bg-white border-2 border-red-50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                               <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest">
                                  Payment Pending
                               </div>
                               <div className="mb-4">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Token Number</p>
                                  <p className="text-3xl font-black text-black">#{order.tokenNumber}</p>
                               </div>
                               <div className="space-y-2 mb-6">
                                  <div className="flex justify-between text-sm">
                                     <span className="font-bold text-gray-500">Order ID:</span>
                                     <span className="font-mono font-bold">{order.orderId}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                     <span className="font-bold text-gray-500">Table:</span>
                                     <span className="font-black text-[#7c3aed]">Table {order.tableNumber}</span>
                                  </div>
                                  <div className="flex justify-between text-lg pt-2 border-t border-dashed">
                                     <span className="font-black text-gray-800">Total:</span>
                                     <span className="font-black text-green-600">₹{order.totalAmount}</span>
                                  </div>
                               </div>
                               <button 
                                  onClick={() => confirmCashPayment(order.orderId)}
                                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                               >
                                  <ShieldCheck size={18} /> Mark Payment Received
                               </button>
                            </div>
                          ))
                        )}
                      </div>
                   </div>
                </div>
             ) : null}
            {activeTab !== 'tables' && activeTab !== 'cash' && (activeTab === 'items' ? filteredItems : filteredCategories).length === 0 && (
              <div className="p-10 text-center text-gray-500 font-medium">No items found matching your search.</div>
            )}
          </div>
        </div>
      </div>

      {/* Table History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#7c3aed] text-white rounded-2xl flex items-center justify-center font-black text-xl">
                    {selectedTable}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-[#282c3f]">Table Daily Timeline</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking activity from morning</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                {tableHistory.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Clock size={40} />
                    </div>
                    <p className="text-gray-500 font-bold">No orders recorded for this table today.</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                    {tableHistory.map((order, idx) => (
                      <div key={order.orderId} className="relative pl-12">
                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-xs ${idx === 0 ? 'bg-green-500' : 'bg-[#7c3aed]'}`}>
                          {tableHistory.length - idx}
                        </div>
                        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               <h4 className="font-black text-[#1a1a1b] text-base">{order.orderId}</h4>
                            </div>
                            <div className="text-right">
                               <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 uppercase mb-1 inline-block">{order.paymentMethod}</span>
                               <p className="font-black text-[#7c3aed]">₹{order.totalAmount}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-3 border-t border-dashed border-gray-100">
                             {order.items.map((item, i) => (
                               <div key={i} className="flex justify-between items-center text-sm">
                                 <p className="text-[#3d4152] font-bold flex items-center gap-2">
                                   <span className="w-4 h-4 bg-gray-50 rounded text-[10px] flex items-center justify-center font-bold text-gray-500">{item.quantity}</span>
                                   {item.name}
                                 </p>
                                 <p className="text-gray-400 font-medium">₹{item.price * item.quantity}</p>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Daily Revenue</p>
                    <p className="text-2xl font-black text-[#282c3f]">₹{tableHistory.reduce((sum, o) => sum + o.totalAmount, 0)}</p>
                 </div>
                 <button onClick={() => window.print()} className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">
                    Print Daily Log
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-black text-xl text-[#282c3f]">{editingId ? 'Edit Menu Item' : 'Create New Menu Item'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-2 gap-5 mb-5">
                   <div className="col-span-2">
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Item Name</label>
                     <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>

                   <div className="col-span-2">
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Description</label>
                     <textarea required rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]"></textarea>
                   </div>

                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Category</label>
                     <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" placeholder="e.g. South Indian" />
                   </div>

                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Price (₹)</label>
                     <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>

                   <div className="col-span-2">
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Image URL (Unsplash recommended)</label>
                     <input required type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>

                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Prep Time (mins)</label>
                     <input required type="number" min="1" value={formData.preparationTime} onChange={e => setFormData({...formData, preparationTime: Number(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-[#7c3aed] text-white font-bold rounded-xl hover:bg-[#6d28d9] transition flex items-center gap-2 shadow-md">
                     <Save size={18} /> {editingId ? 'Save Changes' : 'Publish Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Add / Edit Modal */}
      <AnimatePresence>
        {isAddingCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-black text-xl text-[#282c3f]">{editingId ? 'Edit Category' : 'Create New Category'}</h3>
                <button onClick={() => setIsAddingCat(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleSaveCat} className="p-6">
                <div className="space-y-5 mb-5">
                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Category Name</label>
                     <input required type="text" value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>

                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Image URL (Circular Icon)</label>
                     <input required type="url" value={catFormData.imageUrl} onChange={e => setCatFormData({...catFormData, imageUrl: e.target.value})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>

                   <div>
                     <label className="text-[12px] font-bold text-[#686b78] uppercase tracking-wider mb-2 block">Display Order</label>
                     <input required type="number" value={catFormData.order} onChange={e => setCatFormData({...catFormData, order: Number(e.target.value)})} className="w-full border p-3 rounded-lg outline-none focus:border-[#7c3aed]" />
                   </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsAddingCat(false)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-[#7c3aed] text-white font-bold rounded-xl hover:bg-[#6d28d9] transition flex items-center gap-2 shadow-md">
                     <Save size={18} /> {editingId ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* QR Code Modal */}
      <AnimatePresence>
        {isQRModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative"
            >
               <button onClick={() => setIsQRModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                  <X size={20} />
               </button>
               
               <div className="mb-6">
                  <div className="bg-[#7c3aed] text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                    {qrTableNum}
                  </div>
                  <h3 className="font-black text-2xl text-[#1a1a1b] leading-tight">Table QR Code</h3>
                  <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Instant Menu Access</p>
               </div>
               
               <div className="bg-white p-6 border-4 border-gray-50 rounded-[2rem] inline-block shadow-inner mb-6">
                 <QRCodeCanvas 
                    id="table-qr"
                    value={`${window.location.origin}/menu?table=${qrTableNum}`} 
                    size={200}
                    level="H"
                    includeMargin={true}
                 />
               </div>
               
               <div className="space-y-3">
                  <button 
                    onClick={() => {
                        const canvas = document.getElementById('table-qr');
                        const url = canvas.toDataURL("image/png");
                        const link = document.createElement('a');
                        link.download = `QuickServe_Table_${qrTableNum}.png`;
                        link.href = url;
                        link.click();
                    }}
                    className="w-full bg-[#7c3aed] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#6d28d9] transition-all shadow-xl shadow-violet-200"
                  >
                     <Download size={18} /> Download Image
                  </button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Scan to open table {qrTableNum} menu</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
