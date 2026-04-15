// PowerupHandler.js
import { useState, useRef, useEffect } from 'react';
import { MathUtils } from 'three';
import { AUDIO_SFX } from '../components/Data';
import { useAudio } from '../audio/AudioManager';

export const ITEMS = {
  NONE: 'NONE',
  MUSHROOM: 'MUSHROOM',
  DOUBLE_MUSHROOM: 'DOUBLE_MUSHROOM',
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

const ITEM_WEIGHTS = {
    1:  { [ITEMS.BANANA]: 50, [ITEMS.GREEN_SHELL]: 40, [ITEMS.MUSHROOM]: 10 },
    2:  { [ITEMS.BANANA]: 25, [ITEMS.GREEN_SHELL]: 30, [ITEMS.RED_SHELL]: 25, [ITEMS.MUSHROOM]: 20 },
    3:  { [ITEMS.BANANA]: 10, [ITEMS.GREEN_SHELL]: 20, [ITEMS.RED_SHELL]: 30, [ITEMS.MUSHROOM]: 30, [ITEMS.BOB_OMB]: 10 },
    4:  { [ITEMS.MUSHROOM]: 40, [ITEMS.RED_SHELL]: 20, [ITEMS.TRIPLE_MUSHROOM]: 10, [ITEMS.BOB_OMB]: 15, [ITEMS.GREEN_SHELL]: 15 },
    5:  { [ITEMS.MUSHROOM]: 30, [ITEMS.RED_SHELL]: 15, [ITEMS.TRIPLE_MUSHROOM]: 20, [ITEMS.BOB_OMB]: 15, [ITEMS.STAR]: 10, [ITEMS.MEGA_MUSHROOM]: 10 },
    6:  { [ITEMS.TRIPLE_MUSHROOM]: 25, [ITEMS.STAR]: 15, [ITEMS.MEGA_MUSHROOM]: 15, [ITEMS.GOLDEN_MUSHROOM]: 10, [ITEMS.RED_SHELL]: 15, [ITEMS.BOB_OMB]: 10, [ITEMS.BLUE_SHELL]: 0 },
    7:  { [ITEMS.TRIPLE_MUSHROOM]: 30, [ITEMS.STAR]: 20, [ITEMS.GOLDEN_MUSHROOM]: 20, [ITEMS.MEGA_MUSHROOM]: 15, [ITEMS.LIGHTNING]: 5, [ITEMS.BLUE_SHELL]: 0 },
    8:  { [ITEMS.STAR]: 20, [ITEMS.GOLDEN_MUSHROOM]: 25, [ITEMS.MEGA_MUSHROOM]: 15, [ITEMS.TRIPLE_MUSHROOM]: 20, [ITEMS.LIGHTNING]: 10, [ITEMS.BULLET_BILL]: 5, [ITEMS.BLUE_SHELL]: 0 },
    9:  { [ITEMS.STAR]: 20, [ITEMS.GOLDEN_MUSHROOM]: 30, [ITEMS.BULLET_BILL]: 15, [ITEMS.LIGHTNING]: 15, [ITEMS.MEGA_MUSHROOM]: 10, [ITEMS.BLUE_SHELL]: 0 },
    10: { [ITEMS.GOLDEN_MUSHROOM]: 35, [ITEMS.BULLET_BILL]: 20, [ITEMS.STAR]: 20, [ITEMS.LIGHTNING]: 15, [ITEMS.MEGA_MUSHROOM]: 10 },
    11: { [ITEMS.GOLDEN_MUSHROOM]: 30, [ITEMS.BULLET_BILL]: 30, [ITEMS.STAR]: 20, [ITEMS.LIGHTNING]: 15, [ITEMS.BLUE_SHELL]: 0 },
    12: { [ITEMS.BULLET_BILL]: 40, [ITEMS.GOLDEN_MUSHROOM]: 20, [ITEMS.STAR]: 15, [ITEMS.LIGHTNING]: 15, [ITEMS.BLUE_SHELL]: 0 }
};

const getItemBasedOnRank = (currentRank) => {
    const rankKey = Math.min(Math.max(Math.round(currentRank), 1), 12);
    const pool = ITEM_WEIGHTS[rankKey] || ITEM_WEIGHTS[6];

    let totalWeight = 0;
    for (const item in pool) {
        totalWeight += pool[item];
    }

    let randomValue = Math.random() * totalWeight;

    for (const item in pool) {
        randomValue -= pool[item];
        if (randomValue <= 0) {
            return item;
        }
    }
    
    return ITEMS.MUSHROOM;
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
  selectedCharacter,
  isLocalPlayer = false,
  socket,
  roomCode,
  isTimeTrial,
  getFirstPlaceRef
}) => {
  
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
	const [isRoulette, setIsRoulette] = useState(false);
    const { playSfx } = useAudio();

	const triggerItemRoulette = (rank = 6) => {
		if (currentItem !== ITEMS.NONE || isRoulette) return;

		setIsRoulette(true);
		if (isLocalPlayer) {
      playSfx(AUDIO_SFX.ITEM_BOX_DECIDE, 0.7);
    }
		// Lista di tutti gli item possibili per l'animazione visiva
		const allItems = Object.keys(ITEMS).filter(item => item !== 'NONE');
		
		// Effetto visivo: cambia l'icona ogni 100ms
		let rouletteInterval = setInterval(() => {
			const randomVisualItem = allItems[Math.floor(Math.random() * allItems.length)];
			window.dispatchEvent(new CustomEvent('hud-update', { 
				detail: { item: randomVisualItem, isSpinning: true, targetRacerId: racerId } 
			}));
		}, 100);

		setTimeout(() => {
			clearInterval(rouletteInterval); // Ferma lo scrolling
			const selectedItem = getItemBasedOnRank(rank);
			
      if (isLocalPlayer) {
        playSfx(AUDIO_SFX.ITEM_BOX_ROLL, 0.8);
      }
			setIsRoulette(false);
			setCurrentItem(selectedItem);
			
			if (selectedItem === ITEMS.TRIPLE_MUSHROOM) setTripleCount(3);
			if (selectedItem === ITEMS.GOLDEN_MUSHROOM) setIsGoldenActive(false);
			if (selectedItem === ITEMS.MUSHROOM) setTripleCount(1);
			// Invia l'oggetto definitivo
			window.dispatchEvent(new CustomEvent('hud-update', { 
				detail: { item: selectedItem, isSpinning: false, targetRacerId: racerId } 
				
			}));
		}, 2135); 
	};
  const isItemKeyPressed = useRef(false);

  const [tripleCount, setTripleCount] = useState(3);
  const [isGoldenActive, setIsGoldenActive] = useState(false);
  const goldenTimerRef = useRef(null);
  const lastMushroomAudioTime = useRef(0);

  const pickupItem = () => {
	//   setCurrentItem(ITEMS.RED_SHELL);
  };

useEffect(() => {
    const setupInitialItems = () => {
        // Pulizia timer precedenti
        if (goldenTimerRef.current) clearTimeout(goldenTimerRef.current);
        setIsGoldenActive(false);
        setIsRoulette(false);
        
        if (isTimeTrial) {
            setCurrentItem(ITEMS.TRIPLE_MUSHROOM);
            setTripleCount(3);
            
            if (isLocalPlayer) {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('hud-update', { 
                        detail: { item: ITEMS.TRIPLE_MUSHROOM, isSpinning: false, targetRacerId: racerId } 
                    }));
                }, 100);
            }
        } else {
            setCurrentItem(ITEMS.NONE);
        }
    };

    // 1. Esegui al montaggio del componente
    setupInitialItems();

    // 2. Mettiti in ascolto del tasto "Play Again"
    window.addEventListener('race-restarted', setupInitialItems);
    
    return () => {
        window.removeEventListener('race-restarted', setupInitialItems);
    };
  }, [isTimeTrial, isLocalPlayer, racerId]);

  const useMushroom = () => {
    if (!boostTime) return;

    const now = Date.now();
    if (now - lastMushroomAudioTime.current > 1000) {
      playSfx(AUDIO_SFX.TURBO_DRIFT, 2.0);
      if (selectedCharacter?.turbo_sfx && AUDIO_SFX[selectedCharacter.turbo_sfx]) {
        playSfx(AUDIO_SFX[selectedCharacter.turbo_sfx], 0.6);
      }
      lastMushroomAudioTime.current = now;
    }
    
    boostTime.current = SETTINGS.boostDuration * 2.0;
    
    if (speed && speed.current < SETTINGS.maxSpeed) {
      speed.current = MathUtils.lerp(speed.current, SETTINGS.maxSpeed + 25, 0.5);
    }
    // console.log("Fungo utilizzato!");
  };

  const useTripleMushroom = () => {
      useMushroom(); // Usa un fungo
      
      const newCount = tripleCount - 1;
      setTripleCount(newCount);
    //   console.log(`Funghi rimasti: ${newCount}`);

      // Aggiorna l'icona in base ai funghi rimasti
      let newItem = ITEMS.NONE;
      if (newCount > 2) {
          newItem = ITEMS.TRIPLE_MUSHROOM;
      } else if (newCount === 2) {
          newItem = ITEMS.DOUBLE_MUSHROOM;
      } else if (newCount === 1) {
          newItem = ITEMS.MUSHROOM;
      }
      
      setCurrentItem(newItem);
      
      // Dispatch event per aggiornare l'HUD
      window.dispatchEvent(new CustomEvent('hud-update', { 
          detail: { item: newItem, isSpinning: false, targetRacerId: racerId } 
      }));
  };

  // 2. FUNGO D'ORO
  const useGoldenMushroom = () => {
      // Usa il fungo (boost) ogni volta che premiamo
      useMushroom();

      // Se è la prima volta che premiamo, attiviamo il timer
      if (!isGoldenActive) {
        //   console.log("GOLDEN MUSHROOM ATTIVO! SPAMMA IL TASTO!");
          setIsGoldenActive(true);
          
          // Dura 10 secondi, poi sparisce
          goldenTimerRef.current = setTimeout(() => {
              setIsGoldenActive(false);
              setCurrentItem(ITEMS.NONE);
            //   console.log("Golden Mushroom esaurito.");
          }, 10000);
      }
  };

  // --- ALTRI ITEM ---

  const useLightning = () => {
      // THUNDER_USE: lo sentono tutti
      playSfx(AUDIO_SFX.THUNDER_USE, 1.0);
      window.dispatchEvent(new CustomEvent('lightning-strike', { 
          detail: { attackerId: racerId } 
      }));
	  if (socket && roomCode) {
		socket.emit('use_lightning', { 
			attackerId: socket.id,
		});
	}
      setCurrentItem(ITEMS.NONE);
  };

  const useMegaMushroom = () => {
    //   console.log("Attivazione MEGA FUNGO!");
      if (activateMega) activateMega();
      setCurrentItem(ITEMS.NONE);
  };

  const useStar = () => {
    //   console.log("Attivazione STELLA!");
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
        const offsetDistance = 4.5; // Aumentato da 2.0 per evitare autodistruzione
        const spawnX = currentPos.x + Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z + Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1;
        const throwForce = 0;

        // ISTANTANEO - no setTimeout per reattività
        onSpawnBanana([spawnX, spawnY, spawnZ], [Math.sin(currentRot) * throwForce, 0, Math.cos(currentRot) * throwForce]);
        // console.log("Banana lanciata!");
    }
    setCurrentItem(ITEMS.NONE);
  };

  const useGreenShell = () => {
    if (onSpawnGreenShell) {
        // ... (calcoli posizione esistenti) ...
        const currentPos = position.current;
        const currentRot = rotation.current;
        const offsetDistance = 14.0; // Aumentato da 8.0 per massima protezione
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.5;
        const speed = 90; // Aumentato da 80 per partenza più veloce
        
        onSpawnGreenShell([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * speed, 0, -Math.cos(currentRot) * speed]);
    }
    setCurrentItem(ITEMS.NONE);
  };

  const useRedShell = () => {
    if (onSpawnRedShell) {
        // ... (calcoli esistenti) ...
        const currentPos = position.current;
        const currentRot = rotation.current;
        const offsetDistance = 16; // Aumentato da 10 per massima protezione
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.8;
        const initSpeed = 65; // Aumentato da 50 per partenza più veloce

        onSpawnRedShell([spawnX, spawnY, spawnZ], [-Math.sin(currentRot) * initSpeed, 0, -Math.cos(currentRot) * initSpeed]);
    }
    setCurrentItem(ITEMS.NONE);
  }

  const useBlueShell = () => {
    // console.log('[BlueShell] useBlueShell called');
    
    if (onSpawnBlueShell && getFirstPlaceRef) {
        // Use callback to get first place ref from component level
        const targetRef = getFirstPlaceRef?.();
        // console.log('[BlueShell] TargetRef from callback:', targetRef);
        // console.log('[BlueShell] TargetRef.current:', targetRef?.current);
        // console.log('[BlueShell] TargetRef is null?', targetRef === null);
        
        if (targetRef?.current) {
            try {
                const leaderTrans = targetRef.current.translation();
                const spawnX = leaderTrans.x;
                const spawnY = leaderTrans.y; // 5 unità sopra il leader
                const spawnZ = leaderTrans.z;
                
                // console.log('[BlueShell] Spawning at:', { spawnX, spawnY, spawnZ });
                onSpawnBlueShell([spawnX, spawnY, spawnZ], [0, 0, 0]);
            } catch (e) {
                console.error('[BlueShell] Errore nel calcolare la posizione:', e);
            }
        } else {
            console.warn('[BlueShell] No valid target ref found from getFirstPlaceRef');
        }
    } else {
        console.warn('[BlueShell] Missing onSpawnBlueShell or getFirstPlaceRef', { 
            onSpawnBlueShell: !!onSpawnBlueShell, 
            getFirstPlaceRef: !!getFirstPlaceRef 
        });
    }
    setCurrentItem(ITEMS.NONE);
  }

  const useBomb = () => {
    if (onSpawnBomb) {
        const currentPos = position.current;
        const currentRot = rotation.current; 
        const offsetDistance = 7.0; // Aumentato da 3.0 per evitare autodistruzione
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.5; 
        const throwForce = 40; // Aumentato da 30 per partenza più veloce
        const upForce = 12; // Aumentato da 8

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
      case ITEMS.DOUBLE_MUSHROOM:
          useTripleMushroom();
          // NONE gestito dentro la funzione
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
    // Se il bot (o l'umano) preme il tasto
    if (inputActive && !isItemKeyPressed.current) {
        isItemKeyPressed.current = true;
        
        if (currentItem !== ITEMS.NONE) {
            activateItem(); // Esegue lo switch e usa l'oggetto
        } else {
			pickupItem(); // Per ora simula la raccolta di un oggetto
		}
    }

    // Fondamentale: resetta il flag quando l'input torna false
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
      if (itemEnum === ITEMS.DOUBLE_MUSHROOM) setTripleCount(2);
      if (itemEnum === ITEMS.MUSHROOM) setTripleCount(1);
      if (itemEnum === ITEMS.GOLDEN_MUSHROOM) setIsGoldenActive(false);
  };

  return {
    currentItem,
    pickupItem,
    handleItemInput,
    tripleCount,
	triggerItemRoulette
  };
};