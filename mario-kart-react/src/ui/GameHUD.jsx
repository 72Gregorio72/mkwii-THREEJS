import React, { useEffect, useState, useRef } from 'react';
import { ITEMS } from '../Items/PowerupHandler';

// Font face per Mario Kart Wii + Digital Clock Font
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
  [ITEMS.BULLET_BILL]: '/itemSprites/BulletBill.png',
};

export const GameHUD = ({ lap = 1, totalLaps = 3, rank = 1, playerId = "player", gameState = 'INTRO', finished = false }) => {
  
  // --- STATI LOCALI ---
  const [speed, setSpeed] = useState(0);
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const [animClass, setAnimClass] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  
  // --- TIMER STATE ---
  const [raceTime, setRaceTime] = useState(0);
  const raceStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const hasStarted = useRef(false);
  const lastLapRef = useRef(1);
  const lapStartTimeRef = useRef(null);

  // --- FREEZE & FLASH STATE ---
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenTimeValue, setFrozenTimeValue] = useState(0);

  // 1. GESTIONE TIMER GENERALE
  useEffect(() => {
    if (gameState === 'RACING' && !hasStarted.current) {
      hasStarted.current = true;
      raceStartTimeRef.current = Date.now();
      lapStartTimeRef.current = Date.now();
      
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - raceStartTimeRef.current;
        setRaceTime(elapsed);
      }, 10);
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

  // 2. GESTIONE CAMBIO GIRO (Blocco 2s + Fade in/out Rosso)
  useEffect(() => {
    if (lap > lastLapRef.current && hasStarted.current) {
      
      // Calcola il tempo del giro appena completato (non il tempo totale)
      const now = Date.now();
      const lapTime = now - lapStartTimeRef.current;
      setFrozenTimeValue(lapTime); // Salva il tempo del giro
      setIsFrozen(true);            // Blocca l'UI
      
      lapStartTimeRef.current = now; // Reset per il prossimo giro
      lastLapRef.current = lap;

      // Sblocca dopo 2 secondi
      const timer = setTimeout(() => {
        setIsFrozen(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [lap]); // Dipendenza solo da [lap] per evitare loop infiniti

  // Formatta il tempo
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(3, '0')
    };
  };

  const displayTime = isFrozen ? frozenTimeValue : raceTime;
  const timeFormatted = formatTime(displayTime);

  // GESTIONE UPDATE HUD
  useEffect(() => {
    const handleHudUpdate = (e) => {
        if (!e.detail) return;
        if (e.detail.targetRacerId && e.detail.targetRacerId !== playerId) return; 

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

    window.addEventListener('hud-update', handleHudUpdate);
    return () => window.removeEventListener('hud-update', handleHudUpdate);
  }, [playerId]);

  // Animazione Item
  useEffect(() => {
    if (currentItem !== ITEMS.NONE) {
      setAnimClass('pop-in');
      const t = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(t);
    }
  }, [currentItem]);

  const itemImage = ITEM_SPRITES[currentItem];
  const finalItemAnim = (!isSpinning && currentItem !== ITEMS.NONE) ? 'pop-in' : '';
  const spinningAnim = isSpinning ? 'roulette-blur' : '';
  const safeRender = (val) => (isNaN(val) || val === null || val === undefined) ? 0 : val;

  // Classe CSS condizionale
  const flashClass = isFrozen ? 'flash-red' : '';

  return (
    <div style={styles.container}>
      <style>{mkwiiFontStyle}</style>
      
      {/* AGGIORNATA LA SEZIONE CSS SOTTOSTANTE */}
      <style>{`
        .pop-in { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        /* NUOVA ANIMAZIONE FADE ROSSO */
        @keyframes flashRedFade {
          0% { opacity: 1; }
          50% { opacity: 0; } /* Diventa invisibile */
          100% { opacity: 1; }
        }
        
        .flash-red {
          /* Forza il colore rosso */
          background: none !important; 
          -webkit-text-fill-color: red !important;
          color: red !important;
          text-shadow: 2px 2px 0px black !important;
          
          /* Applica il Fade In / Fade Out - 0.5s significa 4 lampeggi in 2 secondi */
          animation: flashRedFade 0.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* --- ITEM BOX --- */}
      <div style={styles.itemBoxContainer}>
        <div style={styles.itemBoxBg}></div>
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

      {/* --- TOP RIGHT: TIME / LAP --- */}
      <div style={styles.topRight}>
        <div style={styles.mkwiiRow}>
          <span style={styles.mkwiiLabel}>TIME</span>
          <div style={styles.mkwiiTimeContainer}>
            <span className={flashClass} style={styles.mkwiiNumber}>{timeFormatted.minutes}</span>
            <span className={flashClass} style={styles.mkwiiSeparator}>'</span>
            <span className={flashClass} style={styles.mkwiiNumber}>{timeFormatted.seconds}</span>
            <span className={flashClass} style={styles.mkwiiSeparator}>"</span>
            <span className={flashClass} style={styles.mkwiiMillis}>{timeFormatted.milliseconds}</span>
          </div>
        </div>
        
        <div style={styles.mkwiiRow}>
          <span style={styles.mkwiiLabel}>LAP</span>
          <div style={styles.mkwiiLapContainer}>
            <span style={styles.mkwiiLapNumber}>{lap}</span>
            <span style={styles.mkwiiLapSeparator}>/</span>
            <span style={styles.mkwiiLapTotal}>{totalLaps}</span>
          </div>
        </div>
      </div>

      {/* --- RANK --- */}
      <div style={styles.rankContainer}>
        <img 
          src={`/RankSprites/rank${safeRender(rank)}.png`} 
          alt={`Rank ${rank}`}
          style={{ width: '120px', height: 'auto', filter: 'drop-shadow(4px 4px 0px black)' }}
        />
      </div>

      {/* --- SPEEDOMETER --- */}
      <div style={styles.speedContainer}>
        <span style={styles.speedValue}>{speed}</span>
        <span style={styles.speedUnit}>km/h</span>
      </div>
    </div>
  );
};

// ... Styles (invariati)
const styles = {
  container: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
    fontFamily: '"MKWii", "Arial Black", Gadget, sans-serif',
    fontStyle: 'normal',
    userSelect: 'none',
    overflow: 'hidden',
    zIndex: 10
  },
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
    width: '90%', height: '90%', objectFit: 'contain', zIndex: 2,
    filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.6))'
  },
  topRight: {
    position: 'absolute',
    top: '15px', right: '15px',
    textAlign: 'right',
    display: 'flex', flexDirection: 'column', gap: '0px',
    fontFamily: '"MKWii", "Arial Black", sans-serif',
    paddingRight: '10px',
  },
  mkwiiRow: {
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px',
  },
  mkwiiLabel: {
    fontFamily: '"MKWii", "Arial Black", sans-serif', fontSize: '53px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold', letterSpacing: '1px', fontStyle: 'italic',
    paddingRight: '20px', paddingBottom: '10px'
  },
  mkwiiTimeContainer: {
    display: 'flex', alignItems: 'baseline', paddingRight: '5px',
  },
  mkwiiNumber: {
    fontFamily: '"Digital7", monospace', fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold', fontStyle: 'normal', letterSpacing: '3px',
  },
  mkwiiSeparator: {
    fontFamily: '"Digital7", monospace', fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    margin: '0 1px', fontStyle: 'normal', fontWeight: 'bold',
  },
  mkwiiMillis: {
    fontFamily: '"Digital7", monospace', fontSize: '34px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold', fontStyle: 'normal', letterSpacing: '3px',
  },
  mkwiiLapContainer: {
    display: 'flex', alignItems: 'baseline', paddingBottom: '5px'
  },
  mkwiiLapNumber: {
    fontFamily: '"Digital7", monospace', fontSize: '50px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold', fontStyle: 'normal', letterSpacing: '3px',
  },
  mkwiiLapSeparator: {
    fontFamily: '"Digital7", monospace', fontSize: '42px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    margin: '0 2px', fontStyle: 'normal', fontWeight: 'bold',
  },
  mkwiiLapTotal: {
    fontFamily: '"Digital7", monospace', fontSize: '38px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    fontWeight: 'bold', fontStyle: 'normal', letterSpacing: '3px',
  },
  rankContainer: {
    position: 'absolute', bottom: '40px', left: '30px',
    color: '#E0E0E0', textShadow: '4px 4px 0 #000, -1px -1px 0 #000', lineHeight: '0.8'
  },
  speedContainer: {
    position: 'absolute', bottom: '40px', right: '50px', textAlign: 'right',
  },
  speedValue: {
    fontFamily: '"Digital7", monospace', fontSize: '60px', fontWeight: 'bold',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-2px -2px 0 #000) drop-shadow(2px -2px 0 #000) drop-shadow(-2px 2px 0 #000) drop-shadow(2px 2px 0 #000)',
    letterSpacing: '3px',
  },
  speedUnit: {
    fontFamily: '"MKWii", "Arial Black", sans-serif', fontSize: '20px', marginLeft: '5px',
    background: 'linear-gradient(180deg, #FFE135 0%, #FFD000 40%, #E5A000 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
  },
};