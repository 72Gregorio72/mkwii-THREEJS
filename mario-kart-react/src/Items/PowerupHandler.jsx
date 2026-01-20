// PowerupHandler.js
import { useState, useRef, useEffect } from 'react';
import { MathUtils } from 'three';

export const ITEMS = {
  NONE: 'NONE',
  MUSHROOM: 'MUSHROOM',
  BANANA: 'BANANA',
  GREEN_SHELL: 'GREEN_SHELL',
  RED_SHELL: 'RED_SHELL',
  BULLET_BILL: 'BULLET_BILL',
  BLUE_SHELL: 'BLUE_SHELL',
  BOB_OMB: 'BOB_OMB',
  STAR: 'STAR',
  MEGA_MUSHROOM: 'MEGA_MUSHROOM',
  LIGHTNING: 'LIGHTNING',
  TRIPLE_MUSHROOM: 'TRIPLE_MUSHROOM',
  GOLDEN_MUSHROOM: 'GOLDEN_MUSHROOM',
};

export const usePowerupHandler = ({ 
  boostTime, 
  speed,     
  SETTINGS,   
  position,
  rotation,
  onSpawnBanana,
  onSpawnGreenShell,
  onSpawnRedShell,
  onSpawnBlueShell,
  kartRef,
  onActivateBulletBill,
  onSpawnBomb,
  onActivateStar,
  activateMega,
  onActivateLightning,
  racerId,
}) => {
  
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const isItemKeyPressed = useRef(false);

  // --- STATI PER TRIPLO E GOLDEN ---
  const [tripleCount, setTripleCount] = useState(3);
  const [isGoldenActive, setIsGoldenActive] = useState(false);
  const goldenTimerRef = useRef(null);

  // Funzione di debug per testare
  const pickupItem = () => {
    
    setCurrentItem(ITEMS.TRIPLE_MUSHROOM);
    console.log("Oggetto raccolto: GOLDEN MUSHROOM");
  };

  // --- LOGICA FUNGHI ---

  const useMushroom = () => {
    if (!boostTime) return;
    // Boost istantaneo
    boostTime.current = SETTINGS.boostDuration * 2.0;
    
    // Spinta sulla velocità
    if (speed && speed.current < SETTINGS.maxSpeed) {
      speed.current = MathUtils.lerp(speed.current, SETTINGS.maxSpeed + 25, 0.5);
    }
    console.log("Fungo utilizzato!");
  };

  // 1. TRIPLO FUNGO
  const useTripleMushroom = () => {
      useMushroom(); // Usa un fungo
      
      const newCount = tripleCount - 1;
      setTripleCount(newCount);
      console.log(`Funghi rimasti: ${newCount}`);

      if (newCount <= 0) {
          setCurrentItem(ITEMS.NONE); // Finiti
      }
      // Se newCount > 0, l'oggetto rimane TRIPLE_MUSHROOM e non facciamo nulla
  };

  // 2. FUNGO D'ORO
  const useGoldenMushroom = () => {
      // Usa il fungo (boost) ogni volta che premiamo
      useMushroom();

      // Se è la prima volta che premiamo, attiviamo il timer
      if (!isGoldenActive) {
          console.log("GOLDEN MUSHROOM ATTIVO! SPAMMA IL TASTO!");
          setIsGoldenActive(true);
          
          // Dura 10 secondi, poi sparisce
          goldenTimerRef.current = setTimeout(() => {
              setIsGoldenActive(false);
              setCurrentItem(ITEMS.NONE);
              console.log("Golden Mushroom esaurito.");
          }, 10000);
      }
  };

  // --- ALTRI ITEM ---

  const useLightning = () => {
      console.log("KABOOM! Fulmine attivato!");
      window.dispatchEvent(new CustomEvent('lightning-strike', { 
          detail: { attackerId: racerId } 
      }));
      // Chi lancia non subisce effetti locali qui, solo invia evento
      setCurrentItem(ITEMS.NONE);
  };

  const useMegaMushroom = () => {
      console.log("Attivazione MEGA FUNGO!");
      if (activateMega) activateMega();
      setCurrentItem(ITEMS.NONE);
  };

  const useStar = () => {
      console.log("Attivazione STELLA!");
      if (onActivateStar) onActivateStar();
      setCurrentItem(ITEMS.NONE);
  };

  const useBulletBill = () => {
      if (onActivateBulletBill) onActivateBulletBill();
      setCurrentItem(ITEMS.NONE);
  };

  const useBanana = () => {
    if (position && position.current && onSpawnBanana) {
        const currentPos = position.current;
        const currentRot = rotation.current; 
        const offsetDistance = 2.0; 
        const spawnX = currentPos.x + Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z + Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.0;
        const throwForce = 2;

        onSpawnBanana([spawnX, spawnY, spawnZ], [Math.sin(currentRot) * throwForce, 0, Math.cos(currentRot) * throwForce]);
        console.log("Banana lanciata!");
    }
    setCurrentItem(ITEMS.NONE);
  };

  const useGreenShell = () => {
    if (onSpawnGreenShell) {
        // ... (calcoli posizione esistenti) ...
        const currentPos = position.current;
        const currentRot = rotation.current;
        const offsetDistance = 3.0; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.5;
        const speed = 60;
        
        onSpawnGreenShell([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * speed, 0, -Math.cos(currentRot) * speed]);
    }
    setCurrentItem(ITEMS.NONE);
  };

  const useRedShell = () => {
    if (onSpawnRedShell) {
        // ... (calcoli esistenti) ...
        const currentPos = position.current;
        const currentRot = rotation.current;
        const offsetDistance = 6; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.8;
        const initSpeed = 20;

        onSpawnRedShell([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * initSpeed, 0, -Math.cos(currentRot) * initSpeed]);
    }
    setCurrentItem(ITEMS.NONE);
  }

  const useBlueShell = () => {
    if (onSpawnBlueShell) {
        // ... (calcoli esistenti) ...
        const currentPos = position.current;
        const currentRot = rotation.current;
        const offsetDistance = 6; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.8;
        const initSpeed = 20; 

        onSpawnBlueShell([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * initSpeed, 0, -Math.cos(currentRot) * initSpeed]);
    }
    setCurrentItem(ITEMS.NONE);
  }

  const useBomb = () => {
    if (onSpawnBomb) {
        const currentPos = position.current;
        const currentRot = rotation.current; 
        const offsetDistance = 3.0; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.5; 
        const throwForce = 50; 
        const upForce = 15;

        onSpawnBomb([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * throwForce, upForce, -Math.cos(currentRot) * throwForce]);
    }
    setCurrentItem(ITEMS.NONE);
  };

  // --- SWITCH PRINCIPALE ---
  // Nota: Ho spostato setCurrentItem(NONE) dentro i singoli case
  // per poter gestire Triple e Golden che non si consumano subito.
  const activateItem = () => {
    switch (currentItem) {
      case ITEMS.MUSHROOM: 
          useMushroom(); 
          setCurrentItem(ITEMS.NONE);
          break;
      case ITEMS.TRIPLE_MUSHROOM: 
          useTripleMushroom(); 
          // NONE gestito dentro la funzione
          break;
      case ITEMS.GOLDEN_MUSHROOM: 
          useGoldenMushroom(); 
          // NONE gestito dal timer
          break;
      case ITEMS.BANANA: useBanana(); break;
      case ITEMS.GREEN_SHELL: useGreenShell(); break;
      case ITEMS.RED_SHELL: useRedShell(); break;
      case ITEMS.BLUE_SHELL: useBlueShell(); break;
      case ITEMS.BULLET_BILL: useBulletBill(); break;
      case ITEMS.BOB_OMB: useBomb(); break;
      case ITEMS.MEGA_MUSHROOM: useMegaMushroom(); break;
      case ITEMS.STAR: useStar(); break;
      case ITEMS.LIGHTNING: useLightning(); break;
      default: break;
    }
  };

  const handleItemInput = (inputActive) => {
    if (inputActive && !isItemKeyPressed.current) {
      isItemKeyPressed.current = true;
      
      if (currentItem !== ITEMS.NONE) {
        activateItem();
      } else {
        pickupItem();
      }
    }

    if (!inputActive) {
      isItemKeyPressed.current = false;
    }
  };

  // Cleanup del timer se il componente viene smontato
  useEffect(() => {
      return () => {
          if (goldenTimerRef.current) clearTimeout(goldenTimerRef.current);
      };
  }, []);

  // Quando prendiamo un oggetto reale (dalla ItemBox), dobbiamo resettare gli stati
  // Questa funzione è un helper per quando implementerai la logica randomica delle scatole
  const setRandomItem = (itemEnum) => {
      setCurrentItem(itemEnum);
      if (itemEnum === ITEMS.TRIPLE_MUSHROOM) setTripleCount(3);
      if (itemEnum === ITEMS.GOLDEN_MUSHROOM) setIsGoldenActive(false);
  };

  return {
    currentItem,
    pickupItem, // Usa setRandomItem logicamente quando integri le scatole
    handleItemInput,
    tripleCount 
  };
};