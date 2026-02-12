import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const WaitingRoom = ({ roomCode, roomId, isHost, socket, selectedTrack, setSelectedTrack }) => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [trackInfo, setTrackInfo] = useState(selectedTrack);
  const [copied, setCopied] = useState(false);

  // Aggiorna l'URL del browser per mostrare il roomId
  useEffect(() => {
    if (roomId) {
      window.history.replaceState(null, '', `/waiting?room=${roomId}`);
    }
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomCode) {
      navigate('/menu');
      return;
    }

    const handleRoomState = (data) => {
      if (data.roomCode === roomCode) {
        setPlayers(data.players || []);
        
        if (data.selectedTrack) {
          const trackData = {
            ...data.selectedTrack,
            start_pos: data.selectedTrack.startPos || data.selectedTrack.start_pos || [0, 2, 0]
          };
          setTrackInfo(trackData);
          setSelectedTrack(trackData);
        }
      }
    };

    const handleGameStarted = (data) => {
      if (data.roomCode === roomCode) {
        navigate('/game');
      }
    };

    const handleTrackSelected = (data) => {
      if (data.roomCode === roomCode) {
        const trackData = {
          ...data.track,
          start_pos: data.track.startPos || data.track.start_pos || [0, 2, 0]
        };
        setTrackInfo(trackData);
        setSelectedTrack(trackData);
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('game_started', handleGameStarted);
    socket.on('track_selected', handleTrackSelected);

    socket.emit('request_room_state', { roomCode });

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('game_started', handleGameStarted);
      socket.off('track_selected', handleTrackSelected);
    };
  }, [socket, roomCode, navigate, setSelectedTrack]);

  const handleStartGame = () => {
    if (isHost && socket) {
      socket.emit('start_game', { roomCode });
    }
  };

  const handleChangeTrack = () => {
    if (isHost) {
      navigate('/track');
    }
  };

  // Funzione per copiare il codice
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      
      {/* Main Container with Scanlines (select-none previene la selezione accidentale di tutto il resto) */}
      <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
        
        {/* Slanted Header */}
        <div className="h-[8vh] bg-white flex items-center pl-[4vw] border-b-[0.6vh] border-[#aaddff] rounded-br-[50px] w-[55%] z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
            <h1 className="text-[4vh] font-bold text-[#666] italic uppercase">
                Waiting Room
            </h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
            
            {/* Background Decoration */}
            <div className="absolute w-[60vmin] h-[60vmin] border-[0.3vmin] border-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-5xl bg-[#1e293b] rounded-[30px] border-[5px] border-[#fbbf24] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)] p-8 flex flex-col gap-6">
                
                {/* Room Code Banner */}
                <div 
                    onClick={copyToClipboard}
                    className="w-full bg-black/40 rounded-xl p-4 border-2 border-white/10 text-center cursor-pointer hover:bg-black/60 transition-colors group relative"
                    title="Click to Copy"
                >
                    <div className="flex flex-col gap-2">
                        {/* Room ID (mostrato piccolo, è nell'URL) */}
                        {roomId && (
                            <div className="text-gray-500 text-sm uppercase tracking-widest">
                                Room ID: <span className="text-gray-400 font-mono">{roomId}</span>
                            </div>
                        )}
                        {/* Room Code (la password da condividere) */}
                        <div>
                            <span className="text-gray-400 text-lg uppercase tracking-widest mr-4">Room Code:</span>
                            <span className="text-[#fbbf24] text-5xl font-black tracking-[0.2em] drop-shadow-md select-text font-mono">
                                {roomCode}
                            </span>
                        </div>
                    </div>
                    
                    {/* Tooltip Copied */}
                    <span className={`absolute top-2 right-4 text-xs font-bold uppercase px-2 py-1 rounded bg-[#22c55e] text-white transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                        Copied! ✅
                    </span>
                    <span className={`absolute top-2 right-4 text-xs font-bold uppercase px-2 py-1 rounded text-gray-500 transition-opacity duration-300 ${copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                        Click to Copy
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 h-full">
                    
                    {/* Left Column: Track Info */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black/20 rounded-xl p-4 border border-white/10 h-full flex flex-col">
                            <h3 className="text-[#fbbf24] font-bold text-xl uppercase tracking-wider mb-2 text-center border-b border-white/10 pb-2">
                                Current Track
                            </h3>
                            
                            {trackInfo ? (
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="text-white text-2xl font-black text-center drop-shadow-md uppercase">
                                        {trackInfo.name}
                                    </div>
                                    <div 
                                        className="w-full aspect-video bg-cover bg-center rounded-lg border-2 border-[#fbbf24] shadow-lg transition-transform hover:scale-[1.02]"
                                        style={{ backgroundImage: `url(${trackInfo.preview || '/placeholder_track.png'})` }}
                                    ></div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                                    No track selected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Player List */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black/20 rounded-xl p-4 border border-white/10 h-full overflow-hidden flex flex-col">
                            <h3 className="text-[#fbbf24] font-bold text-xl uppercase tracking-wider mb-2 text-center border-b border-white/10 pb-2">
                                Racers ({players.length}/12)
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                                {players.map((player, index) => (
                                    <div 
                                        key={player.id || index} 
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg border transition-all animate-in slide-in-from-right duration-300
                                            ${player.isHost 
                                                ? 'bg-[#fbbf24]/20 border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                                                : 'bg-white/5 border-white/10'
                                            }
                                        `}
                                    >
                                        <div className="text-2xl filter drop-shadow-sm">
                                            {player.isHost ? '👑' : '🏎️'}
                                        </div>
                                        <div className="flex-1 font-bold text-white tracking-wide text-lg">
                                            Player {index + 1}
                                        </div>
                                        {player.isHost && (
                                            <div className="text-[#fbbf24] text-xs font-black uppercase tracking-wider bg-black/40 px-2 py-1 rounded border border-[#fbbf24]/30">
                                                HOST
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Area */}
                <div className="mt-2 pt-4 border-t border-white/10 flex flex-col items-center gap-4">
                    {isHost ? (
                        <div className="w-full flex flex-col gap-3 md:flex-row">
                             <button
                                onClick={handleChangeTrack}
                                className="flex-1 py-4 rounded-xl border-b-[6px] border-[#075985] bg-[#0284c7] text-white text-lg font-bold uppercase tracking-wider shadow-md hover:brightness-110 active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                            >
                                🔄 Change Track
                            </button>
                            <button
                                onClick={handleStartGame}
                                className="flex-[2] py-4 rounded-xl border-b-[6px] border-[#15803d] bg-[#22c55e] text-white text-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:brightness-110 active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                            >
                                🏁 Start Race
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-4 w-full bg-black/20 rounded-lg">
                            <h2 className="text-[#fbbf24] text-2xl font-bold uppercase tracking-wider animate-pulse flex items-center gap-3">
                                <span className="w-3 h-3 bg-[#fbbf24] rounded-full"></span>
                                Waiting for Host...
                                <span className="w-3 h-3 bg-[#fbbf24] rounded-full"></span>
                            </h2>
                            <div className="flex gap-2">
                                <div className="w-4 h-4 bg-[#fbbf24] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-4 h-4 bg-[#fbbf24] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-4 h-4 bg-[#fbbf24] rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* Footer with Back Button */}
        <div className="h-[10vh] flex justify-center items-center bg-gradient-to-t from-black/90 to-transparent z-20">
            <button
                onClick={() => navigate('/menu')}
                className="py-[1vh] px-[6vw] text-[2.5vh] font-bold rounded-full border-[0.3vh] border-white cursor-pointer uppercase shadow-md bg-[#ef4444] text-white hover:bg-[#dc2626] transition-all active:scale-95"
            >
                Leave Room
            </button>
        </div>

        {/* Scrollbar Styles */}
        <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #fbbf24;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #f59e0b;
            }
        `}</style>

      </div>
    </>
  );
};