import { useRef } from 'react'

export function useHitboxHandler({ speed, boostTime, SETTINGS, onCheckpoint, maxCheckpoints }) {

  const lastCheckTime = useRef(0);
  const nextCheckpoint = useRef(1); 
  const currentLap = useRef(1);     
  
  // Riduciamo il cooldown a 1 secondo, sufficiente per non prenderlo doppio
  // ma abbastanza veloce se fai inversione a U.
  const CHECKPOINT_COOLDOWN = 1000; 

  const checkSurface = (hitObject) => {
    if (!hitObject) return { type: 'none' };

    let obj = hitObject;
    let foundName = '';
    
    // Risalita sicura
    for (let i = 0; i < 3; i++) {
        if (!obj || !obj.name) break;
        
        if (obj.name.includes('Check_')) { foundName = obj.name; break; }
        if (obj.name.includes('_boost')) { foundName = obj.name; break; }
        if (obj.name.includes('_grass')) { foundName = obj.name; break; }
        if (obj.name.includes('_outBound')) { foundName = obj.name; break; }
        if (obj.name.includes('Road') || obj.name.includes('Floor')) break; 
        
        obj = obj.parent;
    }

    if (!foundName) return { type: 'none' };

    // --- CHECKPOINTS ---
    if (foundName.includes('Check_')) {
        const now = Date.now();
        const match = foundName.match(/Check_(\d+)/);
        
        if (match && match[1]) {
             const checkIndex = parseInt(match[1]);

             // 1. Se colpisco quello che mi aspetto:
             if (checkIndex === nextCheckpoint.current) {
                 if (now - lastCheckTime.current < CHECKPOINT_COOLDOWN) return { type: 'checkpoint_cooldown' };
                 
                 console.log(`✅ Checkpoint ${checkIndex} PRESO!`);
                 lastCheckTime.current = now; 

                 if (checkIndex === 0) {
                     currentLap.current += 1;
                     console.log(`🏁 GIRO ${currentLap.current} INIZIATO!`);
                     nextCheckpoint.current = 1; 
                 } else if (checkIndex === maxCheckpoints) {
                     nextCheckpoint.current = 0; 
                 } else {
                     nextCheckpoint.current += 1; 
                 }

                 if (onCheckpoint) onCheckpoint(checkIndex, currentLap.current);
                 return { type: 'checkpoint', index: checkIndex, lap: currentLap.current };
             } 
             
             // 2. Se colpisco quello PRECEDENTE (es: ho appena preso il 2, e ritocco il 2 per sbaglio)
             // Lo ignoriamo silenziosamente, niente errore.
             else if (
                (checkIndex === nextCheckpoint.current - 1) || 
                (nextCheckpoint.current === 0 && checkIndex === maxCheckpoints)
             ) {
                 return { type: 'checkpoint_ignored' };
             }

             // 3. Errore vero (es: salto dal 1 al 3)
             else {
                 // Mettiamo un log solo se è passato un po' di tempo per non spammare la console
                 if (now - lastCheckTime.current > 2000) {
                    console.log(`❌ Checkpoint errato (Preso: ${checkIndex}, Atteso: ${nextCheckpoint.current})`);
                 }
                 return { type: 'wrong_checkpoint' };
             }
        }
    }

    // --- ALTRE SUPERFICI ---
    if (foundName.includes('_outBound')) return { type: 'outbound' };
    
    if (foundName.includes('_grass')) {
        speed.current *= 0.95; 
        if (speed.current > 15) speed.current = 15;
        return { type: 'grass' };
    }

    if (foundName.includes('_boost')) {
        if (boostTime.current < 5) { 
             boostTime.current = SETTINGS.boostDuration;
             speed.current = Math.max(speed.current, SETTINGS.maxSpeed + 20);
        }
        return { type: 'boost' };
    }

    return { type: 'none' };
  }

  return { checkSurface };
}