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

// Costanti Tailwind per stili di testo riutilizzati (Stroke + Gradient MKWii)
const textGradientStroke = "bg-[linear-gradient(180deg,#FFE135_0%,#FFD000_40%,#E5A000_100%)] bg-clip-text text-transparent [filter:drop-shadow(-2px_-2px_0_#000)_drop-shadow(2px_-2px_0_#000)_drop-shadow(-2px_2px_0_#000)_drop-shadow(2px_2px_0_#000)]";
const smallTextGradientStroke = "bg-[linear-gradient(180deg,#FFE135_0%,#FFD000_40%,#E5A000_100%)] bg-clip-text text-transparent [filter:drop-shadow(-1px_-1px_0_#000)_drop-shadow(1px_-1px_0_#000)_drop-shadow(-1px_1px_0_#000)_drop-shadow(1px_1px_0_#000)]";

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

  // 0. GESTIONE RESET (Quando si clicca Play Again e lo stato torna a INTRO/COUNTDOWN)
  useEffect(() => {
    if (gameState === 'INTRO' || gameState === 'COUNTDOWN') {
      hasStarted.current = false;
      setRaceTime(0);
      setFrozenTimeValue(0);
      setIsFrozen(false);
      lastLapRef.current = 1;
      
      // Reset visuale dell'oggetto nell'HUD
      setCurrentItem(ITEMS.NONE);
      setIsSpinning(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [gameState]);

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

  // 2. Ferma il timer quando la gara finisce
  useEffect(() => {
    if (finished && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [finished]);

  // 3. GESTIONE CAMBIO GIRO (Blocco 2s + Fade in/out Rosso)
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

  // 4. GESTIONE UPDATE HUD (Custom Event ricevuto dal Kart/Moto)
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

  // Animazione Item Pop-in
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

  // Classe CSS condizionale per il "freeze" di fine giro
  const flashClass = isFrozen ? 'flash-red' : '';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none font-['MKWii',_'Arial_Black',_Gadget,_sans-serif] not-italic select-none overflow-hidden z-10">
      <style>{mkwiiFontStyle}</style>
      
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
      <div className="absolute top-[30px] left-[30px] w-[140px] h-[120px] flex justify-center items-center drop-shadow-[5px_5px_0px_rgba(0,0,0,0.5)]">
        <div className="absolute w-full h-full bg-[radial-gradient(circle,_rgba(0,0,0,0.6)_20%,_rgba(0,0,0,0)_70%)] border-4 border-[rgba(255,255,255,0.3)] rounded-[20px] bg-[rgba(0,0,0,0.2)] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] -skew-x-[10deg]"></div>
        {itemImage && (
          <img 
            src={itemImage} 
            alt="Item" 
            className={`w-[90%] h-[90%] object-contain z-[2] ${finalItemAnim} ${spinningAnim} ${isSpinning ? 'blur-[2px] brightness-[1.2]' : 'drop-shadow-[0px_0px_10px_rgba(255,255,255,0.6)]'}`}
          />
        )}
      </div>

      {/* --- TOP RIGHT: TIME / LAP --- */}
      <div className="absolute top-[15px] right-[15px] text-right flex flex-col gap-0 font-['MKWii',_'Arial_Black',_sans-serif] pr-[10px]">
        <div className="flex justify-end items-center gap-[8px]">
          <span className={`font-['MKWii',_'Arial_Black',_sans-serif] text-[53px] font-bold tracking-[1px] italic pr-[20px] pb-[10px] ${textGradientStroke}`}>
            TIME
          </span>
          <div className="flex items-baseline pr-[5px]">
            <span className={`${flashClass} font-['Digital7',_monospace] text-[42px] font-bold not-italic tracking-[3px] ${textGradientStroke}`}>{timeFormatted.minutes}</span>
            <span className={`${flashClass} font-['Digital7',_monospace] text-[42px] mx-[1px] not-italic font-bold ${textGradientStroke}`}>'</span>
            <span className={`${flashClass} font-['Digital7',_monospace] text-[42px] font-bold not-italic tracking-[3px] ${textGradientStroke}`}>{timeFormatted.seconds}</span>
            <span className={`${flashClass} font-['Digital7',_monospace] text-[42px] mx-[1px] not-italic font-bold ${textGradientStroke}`}>"</span>
            <span className={`${flashClass} font-['Digital7',_monospace] text-[34px] font-bold not-italic tracking-[3px] ${textGradientStroke}`}>{timeFormatted.milliseconds}</span>
          </div>
        </div>
        
        <div className="flex justify-end items-center gap-[8px]">
          <span className={`font-['MKWii',_'Arial_Black',_sans-serif] text-[53px] font-bold tracking-[1px] italic pr-[20px] pb-[10px] ${textGradientStroke}`}>
            LAP
          </span>
          <div className="flex items-baseline pb-[5px]">
            <span className={`font-['Digital7',_monospace] text-[50px] font-bold not-italic tracking-[3px] ${textGradientStroke}`}>{lap}</span>
            <span className={`font-['Digital7',_monospace] text-[42px] mx-[2px] not-italic font-bold ${textGradientStroke}`}>/</span>
            <span className={`font-['Digital7',_monospace] text-[38px] font-bold not-italic tracking-[3px] ${textGradientStroke}`}>{totalLaps}</span>
          </div>
        </div>
      </div>

      {/* --- RANK --- */}
      <div className="absolute bottom-[40px] left-[30px] text-[#E0E0E0] [text-shadow:4px_4px_0_#000,_-1px_-1px_0_#000] leading-[0.8]">
        <img 
          src={`/RankSprites/rank${safeRender(rank)}.png`} 
          alt={`Rank ${rank}`}
          className="w-[120px] h-auto drop-shadow-[4px_4px_0px_black]"
        />
      </div>

      {/* --- SPEEDOMETER --- */}
      <div className="absolute bottom-[40px] right-[50px] text-right">
        <span className={`font-['Digital7',_monospace] text-[60px] font-bold tracking-[3px] ${textGradientStroke}`}>
          {speed}
        </span>
        <span className={`font-['MKWii',_'Arial_Black',_sans-serif] text-[20px] ml-[5px] ${smallTextGradientStroke}`}>
          km/h
        </span>
      </div>
    </div>
  );
};