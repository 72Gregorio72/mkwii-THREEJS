// PowerupHandler.js
import { useState, useRef } from 'react';
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
  STAR: 'STAR'
};

export const usePowerupHandler = ({ 
  boostTime, 
  speed,     
  SETTINGS,   
  position,
  rotation,     // Ref alla posizione del Kart (es. chassisApi.current.translation())
  onSpawnBanana,
  onSpawnGreenShell,
  onSpawnRedShell,
  onSpawnBlueShell,
  roadWayPoints,
  kartRef,
  onActivateBulletBill,
  onSpawnBomb,
  onActivateStar
}) => {
  
  const [currentItem, setCurrentItem] = useState(ITEMS.NONE);
  const isItemKeyPressed = useRef(false);

  const pickupItem = () => {
    // DEBUG: Testiamo la Stella
    setCurrentItem(ITEMS.STAR);
    console.log("Oggetto raccolto: STAR");
  };

  const useStar = () => {
      console.log("Attivazione STELLA!");
      if (onActivateStar) {
          onActivateStar();
      }
  };

  const useBulletBill = () => {
      console.log("Attivazione Bullet Bill...");
      // Chiamiamo il metodo imperativo esposto nel Kart
      if (onActivateBulletBill) {
          onActivateBulletBill();
      } else {
          console.warn("Funzione onActivateBulletBill non trovata!");
      }
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

        const offsetDistance = 2.0; 
        const spawnX = currentPos.x + Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z + Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.0;

        const throwForce = 2;
        const upForce = 0;

        const velX = Math.sin(currentRot) * throwForce;
        const velZ = Math.cos(currentRot) * throwForce;

        onSpawnBanana(
            [spawnX, spawnY, spawnZ],
            [velX, upForce, velZ]
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

  const useGreenShell = () => {
    if (position && position.current && onSpawnGreenShell) {
        const currentPos = position.current;
        const currentRot = rotation.current; // Rotazione Y del kart

        // 1. Posizione di Spawn: AVANTI al kart (non dietro come la banana)
        const offsetDistance = 3.0; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance; // -sin per avanti (dipende dal sistema coord)
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance; // -cos per avanti
        const spawnY = currentPos.y + 0.5;

        // 2. Velocità di Lancio: Molto veloce, dritta in avanti
        const speed = 60; // Velocità del guscio
        const velX = -Math.sin(currentRot) * speed;
        const velZ = -Math.cos(currentRot) * speed;

        onSpawnGreenShell(
            [spawnX, spawnY, spawnZ], 
            [velX, 0, velZ] // Niente forza Y, viaggia dritto (la gravità lo terrà giù)
        );
        
        console.log("Guscio Verde lanciato!");
    }
  };

  const useRedShell = () => {
    if (position && position.current && onSpawnRedShell) {
        const currentPos = position.current;
        const currentRot = rotation.current; // Rotazione Y del kart

        // Spawn leggermente avanti e in alto
        const offsetDistance = 6; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.8;

        // Velocità iniziale moderata (l'IA accelererà a 65 subito dopo)
        const initSpeed = 20; 
        const velX = -Math.sin(currentRot) * initSpeed;
        const velZ = -Math.cos(currentRot) * initSpeed;

        onSpawnRedShell(
            [spawnX, spawnY, spawnZ], 
            [velX, 0, velZ]
        );
        
        console.log("Guscio ROSSO lanciato!");
    }
  }

  const useBlueShell = () => {
	if (position && position.current && onSpawnBlueShell) {
        const currentPos = position.current;
        const currentRot = rotation.current; // Rotazione Y del kart

        // Spawn leggermente avanti e in alto
        const offsetDistance = 6; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 0.8;

        // Velocità iniziale moderata (l'IA accelererà a 65 subito dopo)
        const initSpeed = 20; 
        const velX = -Math.sin(currentRot) * initSpeed;
        const velZ = -Math.cos(currentRot) * initSpeed;

        onSpawnBlueShell(
            [spawnX, spawnY, spawnZ], 
            [velX, 0, velZ]
        );
        
        console.log("Guscio BLU lanciato!");
    }
  }

  const useBomb = () => {
    if (position && position.current && onSpawnBomb) { // Assicurati di passare onSpawnBomb nelle props
        const currentPos = position.current;
        const currentRot = rotation.current; 

        // Spawn leggermente avanti e in alto
        const offsetDistance = 3.0; 
        const spawnX = currentPos.x - Math.sin(currentRot) * offsetDistance;
        const spawnZ = currentPos.z - Math.cos(currentRot) * offsetDistance;
        const spawnY = currentPos.y + 1.5; // Un po' più in alto per fare un arco

        // Lancia in avanti con un arco (forza Y positiva)
        const throwForce = 50; 
        const upForce = 15; // Forza verso l'alto per fare la parabola

        const velX = -Math.sin(currentRot) * throwForce;
        const velZ = -Math.cos(currentRot) * throwForce;

        onSpawnBomb(
            [spawnX, spawnY, spawnZ], 
            [velX, upForce, velZ]
        );
        
        console.log("Bomba lanciata!");
    }
  };

  const activateItem = () => {
    switch (currentItem) {
      case ITEMS.MUSHROOM: useMushroom(); break;
      case ITEMS.BANANA: useBanana(); break;
      case ITEMS.GREEN_SHELL: useGreenShell(); break;
	  case ITEMS.RED_SHELL: useRedShell(); break;
	  case ITEMS.BLUE_SHELL: useBlueShell(); break;
	  case ITEMS.BULLET_BILL: useBulletBill(); break;
	  case ITEMS.BOB_OMB: useBomb(); break;
	  case ITEMS.STAR: useStar(); break;
      default: break;
    }
    setCurrentItem(ITEMS.NONE);
  };

  return {
    currentItem,
    pickupItem,
    handleItemInput
  };
};