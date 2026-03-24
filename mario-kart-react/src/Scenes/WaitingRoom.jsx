import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

export const WaitingRoom = ({ roomCode, roomId, isHost, socket, selectedTrack, setSelectedTrack, resetRoomState, setHostLeft }) => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [trackInfo, setTrackInfo] = useState(selectedTrack);
  const [copied, setCopied] = useState(false);
  const { playSfx } = useAudio();

  // URL Update
  useEffect(() => {
    if (roomId) {
      window.history.replaceState(null, '', `/waiting?room=${roomId}`);
    }
  }, [roomId]);

  // Socket Logic
  useEffect(() => {
    if (!socket || !roomCode) {
      navigate('/menu');
      return;
    }

    const handleRoomState = (data) => {
      if (data.roomCode === roomCode) {
        setPlayers(data.players || []);
        if (data.selectedTrack) {
          const trackData = { ...data.selectedTrack, start_pos: data.selectedTrack.startPos || [0, 2, 0] };
          setTrackInfo(trackData);
          setSelectedTrack(trackData);
        }
      }
    };

    const handleGameStarted = (data) => {
      if (data.roomCode === roomCode) {
        playSfx(AUDIO_SFX.RACE_START_VOICE); // Optional voice
        navigate('/game');
      }
    };

    const handleTrackSelected = (data) => {
      if (data.roomCode === roomCode) {
        const trackData = { ...data.track, start_pos: data.track.startPos || [0, 2, 0] };
        setTrackInfo(trackData);
        setSelectedTrack(trackData);
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('game_started', handleGameStarted);
    socket.on('track_selected', handleTrackSelected);
    socket.on('room_closed', () => {
      playSfx(AUDIO_SFX.BACK_IN_MENU);
    //   alert('The host has closed the room.');
      resetRoomState();
      setHostLeft(true);
      navigate('/menu', { replace: true });
    });
    socket.emit('request_room_state', { roomCode });

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('game_started', handleGameStarted);
      socket.off('track_selected', handleTrackSelected);
      socket.off('room_closed');
    };
  }, [socket, roomCode, navigate, setSelectedTrack, playSfx]);

  const handleStartGame = () => {
    if (isHost && socket) {
      playSfx(AUDIO_SFX.SELECT_IN_MENU);
      socket.emit('start_game', { roomCode });
    }
  };

  const handleChangeTrack = () => {
    if (isHost) {
      playSfx(AUDIO_SFX.SELECT_IN_MENU);
      navigate('/track');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    playSfx(AUDIO_SFX.SELECT_IN_MENU);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
      playSfx(AUDIO_SFX.BACK_IN_MENU);
      socket.emit('leave_room', { roomCode });
      resetRoomState();
      navigate('/menu', { replace: true });
  };

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
                            Waiting Room
                        </h1>
                    </div>
                </div>
            </div>

            {/* AREA CENTRALE */}
            <div className="flex-1 flex flex-col items-center justify-center pt-[15vh] pb-4 px-8 w-full">
                
                {/* CONTAINER PANNELLO (Stile Dark/Gold) */}
                <div className="w-full max-w-6xl h-[65vh] bg-black/80 border-4 border-[#aa8800] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] flex gap-6 p-6 backdrop-blur-md relative overflow-hidden">
                    
                    {/* Background Rigato Sottile */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                            style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                    </div>

                    {/* COLONNA SINISTRA (Info Stanza & Pista) */}
                    <div className="w-1/3 flex flex-col gap-6 z-10">
                        
                        {/* Room Code Card */}
                        <div 
                            onClick={copyToClipboard}
                            className="bg-black/60 border-2 border-[#aa8800] rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer group hover:bg-black/80 hover:border-[#ffcc00] transition-all relative overflow-hidden shadow-inner"
                        >
                            <span className="text-[#ddccaa] text-lg uppercase font-bold tracking-widest">Room Code</span>
                            <span className="text-5xl font-black text-[#ffcc00] tracking-[0.2em] drop-shadow-[0_2px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform font-mono">
                                {roomCode}
                            </span>
                            
                            {/* Copied Overlay */}
                            <div className={`absolute inset-0 bg-[#aa8800]/90 flex items-center justify-center transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                                <span className="text-white text-2xl font-bold uppercase tracking-wider">Copied!</span>
                            </div>
                            <div className={`absolute bottom-2 text-[#ffcc00] text-xs font-bold uppercase tracking-wide transition-opacity duration-300 ${copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                Click to Copy
                            </div>
                        </div>

                        {/* Track Info Card */}
                        <div className="flex-1 bg-black/40 border-2 border-[#666] rounded-lg p-4 flex flex-col items-center gap-4 relative overflow-hidden">
                            <h3 className="text-[#aa8800] font-bold text-xl uppercase tracking-widest border-b border-[#aa8800]/50 w-full text-center pb-2">
                                Track Selection
                            </h3>
                            
                            {trackInfo ? (
                                <>
                                    <div 
                                        className="w-full aspect-video bg-cover bg-center rounded border-2 border-white/50 shadow-lg group-hover:scale-105 transition-transform"
                                        style={{ backgroundImage: `url("${trackInfo.preview || '/placeholder_track.png'}")` }}
                                    ></div>
                                    <span className="text-2xl font-black text-white uppercase text-center drop-shadow-md tracking-tight leading-none">
                                        {trackInfo.name}
                                    </span>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                                    Selecting Track...
                                </div>
                            )}

                            {isHost && (
                                <button 
                                    onClick={handleChangeTrack}
                                    className="w-full py-3 bg-[#0066cc] border-y-2 border-[#0088dd] text-white font-bold uppercase rounded hover:bg-[#0055aa] hover:border-white transition-all shadow-md mt-auto"
                                >
                                    Change Track
                                </button>
                            )}
                        </div>

                    </div>

                    {/* COLONNA DESTRA (Lista Giocatori - Stile Mii Slots) */}
                    <div className="flex-1 bg-black/40 border-2 border-[#666] rounded-lg p-4 flex flex-col relative z-10">
                        
                        <div className="flex justify-between items-end border-b-2 border-[#aa8800] pb-2 mb-4 px-2">
                            <h3 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                                Racers
                            </h3>
                            <span className="text-[#ddccaa] font-bold text-xl">
                                {players.length} / 12
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 gap-3 content-start">
                            {players.map((player, index) => (
                                <div 
                                    key={player.id || index} 
                                    className={`
                                        group relative h-16 flex items-center px-4 rounded border-l-4 shadow-sm transition-all animate-in slide-in-from-right duration-300
                                        ${player.isHost 
                                            ? 'bg-gradient-to-r from-[#332200] to-transparent border-[#ffcc00]' 
                                            : 'bg-gradient-to-r from-[#111] to-transparent border-[#666]'
                                        }
                                    `}
                                >
                                    {/* Slot Number */}
                                    <div className="w-8 text-[#666] font-mono text-xl font-bold mr-4">
                                        {index + 1}.
                                    </div>

                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center mr-4 shadow-inner">
                                        <span className="text-2xl filter drop-shadow-sm">{player.isHost ? '👑' : '🏎️'}</span>
                                    </div>

                                    {/* Name */}
                                    <span className={`text-xl font-bold tracking-wide ${player.isHost ? 'text-[#ffcc00]' : 'text-white'}`}>
                                        {player.username || `Player ${index + 1}`}
                                        {player.id === socket?.id && <span className="text-[#88aaff] text-sm ml-2">(YOU)</span>}
                                    </span>

                                    {/* Host Badge */}
                                    {player.isHost && (
                                        <div className="ml-auto bg-[#ffcc00] text-black text-xs font-black uppercase px-2 py-1 rounded shadow-sm">
                                            HOST
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Empty Slots (Optional visual filler) */}
                            {[...Array(Math.max(0, 12 - players.length))].map((_, i) => (
                                <div key={`empty-${i}`} className="h-16 border-2 border-dashed border-[#333] rounded flex items-center justify-center opacity-30">
                                    <span className="text-[#666] font-bold uppercase tracking-widest">Empty Slot</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                
                {/* ACTION BUTTONS (Start Game) */}
                <div className="absolute bottom-8 right-12 z-50">
                    {isHost ? (
                        <button
                            onClick={handleStartGame}
                            className="group relative px-12 py-4 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                       flex items-center gap-4 overflow-hidden transition-all duration-200 
                                       hover:scale-110 hover:border-[#ffeebb] hover:shadow-[0_0_30px_rgba(255,215,0,0.8)] hover:bg-black/80"
                        >
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                             <span className="text-4xl font-black text-[#ffcc00] uppercase tracking-widest drop-shadow-md group-hover:text-white">
                                Start Race
                             </span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-black/60 px-8 py-3 rounded-full border border-[#aa8800] animate-pulse">
                            <span className="w-3 h-3 bg-[#ffcc00] rounded-full"></span>
                            <span className="text-[#ddccaa] font-bold uppercase tracking-wider text-xl">Waiting for Host...</span>
                        </div>
                    )}
                </div>

            </div>

            {/* FOOTER / LEAVE BUTTON */}
            <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                <button 
                    onClick={handleLeave}
                    className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">{isHost ? 'Close Room' : 'Leave Room'}</span>
                </button>
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
                background: #aa8800;
                border: 1px solid #ffcc00;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ffcc00;
            }
        `}</style>
    </div>
  );
};