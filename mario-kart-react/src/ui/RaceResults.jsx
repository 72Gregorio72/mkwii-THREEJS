import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react'; 
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { formatTime } from './GameHUD.jsx';
import { socket } from '../multiplayer/socket.js';
import { useGameDataStore, useGameStore, useRoomDataStore, useUserStore } from '../store.js';
import { ShortType } from 'three/src/constants.js';

// Font Injection (se non già presente globalmente)
const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const calculatePoints = (racersDataObj) => {
    if (!racersDataObj) return [];

    // 1. Converti l'oggetto racersData in un array
    const racersArray = Object.values(racersDataObj);

    // 2. Ordina i corridori in base alla loro posizione attuale nella gara
    racersArray.sort((a, b) => {
        const posA = a.position || 99;
        const posB = b.position || 99;
        return posA - posB;
    });

    // 3. Tabella dei punti di Mario Kart Wii
    const pointsTable = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const result = [];

    // 4. Assegna i punti e aggiorna i totali
    racersArray.forEach((racer, index) => {
        const earnedPoints = pointsTable[index] || 0;
        
        // Aggiorniamo direttamente i dati originali per mantenere i punti 
        // tra una gara e l'altra del Grand Prix
        racer.points = (racer.points || 0) + earnedPoints;

        result.push({ 
            ...racer, 
            points: racer.points // Usa il totale cumulativo
        });
    });

    // 5. Riordina il risultato in base ai PUNTI TOTALI decrescenti per la Leaderboard
    result.sort((a, b) => b.points - a.points);

    return result;
};

const LeaderBoard = ({ finished, racersData, socket }) => {
  if (!racersData || racersData.length === 0) return null;

  // Ordina i corridori per punti (in ordine decrescente)
  const sortedRacers = [...racersData].sort((a, b) => (b.points || 0) - (a.points || 0));

  const RenderRow = ({ racer, index }) => {
    const position = index + 1;
    
    // Calcolo suffisso posizione (1st, 2nd, 3rd, th)
    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
    
    let bgGradient = 'from-black/60 to-transparent';
    let borderColor = 'border-gray-600';
    let rankColor = 'text-white';

    if (position === 1) {
        rankColor = 'text-[#FFD700]'; // Oro
        bgGradient = 'from-[#332200] to-transparent';
        borderColor = 'border-[#FFD700]';
    } else if (position === 2) {
        rankColor = 'text-[#C0C0C0]'; // Argento
        bgGradient = 'from-[#1a1a1a] to-transparent';
        borderColor = 'border-[#C0C0C0]';
    } else if (position === 3) {
        rankColor = 'text-[#CD7F32]'; // Bronzo
        bgGradient = 'from-[#1a0f00] to-transparent';
        borderColor = 'border-[#CD7F32]';
    }

    // Nome Display e Evidenziazione Giocatore
    let displayName = racer.id;
    const isMe = displayName === socket?.id;

    if (isMe) {
        displayName = 'PLAYER';
        bgGradient = 'from-[#0033aa] to-transparent'; 
        borderColor = 'border-[#00aeff]';
    } else if (displayName && displayName.startsWith('bot_')) {
       const parts = displayName.split('_');
       const botNum = parseInt(parts[1]) + 1;
       displayName = `CPU ${botNum}`;
    }

    // Ricava il nome del personaggio per l'icona (se non c'è usa Mario di default)
    const rawName = racer.name || 'Mario';

    const characterName = rawName
        .split(/[^a-zA-Z0-9]+/) // Divide la stringa ad ogni spazio o segno di punteggiatura (es. il punto in "Jr.")
        .filter(Boolean)        // Rimuove eventuali stringhe vuote generate dal divisione
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizza la prima lettera di ogni parola
        .join('');              // Unisce tutto in un'unica stringa senza spazi

    return (
        <div 
            className={`
                flex items-center justify-between py-1.5 px-3 md:py-2 md:px-4 rounded-r-lg border-l-4 mb-1 shadow-sm
                bg-gradient-to-r ${bgGradient} ${borderColor}
                animate-in slide-in-from-left duration-500
            `}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center gap-4 md:gap-6">
                {/* Posizione (es: 1st, 2nd) */}
                <div className={`w-16 text-3xl font-black italic ${rankColor} drop-shadow-md text-right pr-2`}>
                    {position}<span className="text-lg align-top opacity-80">{suffix}</span>
                </div>
                
                {/* Icona Personaggio */}
                <img 
                    src={`/sprites/${characterName}.png`} 
                    alt={characterName} 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md"
                    onError={(e) => { e.target.style.display='none'; }}
                />

                {/* Nome */}
                <span className={`text-xl md:text-2xl font-bold uppercase tracking-wide drop-shadow-md ${isMe ? 'text-[#00aeff]' : 'text-white'}`}>
                    {displayName}
                </span>
            </div>

            {/* Punteggio */}
            <div className="font-mono text-[#ffcc00] text-2xl tracking-wider font-bold drop-shadow-sm bg-black/60 px-4 py-1 rounded border border-[#aa8800]/50 min-w-[120px] text-right">
                {racer.points || 0} <span className="text-sm">pts</span>
            </div>
        </div>
    );
  };

  return (
    <div className="w-full max-w-4xl bg-black/90 border-4 border-[#aa8800] rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9)] p-4 md:p-6 relative flex flex-col animate-in zoom-in duration-300 max-h-full">
        
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)", backgroundSize: "40px 40px"}}>
        </div>

        <div className="flex justify-between items-center border-b-2 border-[#aa8800] pb-3 mb-3 z-10">
            <h2 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                {finished ? "Final Grand Prix Standings" : "Leaderboard"}
            </h2>
            <span className="text-[#ddccaa] font-bold text-lg bg-black/60 px-4 py-1 rounded-full border border-[#aa8800]">
                {sortedRacers.length} Racers
            </span>
        </div>

        {/* Colonna Singola con overflow corretto */}
        <div className="flex-1 overflow-y-auto z-10 flex flex-col content-start custom-scrollbar pr-2 min-h-0">
            {sortedRacers.map((racer, index) => (
                <RenderRow key={racer.id} racer={racer} index={index} />
            ))}
        </div>

    </div>
  );
}

export const RaceResults = ({ finishers, onPlayAgain, racersData, userName, trackName, lobbyPlayers = [], isHost }) => {
  const navigate = useNavigate();
  const { playSfx, changeTrack } = useAudio();
  
  const { isLoggedIn: isLoggedIn } = useUserStore();
  const {isGrandPrix: isGrandPrix, isTimeTrial: isTimeTrial} = useGameStore();
  const { roomCode } = useRoomDataStore();
  const gameStore = useGameStore();

  const [showResults, setShowResults] = useState(false);
  const [isGrandPrixFinished, setIsGrandPrixFinished] = useState(isGrandPrix ? false : true);
  const [pointsData, setPointsData] = useState([]);

  const [ showLeaderboard, setShowLeaderboard ] = useState(false);

  // Se non ci sono risultati, non mostrare nulla
  if (!finishers || finishers.length === 0) return null;

  const updateRecordTimes = () => {
    if (isTimeTrial && finishers[0] && finishers[0].id === socket?.id) {
        const bestTime = finishers[0].finishTime;
        fetch(`/api/updateRecordTime?userName=${userName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackname: trackName, time: bestTime })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Time updated:', data);
        })
        .catch(error => {
            console.error('Error updating time:', error);
        });
    }
  };

  const isMultiplayerRace = Boolean(roomCode);
  const totalLobbyPlayers = lobbyPlayers.length;
  const finishedHumanPlayers = finishers.filter((finisher) => !String(finisher.id).startsWith('bot_')).length;
  const allLobbyPlayersFinished = !isMultiplayerRace
      ? true
      : totalLobbyPlayers > 0 && finishedHumanPlayers >= totalLobbyPlayers;

  const canHostQuitMultiplayer = isHost && allLobbyPlayersFinished;

  const handleQuit = () => {
      if (isMultiplayerRace && !canHostQuitMultiplayer) {
          return;
      }

      playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
      changeTrack('MENU', 500, true);

      // In multiplayer i punti vengono ufficializzati solo quando l'host preme Quit.
      if (socket?.connected && isHost && finishers?.length > 0 && racersData) {
          socket.emit('race_finished', {
              finishers,
              racersData
          });
      }

      if (isTimeTrial) {
          updateRecordTimes();
          gameStore.setIsTimeTrial(false);
      }
      if (isGrandPrix) {
          setIsGrandPrixFinished(true);
          gameStore.setIsGrandPrix(false);
      }
      if (isMultiplayerRace) {
          if (socket?.connected && isHost) {
              socket.emit('return_to_waiting');
          }
          navigate('/waiting');
      } else {
          navigate('/menu');
      }
  };

  const handlePlayAgain = () => {   
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    updateRecordTimes();
    if (onPlayAgain) {
        gameStore.setIsTimeTrial(true);
        onPlayAgain();
    } else {
        navigate('/game');
    }
  };

  const handleNextRace = () => {
    playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
    window.dispatchEvent(new CustomEvent('nextGrandPrixRace'));
  };

  useEffect(() => {
    console.log('RaceResults - finishers updated:', finishers);
    if (isGrandPrix) {
        setTimeout(() => {
            setShowLeaderboard(true);
        }, 5000);
    }
  }, [isGrandPrix]);

  const RenderRow = ({ finisher, index }) => {
    const position = index + 1;
    const isMe = finisher.id === socket?.id;

    // Calcolo suffisso posizione (1st, 2nd, 3rd, th)
    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';

    const formattedTime = finisher.finishTime ? formatTime(finisher.finishTime) : null;
    
    let bgGradient = 'from-black/60 to-transparent';
    let borderColor = 'border-gray-600';
    let rankColor = 'text-white';

    if (position === 1) {
        rankColor = 'text-[#FFD700]';
        bgGradient = 'from-[#332200] to-transparent';
        borderColor = 'border-[#FFD700]';
    } else if (position === 2) {
        rankColor = 'text-[#C0C0C0]';
        bgGradient = 'from-[#1a1a1a] to-transparent';
        borderColor = 'border-[#C0C0C0]';
    } else if (position === 3) {
        rankColor = 'text-[#CD7F32]';
        bgGradient = 'from-[#1a0f00] to-transparent';
        borderColor = 'border-[#CD7F32]';
    }

    if (isMe) {
        bgGradient = 'from-[#0033aa] to-transparent';
        borderColor = 'border-[#00aeff]';
    }

    let displayName = finisher.id;
    let characterName = finisher.name || 'Mario';
    
    if (isMe) {
        displayName = 'YOU';
    } else if (finisher.id.startsWith('bot_')) {
       const parts = finisher.id.split('_');
       const botNum = parseInt(parts[1]) + 1;
       displayName = `CPU ${botNum}`;
    } else {
        console.log(`Looking for player info for ID: ${finisher.id} in lobbyPlayers:`, lobbyPlayers);
        // Cerca il player nei lobbyPlayers per ottenere username e character
        const playerInfo = lobbyPlayers.find(player => player.id === finisher.id);
        if (playerInfo) {
            displayName = playerInfo.username || finisher.id;
            characterName = playerInfo.character?.name || finisher.name || 'Mario';
        }
    }

    // Processa il nome del personaggio per l'icona
    const processedCharacterName = characterName
        .split(/[^a-zA-Z0-9]+/) // Divide la stringa ad ogni spazio o segno di punteggiatura (es. il punto in "Jr.")
        .filter(Boolean)        // Rimuove eventuali stringhe vuote generate dal divisione
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizza la prima lettera di ogni parola
        .join('');              // Unisce tutto in un'unica stringa senza spazi

    return (
        <div 
            className={`
                flex items-center justify-between py-1.5 px-3 md:py-2 md:px-4 rounded-r-lg border-l-4 mb-1 shadow-sm
                bg-gradient-to-r ${bgGradient} ${borderColor}
                animate-in slide-in-from-left duration-500
            `}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center gap-4 md:gap-6">
                {/* Posizione */}
                <div className={`w-16 text-3xl font-black italic ${rankColor} drop-shadow-md text-right pr-2`}>
                    {position}<span className="text-lg align-top opacity-80">{suffix}</span>
                </div>
                
                {/* Icona Personaggio */}
                <img 
                    src={`/sprites/${processedCharacterName}.png`} 
                    alt={processedCharacterName}
                    className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md"
                    onError={(e) => { e.target.style.display='none'; }}
                />

                {/* Nome */}
                <span className={`text-xl md:text-2xl font-bold uppercase tracking-wide drop-shadow-md ${isMe ? 'text-[#00aeff]' : 'text-white'}`}>
                    {displayName}
                </span>
            </div>

            {/* Tempo */}
            <div className="font-mono tabular-nums text-white text-lg md:text-xl tracking-wider font-bold drop-shadow-[2px_2px_0_#000] bg-black/40 px-3 py-1.5 rounded-md border border-white/10 flex items-baseline justify-end min-w-[140px]">
                {formattedTime ? (
                    <>
                        <span>{formattedTime.minutes}</span>
                        <span className="text-white/50 mx-[2px]">:</span>
                        <span>{formattedTime.seconds}</span>
                        <span className="text-white/50 mx-[2px]">:</span>
                        <span className="text-[#FFD000] text-base ml-[1px]">{formattedTime.milliseconds}</span>
                    </>
                ) : (
                    <span className="text-white/40 tracking-[4px]">--:--.---</span>
                )}
            </div>
        </div>
    );
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      
      {/* CONTAINER PRINCIPALE */}
      <div className="fixed inset-0 z-[2000] font-sans select-none text-white flex flex-col bg-black/40 backdrop-blur-sm p-4 md:p-8">
        
        <div className="relative w-full h-full flex flex-col">

          {/* AREA CENTRALE - Modificati items-start e pt-[4vh] per stare più in alto */}
          <div className="flex-1 flex items-start justify-center pt-[4vh] pb-[2vh] px-2 md:px-8 w-full min-h-0">
            
            {isGrandPrix && showResults ? (
                <LeaderBoard finished={isGrandPrixFinished} racersData={pointsData} socket={socket}/>
            ) : (
                <div className="w-full max-w-4xl bg-black/90 border-4 border-[#aa8800] rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9)] p-4 md:p-6 relative flex flex-col animate-in zoom-in duration-300 max-h-full">
                    
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)", backgroundSize: "40px 40px"}}>
                    </div>

                    <div className="flex justify-between items-center border-b-2 border-[#aa8800] pb-3 mb-3 z-10">
                        <h2 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                            Final Standing
                        </h2>
                        <span className="text-[#ddccaa] font-bold text-lg bg-black/60 px-4 py-1 rounded-full border border-[#aa8800]">
                            {finishers.length} Racers Finished
                        </span>
                    </div>

                    {/* Colonna Singola Tempi con min-h-0 per permettere l'overflow scroll */}
                    <div className="flex-1 overflow-y-auto z-10 flex flex-col content-start custom-scrollbar pr-2 min-h-0">
                        {finishers.map((finisher, index) => (
                            <RenderRow key={finisher.id} finisher={finisher} index={index} />
                        ))}
                    </div>
                </div>
            )}
          </div>

          {/* FOOTER / AREA BOTTONI - Modificato in absolute per non "mangiare" spazio verticale vitale */}
          <div className="absolute bottom-6 right-8 flex flex-col items-end gap-3 z-30 pointer-events-none">
            
            {/* 1. Bottone PLAY AGAIN (Solo Time Trial) */}
            {isTimeTrial && (
                <button 
                    onClick={handlePlayAgain}
                    className="pointer-events-auto flex items-center gap-3 bg-white px-8 py-2.5 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group w-84 justify-between"
                >
                    <span className="text-gray-600 font-bold text-xl tracking-wide uppercase">Play Again</span>
                    <div className="w-8 h-8 rounded-full bg-[#22cc22] text-white flex items-center justify-center font-bold shadow-inner border border-white/50 group-hover:rotate-180 transition-transform duration-500">↻</div>
                </button>
            )}

            {/* 2. Bottone SEE LEADERBOARD */}
            {isGrandPrix && !isGrandPrixFinished && !showResults && showLeaderboard && (
                <button 
                    onClick={() => {
                        setShowResults(true);
                        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
                        setPointsData(calculatePoints(racersData));
                    }}
                    className="pointer-events-auto flex items-center gap-3 bg-white px-8 py-2.5 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group w-84 justify-between"
                >
                    <span className="text-gray-600 font-bold text-xl tracking-wide uppercase">Leaderboard</span>
                    <div className="w-8 h-8 rounded-full bg-[#ffcc00] text-white flex items-center justify-center font-bold text-sm shadow-inner border border-white/50 group-hover:scale-110 transition-transform">★</div>
                </button>
            )}

            {/* 3. Bottone NEXT RACE */}
            {isGrandPrix && !isGrandPrixFinished && showResults && (
                <button 
                    onClick={handleNextRace}
                    className="pointer-events-auto flex items-center gap-3 bg-white px-8 py-2.5 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group w-84 justify-between"
                >
                    <span className="text-gray-600 font-bold text-xl tracking-wide uppercase">Next Race</span>
                    <div className="w-8 h-8 rounded-full bg-[#ffff44] text-gray-700 flex items-center justify-center font-bold shadow-inner border border-white/50 group-hover:scale-110 transition-transform">➜</div>
                </button>
            )}

            {/* 4. Bottone QUIT */}

            {/* {!isLoggedIn && (
                <button 
                    onClick={handleQuit}
                    className="pointer-events-auto flex items-center gap-3 bg-white px-8 py-2.5 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group w-84 justify-between"
                >
                    <span className="text-gray-600 font-bold text-xl tracking-wide uppercase">Quit</span>
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold shadow-inner border border-white/50 group-hover:scale-110 transition-transform">✖</div>
                </button>
            )} */}

            {((!isMultiplayerRace && isTimeTrial) || !isLoggedIn) && (
                <button 
                    onClick={handleQuit}
                    className="pointer-events-auto flex items-center gap-3 bg-white px-8 py-2.5 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer group w-84 justify-between"
                >
                    <span className="text-gray-600 font-bold text-xl tracking-wide uppercase">Quit</span>
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold shadow-inner border border-white/50 group-hover:scale-110 transition-transform">✖</div>
                </button>
            )}

            {isMultiplayerRace && isHost && (
                <>
                    <button 
                        onClick={handleQuit}
                        disabled={!allLobbyPlayersFinished}
                        className={`pointer-events-auto flex items-center gap-3 px-8 py-2.5 rounded-full border-[3px] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] transition-all w-84 justify-between ${allLobbyPlayersFinished ? 'bg-white border-[#cccccc] hover:bg-[#f0f0f0] cursor-pointer group' : 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-70'}`}
                    >
                        <span className="text-gray-700 font-bold text-xl tracking-wide uppercase">Back To Waiting</span>
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold shadow-inner border border-white/50">↩</div>
                    </button>
                    {!allLobbyPlayersFinished && (
                        <div className="pointer-events-none bg-black/60 text-yellow-300 text-sm px-4 py-2 rounded-md border border-yellow-500/40">
                            Waiting racers: {finishedHumanPlayers}/{totalLobbyPlayers}
                        </div>
                    )}
                </>
            )}

          </div>

        </div>
      </div>

      <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-left: 1px solid #aa8800; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #aa8800; border: 1px solid #ffcc00; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffcc00; }
      `}</style>
    </>
  );
};