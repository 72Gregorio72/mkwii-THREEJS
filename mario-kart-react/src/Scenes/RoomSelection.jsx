import React, { useState, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { useUserStore } from '../store.js';
import { socket } from '../multiplayer/socket.js';

// Componente Pulsante Menu (Stile MKWii Options riutilizzato)
const MenuButton = ({ title, onClick, bgImage }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative w-full h-24 md:h-32 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                       flex items-center justify-center px-8 overflow-hidden transition-all duration-200 
                       hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:bg-black/70 active:scale-95"
        >
            {/* Immagine di sfondo del bottone */}
            {bgImage && (
                <div 
                    className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 scale-[1.25] group-hover:scale-[1.0] transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('${bgImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center'
                    }}
                />
            )}

            {/* Effetto bagliore interno */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>

            {/* Testo Centrale */}
            <div className="relative z-[2] flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl md:text-5xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                    {title}
                </span>
            </div>
        </button>
    );
};

export const RoomSelection = ({ onCreateRoom, onJoinRoom }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const navigate = useNavigate();
  const { playSfx, fadeOutMusic , changeTrack, enableSmoothLoop , getCurrentTrack } = useAudio();

  const {isLoggedIn: loggedIn, userName: username} = useUserStore();

  useEffect(() => {
    if (getCurrentTrack() !== 'MENU') {
        changeTrack('MENU', 100);
        enableSmoothLoop();
    }
  }, [changeTrack, enableSmoothLoop]);
  // Listen for room_state
  useEffect(() => {
    if (socket) {
      const handleRoomState = (data) => {
          setFadeToBlack(true);
          fadeOutMusic(700);
          setTimeout(() => {
              navigate('/character');
          }, 700);
      };
      
      socket.on('room_state', handleRoomState);
      return () => socket.off('room_state', handleRoomState);
    }
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(code, username);
  };

  const handleJoinClick = () => {
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    setShowJoinInput(true);
  };

  const handleConfirmJoin = () => {
    if (roomCode.trim()) {
      playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
      onJoinRoom(roomCode.trim().toUpperCase(), username);
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
        
        {/* --- OVERLAY FADE TO BLACK */}
        <div 
            className={`fixed inset-0 bg-black z-[9999] pointer-events-none transition-opacity duration-700 ease-in-out ${fadeToBlack ? 'opacity-100' : 'opacity-0'}`}
        />

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

                    {/* --- TASTO PROFILO / LICENSE (Accanto a Info) --- */}
                    {loggedIn && (
                        <div 
                            onClick={() => handleNavigate('/profile')}
                            className="absolute top-18 right-28 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                        >
                            <div className="relative w-14 h-14 md:w-16 md:h-16">
                                {/* Halo */}
                                <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                                
                                {/* Cerchio Verde Lucido */}
                                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#22cc22] to-[#008800] border-[3px] border-white ring-[3px] ring-[#00aa00] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                    {/* Riflesso */}
                                    <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                                    <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                        👤
                                    </span>
                                </div>
                            </div>

                            {/* Label 'License' */}
                            <div className="absolute -bottom-2 -right-1 bg-[#008800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                                License
                            </div>
                        </div>
                    )}

                    {loggedIn && (
                        <div 
                            onClick={() => navigate('/friends')}
                            className="absolute top-26 right-52 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                        >
                            <div className="relative w-14 h-14 md:w-16 md:h-16">
                                {/* Halo */}
                                <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                                
                                {/* Cerchio Giallo Lucido */}
                                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#ffcc00] to-[#aa8800] border-[3px] border-white ring-[3px] ring-[#cc9900] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                    {/* Riflesso */}
                                    <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                                    <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                        🌍
                                    </span>
                                </div>
                            </div>

                            {/* Label 'Friends' */}
                            <div className="absolute -bottom-2 -right-1 bg-[#aa8800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                                Friends
                            </div>
                        </div>
                    )}

                    {/* TASTO SETTINGS / INFO (Destra Estrema) */}
                    <div 
                        onClick={() => handleNavigate('/info')}
                        className="absolute top-2 right-4 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                    >
                        <div className="relative w-16 h-16 md:w-20 md:h-20">
                            <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>

                            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-[3px] border-white ring-[3px] ring-[#8899ff] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                                <span className="text-4xl text-white drop-shadow-md transform -rotate-12 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                    🔧
                                </span>
                            </div>
                        </div>

                        <div className="absolute -bottom-1 -left-3 bg-[#0088dd] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                            Info
                        </div>
                    </div>

            {/* AREA CENTRALE */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 w-full">
                
                {/* 1. SELEZIONE MODALITÀ (CREATE / JOIN) */}
                {!showJoinInput ? (
                    <div className="flex flex-col gap-8 w-full max-w-3xl animate-in fade-in zoom-in duration-300">
                        <MenuButton 
                            title="Create Room" 
                            onClick={handleCreateRoom}
                            bgImage="/buttonsImg/chara_6_diddy_00.png"
                        />
                        <MenuButton 
                            title="Join Room" 
                            onClick={handleJoinClick}
                            bgImage="/buttonsImg/chara_6_koopa_00.png"
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