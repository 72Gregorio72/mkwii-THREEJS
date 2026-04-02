import React from 'react';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const LobbyScreen = ({ isHost, players = [], onStartRace, roomId }) => {
  return (
    <>
      <style>{mkwiiFontStyle}</style>
      
      {/* Container Principale (Overlay a tutto schermo) */}
      <div className="fixed inset-0 z-[2000] font-sans select-none text-white overflow-hidden">
        
        {/* 1. SFONDO SFUOCATO DIETRO */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center scale-110"
            style={{ 
                backgroundImage: "url('/sprites/TitleScreen.jpg')",
                filter: "blur(6px)"
            }}
        />

        {/* 2. OVERLAY SCANLINES */}
        <div 
            className="absolute inset-0 z-10 opacity-80"
            style={{
                background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)"
            }}
        />

        {/* 3. UI CONTENT */}
        <div className="relative z-20 w-full h-full flex flex-col">

            {/* HEADER CURVO (Stile MKWii) */}
            <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                        <path 
                            d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" 
                            fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <div className="absolute bottom-15 left-12 z-20">
                        <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                            Race Lobby
                        </h1>
                    </div>
                </div>
            </div>

            {/* AREA CENTRALE */}
            <div className="flex-1 flex flex-col items-center justify-center pt-[15vh] pb-4 px-8 w-full">
                
                {/* PANNELLO PRINCIPALE (Stile Dark/Gold) */}
                <div className="w-full max-w-4xl h-[70vh] bg-black/80 border-4 border-[#aa8800] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col p-6 backdrop-blur-md relative overflow-hidden">
                    
                    {/* Background Rigato Sottile Pannello */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                            style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                    </div>

                    {/* Header Pannello (Room ID & Host Status) */}
                    <div className="flex justify-between items-center border-b-2 border-[#aa8800] pb-4 mb-4 z-10">
                        <div className="flex flex-col">
                            <span className="text-[#aa8800] text-sm font-bold uppercase tracking-widest">Room ID</span>
                            <span className="text-3xl font-mono font-bold text-white tracking-wider drop-shadow-md">
                                {roomId || 'N/A'}
                            </span>
                        </div>

                        {isHost && (
                            <div className="bg-[#ffcc00] text-black px-4 py-1 rounded-full border-2 border-white shadow-md animate-pulse">
                                <span className="font-black uppercase tracking-wide text-sm">👑 You are Host</span>
                            </div>
                        )}
                    </div>

                    {/* LISTA GIOCATORI */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 z-10">
                        <div className="flex justify-between items-end mb-2 px-2">
                            <h3 className="text-2xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                                Racers
                            </h3>
                            <span className="text-[#ddccaa] font-bold text-lg">
                                {players.length} / 12
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {players.map((player, index) => (
                                <div 
                                    key={player.id || index} 
                                    className={`
                                        group relative h-14 flex items-center px-4 rounded border-l-4 shadow-sm transition-all gap-2
                                        ${player.isHost 
                                            ? 'bg-gradient-to-r from-[#332200] to-transparent border-[#ffcc00]' 
                                            : 'bg-gradient-to-r from-[#111] to-transparent border-[#666]'
                                        }
                                    `}
                                >
                                    {/* Numero */}
                                    <div className="w-8 text-[#666] font-mono text-xl font-bold mr-4">
                                        {index + 1}.
                                    </div>

                                    {/* Nome & Icona */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-9 h-9 rounded-full bg-black/50 border border-white/20 shadow-inner overflow-hidden flex items-center justify-center">
                                            <img
                                                src={player.icon ? `/sprites/${player.icon}` : '/sprites/Mario.png'}
                                                alt={player.username || `Player ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.src = '/sprites/Mario.png'; }}
                                            />
                                        </div>
                                        <span className={`text-xl font-bold tracking-wide ${player.isHost ? 'text-[#ffcc00]' : 'text-white'}`}>
                                            {player.username || `Player ${index + 1}`}
                                        </span>
                                    </div>

                                    {/* Punti */}
                                    <div className="flex items-center gap-2 px-4 py-1 bg-black/40 rounded border border-[#ffcc00]/50">
                                        <span className="text-[#ffcc00] font-bold text-lg">{player.points || 0}</span>
                                        <span className="text-[#ffcc00] text-sm font-semibold">pts</span>
                                    </div>

                                    {/* Status Ready */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#00ff00] shadow-[0_0_8px_#00ff00] animate-pulse"></div>
                                        <span className="text-[#00ff00] font-bold uppercase text-xs tracking-wider">Ready</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FOOTER ACTIONS (Start Button / Waiting Message) */}
                    <div className="mt-6 pt-4 border-t border-[#aa8800]/50 z-10 flex justify-center">
                        {isHost ? (
                            <button
                                onClick={onStartRace}
                                className="group relative w-full md:w-2/3 py-4 bg-[#22c55e] border-y-2 border-x-4 border-[#15803d] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                           flex items-center justify-center overflow-hidden transition-all duration-200 
                                           hover:scale-105 hover:brightness-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                <span className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-md flex items-center gap-3">
                                    🏁 Start Race
                                </span>
                            </button>
                        ) : (
                            <div className="w-full md:w-2/3 py-4 bg-black/40 border-2 border-[#ffcc00] rounded-full flex items-center justify-center gap-3 animate-pulse">
                                <span className="w-3 h-3 bg-[#ffcc00] rounded-full"></span>
                                <span className="text-[#ffcc00] font-bold uppercase tracking-wider text-lg">
                                    Waiting for Host...
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            
            {/* Footer Text */}
            <div className="h-[8vh] flex justify-center items-start z-20">
                 <span className="text-gray-400 font-mono text-sm bg-black/50 px-4 py-1 rounded-full border border-gray-600">
                    {isHost ? 'Waiting for players...' : 'Prepare your engines!'}
                 </span>
            </div>

        </div>
      </div>

      {/* Scrollbar Custom CSS (Dorata) */}
      <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 10px;
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
    </>
  );
};