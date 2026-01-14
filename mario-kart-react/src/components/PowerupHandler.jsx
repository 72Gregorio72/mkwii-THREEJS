import { useState, useRef } from 'react';
import { MathUtils } from 'three';

// Enum degli oggetti disponibili
export const ITEMS = {
  NONE: 'NONE',
  MUSHROOM: 'MUSHROOM',
  // Futuri: GREEN_SHELL, RED_SHELL, STAR, etc.
};

export const usePowerupHandler = ({ 
  boostTime, // Ref al timer del boost del kart
  speed,     // Ref alla velocità attuale (opzionale, se serve settarla subito)
  SETTINGS   // I settaggi del kart per sapere durata e potenza
}) => {
  
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE); // Stato dell'oggetto attuale
  const isItemKeyPressed = useRef(false); // Per evitare spam se tieni premuto il tasto

  // Funzione per raccogliere un oggetto (da chiamare quando colpisci un Item Box)
  const pickupItem = () => {
    // Per ora forziamo sempre il fungo per testare
    setCurrentItem(ITEMS.MUSHROOM);
    console.log("Oggetto raccolto: MUSHROOM");
  };

  // Logica specifica per il Fungo
  const useMushroom = () => {
    if (!boostTime) return;

    // 1. Imposta il timer del boost. 
    // Moltiplichiamo la durata standard per un valore (es. 2.0) per farlo durare più di un miniturbo
    boostTime.current = SETTINGS.boostDuration * 2.0;
    
    // 2. Opzionale: Dai un colpo di velocità immediato se sei quasi fermo
    // (Simula l'accelerazione improvvisa del fungo)
    if (speed && speed.current < SETTINGS.maxSpeed) {
      speed.current = MathUtils.lerp(speed.current, SETTINGS.maxSpeed + 20, 0.5);
    }

    console.log("Fungo utilizzato!");
  };

  const useBanana = () => {
	
  }

  // Funzione principale chiamata nel loop del kart per gestire l'input
  const handleItemInput = (inputActive) => {
    // Logica "Press Once": attiva solo quando il tasto passa da false a true
    if (inputActive && !isItemKeyPressed.current) {
      isItemKeyPressed.current = true;
      
      if (currentItem !== ITEMS.NONE) {
        activateItem();
      } else {
        // DEBUG: Se non ho oggetti e premo il tasto, mi do un fungo (per testare)
        pickupItem();
      }
    }

    if (!inputActive) {
      isItemKeyPressed.current = false;
    }
  };

  // Smistatore logico: decide quale funzione chiamare in base all'oggetto
  const activateItem = () => {
    switch (currentItem) {
      case ITEMS.MUSHROOM:
        useMushroom();
        break;
      // case ITEMS.STAR: useStar(); break;
      default:
        break;
    }
    // Consuma l'oggetto
    setCurrentItem(ITEMS.NONE);
  };

  return {
    currentItem,
    pickupItem,     // Chiama questa quando colpisci un box
    handleItemInput // Chiama questa nel useFrame del kart passando activeControls.current.item
  };
};