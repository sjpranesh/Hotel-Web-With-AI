import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Utensils, ChefHat, Settings, ArrowRight, Star, X,
  Leaf, ShieldCheck, Clock, CreditCard, Sparkles, Activity,
  ChevronDown, MapPin, Phone, Mail, Globe, Share2, ExternalLink,
  Quote, ArrowLeft
} from 'lucide-react';

/* ─── Image paths ─── */
const HERO_IMG = '/images/hero-restaurant.png';
const GALLERY = [
  '/images/gallery/food1.png',
  '/images/gallery/food2.png',
  '/images/gallery/food3.png',
  '/images/gallery/food4.png',
  '/images/gallery/food5.png',
];

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }
  }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' }
  }),
};
const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Animated Counter Hook ─── */
function useCounter(end, duration = 2000, startOnView = false, inView = true) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, inView]);
  return count;
}

/* ─── Ripple Button ─── */
const RippleButton = ({ children, className, onClick, ...props }) => {
  const [ripples, setRipples] = useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  };
  return (
    <button className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>
      {ripples.map(r => (
        <span key={r.id} className="absolute bg-white/30 rounded-full w-4 h-4 animate-ripple pointer-events-none"
          style={{ left: r.x - 8, top: r.y - 8 }} />
      ))}
      {children}
    </button>
  );
};

/* ─── Section Heading ─── */
const SectionHeading = ({ label, title, subtitle, light = false }) => (
  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
    className="text-center mb-16 md:mb-20">
    {label && (
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-outfit font-semibold tracking-[0.2em] uppercase mb-4
        bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20 text-amber-400">
        <Sparkles size={12} /> {label}
      </span>
    )}
    <h2 className={`font-playfair text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 ${light ? 'text-white' : 'text-white'}`}>
      {title}
    </h2>
    {subtitle && <p className="text-gray-400 font-outfit text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
  </motion.div>
);

/* ─── Testimonial Data ─── */
const TESTIMONIALS = [
  { name: 'Rajesh Kumar', role: 'Food Critic', text: 'QuickServe has redefined fine dining for me. The seamless ordering experience and exceptional cuisine make every visit unforgettable.', rating: 5, avatar: 'RK' },
  { name: 'Priya Sharma', role: 'Regular Guest', text: 'The digital ordering from our table was incredibly smooth. The food arrived hot and perfectly prepared. An absolute delight!', rating: 5, avatar: 'PS' },
  { name: 'Amit Patel', role: 'Business Traveler', text: 'Best restaurant technology I have experienced. Real-time kitchen updates gave us complete visibility. Truly premium service.', rating: 5, avatar: 'AP' },
  { name: 'Sneha Reddy', role: 'Anniversary Dinner', text: 'Our anniversary dinner was magical. The ambiance, the food, and the seamless service through QuickServe made it perfect.', rating: 5, avatar: 'SR' },
  { name: 'Vikram Singh', role: 'Hotel Guest', text: 'From appetizers to dessert, every dish was a masterpiece. The QR ordering system is genius — no waiting, just pure enjoyment.', rating: 5, avatar: 'VS' },
];

/* ═══════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const { tableNumber, setTableNumber, API_URL } = useHotel();
  const { t } = useLanguage();

  const [showTableModal, setShowTableModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showKitchenLogin, setShowKitchenLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  /* Scroll listener for nav glassmorphism */
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Auto-rotate testimonials */
  useEffect(() => {
    const id = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* Handle table selection */
  const selectTable = (num) => {
    setTableNumber(String(num));
    localStorage.setItem('quickserve_table', String(num));
    setShowTableModal(false);
    navigate(`/menu?table=${num}`);
  };

  /* Handle order food click */
  const handleOrderFood = () => {
    setShowTableModal(true);
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.user.role !== 'admin') throw new Error('Not an admin');
      localStorage.setItem('admin_token', data.token);
      setShowAdminLogin(false);
      navigate('/admin');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleKitchenAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.user.role !== 'kitchen') throw new Error('Not a kitchen staff');
      localStorage.setItem('kitchen_token', data.token);
      setShowKitchenLogin(false);
      navigate('/kitchen');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  /* Smooth scroll to section */
  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ─── NAVIGATION BAR ─── */
  const Navbar = () => (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        navScrolled
          ? 'py-3 bg-black/70 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/40'
          : 'py-5 bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollTo('hero')}>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center shadow-lg shadow-purple-500/25
              group-hover:shadow-purple-500/40 transition-shadow duration-300">
              <Utensils size={22} className="text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border-2 border-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-playfair text-xl md:text-2xl font-bold text-white tracking-wide">QuickServe</span>
            <span className="text-[10px] font-outfit font-medium tracking-[0.25em] uppercase text-amber-400/80">Premium Dining Experience</span>
          </div>
        </div>

        {/* Center Links - Desktop */}
        <div className="hidden lg:flex items-center gap-8">
          {[ ['Home','hero'], ['About','about'], ['Menu','features'], ['Facilities','why-us'], ['Gallery','gallery'], ['Contact','footer'] ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm font-outfit font-medium tracking-wider uppercase text-gray-300 hover:text-white
                relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-[#7C3AED] after:to-amber-400
                after:transition-all after:duration-300 hover:after:w-full transition-colors duration-300">
              {t(label)}
            </button>
          ))}
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Order Food - Primary */}
          <RippleButton onClick={handleOrderFood}
            className="group flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-outfit font-bold text-sm sm:text-base
              bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white
              shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105
              transition-all duration-300 border border-purple-400/20">
            <span className="text-lg sm:text-xl">🍽</span>
            <span className="hidden sm:inline">{t('Order Food')}</span>
            <span className="sm:hidden">Order</span>
          </RippleButton>

          {/* Kitchen */}
          <button onClick={() => { setEmail('kitchen@quickserve.com'); setShowKitchenLogin(true); }}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm
              bg-white/5 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/10
              border border-white/10 hover:border-white/20 transition-all duration-300">
            <span>👨‍🍳</span> {t('Kitchen')}
          </button>

          {/* Admin */}
          <button onClick={() => { setEmail('admin@quickserve.com'); setShowAdminLogin(true); }}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-outfit font-semibold text-sm
              bg-white/5 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/10
              border border-white/10 hover:border-white/20 transition-all duration-300">
            <span>🛠</span> {t('Admin')}
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/90 backdrop-blur-2xl border-t border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              {[ ['Home','hero'], ['About','about'], ['Menu','features'], ['Facilities','why-us'], ['Gallery','gallery'], ['Contact','footer'] ].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className="text-left text-base font-outfit font-medium text-gray-300 hover:text-white py-2 border-b border-white/5 transition-colors">
                  {t(label)}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setMobileMenuOpen(false); setEmail('kitchen@quickserve.com'); setShowKitchenLogin(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-outfit font-semibold text-sm">
                  👨‍🍳 {t('Kitchen')}
                </button>
                <button onClick={() => { setMobileMenuOpen(false); setEmail('admin@quickserve.com'); setShowAdminLogin(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-outfit font-semibold text-sm">
                  🛠 {t('Admin')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );

  /* ─── HERO SECTION ─── */
  const HeroSection = () => {
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
    const textY = useTransform(scrollYProgress, [0, 0.3], [0, 80]);

    return (
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="QuickServe Luxury Restaurant"
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-purple-900/20" />
        </motion.div>

        {/* Decorative Particles */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
              initial={{ x: `${15 + i * 15}%`, y: '100%', opacity: 0 }}
              animate={{ y: '-10%', opacity: [0, 0.6, 0] }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, delay: i * 1.5, ease: 'linear' }} />
          ))}
        </div>

        {/* Content */}
        <motion.div style={{ y: textY, opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Stars */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="flex items-center justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-2 text-xs font-outfit font-medium tracking-widest uppercase text-amber-400/80">Premium Dining</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="font-playfair text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] mb-6">
            {t('Experience Luxury')}<br />
            <span className="text-gradient-gold">{t('Dining')}</span>{' '}
            {t('with')}{' '}
            <span className="text-gradient-purple">{t('QuickServe')}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-gray-300 font-outfit text-sm sm:text-base mb-10">
            {[
              'Order directly from your table',
              'Fast service',
              'Real-time kitchen updates',
              'Premium dining experience',
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-amber-400" />
                {t(item)}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <RippleButton onClick={handleOrderFood}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-outfit font-bold text-lg
                bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white
                shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105
                transition-all duration-300 border border-purple-400/20 glow-purple">
              <span className="text-2xl">🍽</span>
              {t('Order Food Now')}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </RippleButton>

            <button onClick={() => scrollTo('about')}
              className="group flex items-center gap-2 px-6 py-4 rounded-2xl font-outfit font-semibold text-base
                bg-white/5 backdrop-blur-sm text-white border border-white/15 hover:border-white/30
                hover:bg-white/10 transition-all duration-300">
              {t('Explore More')}
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-xs font-outfit tracking-widest uppercase text-gray-500">{t('Scroll')}</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ y: [0, 16, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      </section>
    );
  };

  /* ─── FEATURE CARDS SECTION ─── */
  const FeaturesSection = () => {
    const features = [
      {
        icon: <span className="text-4xl">🍽</span>,
        title: t('Order Food'),
        desc: t('Browse menu, customize food, place your order instantly from your table.'),
        btn: t('Order Now'),
        action: handleOrderFood,
        gradient: 'from-[#7C3AED] to-[#5B21B6]',
        glow: 'shadow-purple-500/20 hover:shadow-purple-500/40',
      },
      {
        icon: <span className="text-4xl">👨‍🍳</span>,
        title: t('Kitchen Portal'),
        desc: t('Kitchen receives every order instantly. Real-time updates ensure perfect timing.'),
        btn: t('Open Kitchen'),
        action: () => { setEmail('kitchen@quickserve.com'); setShowKitchenLogin(true); },
        gradient: 'from-amber-500 to-amber-700',
        glow: 'shadow-amber-500/20 hover:shadow-amber-500/40',
      },
      {
        icon: <span className="text-4xl">🛠</span>,
        title: t('Admin Dashboard'),
        desc: t('Manage menu, tables, payments, reports and staff — all in one place.'),
        btn: t('Open Admin'),
        action: () => { setEmail('admin@quickserve.com'); setShowAdminLogin(true); },
        gradient: 'from-emerald-500 to-emerald-700',
        glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
      },
    ];

    return (
      <section id="features" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Our Services" title={t('Seamless Dining Experience')}
            subtitle={t('From ordering to kitchen to management — everything connected in real time.')} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i}
                className={`group relative glass-card rounded-3xl p-8 md:p-10 hover:bg-white/8 transition-all duration-500
                  shadow-2xl ${f.glow} hover:scale-[1.02]`}>
                {/* Gradient Border Top */}
                <div className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r ${f.gradient} rounded-full`} />

                <div className="mb-6">{f.icon}</div>
                <h3 className="font-playfair text-2xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 font-outfit text-sm leading-relaxed mb-8">{f.desc}</p>

                <RippleButton onClick={f.action}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-outfit font-bold text-sm
                    bg-gradient-to-r ${f.gradient} text-white shadow-lg ${f.glow}
                    hover:scale-[1.02] transition-all duration-300`}>
                  {f.btn}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </RippleButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ─── ABOUT SECTION ─── */
  const AboutSection = () => (
    <section id="about" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image */}
          <motion.div variants={slideLeft} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="relative">
            <div className="relative rounded-3xl overflow-hidden luxury-shadow">
              <img src={GALLERY[0]} alt="Premium Cuisine" className="w-full h-[400px] md:h-[500px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            {/* Floating Badge */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -right-4 md:right-8 glass-card rounded-2xl px-6 py-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center">
                <Star size={20} className="text-amber-400 fill-amber-400" />
              </div>
              <div>
                <span className="text-2xl font-playfair font-bold text-white">4.9</span>
                <p className="text-xs font-outfit text-gray-400">{t('Customer Rating')}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Text */}
          <motion.div variants={slideRight} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-outfit font-semibold tracking-[0.2em] uppercase mb-6
              bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20 text-amber-400">
              <Sparkles size={12} /> {t('Our Story')}
            </span>

            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              {t('Welcome to')}{' '}
              <span className="text-gradient-purple">{t('QuickServe')}</span>{' '}
              <span className="text-gradient-gold">{t('Premium Dining')}</span>
            </h2>

            <p className="text-gray-400 font-outfit text-base md:text-lg leading-relaxed mb-8">
              {t('Experience exceptional cuisine served with elegance and speed. Our digital ordering platform ensures seamless service directly from your table while chefs prepare your meals in real time.')}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: <Leaf size={20} />, label: t('Farm Fresh') },
                { icon: <ChefHat size={20} />, label: t('Expert Chefs') },
                { icon: <Clock size={20} />, label: t('Fast Service') },
                { icon: <ShieldCheck size={20} />, label: t('Hygienic Food') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                  <span className="text-[#7C3AED]">{item.icon}</span>
                  <span className="text-sm font-outfit font-medium text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>

            <RippleButton onClick={handleOrderFood}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-outfit font-bold text-sm
                bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25
                hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300">
              {t('Reserve Your Table')}
              <ArrowRight size={16} />
            </RippleButton>
          </motion.div>
        </div>
      </div>
    </section>
  );

  /* ─── STATISTICS SECTION ─── */
  const StatsSection = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const stats = [
      { value: 50, suffix: '+', label: t('Premium Dishes') },
      { value: 25, suffix: '', label: t('Dining Tables') },
      { value: 1000, suffix: '+', label: t('Happy Customers') },
      { value: 4.9, suffix: '★', label: t('Customer Rating'), isDecimal: true },
    ];

    return (
      <section ref={ref} className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/10 via-transparent to-amber-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-card rounded-3xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="text-center">
                <div className="font-playfair text-4xl md:text-5xl font-bold text-white mb-2">
                  <CountUp end={s.value} inView={inView} isDecimal={s.isDecimal} />
                  <span className="text-gradient-gold">{s.suffix}</span>
                </div>
                <p className="text-sm font-outfit text-gray-400 tracking-wider uppercase">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ─── WHY CHOOSE US ─── */
  const WhyChooseUs = () => {
    const reasons = [
      { icon: <Leaf size={28} />, title: t('Fresh Ingredients'), desc: t('Locally sourced, organic ingredients prepared daily for maximum freshness.') },
      { icon: <ChefHat size={28} />, title: t('Expert Chefs'), desc: t('Award-winning culinary team with decades of combined experience.') },
      { icon: <Clock size={28} />, title: t('Fast Service'), desc: t('Average order-to-table time of 15 minutes with real-time tracking.') },
      { icon: <CreditCard size={28} />, title: t('Secure Payments'), desc: t('End-to-end encrypted payments with multiple payment options.') },
      { icon: <Sparkles size={28} />, title: t('Luxury Dining'), desc: t('Elegant ambiance designed for unforgettable dining experiences.') },
      { icon: <Activity size={28} />, title: t('Real-Time Tracking'), desc: t('Track your order from kitchen to table with live status updates.') },
    ];

    return (
      <section id="why-us" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Why QuickServe" title={t('Why Choose Us')}
            subtitle={t('Excellence in every detail — from ingredients to service to technology.')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((r, i) => (
              <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={i}
                className="group glass-card rounded-2xl p-7 hover:bg-white/8 hover:scale-[1.02] transition-all duration-500
                  hover:shadow-xl hover:shadow-purple-500/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-purple-600/10 border border-purple-500/20
                  flex items-center justify-center text-[#7C3AED] mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/20
                  transition-all duration-300">
                  {r.icon}
                </div>
                <h3 className="font-playfair text-lg font-bold text-white mb-2">{r.title}</h3>
                <p className="text-sm font-outfit text-gray-400 leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ─── GALLERY SECTION ─── */
  const GallerySection = () => (
    <section id="gallery" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Gallery" title={t('Culinary Masterpieces')}
          subtitle={t('Every dish is crafted with passion, plated with precision, and served with pride.')} />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GALLERY.map((img, i) => (
            <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={i}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer
                ${i === 0 ? 'md:row-span-2 md:col-span-1' : ''}
                ${i === 0 ? 'h-64 md:h-full' : 'h-48 md:h-64'}`}>
              <img src={img} alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0
                transition-all duration-500">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, j) => <Star key={j} size={10} className="text-amber-400 fill-amber-400" />)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ─── TESTIMONIALS ─── */
  const TestimonialsSection = () => (
    <section id="testimonials" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Testimonials" title={t('What Our Guests Say')}
          subtitle={t('Hear from our valued guests about their dining experiences.')} />

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card rounded-3xl p-8 md:p-12 text-center">
              {/* Quote */}
              <Quote size={40} className="text-[#7C3AED]/30 mx-auto mb-6" />

              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(TESTIMONIALS[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="font-outfit text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl mx-auto italic">
                &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
              </p>

              {/* Avatar & Name */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center
                  text-white font-outfit font-bold text-sm">
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <h4 className="font-outfit font-bold text-white">{TESTIMONIALS[activeTestimonial].name}</h4>
                  <p className="text-xs font-outfit text-gray-400">{TESTIMONIALS[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeTestimonial
                    ? 'w-8 h-2 bg-gradient-to-r from-[#7C3AED] to-amber-400'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`} />
            ))}
          </div>

          {/* Arrows */}
          <button onClick={() => setActiveTestimonial(p => p === 0 ? TESTIMONIALS.length - 1 : p - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-12
              w-10 h-10 rounded-full glass-card flex items-center justify-center text-white
              hover:bg-white/10 transition-all">
            <ArrowLeft size={18} />
          </button>
          <button onClick={() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-12
              w-10 h-10 rounded-full glass-card flex items-center justify-center text-white
              hover:bg-white/10 transition-all">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );

  /* ─── FOOTER ─── */
  const Footer = () => (
    <footer id="footer" className="relative pt-20 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center">
                <Utensils size={18} className="text-white" />
              </div>
              <div>
                <span className="font-playfair text-xl font-bold text-white">QuickServe</span>
                <p className="text-[9px] font-outfit tracking-[0.2em] uppercase text-amber-400/80">Premium Dining</p>
              </div>
            </div>
            <p className="text-sm font-outfit text-gray-400 leading-relaxed">
              {t('Where culinary excellence meets digital innovation. Experience the future of fine dining.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-outfit font-bold text-white text-sm uppercase tracking-wider mb-5">{t('Quick Links')}</h4>
            <ul className="space-y-3">
              {[ ['Home','hero'], ['About Us','about'], ['Our Menu','features'], ['Gallery','gallery'] ].map(([label, id]) => (
                <li key={id}><button onClick={() => scrollTo(id)}
                  className="text-sm font-outfit text-gray-400 hover:text-[#7C3AED] transition-colors">{t(label)}</button></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-outfit font-bold text-white text-sm uppercase tracking-wider mb-5">{t('Contact Us')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-outfit text-gray-400">
                <Mail size={14} className="text-[#7C3AED]" /> info@quickserve.com
              </li>
              <li className="flex items-center gap-2 text-sm font-outfit text-gray-400">
                <Phone size={14} className="text-[#7C3AED]" /> +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-sm font-outfit text-gray-400">
                <MapPin size={14} className="text-[#7C3AED] mt-0.5" /> 123 Luxury Avenue,<br />Chennai, Tamil Nadu
              </li>
            </ul>
          </div>

          {/* Social & CTA */}
          <div>
            <h4 className="font-outfit font-bold text-white text-sm uppercase tracking-wider mb-5">{t('Follow Us')}</h4>
            <div className="flex items-center gap-3 mb-6">
              {[Globe, Share2, ExternalLink].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-gray-400
                    hover:text-[#7C3AED] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <RippleButton onClick={handleOrderFood}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-outfit font-bold text-sm
                bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-purple-500/25
                hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300">
              🍽 {t('Order Now')}
            </RippleButton>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-outfit text-gray-500">
            © {new Date().getFullYear()} QuickServe Premium Dining. {t('All rights reserved.')}
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs font-outfit text-gray-500 hover:text-gray-300 transition-colors">{t('Privacy Policy')}</a>
            <a href="#" className="text-xs font-outfit text-gray-500 hover:text-gray-300 transition-colors">{t('Terms of Service')}</a>
          </div>
        </div>
      </div>
    </footer>
  );

  /* ─── TABLE SELECTION MODAL ─── */
  const TableModal = () => (
    <AnimatePresence>
      {showTableModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setShowTableModal(false)}>
          <motion.div initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="relative px-8 pt-8 pb-6">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7C3AED] via-amber-400 to-[#7C3AED]" />
              <button onClick={() => setShowTableModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10
                  flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center">
                  <Utensils size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-white">{t('Select Your Table')}</h2>
                  <p className="text-xs font-outfit text-gray-400">{t('Choose your table to begin ordering')}</p>
                </div>
              </div>
            </div>

            {/* Table Grid */}
            <div className="px-8 pb-8 overflow-y-auto max-h-[60vh] hide-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {[...Array(20)].map((_, i) => {
                  const num = i + 1;
                  return (
                    <motion.button key={num} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => selectTable(num)}
                      className="group relative aspect-square rounded-2xl glass-card flex flex-col items-center justify-center gap-1
                        hover:bg-gradient-to-br hover:from-[#7C3AED]/20 hover:to-purple-600/10 hover:border-purple-500/30
                        transition-all duration-300 cursor-pointer">
                      <span className="text-lg">🪑</span>
                      <span className="font-outfit font-bold text-white text-sm group-hover:text-gradient-purple">
                        {num}
                      </span>
                      <span className="text-[9px] font-outfit text-gray-500 uppercase tracking-wider">{t('Table')}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─── AUTH MODALS ─── */
  const AuthModal = ({ isOpen, onClose, title, onSubmit, icon }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center mb-4">
                <span className="text-2xl">{icon}</span>
              </div>
              <h2 className="font-playfair text-2xl font-bold text-white text-center">{title}</h2>
              <p className="text-gray-400 text-sm mt-2">Secure access required</p>
            </div>
            {authError && <p className="text-red-400 text-sm text-center mb-4 font-outfit bg-red-500/10 py-2 rounded-lg border border-red-500/20">{authError}</p>}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors" />
              <RippleButton className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold font-outfit py-3 rounded-xl mt-2 tracking-wide hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                Authenticate
              </RippleButton>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─── MAIN RENDER ─── */
  return (
    <div className="landing-page bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <StatsSection />
      <WhyChooseUs />
      <GallerySection />
      <TestimonialsSection />
      <Footer />
      <TableModal />
      <AuthModal isOpen={showAdminLogin} onClose={() => { setShowAdminLogin(false); setAuthError(''); }} title="Admin Login" icon="🛠" onSubmit={handleAdminAuth} />
      <AuthModal isOpen={showKitchenLogin} onClose={() => { setShowKitchenLogin(false); setAuthError(''); }} title="Kitchen Login" icon="👨‍🍳" onSubmit={handleKitchenAuth} />
    </div>
  );
};

/* ─── CountUp helper ─── */
const CountUp = ({ end, inView, isDecimal }) => {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const duration = 2000;
    const step = isDecimal ? 0.1 : Math.max(1, Math.floor(end / (duration / 16)));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [end, inView, isDecimal]);
  return <>{count}</>;
};

export default LandingPage;
