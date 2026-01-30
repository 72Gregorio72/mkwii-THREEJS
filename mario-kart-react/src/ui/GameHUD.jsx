import React, { useEffect, useState, useRef } from 'react';
import { ITEMS } from '../Items/PowerupHandler';

// Font face per Mario Kart Wii + Digital Clock Font (7-segment LCD style Casio)
const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'Digital7';
    src: url('/font/digital7.woff2') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
`;

// Mappa gli Enum ai percorsi dei file
const ITEM_SPRITES = {
  [ITEMS.NONE]: null,
  [ITEMS.MUSHROOM]: '/itemSprites/Mushroom.png',
  [ITEMS.TRIPLE_MUSHROOM]: '/itemSprites/TripleMushroom.png',
  [ITEMS.GOLDEN_MUSHROOM]: '/itemSprites/GoldenMushroom.png',
  [ITEMS.BANANA]: '/itemSprites/Banana.png',
  [ITEMS.TRIPLE_BANANA]: '/itemSprites/TripleBanana.png',
  [ITEMS.GREEN_SHELL]: '/itemSprites/GreenShell.png',
  [ITEMS.TRIPLE_GREEN_SHELL]: '/itemSprites/TripleGreenShell.png',
  [ITEMS.RED_SHELL]: '/itemSprites/RedShell.png',
  [ITEMS.TRIPLE_RED_SHELL]: '/itemSprites/TripleRedShell.png',
  [ITEMS.BLUE_SHELL]: '/itemSprites/BlueShell.png',
  [ITEMS.BOB_OMB]: '/itemSprites/Bobomb.png',
  [ITEMS.STAR]: '/itemSprites/Star.png',
  [ITEMS.MEGA_MUSHROOM]: '/itemSprites/MegaMushroom.png',
  [ITEMS.LIGHTNING]: '/itemSprites/Lightning.png',
};

// 1. FIX: Added default values to props to prevent undefined startup
export const GameHUD = ({ lap = 1, totalLaps = 3, rank = 1, playerId = "player", gameState = 'INTRO', finished = false }) => {
  
  // --- STATI LOCALI PER DATI AD ALTA FREQUENZA ---
  const [speed, setSpeed] = useState(0);
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const [animClass, setAnimClass] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  
  // --- TIMER STATE ---
  const [raceTime, setRaceTime] = useState(0); // tempo in millisecondi
  const raceStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const hasStarted = useRef(false);

  // --- LAP TIMES STATE ---
  const [lapTimes, setLapTimes] = useState([]); // Array dei tempi per ogni giro
  const [lapDiff, setLapDiff] = useState(null); // Differenza con il giro precedente
  const [showLapDiff, setShowLapDiff] = useState(false);
  const lastLapRef = useRef(1);
  const lapStartTimeRef = useRef(null);

  // Avvia il timer solo quando gameState diventa 'RACING'
  useEffect(() => {
    if (gameState === 'RACING' && !hasStarted.current) {
      hasStarted.current = true;
      raceStartTimeRef.current = Date.now();
      lapStartTimeRef.current = Date.now();
      
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - raceStartTimeRef.current;
        setRaceTime(elapsed);
      }, 10); // Aggiorna ogni 10ms per i millisecondi
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState]);

  // Ferma il timer quando la gara finisce
  useEffect(() => {
    if (finished && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [finished]);

  // Formatta il tempo in MM:SS.mmm
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10); // Solo 2 cifre per i centesimi
    
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(3, '0')
    };
  };

  const timeFormatted = formatTime(raceTime);

  // Gestione cambio giro - calcola tempo giro e differenza
  useEffect(() => {
    if (lap > lastLapRef.current && hasStarted.current) {
      const currentLapTime = Date.now() - lapStartTimeRef.current;
      
      // Salva il tempo del giro completato
      setLapTimes(prev => {
        const newLapTimes = [...prev, currentLapTime];
        
        // Calcola la differenza con il giro precedente
        if (newLapTimes.length >= 2) {
          const diff = currentLapTime - newLapTimes[newLapTimes.length - 2];
          setLapDiff(diff);
          setShowLapDiff(true);
          
          // Nascondi la differenza dopo 3 secondi
          setTimeout(() => setShowLapDiff(false), 3000);
        } else {
          // Primo giro completato - mostra solo il tempo
          setLapDiff(0);
          setShowLapDiff(true);
          setTimeout(() => setShowLapDiff(false), 3000);
        }
        
        return newLapTimes;
      });
      
      // Reset timer per il nuovo giro
      lapStartTimeRef.current = Date.now();
      lastLapRef.current = lap;
    }
  }, [lap]);

  // Formatta la differenza di tempo
  const formatDiff = (ms) => {
    const sign = ms >= 0 ? '+' : '-';
    const absMs = Math.abs(ms);
    const seconds = Math.floor(absMs / 1000);
    const millis = Math.floor((absMs % 1000) / 10);
    return `${sign}${seconds}.${String(millis).padStart(2, '0')}`;
  };

  // Formatta il tempo del giro
  const formatLapTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes}'${String(seconds).padStart(2, '0')}"${String(millis).padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleHudUpdate = (e) => {
        if (!e.detail) return;

        if (e.detail.targetRacerId && e.detail.targetRacerId !== playerId) {
            return; 
        }

        const { speed: rawSpeed, item: newItem, isSpinning: spinning } = e.detail;
        
        if (rawSpeed !== undefined) {
            let safeSpeed = Number(rawSpeed);
            setSpeed(Math.abs(Math.round((isNaN(safeSpeed) ? 0 : safeSpeed) * 1.5)));
        }

        if (newItem !== undefined) {
            setCurrentItem(newItem);
            setIsSpinning(spinning || false);
        }
    };

    // Aggiungi listener
    window.addEventListener('hud-update', handleHudUpdate);

    // Rimuovi listener quando il componente si smonta
    return () => window.removeEventListener('hud-update', handleHudUpdate);
  }, [playerId]);

  // --- ANIMAZIONE POP OGGETTO ---
  useEffect(() => {
    if (currentItem !== ITEMS.NONE) {
      setAnimClass('pop-in');
      const t = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(t);
    }
  }, [currentItem]);

  // Determina quale immagine mostrare
  const itemImage = ITEM_SPRITES[currentItem];

  const finalItemAnim = (!isSpinning && currentItem !== ITEMS.NONE) ? 'pop-in' : '';
	const spinningAnim = isSpinning ? 'roulette-blur' : '';

  // 3. FIX: Helper to render numbers safely in JSX
  const safeRender = (val) => {
      if (isNaN(val) || val === null || val === undefined) return 0;
      return val;
  };

  return (
    <div style={styles.container}>
      {/* Inject font-face CSS */}
      <style>{mkwiiFontStyle}</style>
      
      {/* --- TOP LEFT: ITEM BOX --- */}
      <div style={styles.itemBoxContainer}>
        {/* Sfondo del box oggetto */}
        <div style={styles.itemBoxBg}></div>
        
        {/* Sprite dell'oggetto */}
        {itemImage && (
          <img 
			src={itemImage} 
			alt="Item" 
			className={`${finalItemAnim} ${spinningAnim}`}
			style={{
				...styles.itemImage,
				filter: isSpinning ? 'blur(2px) brightness(1.2)' : styles.itemImage.filter
			}} 
			/>
		)}
      </div>

      {/* --- TOP RIGHT: TIME / LAP (Mario Kart Wii Style) --- */}
      <div style={styles.topRight}>
        {/* TIME */}
        <div style={styles.mkwiiRow}>
          <span style={styles.mkwiiLabel}>TIME</span>
          <div style={styles.mkwiiTimeContainer}>
            <span style={styles.mkwiiNumber}>{timeFormatted.minutes}</span>
            <span style={styles.mkwiiSeparator}>'</span>
            <span style={styles.mkwiiNumber}>{timeFormatted.seconds}</span>
            <span style={styles.mkwiiSeparator}>"</span>
            <span style={styles.mkwiiMillis}>{timeFormatted.milliseconds}</span>
          </div>
        </div>
        
        {/* LAP */}
        <div style={styles.mkwiiRow}>
          <span style={styles.mkwiiLabel}>LAP</span>
          <div style={styles.mkwiiLapContainer}>
            <span style={styles.mkwiiLapNumber}>{lap}</span>
            <span style={styles.mkwiiLapSeparator}>/</span>
            <span style={styles.mkwiiLapTotal}>{totalLaps}</span>
          </div>
        </div>

        {/* LAP TIMES */}
        {lapTimes.length > 0 && (
          <div style={styles.lapTimesContainer}>
            {lapTimes.map((time, index) => (
              <div key={index} style={styles.lapTimeRow}>
                <span style={styles.lapTimeLabel}>LAP {index + 1}</span>
                <span style={styles.lapTimeValue}>{formatLapTime(time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LAP DIFF POPUP */}
      {showLapDiff && lapTimes.length > 0 && (
        <div style={{
          ...styles.lapDiffPopup,
          color: lapDiff === 0 ? '#ffffff' : (lapDiff > 0 ? '#ff4444' : '#44ff44')
        }}>
          <div style={styles.lapDiffTime}>
            {formatLapTime(lapTimes[lapTimes.length - 1])}
          </div>
          {lapTimes.length > 1 && (
            <div style={{
              ...styles.lapDiffValue,
              color: lapDiff > 0 ? '#ff4444' : '#44ff44'
            }}>
              {formatDiff(lapDiff)}
            </div>
          )}
        </div>
      )}

      {/* --- BOTTOM LEFT: RANK --- */}
      <div style={styles.rankContainer}>
		<img 	
			src={`/RankSprites/rank${safeRender(rank)}.png`} 
			alt={`Rank ${rank}`}
			style={{ width: '120px', height: 'auto', filter: 'drop-shadow(4px 4px 0px black)' }}
		/>
      </div>

      {/* --- BOTTOM RIGHT: SPEEDOMETER --- */}
      <div style={styles.speedContainer}>
        <span style={styles.speedValue}>{speed}</span>
        <span style={styles.speedUnit}>km/h</span>
      </div>

      {/* Stili CSS Animazione */}
      <style>{`
        .pop-in { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1.1); }
          25% { transform: scale(1); }
          75% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

// Helper per 1st, 2nd, 3rd...
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = {
  container: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none', // IMPORTANTE: lascia passare i click al gioco sotto
    fontFamily: '"MKWii", "Arial Black", Gadget, sans-serif',
    fontStyle: 'normal',
    userSelect: 'none',
    overflow: 'hidden',
    zIndex: 10 // Assicura che stia sopra al Canvas
  },
  // ITEM BOX STYLE
  itemBoxContainer: {
    position: 'absolute',
    top: '30px', left: '30px',
    width: '140px', height: '120px',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    filter: 'drop-shadow(5px 5px 0px rgba(0,0,0,0.5))'
  },
  itemBoxBg: {
    position: 'absolute',
    width: '100%', height: '100%',
    background: 'radial-gradient(circle, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0) 70%)',
    border: '4px solid rgba(255,255,255,0.3)',
    borderRadius: '20px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
    transform: 'skewX(-10deg)',
  },
  itemImage: {
    width: '90%',
    height: '90%',
    objectFit: 'contain',
    zIndex: 2,
    filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.6))'
  },
  // TOP RIGHT - Mario Kart Wii Style
  topRight: {
    position: 'absolute',
    top: '15px', right: '15px',
    textAlign: 'right',
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0px',
    fontFamily: '"MKWii", "Arial Black", sans-serif',
    paddingRight: '10px',
  },
  // Mario Kart Wii Row Style
  mkwiiRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
  },
  mkwiiLabel: {
    fontFamily: '"MKWii", "Arial Black", sans-serif',
    fontSize: '53px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    letterSpacing: '1px',
    fontStyle: 'italic',
    paddingRight: '20px',
    paddingBottom: '10px'
  },
  mkwiiTimeContainer: {
    display: 'flex',
    alignItems: 'baseline',
    paddingRight: '5px',
  },
  mkwiiNumber: {
    fontFamily: '"Digital7", monospace',
    fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: '3px',
  },
  mkwiiSeparator: {
    fontFamily: '"Digital7", monospace',
    fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    margin: '0 1px',
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  mkwiiMillis: {
    fontFamily: '"Digital7", monospace',
    fontSize: '34px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: '3px',
  },
  // LAP Counter Style
  mkwiiLapContainer: {
    display: 'flex',
    alignItems: 'baseline',
    paddingBottom: '5px'
  },
  mkwiiLapNumber: {
    fontFamily: '"Digital7", monospace',
    fontSize: '50px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: '3px',
  },
  mkwiiLapSeparator: {
    fontFamily: '"Digital7", monospace',
    fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    margin: '0 2px',
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  mkwiiLapTotal: {
    fontFamily: '"Digital7", monospace',
    fontSize: '38px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: '3px',
  },
  // Legacy styles kept for compatibility
  labelValue: {
    display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center'
  },
  labelText: {
    fontSize: '24px', color: '#fff', textShadow: '2px 2px 0 #000'
  },
  valueText: {
    fontSize: '36px', letterSpacing: '2px'
  },
  // RANK
  rankContainer: {
    position: 'absolute',
    bottom: '40px', left: '30px',
    color: '#E0E0E0',
    textShadow: '4px 4px 0 #000, -1px -1px 0 #000',
    lineHeight: '0.8'
  },
  rankBig: {
    fontSize: '100px',
    fontWeight: '900',
    background: 'linear-gradient(to bottom, #fff 0%, #ccc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(4px 4px 0px black)'
  },
  rankSmall: {
    fontSize: '40px',
    marginLeft: '5px'
  },
  // SPEED
  speedContainer: {
    position: 'absolute',
    bottom: '40px', right: '50px',
    textAlign: 'right',
  },
  speedValue: {
    fontFamily: '"Digital7", monospace',
    fontSize: '60px',
    fontWeight: 'bold',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    letterSpacing: '3px',
  },
  speedUnit: {
    fontFamily: '"MKWii", "Arial Black", sans-serif',
    fontSize: '20px',
    marginLeft: '5px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
  },
  // LAP TIMES
  lapTimesContainer: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    paddingRight: '5px',
  },
  lapTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  lapTimeLabel: {
    fontFamily: '"MKWii", "Arial Black", sans-serif',
    fontSize: '18px',
    color: '#ffffff',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
    fontStyle: 'italic',
  },
  lapTimeValue: {
    fontFamily: '"Digital7", monospace',
    fontSize: '22px',
    background: 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
    fontWeight: 'bold',
  },
  // LAP DIFF POPUP
  lapDiffPopup: {
    position: 'absolute',
    top: '35%',
    right: '25px',
    textAlign: 'right',
    animation: 'fadeInOut 3s ease-in-out',
  },
  lapDiffTime: {
    fontFamily: '"Digital7", monospace',
    fontSize: '48px',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lapDiffValue: {
    fontFamily: '"Digital7", monospace',
    fontSize: '36px',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold',
    marginTop: '5px',
  }
};