import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Search, Utensils, ShieldCheck, ArrowRight, Star, Award, Clock, ChevronDown } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { tableNumber } = useHotel();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#7c3aed]/85 backdrop-blur-sm font-sans selection:bg-black selection:text-white pb-20 overflow-x-hidden">
      
      {/* Header */}
      <nav className="relative z-50">
        <div className="max-w-[1500px] mx-auto px-6 h-28 flex justify-between items-center text-white">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
             <div className="bg-white text-[#7c3aed] p-2 rounded-2xl shadow-xl shadow-black/10 transition-transform group-hover:rotate-6">
                <Utensils size={32} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter">QUICKSERVE</span>
                <span className="text-[10px] font-black opacity-80 tracking-[0.2em] -mt-1 uppercase">Premium Dining</span>
             </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10 font-bold text-[14px]">
            <a href="#" className="hover:opacity-70 transition-opacity">{t('QuickServe Corporate')}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{t('Partner with us')}</a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="max-w-[1500px] mx-auto px-6 pt-12 text-center">
        <h1 className="text-white text-5xl md:text-7xl font-black leading-tight mb-12 tracking-tight">
          {t('Order food & cravings. Discover')}<br />
          {t('best hotel items. QuickServe it!')}
        </h1>

        {/* Large Swiggy-Style Search Bars */}
        <div className="flex flex-col md:flex-row max-w-5xl mx-auto gap-0 mb-32 relative z-10 shadow-2xl rounded-[1.5rem] overflow-hidden">
          <div className="bg-white flex-1 flex items-center px-8 py-6 text-left border-r border-gray-100 cursor-text">
            <MapPin className="text-[#ff5200] mr-4" size={24} />
            <div className="flex-1">
               <input 
                type="text" 
                value={tableNumber ? `Table ${tableNumber}` : t('Enter Table...')}
                readOnly
                className="w-full text-lg outline-none font-bold text-gray-400 bg-transparent"
              />
            </div>
            <ChevronDown className="text-gray-400 ml-4" size={20} />
          </div>
          
          <div className="bg-white flex-[1.8] flex items-center px-8 py-6 text-left cursor-text" onClick={() => tableNumber ? navigate('/menu') : null}>
            <div className="flex-1 border-l border-gray-100 pl-8">
               <input 
                type="text" 
                placeholder={t('Search for restaurant, item or more')} 
                className="w-full text-lg outline-none text-gray-400 font-bold placeholder:text-gray-300"
              />
            </div>
            <Search className="text-gray-400 ml-4" size={20} />
          </div>
        </div>

        {/* 3 Large Swiggy-Style Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1400px] mx-auto text-left mb-20">
          
          {/* Card 1: GOURMET DINING */}
          <div 
            onClick={() => tableNumber ? navigate('/menu') : alert('Please use a valid table link.')}
            className="group bg-white rounded-[2.5rem] p-10 relative overflow-hidden h-[340px] cursor-pointer hover:shadow-2xl transition-all duration-300 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)]"
          >
            <div className="relative z-10 flex flex-col h-full">
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-1">{t('GOURMET')}</h2>
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-2">{t('DINING')}</h2>
               <p className="text-[#1a1a1b]/40 font-bold text-lg mb-6">{t('DIRECT FROM KITCHEN')}</p>
               <div className="bg-orange-50 text-[#ff5200] font-black px-3 py-1.5 rounded-lg text-xs inline-block w-fit mb-auto">
                  {t('UPTO 60% OFF')}
               </div>
               <div className="bg-[#7c3aed] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <ArrowRight size={28} strokeWidth={3} />
               </div>
            </div>
            <img 
               src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80" 
               className="absolute top-1/2 left-[40%] w-[320px] h-[320px] object-cover rounded-full shadow-2xl transform translate-y-[-10%] group-hover:scale-105 transition-transform duration-500" 
               alt="Gourmet" 
            />
          </div>

          {/* Card 2: EXPRESS TREATS */}
          <div 
            onClick={() => tableNumber ? navigate('/menu') : alert('Please use a valid table link.')}
            className="group bg-white rounded-[2.5rem] p-10 relative overflow-hidden h-[340px] cursor-pointer hover:shadow-2xl transition-all duration-300 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)]"
          >
            <div className="relative z-10 flex flex-col h-full">
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-1">{t('EXPRESS')}</h2>
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-2">{t('TREATS')}</h2>
               <p className="text-[#1a1a1b]/40 font-bold text-lg mb-6">{t('QUICK SNACKS')}</p>
               <div className="bg-orange-50 text-[#ff5200] font-black px-3 py-1.5 rounded-lg text-xs inline-block w-fit mb-auto">
                  {t('UPTO 40% OFF')}
               </div>
               <div className="bg-[#7c3aed] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <ArrowRight size={28} strokeWidth={3} />
               </div>
            </div>
            <img 
               src="https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80" 
               className="absolute top-1/2 left-[40%] w-[320px] h-[320px] object-cover shadow-2xl transform translate-y-[-10%] group-hover:scale-105 transition-transform duration-500" 
               alt="Quick" 
            />
          </div>

          {/* Card 3: SIGNATURE PLATTERS */}
          <div 
            onClick={() => tableNumber ? navigate('/menu') : alert('Please use a valid table link.')}
            className="group bg-white rounded-[2.5rem] p-10 relative overflow-hidden h-[340px] cursor-pointer hover:shadow-2xl transition-all duration-300 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)]"
          >
            <div className="relative z-10 flex flex-col h-full">
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-1">{t('SIGNATURE')}</h2>
               <h2 className="text-[#1a1a1b] font-black text-[2.7rem] tracking-tighter leading-none mb-2">{t('PLATTERS')}</h2>
               <p className="text-[#1a1a1b]/40 font-bold text-lg mb-6">{t('EAT & SAVE MORE')}</p>
               <div className="bg-orange-50 text-[#ff5200] font-black px-3 py-1.5 rounded-lg text-xs inline-block w-fit mb-auto">
                  {t('UPTO 50% OFF')}
               </div>
               <div className="bg-[#7c3aed] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <ArrowRight size={28} strokeWidth={3} />
               </div>
            </div>
            <img 
               src="https://images.unsplash.com/photo-1546272989-40c92939c6c2?auto=format&fit=crop&w=400&q=80" 
               className="absolute top-1/2 left-[40%] w-[320px] h-[320px] object-cover rounded-full shadow-2xl transform translate-y-[-10%] group-hover:scale-105 transition-transform duration-500" 
               alt="Platters" 
            />
          </div>

        </div>

        {/* Developer Preview Bypass */}
        {!tableNumber && (
          <div className="mt-10">
             <button 
               onClick={() => { window.location.href = '/menu?table=5'; }}
               className="text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
             >
               {t('Skip to Menu Preview (Table 5)')}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;



