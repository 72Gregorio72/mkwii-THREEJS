import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { useNotificationsStore, useRoomDataStore, useUserStore } from '../store.js';
import { socket } from '../multiplayer/socket.js';

// Componente Pulsante Menu (Stile MKWii Options riutilizzato)
const MenuButton = ({ title, onClick, bgImage, showNotificationDot = false }) => {
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

            {showNotificationDot && (
                <span className="absolute top-1 right-1 z-[3] w-7 h-7 rounded-full bg-[#ff1f1f] border-[3px] border-white shadow-[0_0_14px_rgba(255,0,0,0.85)] invite-dot-blink" />
            )}
        </button>
    );
};

export const RoomSelection = ({ onCreateRoom, onJoinRoom }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [fadeToBlack, setFadeToBlack] = useState(false);
  
  // Stati per le notifiche
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const { playSfx, fadeOutMusic , changeTrack, enableSmoothLoop , getCurrentTrack } = useAudio();

    const {isLoggedIn: loggedIn, userName: username} = useUserStore();
    const { pendingRoomInvites, setPendingRoomInvites } = useNotificationsStore();

  useEffect(() => {
    if (getCurrentTrack() !== 'MENU') {
        changeTrack('MENU', 100);
        enableSmoothLoop();
    }
  }, [changeTrack, enableSmoothLoop]);

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

  // Fetch delle notifiche quando si apre la view "Join Room"
  useEffect(() => {
    if (loggedIn && username && showJoinInput) {
        fetch(`/api/notifications?username=${username}`)
            .then(res => {
                if (res.status === 404) return [];
                if (!res.ok) throw new Error("No notifications found");
                return res.json();
            })
            .then(data => {
                const inviteList = Array.isArray(data) ? data : [];
                setNotifications(inviteList);
                setPendingRoomInvites(inviteList.length);
            })
            .catch(err => {
                console.error("Error fetching notifications:", err);
                setNotifications([]);
                setPendingRoomInvites(0);
            });
    }
  }, [loggedIn, username, showJoinInput, setPendingRoomInvites]);

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
          setShowDropdown(false);
      } else {
          navigate('/menu');
      }
  };

    const handleAcceptInvite = (code, notificationId) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        fetch(`/api/deleteNotification?notificationId=${notificationId}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error("Failed to delete notification");
                setShowDropdown(false);
                
                // 1. Calculate the new state outside of the updater function
                const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
                
                // 2. Call both setters sequentially
                setNotifications(updatedNotifications);
                setPendingRoomInvites(updatedNotifications.length);
                
                console.log(`Joining room with code: ${code.trim()}`);
                onJoinRoom(code.trim(), username);
            })
            .catch(err => console.error("Error deleting notification:", err));
    };

    const handleRejectInvite = (id) => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        // console.log(`Rejecting invite with notification ID: ${id}`);
        fetch(`/api/deleteNotification?notificationId=${id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error("Failed to delete notification");
                
                // 1. Calculate the new state outside of the updater function
                const updatedNotifications = notifications.filter(notif => notif.id !== id);
                
                // 2. Call both setters sequentially
                setNotifications(updatedNotifications);
                setPendingRoomInvites(updatedNotifications.length);
            })
            .catch(err => console.error("Error deleting notification:", err));
    };

  const toggleNotifications = () => {
      playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
      setShowDropdown(!showDropdown);
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden font-sans select-none">
        <style>{`
            @keyframes inviteDotBlink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.45; transform: scale(0.92); }
            }
            .invite-dot-blink {
                animation: inviteDotBlink 1.8s ease-in-out infinite;
            }
        `}</style>
        
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

            {/* --- TASTO PROFILO / LICENSE --- */}
            {loggedIn && (
                <div 
                    onClick={() => navigate('/profile')}
                    className="absolute top-18 right-28 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16">
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#22cc22] to-[#008800] border-[3px] border-white ring-[3px] ring-[#00aa00] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                👤
                            </span>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-[#008800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        License
                    </div>
                </div>
            )}

            {/* --- TASTO FRIENDS --- */}
            {loggedIn && (
                <div 
                    onClick={() => navigate('/friends')}
                    className="absolute top-26 right-52 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16">
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#ffcc00] to-[#aa8800] border-[3px] border-white ring-[3px] ring-[#cc9900] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                🌍
                            </span>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-[#aa8800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        Friends
                    </div>
                </div>
            )}

            {/* TASTO SETTINGS / INFO */}
            <div 
                onClick={() => navigate('/info')}
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
            <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 pt-[18vh] w-full">
                
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
                            onClick={() => handleJoinClick()}
                            bgImage="/buttonsImg/chara_6_koopa_00.png"
                            showNotificationDot={pendingRoomInvites > 0}
                        />
                    </div>
                ) : (
                    /* 2. INPUT JOIN ROOM */
                    <div className="w-full max-w-2xl bg-black/60 border-4 border-[#aa8800] rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300 backdrop-blur-sm">
                        
                        {/* Intestazione e Campanella */}
                        <div className="flex justify-center items-center border-b-2 border-[#aa8800] pb-4 mb-8 relative">
                            <h2 className="text-3xl font-bold text-[#ffcc00] uppercase drop-shadow-md tracking-widest">
                                Enter Room Code
                            </h2>

                            {/* Campanella Notifiche */}
                            {loggedIn && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2">

                                    <button 
                                        onClick={toggleNotifications}
                                        className="-translate-y-1/4 relative w-12 h-12 bg-[#00aaff] hover:bg-[#33bbff] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
                                        title="Room Invites"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white drop-shadow-[1px_1px_0_#0055aa]">
                                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                        </svg>
                                        
                                        {/* Badge Notifiche */}
                                        {notifications.length > 0 && (
                                            <div className="absolute -top-2 -right-2 bg-[#ff0000] border-2 border-white rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-black shadow-md z-10 animate-in zoom-in">
                                                {notifications.length}
                                            </div>
                                        )}
                                    </button>

                                    {/* MENU A TENDINA NOTIFICHE */}
                                    {showDropdown && (
                                        <div className="absolute top-1 -right-90 w-80 bg-gradient-to-b from-[#000066] to-[#000033] border-4 border-[#0088dd] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 overflow-hidden animate-in slide-in-from-top-2">
                                            <div className="bg-[#0088dd] text-white font-bold text-center py-2 uppercase tracking-widest text-sm shadow-md">
                                                Room Invites
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <p className="text-white/60 text-center py-6 italic uppercase tracking-wider font-bold">No Pending Invites</p>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div key={notif.id} className="bg-black/40 border-2 border-[#555] rounded-md p-3 mb-2 flex flex-col shadow-inner">
                                                            <p className="text-[#ffcc00] text-sm font-bold tracking-wide drop-shadow-md mb-2">
                                                                <span className="text-white">{notif.senderName || notif.from}</span> invited you!
                                                            </p>
                                                            <div className="flex gap-2 mt-auto">
                                                                <button 
                                                                    className="flex-1 bg-gradient-to-b from-[#22cc22] to-[#008800] border border-white rounded shadow-md text-white font-bold text-sm uppercase py-1 hover:brightness-110 active:scale-95"
                                                                    onClick={() => handleAcceptInvite(notif.entityId, notif.id)}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button 
                                                                    className="flex-1 bg-gradient-to-b from-[#ff4444] to-[#aa0000] border border-white rounded shadow-md text-white font-bold text-sm uppercase py-1 hover:brightness-110 active:scale-95"
                                                                    onClick={() => handleRejectInvite(notif.id)}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
                                onClick={() => handleConfirmJoin()}
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
            <div className="h-[12vh] w-full flex items-center px-12 relative z-10">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                </button>
            </div>

            {/* Stili per la custom scrollbar del dropdown */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #0088dd; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #44ccff; }
            `}</style>
        </div>
    </div>
  );
};