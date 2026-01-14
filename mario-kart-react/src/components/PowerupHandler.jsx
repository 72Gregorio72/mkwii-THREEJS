// PowerupHandler.js
import { useState, useRef } from 'react';
import { MathUtils } from 'three';

export const ITEMS = {
  NONE: 'NONE',
  MUSHROOM: 'MUSHROOM',
  BANANA: 'BANANA', // Assicurati che BANANA sia nell'enum
};

export const usePowerupHandler = ({ 
  boostTime, 
  speed,     
  SETTINGS,   
  position,
  rotation,     // Ref alla posizione del Kart (es. chassisApi.current.translation())
  onSpawnBanana  // <--- NUOVA CALLBACK: Funzione ricevuta dal componente padre
}) => {
  
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const isItemKeyPressed = useRef(false);

  const pickupItem = () => {
    // DEBUG: Forziamo la banana per testare
    setCurrentItem(ITEMS.BANANA);
    console.log("Oggetto raccolto: BANANA");
  };

  const useMushroom = () => {
    if (!boostTime) return;
    boostTime.current = SETTINGS.boostDuration * 2.0;
    if (speed && speed.current < SETTINGS.maxSpeed) {
      speed.current = MathUtils.lerp(speed.current, SETTINGS.maxSpeed + 20, 0.5);
    }
    console.log("Fungo utilizzato!");
  };

  const useBanana = () => {
    if (position && position.current && onSpawnBanana) {
        const currentPos = position.current;
        const currentRot = rotation.current; 

        // 1. Calcola posizione di Spawn (leggermente dietro e in alto)
        const offsetDistance = 2.0; 
        const spawnX = currentPos.x + Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z + Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.0; // Più in alto per fare l'arco

        // 2. CALCOLO DEL VETTORE DI LANCIO (VELOCITY)
        const throwForce = 2; // Potenza del lancio orizzontale
        const upForce = 0;     // Potenza del lancio verso l'alto (per fare l'arco)

        // Calcoliamo il vettore "Indietro" ruotato
        // Math.sin(rot) e Math.cos(rot) ci danno la direzione
        // Nota: In base al tuo sistema di coordinate, "Indietro" è solitamente +Z locale ruotato.
        const velX = Math.sin(currentRot) * throwForce;
        const velZ = Math.cos(currentRot) * throwForce;

        // 3. Passiamo sia la posizione che la velocità
        onSpawnBanana(
            [spawnX, spawnY, spawnZ], // Posizione
            [velX, upForce, velZ]     // Velocità (Vettore 3D)
        );
        
        console.log("Banana lanciata!");
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

  const activateItem = () => {
    switch (currentItem) {
      case ITEMS.MUSHROOM:
        useMushroom();
        break;
      case ITEMS.BANANA:
        useBanana();
        break;
      default:
        break;
    }
    setCurrentItem(ITEMS.NONE);
  };

  return {
    currentItem,
    pickupItem,
    handleItemInput
  };
};