import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ArrowRight, UserCheck, ChefHat, X, Star, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setTableNumber, API_URL } = useHotel();
  const { t, language, setLanguage } = useLanguage();

  const [modalType, setModalType] = useState(null); // 'table', 'admin', 'kitchen'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleTable = (num) => {
    setTableNumber(String(num));
    localStorage.setItem('quickserve_table', String(num));
    navigate(`/menu?table=${num}`);
  };

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.user.role !== type) throw new Error(`Not an ${type}`);
      localStorage.setItem(`${type}_token`, data.token);
      setModalType(null);
      navigate(`/${type}`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const renderModal = () => {
    if (!modalType) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#0c0c0c] border border-white/10 p-8 rounded-3xl w-full max-w-md relative shadow-2xl shadow-purple-900/20">
          <button onClick={() => setModalType(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>

          <h3 className="text-2xl font-playfair font-bold text-white mb-8 text-center">
            {modalType === 'table' ? t('Select Table') : t(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Portal`)}
          </h3>

          {modalType === 'table' ? (
            <div className="grid grid-cols-5 gap-3">
              {[...Array(20)].map((_, i) => (
                <button key={i} onClick={() => handleTable(i + 1)}
                  className="bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/50 border border-white/10 rounded-xl py-3 text-white font-outfit font-medium transition-all hover:scale-105">
                  {i + 1}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={(e) => handleAuth(e, modalType)} className="space-y-5">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-outfit focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-gray-500" required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-outfit focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-gray-500" required />
              {authError && <p className="text-red-400 text-sm font-outfit text-center">{authError}</p>}
              <button type="submit" className="w-full bg-white text-black font-outfit font-bold rounded-xl py-3.5 hover:bg-gray-200 hover:scale-[1.02] transition-all duration-300">
                {t('Sign In')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit overflow-x-hidden selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <Utensils size={18} className="text-black" />
          </div>
          <div>
            <span className="font-playfair font-bold text-xl tracking-wide text-white block leading-none">QuickServe</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 block mt-1">Premium Dining</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Premium Language Dropdown */}
          <div className="relative flex items-center">
            <select
              value={language || 'en'}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full pl-8 pr-5 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-all duration-300 font-outfit cursor-pointer"
            >
              <option value="en" className="bg-[#050505] text-white">EN</option>
              <option value="ta" className="bg-[#050505] text-white">தமிழ்</option>
              <option value="hi" className="bg-[#050505] text-white">हिंदी</option>
              <option value="te" className="bg-[#050505] text-white">తెలుగు</option>
              <option value="ml" className="bg-[#050505] text-white">മലയാളം</option>
              <option value="kn" className="bg-[#050505] text-white">ಕನ್ನಡ</option>
            </select>
            <div className="pointer-events-none absolute left-2.5 flex items-center text-purple-400">
              <Globe size={11} />
            </div>
          </div>

          <button onClick={() => { setModalType('kitchen'); setEmail('kitchen@quickserve.com'); setPassword(''); }}
            className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-all">
            <ChefHat size={14} /> {t('Kitchen')}
          </button>
          <button onClick={() => { setModalType('admin'); setEmail('admin@quickserve.com'); setPassword(''); }}
            className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-all">
            <UserCheck size={14} /> {t('Admin')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center px-4">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img src="/images/hero-restaurant.png" alt="Luxury Dining" className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/70 to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center mt-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            className="flex gap-1.5 mb-8">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400/50" />)}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="font-playfair text-5xl md:text-7xl font-semibold leading-[1.1] mb-6 text-white tracking-tight">
            {t('A Symphony of')} <br />
            <span className="text-gray-400 italic">{t('Taste & Elegance')}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="text-gray-400 text-sm md:text-base font-light tracking-wide max-w-xl mb-12 leading-relaxed">
            {t('Experience culinary mastery coupled with seamless digital ordering. Begin your pristine dining journey directly from your table.')}
          </motion.p>

          <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
            onClick={() => setModalType('table')}
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]">
            {t('Explore Menu')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </section>

      {/* Minimalism Features */}
      <section className="py-24 px-6 relative z-10 bg-[#050505]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { t: 'Seamless Ordering', d: 'Scan, select, and savor directly from your personal device.' },
            { t: 'Artisan Culinary', d: 'Crafted with precision by our team of masterful chefs.' },
            { t: 'Immersive Ambiance', d: 'A luxurious environment curated exclusively for your senses.' }
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: i * 0.1 }} viewport={{ once: true }}
              className="p-8 border border-white/5 rounded-3xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <h3 className="font-playfair text-xl mb-3 text-gray-200">{t(f.t)}</h3>
              <p className="text-gray-500 font-light text-sm leading-relaxed">{t(f.d)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-white/5 relative z-10">
        <p className="font-playfair text-xl text-gray-300 mb-2 mt-4 tracking-wide">QuickServe</p>
        <p className="text-gray-600 text-xs tracking-wider uppercase">© {new Date().getFullYear()} {t('Premium Dining')}</p>
      </footer>

      <AnimatePresence>
        {renderModal()}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
