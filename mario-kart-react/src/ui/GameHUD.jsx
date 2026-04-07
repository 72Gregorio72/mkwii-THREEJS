import React, { useEffect, useState, useRef } from 'react';
import { ITEMS } from '../Items/PowerupHandler';

const ITEM_SPRITES = {
  'NONE': null,
  'MUSHROOM': '/itemSprites/Mushroom.png',
  'DOUBLE_MUSHROOM': '/itemSprites/DoubleMushroom.png',
  'TRIPLE_MUSHROOM': '/itemSprites/TripleMushroom.png',
  'GOLDEN_MUSHROOM': '/itemSprites/GoldenMushroom.png',
  'BANANA': '/itemSprites/Banana.png',
  'TRIPLE_BANANA': '/itemSprites/TripleBanana.png',
  'GREEN_SHELL': '/itemSprites/GreenShell.png',
  'TRIPLE_GREEN_SHELL': '/itemSprites/TripleGreenShell.png',
  'RED_SHELL': '/itemSprites/RedShell.png',
  'TRIPLE_RED_SHELL': '/itemSprites/TripleRedShell.png',
  'BLUE_SHELL': '/itemSprites/BlueShell.png',
  'BOB_OMB': '/itemSprites/Bobomb.png',
  'STAR': '/itemSprites/Star.png',
  'MEGA_MUSHROOM': '/itemSprites/MegaMushroom.png',
  'LIGHTNING': '/itemSprites/Lightning.png',
  'BULLET_BILL': '/itemSprites/BulletBill.png',
};

// Costanti Tailwind per stili di testo riutilizzati
const textGradientStroke = "bg-[linear-gradient(180deg,#FFE135_0%,#FFD000_40%,#E5A000_100%)] bg-clip-text text-transparent [filter:drop-shadow(-2px_-2px_0_#000)_drop-shadow(2px_-2px_0_#000)_drop-shadow(-2px_2px_0_#000)_drop-shadow(2px_2px_0_#000)]";
const smallTextGradientStroke = "bg-[linear-gradient(180deg,#FFE135_0%,#FFD000_40%,#E5A000_100%)] bg-clip-text text-transparent [filter:drop-shadow(-1px_-1px_0_#000)_drop-shadow(1px_-1px_0_#000)_drop-shadow(-1px_1px_0_#000)_drop-shadow(1px_1px_0_#000)]";

export const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(3, '0')
    };
};


export const GameHUD = ({ lap = 1, totalLaps = 3, rank = 1, playerId = "player", gameState = 'INTRO', finished = false }) => {
  
  // --- STATI LOCALI ---
  const [speed, setSpeed] = useState(0);
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteItems, setRouletteItems] = useState([]);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const rouletteIntervalRef = useRef(null);
  
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

  // 0. GESTIONE RESET
  useEffect(() => {
    if (gameState === 'INTRO' || gameState === 'COUNTDOWN') {
      hasStarted.current = false;
      setRaceTime(0);
      setFrozenTimeValue(0);
      setIsFrozen(false);
      lastLapRef.current = 1;
      
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
      const now = Date.now();
      const lapTime = now - lapStartTimeRef.current;
      setFrozenTimeValue(lapTime);
      setIsFrozen(true);
      
      lapStartTimeRef.current = now;
      lastLapRef.current = lap;

      const timer = setTimeout(() => setIsFrozen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lap]);

  const displayTime = isFrozen ? frozenTimeValue : raceTime;
  const timeFormatted = formatTime(displayTime);

  // 4. GESTIONE UPDATE HUD
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
            
            // Se è spinning (roulette attiva), aggiungi l'item alla lista di roulette
            if (spinning) {
                setRouletteItems(prev => {
                    const updated = [...prev, newItem];
                    // Tieni una storia di ultimi 20 items per la roulette
                    return updated.slice(-20);
                });
            } else {
                // Fine roulette, resetta
                setRouletteItems([]);
                setRouletteIndex(0);
            }
        }
    };

    window.addEventListener('hud-update', handleHudUpdate);
    return () => window.removeEventListener('hud-update', handleHudUpdate);
  }, [playerId]);

  // 5. ANIMAZIONE ROULETTE: cicla gli items raccolti
  useEffect(() => {
    if (isSpinning && rouletteItems.length > 0) {
        let index = 0;
        
        // Velocità di rotazione che aumenta poi rallenta (accelerazione/decellerazione)
        const speeds = [
            { duration: 50, count: 5 },    // Velocissimo all'inizio (5 items in 50ms)
            { duration: 80, count: 4 },    // Veloce
            { duration: 120, count: 3 },   // Normale
            { duration: 200, count: 2 },   // Lento
        ];
        
        let speedPhase = 0;
        let itemsInPhase = 0;
        
        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
        
        rouletteIntervalRef.current = setInterval(() => {
            const currentPhase = speeds[Math.min(speedPhase, speeds.length - 1)];
            
            index = (index + 1) % rouletteItems.length;
            setRouletteIndex(index);
            
            itemsInPhase++;
            if (itemsInPhase >= currentPhase.count) {
                itemsInPhase = 0;
                speedPhase++;
            }
        }, speeds[Math.min(speedPhase, speeds.length - 1)]?.duration || 50);
        
        return () => {
            if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
        };
    }
  }, [isSpinning, rouletteItems]);

  // 6. CLEANUP al cambio di stato o smontaggio
  useEffect(() => {
    return () => {
        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
    };
  }, []);

  const itemImage = ITEM_SPRITES[rouletteItems.length > 0 ? rouletteItems[rouletteIndex] : currentItem];
  const safeRender = (val) => (isNaN(val) || val === null || val === undefined) ? 0 : val;

  // Classe Tailwind per il "freeze" di fine giro con `!important` nativi di Tailwind
  const flashClass = isFrozen 
    ? '!bg-none ![text-fill-color:red] !text-red-600 ![text-shadow:2px_2px_0px_black] animate-[flashRedFade_0.5s_ease-in-out_infinite]' 
    : '';
  
  // Animazione roulette: rotazione + blur con effetto accelerazione
  const rouletteSpinClass = isSpinning 
    ? 'animate-[spin_0.1s_linear_infinite] brightness-[1.3] drop-shadow-[0px_0px_20px_rgba(255,255,0,0.8)]' 
    : 'drop-shadow-[0px_0px_10px_rgba(255,255,255,0.6)]';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none font-['MKWii',_'Arial_Black',_Gadget,_sans-serif] not-italic select-none overflow-hidden z-10">
      
      {/* Definizione dei Font e dei Keyframes (necessari qui se non configurati in tailwind.config.js) */}
      <style>{`
        @font-face {
          font-family: 'MKWii';
          src: url('/font/mkwiiFont.otf') format('opentype');
          font-weight: normal; font-style: normal;
        }
        @font-face {
          font-family: 'Digital7';
          src: url('/font/digital7.woff2') format('woff2');
          font-weight: bold; font-style: normal;
        }
        @keyframes pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes flashRedFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotateZ(0deg) scale(1); }
          to { transform: rotateZ(360deg) scale(1.05); }
        }
      `}</style>
      
      {/* --- ITEM BOX --- */}
      <div className="absolute top-[30px] left-[30px] w-[140px] h-[120px] flex justify-center items-center drop-shadow-[5px_5px_0px_rgba(0,0,0,0.5)]">
        <div className="absolute w-full h-full border-4 border-[rgba(255,255,255,0.3)] rounded-[20px] bg-[rgba(0,0,0,0.2)] bg-[radial-gradient(circle,_rgba(0,0,0,0.6)_20%,_rgba(0,0,0,0)_70%)] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] -skew-x-[10deg]"></div>
        {itemImage && (
          <img 
            src={itemImage} 
            alt="Item" 
            className={`w-[90%] h-[90%] object-contain z-[2] transition-all ${rouletteSpinClass} ${!isSpinning && currentItem !== ITEMS.NONE ? 'animate-[pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}`}
          />
        )}
      </div>

      {/* --- TOP RIGHT: TIME / LAP --- */}
      <div className="absolute top-[15px] right-[15px] text-right flex flex-col gap-0 font-['MKWii',_'Arial_Black',_sans-serif] pr-[10px]">
        
        {/* TIME */}
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
        
        {/* LAP */}
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