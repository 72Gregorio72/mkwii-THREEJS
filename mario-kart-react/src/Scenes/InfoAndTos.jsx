import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

export const InfoAndTos = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('tos'); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSfx } = useAudio();

  useEffect(() => {
    fetch('/api/info')
      .then((res) => {
        if (!res.ok) throw new Error('Network response');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleBack = () => {
      playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
      navigate(-1);
  };

  const handleTabChange = (tab) => {
      if (activeTab !== tab) {
          playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
          setActiveTab(tab);
      }
  };

  // --- 2. RENDER STILE MKWII (Dark/Gold) ---

  // Loading State
  if (loading) return (
    <div className="w-screen h-screen flex items-center justify-center bg-black text-[#ffcc00] font-sans font-bold text-3xl tracking-widest uppercase">
        <div className="animate-pulse">Loading Data...</div>
    </div>
  );

  // Error State
  if (!data) return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white gap-6">
         <h1 className="text-4xl font-bold text-red-500 tracking-wider">CONNECTION ERROR</h1>
         <button 
            onClick={handleBack} 
            className="px-8 py-3 bg-gray-800 border-2 border-gray-500 text-white rounded-full hover:bg-gray-700 hover:border-white transition-all uppercase font-bold"
         >
            Return to Menu
         </button>
    </div>
  );

  const currentContent = activeTab === 'tos' ? data.tos : data.privacy;

  return (
    <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white">
        
        {/* BACKGROUND LAYER */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center scale-110"
            style={{ 
                backgroundImage: "url('/sprites/TitleScreen.jpg')",
                filter: "blur(6px)"
            }}
        />

        {/* SCANLINES OVERLAY */}
        <div 
            className="absolute inset-0 z-10 opacity-80"
            style={{
                background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)"
            }}
        />

        {/* UI CONTENT */}
        <div className="relative z-20 w-full h-full flex flex-col">
            
            {/* HEADER CURVO (Stile MKWii con SVG corretto) */}
            <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                        {/* Curva che 'evita' il tasto in alto a destra */}
                        <path 
                            d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" 
                            fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <div className="absolute bottom-15 left-12 z-20">
                        <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                            Privacy Policy and TOS
                        </h1>
                    </div>
                </div>
            </div>

            {/* AREA CENTRALE (Pannello Dati) */}
            <div className="flex-1 flex flex-col items-center justify-center pt-[15vh] pb-4 px-8 w-full">
                
                {/* CONTAINER PRINCIPALE (Stile Dark/Gold) */}
                <div className="w-full max-w-6xl h-[65vh] flex gap-6">
                    
                    {/* COLONNA SINISTRA (Tabs / Pulsanti) */}
                    <div className="w-1/3 flex flex-col gap-6 pt-4">
                        
                        {/* Tab Button: Rules */}
                        <button
                            onClick={() => handleTabChange('tos')}
                            className={`
                                group relative w-full h-24 border-y-2 border-x-4 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                flex items-center justify-between px-6 overflow-hidden transition-all duration-200
                                ${activeTab === 'tos' 
                                    ? 'bg-black/80 border-[#ffcc00] shadow-[0_0_20px_rgba(255,215,0,0.6)] scale-105 z-10' 
                                    : 'bg-black/60 border-[#aa8800] hover:border-[#ffeebb] hover:bg-black/70 hover:scale-105'
                                }
                            `}
                        >
                            {/* Bagliore interno */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>

                            {/* Testo */}
                            <div className="flex-1 text-right">
                                <span className={`text-2xl font-bold uppercase tracking-tight drop-shadow-md
                                    ${activeTab === 'tos' ? 'text-white' : 'text-[#ddccaa] group-hover:text-white'}
                                `}>
                                    Rules & TOS
                                </span>
                            </div>
                        </button>

                        {/* Tab Button: Privacy */}
                        <button
                            onClick={() => handleTabChange('privacy')}
                            className={`
                                group relative w-full h-24 border-y-2 border-x-4 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                flex items-center justify-between px-6 overflow-hidden transition-all duration-200
                                ${activeTab === 'privacy' 
                                    ? 'bg-black/80 border-[#ffcc00] shadow-[0_0_20px_rgba(255,215,0,0.6)] scale-105 z-10' 
                                    : 'bg-black/60 border-[#aa8800] hover:border-[#ffeebb] hover:bg-black/70 hover:scale-105'
                                }
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
{/*                             
                            <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 shadow-inner transition-colors
                                ${activeTab === 'privacy' ? 'bg-black/50 border-[#ffcc00]' : 'bg-black/30 border-[#aa8800] group-hover:border-[#ffcc00]'}
                            `}>
                                <span className="text-2xl filter drop-shadow-md">🛡️</span>
                            </div> */}

                            <div className="flex-1 text-right">
                                <span className={`text-2xl font-bold uppercase tracking-tight drop-shadow-md
                                    ${activeTab === 'privacy' ? 'text-white' : 'text-[#ddccaa] group-hover:text-white'}
                                `}>
                                    Privacy
                                </span>
                            </div>
                        </button>

                    </div>

                    {/* COLONNA DESTRA (Contenuto Testuale) */}
                    <div className="flex-1 h-full bg-black/60 border-4 border-[#aa8800] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col relative backdrop-blur-md overflow-hidden">
                        
                        {/* Background Rigato Sottile */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                             style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                        </div>

                        {/* Header Contenuto */}
                        <div className="h-24 border-b-2 border-[#aa8800] flex flex-col justify-center px-8 bg-black/40 z-10">
                            <h2 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                {currentContent?.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#aa8800] uppercase font-bold tracking-wider">Last Updated:</span>
                                <span className="text-sm text-white font-mono">{currentContent?.lastUpdated}</span>
                            </div>
                        </div>

                        {/* Testo Scrollabile */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar z-10">
                            <p className="whitespace-pre-line text-xl text-[#eee] leading-relaxed font-medium drop-shadow-md">
                                {currentContent?.content}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER / BACK BUTTON */}
            <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                </button>
            </div>
        </div>

        {/* Scrollbar Custom CSS (Stile Dorato) */}
        <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 14px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.4);
                border-left: 1px solid #aa8800;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #aa8800, #ffcc00, #aa8800);
                border: 2px solid #332200;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ffcc00;
            }
        `}</style>
    </div>
  );
};