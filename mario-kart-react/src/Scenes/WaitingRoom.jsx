import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { socket } from '../multiplayer/socket.js';
import { useGameDataStore, useGameStore, useRoomDataStore, useUserStore } from '../store.js';

const FriendList = ({ friends, isLoading, userName, roomCode, setShowFriendList }) => {

    const [inviteError, setInviteError] = useState(null);

    const handleInviteFriend = async (friendUsername) => {
        if (!socket) return;

        const response = await socket.emitWithAck('invite_friend_to_room', {
            senderName: userName,
            roomCode: roomCode,
            friendUsername: friendUsername
        });

        if (!response.success) {
            setInviteError(response?.error || 'Failed to send invite');
            setTimeout(() => setInviteError(null), 3000);
            return ;
        }

        setShowFriendList(false);

    };

    return (
        <div className="flex-1 flex items-center justify-center pt-[19vh] pb-4 px-4 w-full relative z-20">
            <div className="bg-gradient-to-b from-[#0000cc] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 w-full max-w-4xl flex flex-col gap-4 relative animate-in zoom-in duration-300 h-[65vh]">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)"}}></div>

                <div className="flex justify-between items-center border-b-4 border-white/30 pb-3 z-10">
                    <h2 className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] tracking-wide uppercase">
                        Friend List
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="bg-[#000088] border-2 border-[#88aaff] px-4 py-1 rounded-full font-bold text-xl font-mono shadow-inner text-white drop-shadow-[2px_2px_0_#0000ff] ml-2">
                            {friends.length}
                        </span>
                    </div>
                </div>

                {/* Messaggio di Errore (Host Left) */}
                {inviteError && (
                    <div className="absolute top-[20vh] left-0 w-full flex justify-center z-40 animate-pulse px-4 pointer-events-none">
                        <div className="bg-gradient-to-b from-[#ff6666] to-[#cc0000] border-2 border-white rounded-lg shadow-[0_0_15px_#ff0000] px-6 py-3 flex items-center gap-3 pointer-events-auto">
                            <div className="bg-white text-[#cc0000] rounded-full w-8 h-8 min-w-[32px] flex items-center justify-center font-black text-xl shadow-inner border border-gray-300">!</div>
                            <span className="text-white font-bold uppercase tracking-wide drop-shadow-md text-sm md:text-lg">
                                {inviteError}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto z-10 flex flex-col gap-3 custom-scrollbar pr-2 mt-2 min-h-0">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white drop-shadow-[2px_2px_0_#0000ff] animate-pulse">Loading...</span>
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-[3px_3px_0_#0000ff] uppercase italic tracking-widest">
                                No Friends Found
                            </span>
                        </div>
                    ) : (
                        friends.map((friend, index) => (
                            <div key={index} className="group relative w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full flex items-center p-2 px-4 shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-white cursor-pointer flex-shrink-0">
                                <div className="absolute top-0 left-4 right-4 h-[35%] bg-white/10 rounded-b-full pointer-events-none"></div>
                                
                                {/* Icona */}
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-[#000044] border-2 border-white shadow-inner rounded-full overflow-hidden flex-shrink-0 relative">
                                    <img src={friend.icon ? `/sprites/${friend.icon}` : '/sprites/Mario.png'} alt={friend.username} className="w-full h-full object-cover filter drop-shadow-md" onError={(e) => { e.target.src = '/sprites/Mario.png'; }} />
                                </div>
                                
                                {/* Username */}
                                <div className="flex-1 ml-6 flex flex-col justify-center">
                                    <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider drop-shadow-[2px_2px_0_#0000ff] transition-colors">
                                        {friend.username || "Unknown"}
                                    </span>
                                </div>
                                
                                {/* Pallino verde status */}
                                {friend.isLoggedIn ? (
                                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-[0_0_8px_#22cc22] mr-4 animate-pulse"></div>
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_8px_#cc0000] mr-4 animate-pulse"></div>
                                )}

                                {/* Tasto Rimuovi Amico */}
                                <button 
                                    onClick={() => handleInviteFriend(friend.username)}
                                    className="w-10 h-10 bg-[#cc0000] border-2 border-white rounded-full shadow-md flex items-center justify-center z-20 mr-1"
                                    title="Send Invite"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-5 h-5 text-white drop-shadow-sm">
                                        <line x1="12" y1="0" x2="12" y2="24" />
                                        <line x1="0" y1="12" x2="24" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export const WaitingRoom = ({ resetRoomState }) => {
  
  const { isHost: isHost } = useGameStore();
  const { SelectedTrack: selectedTrack } = useGameDataStore();
  const { roomCode: roomCode, roomId: roomId } = useRoomDataStore();
  const { userName: userName } = useUserStore();
  const gameStore = useGameStore();
  const gameDataStore = useGameDataStore();

  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [trackInfo, setTrackInfo] = useState(selectedTrack);
  const [copied, setCopied] = useState(false);
  const { playSfx } = useAudio();

  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFriendList, setShowFriendList] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // URL Update & Fetch Friends
  useEffect(() => {
    if (!userName) return;

    setIsLoading(true);
    fetch(`/api/getFriendList?username=${userName}`)
        .then(res => res.ok ? res.json() : [])
        .then(friendData => {
            setFriends(Array.isArray(friendData) ? friendData : []);
        })
        .catch(err => console.error("Fetch error:", err))
        .finally(() => setIsLoading(false));

    if (roomId) {
      window.history.replaceState(null, '', `/waiting?room=${roomId}`);
    }
  }, [roomId, userName]);

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
          gameDataStore.setSelectedTrack(trackData);
        }
      }
    };

    const handleGameStarted = (data) => {
      if (data.roomCode === roomCode) {
        playSfx(AUDIO_SFX.RACE_START_VOICE);
        navigate('/game');
      }
    };

    const handleTrackSelected = (data) => {
      if (data.roomCode === roomCode) {
        const trackData = { ...data.track, start_pos: data.track.startPos || [0, 2, 0] };
        setTrackInfo(trackData);
        gameDataStore.setSelectedTrack(trackData);
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('game_started', handleGameStarted);
    socket.on('track_selected', handleTrackSelected);
    socket.on('room_closed', () => {
      playSfx(AUDIO_SFX.BACK_IN_MENU);
      resetRoomState();
      gameStore.setHostLeft(true);
      navigate('/menu', { replace: true });
    });
    socket.emit('request_room_state', { roomCode });

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('game_started', handleGameStarted);
      socket.off('track_selected', handleTrackSelected);
      socket.off('room_closed');
    };
  }, [socket, roomCode, navigate, playSfx]);

  const handleStartGame = () => {
    if (isHost && socket) {
      playSfx(AUDIO_SFX.SELECT_IN_MENU);
      socket.emit('start_game', { roomCode });
    }
  };

  const handleInviteFriend = () => {
    setShowFriendList(true);
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

  const handleToggleReady = () => {
    const newReadyState = !isPlayerReady;
    setIsPlayerReady(newReadyState);
    if (socket) {
      socket.emit('toggle_ready', { roomCode, newReadyState });
    }
    playSfx(AUDIO_SFX.SELECT_IN_MENU);
  };

  const allPlayersReady = players.length > 0 && players.every(p => p.isReady === true);

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
            {showFriendList ? (
                <div className="flex-1 w-full h-full relative">
                    <FriendList
                        friends={friends}
                        isLoading={isLoading}
                        userName={userName}
                        roomCode={roomCode}
                        setShowFriendList={setShowFriendList}
                    />
                </div>
            ) : 

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
                                        <div className="w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center mr-4 shadow-inner overflow-hidden">
                                            <img
                                                src={player.icon ? `/sprites/${player.icon}` : '/sprites/Mario.png'}
                                                alt={player.username || `Player ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.src = '/sprites/Mario.png'; }}
                                            />
                                        </div>

                                        {/* Name */}
                                        <span className={`text-xl font-bold tracking-wide ${player.isHost ? 'text-[#ffcc00]' : 'text-white'}`}>
                                            {player.username || `Player ${index + 1}`}
                                            {player.id === socket?.id && <span className="text-[#88aaff] text-sm ml-2">(YOU)</span>}
                                        </span>

                                        {/* Punti */}
                                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-[#ffcc00]/50 ml-auto mr-4">
                                            <span className="text-[#ffcc00] font-bold text-lg">{player.points || 0}</span>
                                            <span className="text-[#ffcc00] text-sm font-semibold">pts</span>
                                        </div>

                                        {/* Ready Badge */}
                                        <div className={`text-xs font-black uppercase px-3 py-1 rounded shadow-sm border-2 mr-2 ${
                                            player.isReady 
                                                ? 'bg-[#00cc00] text-white border-[#00ff00]' 
                                                : 'bg-[#cc0000] text-white border-[#ff6666]'
                                        }`}>
                                            {player.isReady ? '✓ READY' : '✗ NOT READY'}
                                        </div>

                                        {/* Host Badge */}
                                        {player.isHost && (
                                            <div className="bg-[#ffcc00] text-black text-xs font-black uppercase px-2 py-1 rounded shadow-sm">
                                                HOST
                                            </div>
                                        )} 
                                    </div>
                                ))}

                                {/* Ready Toggle per il giocatore locale */}
                                {players.map((player) => {
                                    if (player.id === socket?.id) {
                                        return (
                                            <button
                                                key="ready-button"
                                                onClick={handleToggleReady}
                                                className={`h-12 border-2 rounded flex items-center justify-center font-bold uppercase tracking-wider text-lg transition-all mb-3 ${
                                                    isPlayerReady
                                                        ? 'bg-[#00cc00] border-[#00ff00] text-black hover:bg-[#00ff00] shadow-[0_0_10px_#00cc00]'
                                                        : 'bg-[#cc0000] border-[#ff6666] text-white hover:bg-[#ff6666] shadow-[0_0_10px_#cc0000]'
                                                }`}
                                            >
                                                {isPlayerReady ? '✓ I\'M READY' : '✗ NOT READY'}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Empty Slots (incluso il pulsante "Add Friend") */}
                                {[...Array(Math.max(0, 12 - players.length))].map((_, i) => {
                                    if (i === 0) {
                                        // PRIMO SLOT VUOTO: Bottone Invite Friend
                                        return (
                                            <div 
                                                key={`empty-${i}`} 
                                                onClick={handleInviteFriend}
                                                className="h-16 border-2 border-dashed border-[#0088dd] bg-[#001133]/40 rounded flex items-center justify-center opacity-80 hover:opacity-100 hover:border-[#44ccff] hover:bg-[#002266]/60 transition-all cursor-pointer group shadow-sm animate-in slide-in-from-right duration-300"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[#0066cc] border-2 border-white flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                                    <span className="text-white font-black text-2xl leading-none mb-1">+</span>
                                                </div>
                                                <span className="text-[#88aaff] group-hover:text-white font-bold uppercase tracking-widest transition-colors">
                                                    Invite Friend
                                                </span>
                                            </div>
                                        );
                                    }

                                    // ALTRI SLOT VUOTI: Filler visivo
                                    return (
                                        <div key={`empty-${i}`} className="h-16 border-2 border-dashed border-[#333] rounded flex items-center justify-center opacity-30 animate-in slide-in-from-right duration-300">
                                            <span className="text-[#666] font-bold uppercase tracking-widest">Empty Slot</span>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>

                    </div>
                    
                    {/* ACTION BUTTONS (Start Game) */}
                    <div className="absolute bottom-8 right-12 z-50 flex flex-col items-end gap-3">
                        {isHost ? (
                            <>
                                <button
                                    onClick={handleStartGame}
                                    disabled={!allPlayersReady}
                                    className={`group relative px-12 py-4 border-y-2 border-x-4 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                            flex items-center gap-4 overflow-hidden transition-all duration-200 
                                            ${
                                                allPlayersReady
                                                    ? 'bg-black/60 border-[#aa8800] hover:scale-110 hover:border-[#ffeebb] hover:shadow-[0_0_30px_rgba(255,215,0,0.8)] hover:bg-black/80 cursor-pointer'
                                                    : 'bg-black/40 border-[#666] opacity-50 cursor-not-allowed'
                                            }
                                        `}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                    <span className={`text-4xl font-black uppercase tracking-widest drop-shadow-md ${
                                        allPlayersReady ? 'text-[#ffcc00] group-hover:text-white' : 'text-[#888]'
                                    }`}>
                                        Start Race
                                    </span>
                                </button>
                                {!allPlayersReady && (
                                    <div className="text-sm text-[#ff8844] font-bold uppercase tracking-wider bg-black/60 px-4 py-2 rounded border border-[#ff8844]">
                                        Waiting for all players to be ready...
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-3 bg-black/60 px-8 py-3 rounded-full border border-[#aa8800] animate-pulse">
                                <span className="w-3 h-3 bg-[#ffcc00] rounded-full"></span>
                                <span className="text-[#ddccaa] font-bold uppercase tracking-wider text-xl">Waiting for Host...</span>
                            </div>
                        )}
                    </div>

                </div>
            }

            {/* FOOTER / LEAVE BUTTON */}
            <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    {showFriendList ? (
                            <button 
                                onClick={() => setShowFriendList(false)}
                                className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                                <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">{'Back'}</span>
                            </button>
                        ) : (
                            <button 
                                onClick={handleLeave}
                                className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                                <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">{isHost ? 'Close Room' : 'Leave Room'}</span>
                            </button>
                            
                    )}
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