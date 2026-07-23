import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Search, 
  ShoppingCart, 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  BellRing, 
  Receipt,
  X,
  Plus,
  Minus,
  ChefHat,
  Leaf,
  Info,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MenuPage = () => {
  const { menuItems, categories, cart, setCart, addToCart, updateQuantity, tableNumber, loading, socket, API_URL } = useHotel();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // For Details Modal
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceMsg, setAssistanceMsg] = useState('');
  const [assistanceType, setAssistanceType] = useState('');

  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // Check if table has an active session
    if (tableNumber) {
      fetch(`${API_URL}/orders/table-session/${tableNumber}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.sessionStatus === 'Active') {
            setActiveSession(data);
          }
        })
        .catch(() => {});
    }
  }, [tableNumber, API_URL]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.isAvailable) return false;
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchTerm]);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleAssistance = async () => {
    const type = assistanceType === 'Other Request' ? `Other: ${assistanceMsg}` : assistanceType;
    if (!type) return;
    
    try {
      await fetch(`${API_URL}/tables/waiter-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          requestType: type,
          message: assistanceMsg
        })
      });
      alert('Request sent successfully!');
      setShowAssistanceModal(false);
      setAssistanceType('');
      setAssistanceMsg('');
    } catch (err) {
      alert('Failed to send request');
    }
  };

  const handleRequestBill = () => {
    navigate('/running-bill');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111] text-hotel-gold">
        <div className="animate-pulse flex flex-col items-center">
          <ChefHat size={48} className="mb-4" />
          <p className="font-playfair text-xl tracking-widest uppercase">Preparing Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white font-outfit" style={{ backgroundImage: 'radial-gradient(circle at top right, #1a1a1a, #000)' }}>
      {/* Luxury Navbar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-gradient-to-br from-hotel-gold to-[#997a15] rounded-full flex items-center justify-center luxury-shadow">
               <span className="font-playfair font-bold text-black text-2xl">Q</span>
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold tracking-widest text-gradient-gold uppercase">QuickServe</h1>
              <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase">Premium Dining</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:border-hotel-gold/50 transition-colors">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('Search delicacies...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-48 text-white ml-2 placeholder-gray-500 font-outfit"
              />
            </div>

            {/* Premium Language Dropdown */}
            <div className="relative flex items-center">
              <select 
                value={language || 'en'} 
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full pl-9 pr-6 py-2.5 text-xs font-semibold focus:outline-none focus:border-hotel-gold transition-all duration-300 font-outfit cursor-pointer"
              >
                <option value="en" className="bg-[#1a1a1a] text-white">English</option>
                <option value="ta" className="bg-[#1a1a1a] text-white">தமிழ்</option>
                <option value="hi" className="bg-[#1a1a1a] text-white">हिंदी</option>
                <option value="te" className="bg-[#1a1a1a] text-white">తెలుగు</option>
                <option value="ml" className="bg-[#1a1a1a] text-white">മലയാളം</option>
                <option value="kn" className="bg-[#1a1a1a] text-white">ಕನ್ನಡ</option>
              </select>
              <div className="pointer-events-none absolute left-3 flex items-center text-hotel-gold">
                <Globe size={14} />
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/cart')} 
              className="relative p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <ShoppingCart size={22} className="text-hotel-gold" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-hotel-gold text-black text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-full">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Categories */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-playfair text-3xl text-gradient-gold">Culinary Collections</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-hotel-gold hover:text-black transition-colors"><ArrowLeft size={18}/></button>
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-hotel-gold hover:text-black transition-colors"><ArrowRight size={18}/></button>
            </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveCategory(cat.name)}
                className="flex flex-col items-center cursor-pointer min-w-[100px] group"
              >
                <div className={`w-20 h-20 rounded-full p-1 mb-3 transition-all duration-300 ${activeCategory === cat.name ? 'bg-gradient-to-br from-hotel-gold to-[#8a6e13] scale-110' : 'bg-transparent border border-white/20 group-hover:border-hotel-gold/50'}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className={`text-sm font-medium tracking-wide ${activeCategory === cat.name ? 'text-hotel-gold' : 'text-gray-400'}`}>{t(cat.name)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
          {filteredItems.map((item) => (
            <motion.div 
              key={item._id}
              whileHover={{ y: -8 }}
              onClick={() => setSelectedItem(item)}
              className="glass-panel-dark rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-hotel-gold/30 transition-all duration-500 luxury-shadow group"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                {item.price > 400 && (
                  <div className="absolute top-4 left-4 bg-hotel-gold text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-hotel-gold/20">
                    <Star size={10} className="fill-black" /> Chef's Special
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-hotel-gold tracking-[0.2em] uppercase mb-1">{t(item.category)}</p>
                    <h3 className="font-playfair text-xl text-white font-semibold leading-tight">{item.name}</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex justify-between items-center bg-black/40">
                <p className="text-xl font-outfit text-hotel-gold font-light">₹{item.price}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-hotel-gold hover:text-black transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 left-6 z-30 flex flex-col gap-4">
        <button 
          onClick={() => setShowAssistanceModal(true)}
          className="w-14 h-14 bg-gradient-to-br from-[#2a2a2a] to-[#111] border border-white/20 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform group"
          title="Request Assistance"
        >
          <BellRing size={24} className="group-hover:text-hotel-gold transition-colors" />
        </button>
        {activeSession && (
          <button 
            onClick={handleRequestBill}
            className="w-14 h-14 bg-gradient-to-br from-hotel-gold to-[#997a15] text-black rounded-full flex items-center justify-center luxury-shadow hover:scale-105 transition-transform"
            title="Running Bill"
          >
            <Receipt size={24} />
          </button>
        )}
        <button 
          onClick={() => navigate('/review')}
          className="w-14 h-14 bg-white/10 backdrop-blur-md border border-hotel-gold/40 text-hotel-gold rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-hotel-gold hover:text-black transition-all group"
          title="Rate Experience / Leave Review"
        >
          <Star size={24} className="fill-current" />
        </button>
      </div>

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1a1a] w-full max-w-4xl rounded-3xl overflow-hidden border border-hotel-gold/20 luxury-shadow flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-1/2 relative h-64 md:h-auto">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="md:hidden absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
                >
                  <X size={20} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent md:bg-gradient-to-r"></div>
              </div>
              
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto hide-scrollbar">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <span className={`w-4 h-4 rounded-sm flex items-center justify-center border ${selectedItem.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${selectedItem.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                     </span>
                     <span className="text-[10px] tracking-[0.2em] text-hotel-gold uppercase">{t(selectedItem.category)}</span>
                   </div>
                   <button 
                    onClick={() => setSelectedItem(null)}
                    className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <h2 className="font-playfair text-4xl text-white mb-2">{selectedItem.name}</h2>
                <p className="text-gray-400 font-light text-sm mb-6 leading-relaxed">{selectedItem.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price</p>
                    <p className="text-2xl font-playfair text-hotel-gold">₹{selectedItem.price}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Prep Time</p>
                    <p className="text-lg text-white">{selectedItem.preparationTime || 15} mins</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-hotel-gold mb-2">Nutritional Info</h4>
                    <div className="flex gap-4 text-sm text-gray-300">
                      <span>Calories: {selectedItem.calories || '350'}kcal</span>
                      <span>Protein: {selectedItem.protein || '12'}g</span>
                      <span>Carbs: {selectedItem.carbs || '45'}g</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-hotel-gold mb-2">Spice Level</h4>
                    <div className="flex gap-1">
                      {[1,2,3].map(i => (
                        <div key={i} className={`w-8 h-1 rounded-full ${i <= (selectedItem.spiceLevel || 2) ? 'bg-red-500' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full p-1">
                    <button onClick={() => {
                        const existing = cart.find(i => i.menuItem === selectedItem._id);
                        if (existing && existing.quantity > 1) updateQuantity(selectedItem._id, -1);
                        else if (existing) updateQuantity(selectedItem._id, -1); // remove
                    }} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"><Minus size={18}/></button>
                    <span className="w-4 text-center font-bold">
                      {cart.find(i => i.menuItem === selectedItem._id)?.quantity || 0}
                    </span>
                    <button onClick={() => {
                       addToCart(selectedItem);
                    }} className="w-10 h-10 rounded-full flex items-center justify-center text-hotel-gold hover:text-white hover:bg-hotel-gold/20"><Plus size={18}/></button>
                  </div>
                  <button 
                    onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                    className="flex-1 bg-hotel-gold text-black font-bold py-4 rounded-full uppercase tracking-widest hover:bg-[#b8952a] transition-all luxury-shadow"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Waiter Assistance Modal */}
      <AnimatePresence>
        {showAssistanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] w-full max-w-md rounded-3xl p-6 border border-hotel-gold/30 luxury-shadow"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-playfair text-2xl text-gradient-gold">Request Assistance</h3>
                <button onClick={() => setShowAssistanceModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['Call Waiter', 'Need Water', 'Need Tissue', 'Need Spoon', 'Need Extra Plate', 'Need Cleaning', 'Need Baby Chair', 'Need Bill', 'Other Request'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAssistanceType(opt)}
                    className={`p-3 rounded-xl text-sm transition-all border ${assistanceType === opt ? 'bg-hotel-gold/20 border-hotel-gold text-hotel-gold' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              
              {assistanceType === 'Other Request' && (
                <textarea
                  value={assistanceMsg}
                  onChange={e => setAssistanceMsg(e.target.value)}
                  placeholder="Type your request here (e.g. Need extra ketchup)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-hotel-gold mb-6 resize-none h-24"
                />
              )}
              
              <button 
                onClick={handleAssistance}
                disabled={!assistanceType}
                className="w-full bg-hotel-gold text-black font-bold py-3 rounded-xl uppercase tracking-widest disabled:opacity-50 hover:bg-[#b8952a] transition-colors"
              >
                Send Request
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MenuPage;
