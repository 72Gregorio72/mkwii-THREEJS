import React, { useEffect, useState } from 'react';
import { ITEMS } from '../components/PowerupHandler';

// Mappa gli Enum ai percorsi dei file che vedo nel tuo screenshot
const ITEM_SPRITES = {
  [ITEMS.NONE]: null,
  [ITEMS.MUSHROOM]: '/itemSprites/Mushroom.png',
  [ITEMS.TRIPLE_MUSHROOM]: '/itemSprites/TripleMushroom.png',
  [ITEMS.GOLDEN_MUSHROOM]: '/itemSprites/GoldenMushroom.png',
  [ITEMS.BANANA]: '/itemSprites/Banana.png',
  [ITEMS.TRIPLE_BANANA]: '/itemSprites/TripleBanana.png', // Se hai lo sprite
  [ITEMS.GREEN_SHELL]: '/itemSprites/GreenShell.png',
  [ITEMS.TRIPLE_GREEN_SHELL]: '/itemSprites/TripleGreenShell.png', // Se hai lo sprite
  [ITEMS.RED_SHELL]: '/itemSprites/RedShell.png',
  [ITEMS.TRIPLE_RED_SHELL]: '/itemSprites/TripleRedShell.png', // Se hai lo sprite
  [ITEMS.BLUE_SHELL]: '/itemSprites/BlueShell.png', // Nello screen si chiama BlueShell.png
  [ITEMS.BOB_OMB]: '/itemSprites/Bobomb.png',
  [ITEMS.STAR]: '/itemSprites/Star.png',
  [ITEMS.MEGA_MUSHROOM]: '/itemSprites/MegaMushroom.png',
  [ITEMS.LIGHTNING]: '/itemSprites/Lightning.png',
};

export const GameHUD = ({ currentItem, lap, totalLaps, rank, speed, tripleCount }) => {
  
  // Animazione semplice quando cambia l'oggetto (Pop effect)
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (currentItem !== ITEMS.NONE) {
      setAnimClass('pop-in');
      const t = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(t);
    }
  }, [currentItem]);

  // Determina quale immagine mostrare
  const itemImage = ITEM_SPRITES[currentItem];

  return (
    <div style={styles.container}>
      
      {/* --- TOP LEFT: ITEM BOX --- */}
      <div style={styles.itemBoxContainer}>
        {/* Sfondo del box oggetto (stile MKWii con sfumatura) */}
        <div style={styles.itemBoxBg}></div>
        
        {/* Sprite dell'oggetto */}
        {itemImage && (
          <img 
            src={itemImage} 
            alt="Item" 
            className={animClass}
            style={styles.itemImage} 
          />
        )}

        {/* Contatore per oggetti tripli (opzionale, stile MKWii lo mostra solo con gli oggetti orbitanti, ma utile per debug) */}
        {/* {(currentItem === ITEMS.TRIPLE_MUSHROOM && tripleCount > 0) && (
             <div style={styles.counter}>x{tripleCount}</div>
        )} */}
      </div>

      {/* --- TOP RIGHT: TIME / LAP --- */}
      <div style={styles.topRight}>
        <div style={styles.labelValue}>
            <span style={styles.labelText}>LAP</span>
            <span style={styles.valueText}>{lap} / {totalLaps}</span>
        </div>
        <div style={styles.labelValue}>
            <span style={styles.labelText}>TIME</span>
            <span style={styles.valueText}>00:00:00</span> {/* Qui puoi collegare il timer reale */}
        </div>
      </div>

      {/* --- BOTTOM LEFT: RANK --- */}
      <div style={styles.rankContainer}>
        <span style={styles.rankBig}>{rank}</span>
        <span style={styles.rankSmall}>{getOrdinal(rank)}</span>
      </div>

      {/* --- BOTTOM RIGHT: SPEEDOMETER --- */}
      <div style={styles.speedContainer}>
        <span style={styles.speedValue}>{Math.round(speed)}</span>
        <span style={styles.speedUnit}>km/h</span>
      </div>

      {/* Stili CSS in-line per semplicità, ma meglio metterli in un .css */}
      <style>{`
        .pop-in { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
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
    width: '100vw', height: '100vh',
    pointerEvents: 'none',
    fontFamily: '"Arial Black", Gadget, sans-serif', // Font "Cicciotto"
    fontStyle: 'italic',
    userSelect: 'none',
    overflow: 'hidden',
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
    transform: 'skewX(-10deg)', // Piega tipica MK
  },
  itemImage: {
    width: '90%',
    height: '90%',
    objectFit: 'contain',
    zIndex: 2,
    filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.6))'
  },
  // TOP RIGHT
  topRight: {
    position: 'absolute',
    top: '30px', right: '40px',
    textAlign: 'right',
    color: '#FFD700', // Oro
    textShadow: '3px 3px 0 #000',
    display: 'flex', flexDirection: 'column', gap: '5px'
  },
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
    color: '#E0E0E0', // Argento/Bianco per posizioni normali, Oro per 1st
    textShadow: '4px 4px 0 #000, -1px -1px 0 #000',
    lineHeight: '0.8'
  },
  rankBig: {
    fontSize: '100px',
    fontWeight: '900',
    background: 'linear-gradient(to bottom, #fff 0%, #ccc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    // Fallback shadow hack per text-fill-color
    filter: 'drop-shadow(4px 4px 0px black)' 
  },
  rankSmall: {
    fontSize: '40px',
    marginLeft: '5px'
  },
  // SPEED
  speedContainer: {
    position: 'absolute',
    bottom: '40px', right: '40px',
    textAlign: 'right',
    color: '#fff',
    textShadow: '2px 2px 0 #000',
    transform: 'skewX(-10deg)'
  },
  speedValue: {
    fontSize: '60px',
    fontWeight: 'bold',
  },
  speedUnit: {
    fontSize: '20px',
    marginLeft: '5px'
  }
};