import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

// Componente Pulsante Menu (Stile MKWii Options riutilizzato)
const MenuButton = ({ title, onClick, icon, color = "default" }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative w-full h-24 md:h-32 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                       flex items-center justify-between px-8 overflow-hidden transition-all duration-200 
                       hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:bg-black/70 active:scale-95"
        >
            {/* Effetto bagliore interno */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            
            {/* Icona Sinistra */}
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-[#886600] group-hover:border-[#ffcc00] shadow-inner">
                <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
            </div>

            {/* Testo Centrale */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl md:text-5xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                    {title}
                </span>
            </div>

            {/* Freccia Destra */}
            <div className="w-8 flex justify-center">
                <div className="w-4 h-4 border-t-4 border-r-4 border-[#aa8800] rotate-45 group-hover:border-[#ffcc00] group-hover:translate-x-1 transition-all"></div>
            </div>
        </button>
    );
};

export const RoomSelection = ({ onCreateRoom, onJoinRoom, socket }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();
  const { playSfx } = useAudio();

  // Listen for room_state
  useEffect(() => {
    if (socket) {
      const handleRoomState = (data) => {
          navigate('/character');
      };
      
      socket.on('room_state', handleRoomState);
      return () => socket.off('room_state', handleRoomState);
    }
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(code);
  };

  const handleJoinClick = () => {
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    setShowJoinInput(true);
  };

  const handleConfirmJoin = () => {
    if (roomCode.trim()) {
      playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  const handleBack = () => {
      playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
      if (showJoinInput) {
          setShowJoinInput(false);
          setRoomCode('');
      } else {
          navigate('/menu');
      }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden font-sans select-none">
        
        {/* 1. SFONDO SFUOCATO DIETRO (Coerente con MainMenu) */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center scale-110"
            style={{ 
                backgroundImage: "url('/sprites/TitleScreen.jpg')",
                filter: "blur(6px)"
            }}
        />

        {/* 2. OVERLAY BIANCO "SCANLINES" */}
        <div 
            className="absolute inset-0 z-10 opacity-80"
            style={{
                background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)"
            }}
        />

        {/* 3. CONTENUTO UI */}
        <div className="relative z-20 w-full h-full flex flex-col">
            
            {/* HEADER STILE MKWII */}
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
                            Multiplayer
                        </h1>
                    </div>
                </div>
            </div>

            {/* AREA CENTRALE */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 w-full">
                
                {/* 1. SELEZIONE MODALITÀ (CREATE / JOIN) */}
                {!showJoinInput ? (
                    <div className="flex flex-col gap-8 w-full max-w-3xl animate-in fade-in zoom-in duration-300">
                        <MenuButton 
                            title="Create Room" 
                            icon="🏁" 
                            onClick={handleCreateRoom} 
                        />
                        <MenuButton 
                            title="Join Room" 
                            icon="🚪" 
                            onClick={handleJoinClick} 
                        />
                    </div>
                ) : (
                    /* 2. INPUT JOIN ROOM (Stile Pannello Wii) */
                    <div className="w-full max-w-2xl bg-black/60 border-4 border-[#aa8800] rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300 backdrop-blur-sm">
                        
                        <h2 className="text-3xl font-bold text-[#ffcc00] text-center mb-8 uppercase drop-shadow-md tracking-widest border-b-2 border-[#aa8800] pb-4">
                            Enter Room Code
                        </h2>

                        <div className="flex flex-col gap-6 items-center">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="CODE"
                                maxLength={6}
                                autoFocus
                                className="w-full text-center text-5xl font-black tracking-[0.5em] py-6 rounded-md border-4 border-[#666] bg-white text-[#333] focus:outline-none focus:border-[#aa8800] focus:ring-4 focus:ring-[#aa8800]/50 transition-all placeholder-gray-300 uppercase shadow-inner"
                            />

                            <button 
                                onClick={handleConfirmJoin}
                                disabled={!roomCode.trim()}
                                className={`
                                    group relative w-full h-20 mt-4 border-2 border-[#aa8800] rounded-full shadow-lg overflow-hidden transition-all
                                    ${roomCode.trim() 
                                        ? 'bg-gradient-to-b from-[#0099ff] to-[#0055aa] hover:scale-105 hover:shadow-[0_0_20px_#0088dd] cursor-pointer' 
                                        : 'bg-gray-600 grayscale opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/30 rounded-t-full"></div>
                                <span className="text-3xl font-bold text-white uppercase drop-shadow-md tracking-wider group-hover:text-yellow-100">
                                    Connect
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER / BACK BUTTON */}
            <div className="h-[12vh] w-full flex items-center px-12 relative">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                </button>
            </div>
        </div>
    </div>
  );
};