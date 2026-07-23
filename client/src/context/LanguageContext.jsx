import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('quickserve_language'));
  const [showOthers, setShowOthers] = useState(false);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('quickserve_language', lang);
  };

  const t = (key) => {
    if (!language) return key;
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
      
      {!language && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center pb-20">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-3xl font-black text-[#1a1a1b] mb-2 tracking-tight">Welcome</h2>
            <p className="text-gray-500 font-medium mb-10">Please select your preferred language<br/>தயவுசெய்து உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
            
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={() => setLanguage('ta')}
                className="w-full bg-[#7c3aed] text-white font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-violet-200 text-xl"
              >
                தமிழ் (Tamil)
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className="w-full bg-[#1a1a1b] text-white font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-xl"
              >
                English
              </button>

              <button 
                onClick={() => setShowOthers(!showOthers)}
                className="w-full bg-gray-100 text-[#1a1a1b] font-bold py-3 rounded-xl hover:bg-gray-200 active:scale-95 transition-all outline-none mt-2 flex justify-center items-center gap-2 border border-gray-200"
              >
                {showOthers ? 'Hide Other Languages' : 'Other Languages'}
                <svg className={`w-4 h-4 transition-transform ${showOthers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {showOthers && (
                <div className="grid grid-cols-2 gap-3 mt-1 animate-in fade-in zoom-in duration-300 origin-top">
                  <button onClick={() => setLanguage('hi')} className="bg-white border-[1.5px] border-gray-200 text-[#3d4152] font-black py-3 rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors shadow-sm text-sm">
                    हिन्दी (Hindi)
                  </button>
                  <button onClick={() => setLanguage('te')} className="bg-white border-[1.5px] border-gray-200 text-[#3d4152] font-black py-3 rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors shadow-sm text-sm">
                    తెలుగు (Telugu)
                  </button>
                  <button onClick={() => setLanguage('ml')} className="bg-white border-[1.5px] border-gray-200 text-[#3d4152] font-black py-3 rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors shadow-sm text-sm">
                    മലയാളം (Malayalam)
                  </button>
                  <button onClick={() => setLanguage('kn')} className="bg-white border-[1.5px] border-gray-200 text-[#3d4152] font-black py-3 rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors shadow-sm text-sm">
                    ಕನ್ನಡ (Kannada)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
};
