import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Percent, HelpCircle, ShoppingCart, ChevronDown, SlidersHorizontal, ArrowLeft, ArrowRight, ShieldCheck, Zap, Plus, Minus, X } from 'lucide-react';

const MenuPage = () => {
  const { menuItems, categories, cart, setCart, addToCart, updateQuantity, tableNumber, loading } = useHotel();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const menuGridRef = useRef(null);

  const scrollToGrid = () => {
    menuGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // orderNowItems: { [itemId]: { item, quantity } }
  const [orderNowItems, setOrderNowItems] = useState({});

  // Track which cart quantity panels are expanded (visible)
  const [expandedCartItems, setExpandedCartItems] = useState(new Set());

  const handleAddToCart = (item) => {
    const inCart = cart.find(c => c.menuItem === item._id);
    if (inCart) {
      // toggle the quantity panel visibility
      setExpandedCartItems(prev => {
        const next = new Set(prev);
        if (next.has(item._id)) { next.delete(item._id); } else { next.add(item._id); }
        return next;
      });
    } else {
      // first time: add to cart and auto-expand the panel
      addToCart(item);
      setExpandedCartItems(prev => new Set(prev).add(item._id));
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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

  // --- Order Now handlers ---
  const toggleOrderNow = (item) => {
    setOrderNowItems(prev => {
      if (prev[item._id]) {
        // Remove this item from order now
        const updated = { ...prev };
        delete updated[item._id];
        return updated;
      } else {
        // Add this item with qty 1
        return { ...prev, [item._id]: { item, quantity: 1 } };
      }
    });
  };

  const changeOrderNowQty = (itemId, delta) => {
    setOrderNowItems(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty < 1) return prev;
      return { ...prev, [itemId]: { ...current, quantity: newQty } };
    });
  };

  const removeFromOrderNow = (itemId) => {
    setOrderNowItems(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const orderNowList = Object.values(orderNowItems);
  const orderNowTotal = orderNowList.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);
  const orderNowCount = orderNowList.reduce((sum, { quantity }) => sum + quantity, 0);

  const proceedOrderNow = () => {
    if (orderNowList.length === 0) return;
    setCart(orderNowList.map(({ item, quantity }) => ({
      menuItem: item._id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.imageUrl,
    })));
    setOrderNowItems({});
    navigate('/payment');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-[#7c3aed]">Loading Menu...</div>;
  }

  return (
    <div className="min-h-screen text-[#1a1a1b] font-sans">
      {/* Premium Navbar */}
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <div className="cursor-pointer group flex items-center gap-3" onClick={() => navigate('/')}>
              <div className="bg-[#7c3aed] text-white p-2 rounded-xl shadow-lg shadow-violet-200 group-hover:rotate-6 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-[#1a1a1b]">QUICKSERVE</span>
                <span className="text-[10px] font-bold text-[#7c3aed] tracking-[0.2em] -mt-1 uppercase">Premium Dining</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 font-bold text-[#3d4152] text-sm tracking-wide">
            <div onClick={() => showToast(t('QuickServe Corporate Info'))} className="flex items-center gap-2 cursor-pointer hover:text-[#7c3aed] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><path d="m9 16 3-3 3 3"/></svg>
              {t('QuickServe Corporate')}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl focus-within:ring-2 ring-violet-100 transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('Search food items...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-48 font-medium"
              />
            </div>
            <div onClick={() => setActiveCategory('Combos')} className="flex items-center gap-2 cursor-pointer hover:text-[#7c3aed] transition-colors relative">
              <Percent size={18} /> {t('Offers')}
              <span className="absolute -top-3 -right-6 text-[#7c3aed] text-[10px] font-bold">{t('SALE')}</span>
            </div>
            <div onClick={() => showToast(t('QuickServe Support'))} className="flex items-center gap-2 cursor-pointer hover:text-[#7c3aed] transition-colors">
              <HelpCircle size={18} /> {t('Help')}
            </div>
            <div onClick={() => navigate('/cart')} className="flex items-center gap-2 cursor-pointer text-[#7c3aed] relative">
              <div className="flex items-center justify-center">
                <ShoppingCart size={22} strokeWidth={2.5} />
                {totalCartItems > 0 && <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold px-1 rounded-full">{totalCartItems}</span>}
              </div>
              <span className="text-[#1a1a1b] font-bold">{t('Cart')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-10">

        {/* Category Section */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[#7c3aed] font-bold text-xs uppercase tracking-[0.3em] mb-2">{t('Curated Collections')}</p>
              <h2 className="text-4xl font-black tracking-tight text-[#1a1a1b]">{t('Discover Our Specialties')}</h2>
            </div>
            <div className="flex gap-3 mb-1">
              <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#7c3aed] hover:border-[#7c3aed] transition-all shadow-sm"><ArrowLeft size={20} /></button>
              <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#7c3aed] hover:border-[#7c3aed] transition-all shadow-sm"><ArrowRight size={20} /></button>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 scroll-smooth">
            {categories.map((cat, idx) => (
              <div key={idx} onClick={() => { setActiveCategory(cat.name); scrollToGrid(); }} className="flex flex-col items-center cursor-pointer min-w-[140px] group transition-all duration-500">
                <div className={`w-[140px] h-[140px] rounded-full overflow-hidden mb-4 border-2 transition-all relative shadow-lg ${activeCategory === cat.name ? 'border-[#7c3aed] scale-105 shadow-violet-200' : 'border-transparent group-hover:scale-105'}`}>
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover transition-all duration-700" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'; }} />
                </div>
                <span className={`text-[#3d4152] text-sm font-bold tracking-tight text-center ${activeCategory === cat.name ? 'text-[#7c3aed]' : ''}`}>{t(cat.name)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Food Section Header */}
        <div ref={menuGridRef} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-100 pb-10">
          <div>
            <h2 className="text-4xl font-black text-[#1a1a1b] tracking-tight mb-2">
              {activeCategory === 'All' ? t('Signature Menu') : t(activeCategory)}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{filteredItems.length} {t('Masterpieces Found')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1">
            <button className="px-5 py-2.5 rounded-2xl border border-gray-200 hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all bg-white shadow-sm flex items-center gap-2 font-bold text-sm">
              <SlidersHorizontal size={18} /> {t('Filter')}
            </button>
            <div className="hidden md:block w-[1px] h-6 bg-gray-200 mx-2"></div>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors whitespace-nowrap">
              {t('Sorted by: Presence')} <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 ${orderNowList.length > 0 ? 'pb-36' : 'pb-6'}`}>
          {filteredItems.map((item, idx) => {
            const cartItem = cart.find(c => c.menuItem === item._id);
            const onItem = orderNowItems[item._id];
            const isSelected = !!onItem;

            return (
              <div key={item._id} className={`group bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-500 flex flex-col h-full ${isSelected ? 'border-[#7c3aed] shadow-2xl shadow-violet-100/70 ring-2 ring-violet-200' : 'border-gray-100/50 hover:shadow-2xl hover:shadow-violet-100/50 ring-0 hover:ring-1 ring-violet-200'}`}>

                {/* Image */}
                <div className="relative w-full h-[240px] overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }} />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute top-5 left-5">
                    <span className="bg-[#7c3aed]/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl uppercase tracking-[0.2em]">
                      {item.price > 300 ? t('Chef Special') : t('Handcrafted')}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">{t('Price')}</p>
                      <p className="text-2xl font-black">₹{item.price}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('Available')}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-3 h-3 border-2 ${idx % 2 === 0 ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-[2px]`}>
                      <div className={`w-full h-full rounded-full ${idx % 2 === 0 ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </span>
                    <span className="text-[10px] font-black text-[#7c3aed] uppercase tracking-[0.3em]">{t(item.category)}</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#1a1a1b] group-hover:text-[#7c3aed] transition-colors leading-tight mb-3">{item.name}</h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-2 mb-5 italic">{item.description}</p>
                  <div className="flex flex-col mb-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Kitchen Prep')}</p>
                    <p className="text-xs font-bold text-gray-700">{item.preparationTime} {t('Mins')}</p>
                  </div>

                  {/* Inline quantity selector for Order Now */}
                  {isSelected && (
                    <div className="mb-5 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                      <p className="text-xs font-black text-[#7c3aed] uppercase tracking-widest mb-3">{t('Select Quantity')}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-2xl p-1 shadow-inner border border-violet-100">
                          <button onClick={() => changeOrderNowQty(item._id, -1)} className="w-10 h-10 flex items-center justify-center text-[#7c3aed] font-black text-xl hover:bg-violet-50 rounded-xl transition-all">
                            <Minus size={18} />
                          </button>
                          <span className="px-6 text-[#1a1a1b] font-black text-lg">{onItem.quantity}</span>
                          <button onClick={() => changeOrderNowQty(item._id, 1)} className="w-10 h-10 flex items-center justify-center text-[#7c3aed] font-black text-xl hover:bg-violet-50 rounded-xl transition-all">
                            <Plus size={18} />
                          </button>
                        </div>
                        <p className="text-lg font-black text-[#1a1a1b]">₹{(item.price * onItem.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto pt-5 border-t border-gray-50">
                    {!item.isAvailable ? (
                      <span className="text-red-500 text-sm font-black uppercase tracking-widest">{t('Sold Out')}</span>
                    ) : (
                      <>
                        {/* Cart quantity stepper — shown ABOVE buttons when panel is expanded */}
                        {cartItem && expandedCartItems.has(item._id) && (
                          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('Cart Quantity')}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-white rounded-2xl p-1 shadow-inner border border-gray-100">
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, -1); }} className="w-9 h-9 flex items-center justify-center text-[#7c3aed] font-black text-xl hover:bg-gray-50 rounded-xl transition-all">−</button>
                                <span className="px-5 text-[#1a1a1b] font-black text-base">{cartItem.quantity}</span>
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, 1); }} className="w-9 h-9 flex items-center justify-center text-[#7c3aed] font-black text-xl hover:bg-gray-50 rounded-xl transition-all">+</button>
                              </div>
                              <p className="text-base font-black text-[#1a1a1b]">₹{(item.price * cartItem.quantity).toFixed(0)}</p>
                            </div>
                          </div>
                        )}

                        {/* Both buttons always visible below */}
                        <div className="flex gap-3">
                          {/* ADD TO CART */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                            className={`flex-1 font-black text-[11px] py-3 rounded-2xl transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 ${
                              cartItem
                                ? 'bg-green-600 text-white shadow-green-100 hover:bg-green-700 hover:scale-105 active:scale-95'
                                : 'bg-[#1a1a1b] text-white shadow-gray-200 hover:bg-black hover:scale-105 active:scale-95'
                            }`}
                          >
                            <ShoppingCart size={15} /> {cartItem ? (expandedCartItems.has(item._id) ? `${t('Hide')} (${cartItem.quantity})` : `${t('In Cart')} (${cartItem.quantity})`) : t('Add to Cart')}
                          </button>

                          {/* ORDER NOW */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleOrderNow(item); }}
                            className={`flex-1 font-black text-[11px] py-3 rounded-2xl transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-[#7c3aed] text-white shadow-violet-200 scale-105'
                                : 'bg-violet-100 text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white hover:scale-105 active:scale-95 shadow-violet-100'
                            }`}
                          >
                            <Zap size={15} /> {isSelected ? t('Added ✓') : t('Order Now')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Sticky Order Now Bottom Bar ===== */}
      {orderNowList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-violet-200 shadow-2xl shadow-violet-300">
          {/* Item summary list */}
          <div className="max-w-[900px] mx-auto px-4 pt-3 pb-1 flex gap-2 flex-wrap">
            {orderNowList.map(({ item, quantity }) => (
              <div key={item._id} className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-black text-[#1a1a1b]">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeOrderNowQty(item._id, -1)} className="w-5 h-5 flex items-center justify-center text-[#7c3aed] hover:bg-violet-100 rounded-full transition-all font-bold">
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-black text-[#7c3aed] min-w-[16px] text-center">{quantity}</span>
                  <button onClick={() => changeOrderNowQty(item._id, 1)} className="w-5 h-5 flex items-center justify-center text-[#7c3aed] hover:bg-violet-100 rounded-full transition-all font-bold">
                    <Plus size={10} />
                  </button>
                </div>
                <button onClick={() => removeFromOrderNow(item._id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Total + CTA */}
          <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-[#7c3aed] uppercase tracking-widest">
                {orderNowCount} {orderNowCount > 1 ? t('items') : t('item')} · {t('Order Now')}
              </p>
              <p className="text-xl font-black text-[#1a1a1b]">
                ₹{orderNowTotal.toFixed(0)} <span className="text-xs text-gray-400 font-bold"> {t('plus taxes')}</span>
              </p>
            </div>
            <button
              onClick={proceedOrderNow}
              className="bg-[#7c3aed] text-white font-black px-8 py-4 rounded-2xl hover:bg-violet-700 active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-violet-300 flex items-center gap-2 whitespace-nowrap"
            >
              <Zap size={18} /> {t('Order Now')} →
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Floating Tab */}
      {totalCartItems > 0 && orderNowList.length === 0 && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
          <div className="bg-[#7c3aed] text-white rounded-2xl p-4 flex justify-between items-center shadow-2xl shadow-violet-200" onClick={() => navigate('/cart')}>
            <div>
              <p className="text-xs font-bold uppercase">{totalCartItems} {totalCartItems > 1 ? t('items') : t('item')}</p>
              <p className="font-bold flex items-center gap-1 text-sm">₹{cart.reduce((a, b) => a + b.price * b.quantity, 0)} <span className="text-xs font-normal">{t('plus taxes')}</span></p>
            </div>
            <div className="flex items-center gap-2 font-bold text-[15px]">
              {t('View Cart')} <ArrowRight size={16} />
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white font-bold px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
