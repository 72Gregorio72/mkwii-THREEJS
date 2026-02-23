import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

// Font Injection (se non già presente globalmente)
const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const RaceResults = ({ finishers, socket, isTimeTrial, onPlayAgain, setIsTimeTrial }) => {
  const navigate = useNavigate();
  const { playSfx } = useAudio();

  // Se non ci sono risultati, non mostrare nulla
  if (!finishers || finishers.length === 0) return null;

  // Split colonne (1-6 a sinistra, 7-12 a destra)
  const leftColumn = finishers.slice(0, 6);
  const rightColumn = finishers.slice(6, 12);

  const handleQuit = () => {
    playSfx(AUDIO_SFX.BACK);
    if (isTimeTrial) {
        setIsTimeTrial(false);
    }
    navigate('/menu');
  };

  const handlePlayAgain = () => {   
    playSfx(AUDIO_SFX.CONFIRM);
    if (onPlayAgain) {
        setIsTimeTrial(true);
        onPlayAgain();
    } else {
        navigate('/game');
    }
  };

  const RenderRow = ({ finisher, index, offset = 0 }) => {
    const position = index + 1 + offset;
    const isMe = finisher.id === socket?.id;
    
    // Colori Rank
    let rankColor = 'text-white';
    let rankIcon = null;
    let bgGradient = 'from-black/60 to-transparent';
    let borderColor = 'border-gray-600';

    if (position === 1) {
        rankColor = 'text-[#FFD700]'; // Oro
        rankIcon = '🏆';
        bgGradient = 'from-[#332200] to-transparent';
        borderColor = 'border-[#FFD700]';
    } else if (position === 2) {
        rankColor = 'text-[#C0C0C0]'; // Argento
        rankIcon = '🥈';
        bgGradient = 'from-[#1a1a1a] to-transparent';
        borderColor = 'border-[#C0C0C0]';
    } else if (position === 3) {
        rankColor = 'text-[#CD7F32]'; // Bronzo
        rankIcon = '🥉';
        bgGradient = 'from-[#1a0f00] to-transparent';
        borderColor = 'border-[#CD7F32]';
    }

    // Override per il giocatore corrente
    if (isMe) {
        bgGradient = 'from-[#0033aa] to-transparent'; // Blu MKWii highlight
        borderColor = 'border-[#00aeff]';
    }

    // Nome Display
    let displayName = finisher.id;
    if (isMe) displayName = 'YOU';
    else if (finisher.id.startsWith('bot_')) {
       const parts = finisher.id.split('_');
       const botNum = parseInt(parts[1]) + 1;
       displayName = `CPU ${botNum}`;
    }

    return (
        <div 
            className={`
                flex items-center justify-between p-3 rounded-r-lg border-l-4 mb-2 shadow-sm
                bg-gradient-to-r ${bgGradient} ${borderColor}
                animate-in slide-in-from-left duration-500
            `}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center gap-4">
                {/* Posizione */}
                <div className={`w-12 text-3xl font-black italic ${rankColor} drop-shadow-md text-center`}>
                    {position}<span className="text-sm align-top opacity-70">.</span>
                </div>
                
                {/* Icona & Nome */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xl filter drop-shadow-md">
                            {rankIcon || (isMe ? '👤' : '🏎️')}
                        </span>
                        <span className={`text-xl font-bold uppercase tracking-wide drop-shadow-md ${isMe ? 'text-[#00aeff]' : 'text-white'}`}>
                            {displayName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tempo */}
            <div className="font-mono text-white/90 text-lg tracking-wider font-bold drop-shadow-sm bg-black/40 px-2 py-1 rounded">
                {finisher.finishTime || '--:--:---'}
            </div>
        </div>
    );
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      
      {/* CONTAINER PRINCIPALE: 
         - fixed inset-0: Copre tutto lo schermo
         - bg-black/40: Scurisce leggermente la gara sotto
         - backdrop-blur-sm: Sfoca leggermente la gara (effetto UI moderno/Wii U)
      */}
      <div className="fixed inset-0 z-[2000] font-sans select-none text-white flex flex-col bg-black/40 backdrop-blur-sm">
        
        {/* 3. CONTENUTO UI */}
        <div className="relative w-full h-full flex flex-col">

            {/* AREA CENTRALE (Tabellone) */}
            <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-8 w-full">
                
                {/* Box Risultati Opaco */}
                <div className="w-full max-w-7xl bg-black/90 border-4 border-[#aa8800] rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 relative overflow-hidden flex flex-col animate-in zoom-in duration-300">
                    
                    {/* Sfondo Griglia Decorativa (Solo dentro il box) */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)", backgroundSize: "40px 40px"}}>
                    </div>

                    {/* Titolo Tabella */}
                    <div className="flex justify-between items-center border-b-2 border-[#aa8800] pb-4 mb-4 z-10">
                        <h2 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                            Final Standing
                        </h2>
                        <span className="text-[#ddccaa] font-bold text-lg bg-black/60 px-4 py-1 rounded-full border border-[#aa8800]">
                            {finishers.length} Racers Finished
                        </span>
                    </div>

                    {/* Grid Colonne */}
                    <div className="flex-1 overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 content-start custom-scrollbar">
                        
                        {/* Colonna Sinistra (1-6) */}
                        <div className="flex flex-col">
                            {leftColumn.map((finisher, index) => (
                                <RenderRow key={finisher.id} finisher={finisher} index={index} offset={0} />
                            ))}
                        </div>

                        {/* Colonna Destra (7-12) */}
                        <div className="flex flex-col">
                            {rightColumn.map((finisher, index) => (
                                <RenderRow key={finisher.id} finisher={finisher} index={index} offset={6} />
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER / QUIT BUTTON */}
            <div className="h-[12vh] w-full flex items-center justify-end px-12 relative z-30">
                
                <button 
                    onClick={handleQuit}
                    className="flex items-center gap-3 bg-white px-10 py-3 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50 group-hover:scale-110 transition-transform">
                        ➜
                    </div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">
                        Quit
                    </span>
                </button>

                {isTimeTrial && (
                    <button 
                        onClick={handlePlayAgain}
                        className="flex items-center gap-3 bg-white px-10 py-3 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[8px] hover:bg-[#f0f0f0] transition-all cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff44ff] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50 group-hover:scale-110 transition-transform">
                            ➜
                        </div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">
                            Play Again
                        </span>
                    </button>
                )}

            </div>

        </div>
      </div>

       {/* Scrollbar Custom CSS */}
       <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.3);
                border-left: 1px solid #aa8800;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #aa8800;
                border: 1px solid #ffcc00;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ffcc00;
            }
      `}</style>
    </>
  );
};