import React, { useEffect, useState } from 'react';

export const InfoAndTos = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('tos'); 
  const [loading, setLoading] = useState(true);

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
        console.error("Errore fetch:", err);
        setLoading(false);
      });
  }, []);

  // Loader
  if (loading) return (
    <div className="min-h-screen bg-[#38b6ff] flex items-center justify-center font-sans">
        <div className="text-white text-2xl font-black animate-bounce tracking-widest drop-shadow-md">LOADING...</div>
    </div>
  );

  if (!data) return (
     <div className="min-h-screen bg-[#38b6ff] flex items-center justify-center font-sans">
        <div className="text-red-500 text-2xl font-black bg-white/90 p-6 rounded-xl border-4 border-red-500">ERROR CONNECTION 🛑</div>
    </div>
  );

  return (
    // SFONDO GENERALE (Blu come nel menu)
    <div className="min-h-screen w-full bg-[#38b6ff] flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      
      {/* CARD "MARIO KART" (Sfondo scuro, Bordo Giallo) */}
      <div className="relative w-full max-w-md bg-[#1e293b] rounded-[30px] border-[5px] border-[#fbbf24] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center">
        
        {/* TITOLO */}
        <h1 className="text-5xl font-black text-[#fbbf24] tracking-tighter mb-2 uppercase text-center drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]">
            MARIO KART
        </h1>
        
        <h2 className="text-white text-xl font-bold mb-6 tracking-wide drop-shadow-md">
            Information Board
        </h2>

        {/* PULSANTI DI SELEZIONE (Stile Create/Join Room) */}
        <div className="w-full flex flex-col gap-4 mb-4">
            
            {/* Pulsante VERDE (TOS) */}
            <button 
                onClick={() => setActiveTab('tos')}
                className={`w-full py-4 rounded-xl text-xl font-black text-white uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 border-b-[6px] active:border-b-0 active:translate-y-[6px]
                ${activeTab === 'tos' 
                    ? 'bg-[#22c55e] border-[#15803d] shadow-[0_0_15px_rgba(34,197,94,0.6)] brightness-110' 
                    : 'bg-[#22c55e] border-[#15803d] opacity-70 hover:opacity-100'
                }`}
            >
                🏁 RULES & TOS
            </button>

            {/* Pulsante BLU (Privacy) */}
            <button 
                onClick={() => setActiveTab('privacy')}
                className={`w-full py-4 rounded-xl text-xl font-black text-white uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 border-b-[6px] active:border-b-0 active:translate-y-[6px]
                ${activeTab === 'privacy' 
                    ? 'bg-[#0284c7] border-[#075985] shadow-[0_0_15px_rgba(2,132,199,0.6)] brightness-110' 
                    : 'bg-[#0284c7] border-[#075985] opacity-70 hover:opacity-100'
                }`}
            >
                 🛡️ PRIVACY
            </button>
        </div>

        {/* BOX TESTO (Scrollabile, stile "Console") */}
        <div className="w-full bg-black/40 rounded-xl p-4 border-2 border-white/10 mb-6 h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-[#fbbf24] scrollbar-track-transparent shadow-inner">
            <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2 sticky top-0 bg-[#1e293b]/0 backdrop-blur-sm">
                <span className="text-[#fbbf24] font-bold text-sm uppercase tracking-wider">
                    {activeTab === 'tos' ? data.tos.title : data.privacy.title}
                </span>
                <span className="text-gray-400 text-xs font-mono">
                    {activeTab === 'tos' ? data.tos.lastUpdated : data.privacy.lastUpdated}
                </span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line font-medium text-shadow-sm px-1">
                {activeTab === 'tos' ? data.tos.content : data.privacy.content}
            </p>
        </div>

        {/* PULSANTE BACK (Grigio scuro, stile "Back") */}
        <button 
            onClick={() => window.history.back()}
            className="w-full bg-[#4b5563] hover:bg-[#6b7280] text-gray-200 font-bold py-3 rounded-lg border-b-4 border-[#374151] active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm"
        >
            ← Back
        </button>

      </div>
    </div>
  );
};

export default InfoAndTos;