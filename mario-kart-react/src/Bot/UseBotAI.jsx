import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const AI_CONFIG = {
  lookAheadDist: 1.0,
  minLookAhead: 1.0,
  maxLookAhead: 12.0,
  curveThreshold: 0.3,
  obstacleLookAhead: 1.0,
  maxLaneOffset: 0.0,
  laneSwitchInterval: 50.0,
  laneSwitchSpeed: 0.05,
  steerReaction: 18.0,
  rayLength: 8.0,
  stuckTime: 1.5,
  debugEnabled: false,
  logicUpdateRate: 10,  // Aumentato da 6 a 10 (logica ogni 10 frames = 6fps invece di 10fps)
  itemUseChance: 1,
  minDistanceToAttack: 20,
  raycastInterval: 5,  // Aumentato da 2 a 5 (meno raycast)
  pathSwitchDistance: 3.0,
  waypointCheckRange: 15,  // Ridotto da 25 a 15 per ricerca waypoint
}

export function useBotAI({ isBot, rigidBody, paths, currentItem, triggerItemInput }) {
  const { world, rapier } = useRapier()
  const { scene } = useThree()

  const itemDecisionTimer = useRef(0);

  const controls = useRef({ 
    forward: false, backward: false, left: false, right: false, drift: false 
  })


  // Offset casuale per evitare che tutti i bot calcolino nello stesso frame
  const frameOffset = useRef(Math.floor(Math.random() * AI_CONFIG.logicUpdateRate))
  const frameCounter = useRef(0)
  const raycastCounter = useRef(0)

  // Cache dei risultati logici tra un frame e l'altro
  const cachedLogic = useRef({
    targetSteer: 0,
    isStuck: false,
    speed: 0,
    isSightBlocked: false,
    obstacleDetected: false,
    avoidanceSteer: 0
  })

	let avoidanceSteer = cachedLogic.current.avoidanceSteer || 0
	let obstacleDetected = cachedLogic.current.obstacleDetected || false

  const activePathIndex = useRef(0)
  const closestWpIndex = useRef(0)
  const currentLaneOffset = useRef(0)
  const targetLaneOffset = useRef(0)
  const laneTimer = useRef(Math.random() * 20)  // Aumentato per iniziare più stabili
  const currentSteer = useRef(0)
  const stuckTimer = useRef(0)
  const debugArrows = useRef({})
  const pathSwitchCooldown = useRef(0)  // Cooldown per cambio path
  const lastObstacleType = useRef(null)  // Traccia tipo ultimo ostacolo

  // Vettori riutilizzabili
  const v = useMemo(() => ({
    pos: new THREE.Vector3(),
    dirToTarget: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    target: new THREE.Vector3(),
    rayOrigin: new THREE.Vector3(),
    rayDir: new THREE.Vector3(),
    temp: new THREE.Vector3(),
    pathRight: new THREE.Vector3(),
    sightRayDir: new THREE.Vector3()
  }), [])

  useEffect(() => {
    return () => {
      Object.values(debugArrows.current).forEach(arrow => {
        if (arrow && arrow.parent) arrow.parent.remove(arrow)
      })
      debugArrows.current = {}
    }
  }, [])

  // Init Path
  useEffect(() => {
    if (!paths || paths.length === 0 || !rigidBody.current) return
    activePathIndex.current = Math.floor(Math.random() * paths.length)
    const currentPath = paths[activePathIndex.current]
    const rbPos = rigidBody.current.translation()
    
    let closestDist = Infinity
    let closestIndex = 0
    for (let i = 0; i < currentPath.length; i++) {
        const dx = currentPath[i].x - rbPos.x
        const dz = currentPath[i].z - rbPos.z
        const dist = dx*dx + dz*dz
        if (dist < closestDist) {
            closestDist = dist
            closestIndex = i
        }
    }
    closestWpIndex.current = closestIndex
    targetLaneOffset.current = (Math.random() - 0.5) * 2 * AI_CONFIG.maxLaneOffset
    currentLaneOffset.current = targetLaneOffset.current
  }, [paths])

  useFrame((state, delta) => {
    if (!isBot || !rigidBody.current || !paths || paths.length === 0) return;

    // --- LOGICA DECISIONALE ITEM ---
    // Usiamo il timer per non spammare il check ogni frame
    itemDecisionTimer.current += delta;
    
    if (itemDecisionTimer.current > 0.5) { // Controlla ogni mezzo secondo
        itemDecisionTimer.current = 0;

        if (currentItem && currentItem !== 'NONE') {
            // Probabilità di usare l'oggetto (es. 20% di chance ogni check)
            const shouldUse = Math.random() < 0.2; 
            
            if (shouldUse) {
                // Attiviamo l'input
                triggerItemInput(true);
                
                // Rilasciamo l'input dopo un breve delay per simulare la pressione
                setTimeout(() => {
                    triggerItemInput(false);
                }, 150);
            }
        }
    }

    // --- AGGIORNAMENTO FISICA DI BASE (SEMPRE ESEGUITO) ---
    const currentPath = paths[activePathIndex.current]
    const rbPos = rigidBody.current.translation()
    const rbRot = rigidBody.current.rotation()
    const rbVel = rigidBody.current.linvel()
    const currentSpeed = Math.sqrt(rbVel.x**2 + rbVel.z**2)
    cachedLogic.current.speed = currentSpeed

    // Interpolazione fluida dello sterzo (deve girare a 60fps anche se la logica gira a 15fps)
    currentSteer.current = THREE.MathUtils.lerp(
        currentSteer.current, 
        cachedLogic.current.targetSteer, 
        delta * AI_CONFIG.steerReaction
    )

    // Output Controlli basato sul valore interpolato
    controls.current.forward = true
    controls.current.backward = false

    // Gestione stuck (semplificata per frame rate)
    if (cachedLogic.current.isStuck) {
       controls.current.forward = false; controls.current.backward = true;
       controls.current.left = !controls.current.left; controls.current.right = !controls.current.right;
    } else {
        if (currentSteer.current > 0.1) {
            controls.current.left = true; controls.current.right = false
        } else if (currentSteer.current < -0.1) {
            controls.current.left = false; controls.current.right = true
        } else {
            controls.current.left = false; controls.current.right = false
        }
    }

    // --- LOGICA PESANTE (PATHFINDING + RAYCAST) - TIME SLICING ---
    frameCounter.current += 1
    // Esegui solo se tocca a questo bot in questo frame
    if ((frameCounter.current + frameOffset.current) % AI_CONFIG.logicUpdateRate !== 0) {
        return 
    }

    // Qui sotto tutto il codice pesante viene eseguito solo 1 volta ogni 4 frame (15 fps logici)
    // ---------------------------------------------------------------------------------------

    v.pos.set(rbPos.x, rbPos.y, rbPos.z)
    const q = new THREE.Quaternion(rbRot.x, rbRot.y, rbRot.z, rbRot.w)
    v.forward.set(0, 0, -1).applyQuaternion(q).normalize()
    v.rayOrigin.copy(v.pos).add(new THREE.Vector3(0, 0.35, 0))

    // 1. Find Closest WP - Ottimizzato con range ridotto
    let bestDist = Infinity
    let checkIndex = closestWpIndex.current
    const pathLen = currentPath.length
    const searchRange = AI_CONFIG.waypointCheckRange; // Usa range configurabile
    for(let i = -5; i < searchRange; i++) {
        let idx = (closestWpIndex.current + i);
        if (idx < 0) idx += pathLen;
        idx = idx % pathLen;
        const wp = currentPath[idx]
        const d = (wp.x - v.pos.x)**2 + (wp.z - v.pos.z)**2
        if(d < bestDist) { bestDist = d; checkIndex = idx; }
    }
    closestWpIndex.current = checkIndex

    // 2. Analisi Curvatura - Cache risultato, ricalcola solo ogni 3 update logici
    let curveAngle = 0;
    let isInCurve = false;
    
    if (!cachedLogic.current.curveCache || frameCounter.current % 30 === 0) {
        const wp1 = currentPath[closestWpIndex.current];
        const wp2Index = (closestWpIndex.current + 3) % pathLen;
        const wp3Index = (closestWpIndex.current + 6) % pathLen;
        const wp2 = currentPath[wp2Index];
        const wp3 = currentPath[wp3Index];
        
        // Vettori tra waypoint - riusa v.temp per evitare allocazioni
        const v1x = wp2.x - wp1.x;
        const v1z = wp2.z - wp1.z;
        const len1 = Math.sqrt(v1x*v1x + v1z*v1z);
        const v2x = wp3.x - wp2.x;
        const v2z = wp3.z - wp2.z;
        const len2 = Math.sqrt(v2x*v2x + v2z*v2z);
        
        // Dot product normalizzato
        const dotProduct = (v1x*v2x + v1z*v2z) / (len1 * len2);
        curveAngle = Math.acos(THREE.MathUtils.clamp(dotProduct, -1, 1));
        isInCurve = curveAngle > AI_CONFIG.curveThreshold;
        
        // Cache per 3 update
        cachedLogic.current.curveCache = { curveAngle, isInCurve };
    } else {
        curveAngle = cachedLogic.current.curveCache.curveAngle;
        isInCurve = cachedLogic.current.curveCache.isInCurve;
    }

    // 3. Target Calculation con LookAhead Dinamico
    let dynamicLookAhead = AI_CONFIG.maxLookAhead;
    
    if (isInCurve) {
        const curveFactor = Math.min(curveAngle / Math.PI, 1.0);
        dynamicLookAhead = THREE.MathUtils.lerp(AI_CONFIG.maxLookAhead, AI_CONFIG.minLookAhead, curveFactor);
    }
    
    const speedBonus = Math.floor(currentSpeed * 0.3); // Ridotto da 0.5
    const lookAheadNodes = Math.max(AI_CONFIG.minLookAhead, Math.floor(dynamicLookAhead * 0.6) + speedBonus);
    const farIndex = (closestWpIndex.current + lookAheadNodes) % pathLen;
    const farWp = currentPath[farIndex];

    // 4. Sight Check (Raycast 1) - Ottimizzato con counter
    let isSightBlocked = cachedLogic.current.isSightBlocked || false
    let finalTargetWp = farWp
    
    raycastCounter.current++
    if (world && rapier && raycastCounter.current % AI_CONFIG.raycastInterval === 0) {
        v.temp.set(farWp.x, v.pos.y + 0.5, farWp.z) 
        v.sightRayDir.copy(v.temp).sub(v.rayOrigin)
        const distanceToFar = v.sightRayDir.length()
        v.sightRayDir.normalize()
        const sightRay = new rapier.Ray(v.rayOrigin, v.sightRayDir)
        const hit = world.castRay(sightRay, distanceToFar, true)
        isSightBlocked = hit && hit.toi < distanceToFar - 1.5
        cachedLogic.current.isSightBlocked = isSightBlocked
    }
    
    // Se ostacolo rilevato, guarda più vicino per non tagliare
    if (isSightBlocked || obstacleDetected) {
        const obstacleLookAhead = Math.floor(AI_CONFIG.obstacleLookAhead);
        const adjustedIndex = (closestWpIndex.current + obstacleLookAhead) % pathLen;
        finalTargetWp = currentPath[adjustedIndex];
    }

    // 5. Lane Logic - Guida più consistente, segue la linea centrale
    let targetIndexForOffset = farIndex;
    
    // Decrementa cooldown cambio path
    if (pathSwitchCooldown.current > 0) {
        pathSwitchCooldown.current -= delta * AI_CONFIG.logicUpdateRate;
    }
    
    if (isSightBlocked) {
        const panicIndex = (closestWpIndex.current + 3) % pathLen;
        finalTargetWp = currentPath[panicIndex];
        targetIndexForOffset = panicIndex; 
        // Mantieni centro linea quando bloccato
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, 0, 10, delta * AI_CONFIG.logicUpdateRate);
    } else {
        // Guida stabile: mantieni sempre centro linea (offset = 0)
        // Solo variazioni minime per sembrare più naturale
        targetLaneOffset.current = 0;  // Sempre al centro
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, targetLaneOffset.current, AI_CONFIG.laneSwitchSpeed, delta * AI_CONFIG.logicUpdateRate);
    }

    const nextWpRef = currentPath[(targetIndexForOffset + 1) % pathLen]
    const roadDir = v.temp.copy(nextWpRef).sub(finalTargetWp).normalize()
    v.pathRight.crossVectors(new THREE.Vector3(0, 1, 0), roadDir).normalize()
    v.target.copy(finalTargetWp).addScaledVector(v.pathRight, currentLaneOffset.current) 

    // 6. Safety Side Ray (Raycast 2 - Only if needed)
    if (world && !isSightBlocked) { 
        v.temp.copy(v.target).sub(v.pos);
        const distToTarget = v.temp.length();
        v.temp.normalize(); 
        const safetyRay = new rapier.Ray(v.rayOrigin, v.temp);
        const safetyHit = world.castRay(safetyRay, distToTarget, true);
        if (safetyHit && safetyHit.toi < distToTarget - 1.0) {
            currentLaneOffset.current = 0; // Immediate reset
            v.target.copy(finalTargetWp);
        }
    }
    
    if (world && raycastCounter.current % AI_CONFIG.raycastInterval === 0) {
      // Cast con info dettagliate
      const castDetailed = (angle) => {
        v.rayDir.copy(v.forward).applyAxisAngle(new THREE.Vector3(0,1,0), angle)
        const ray = new rapier.Ray(v.rayOrigin, v.rayDir);
        const hit = world.castRayAndGetNormal(ray, AI_CONFIG.rayLength, true);
        return hit
      }
      
      const hitCenter = castDetailed(0);
      
      if (hitCenter && hitCenter.toi < AI_CONFIG.rayLength) {
        // Controlla tipo di ostacolo colpito
        const hitObject = hitCenter.collider?.parent();
        const userData = hitObject?.userData;
        const isRacer = userData && (userData.type === 'racer' || userData.type === 'opponent');
        
        lastObstacleType.current = isRacer ? 'racer' : 'static';
        
        if (isRacer) {
          // È un bot o player: prova a sorpassare leggermente
          obstacleDetected = true;
          // Leggero sterzo per tentativo sorpasso, ma resta sulla stessa linea
          const hitLeft = castDetailed(0.3);
          avoidanceSteer = hitLeft ? -0.3 : 0.3;  // Ridotto a 0.3 invece di 1
        } else {
          // È un ostacolo statico (banana, muro, etc): cambia path se possibile
          obstacleDetected = true;
          
          // Cambia path se cooldown scaduto e ci sono altri path disponibili
          if (pathSwitchCooldown.current <= 0 && paths.length > 1 && hitCenter.toi < AI_CONFIG.pathSwitchDistance) {
            // Scegli path alternativo casuale diverso da quello corrente
            let newPathIndex = activePathIndex.current;
            while (newPathIndex === activePathIndex.current && paths.length > 1) {
              newPathIndex = Math.floor(Math.random() * paths.length);
            }
            activePathIndex.current = newPathIndex;
            pathSwitchCooldown.current = 5.0;  // 5 secondi di cooldown
            
            // Resetta waypoint più vicino per nuovo path
            const newPath = paths[newPathIndex];
            let closestDist = Infinity;
            for (let i = 0; i < newPath.length; i++) {
              const dx = newPath[i].x - v.pos.x;
              const dz = newPath[i].z - v.pos.z;
              const dist = dx*dx + dz*dz;
              if (dist < closestDist) {
                closestDist = dist;
                closestWpIndex.current = i;
              }
            }
          }
          
          // Sterzo d'emergenza se molto vicino
          avoidanceSteer = hitCenter.toi < 2.0 ? 1.0 : 0.5;
        }
      } else {
        obstacleDetected = false;
        avoidanceSteer = 0;
        lastObstacleType.current = null;
      }
      
      cachedLogic.current.obstacleDetected = obstacleDetected;
      cachedLogic.current.avoidanceSteer = avoidanceSteer;
    }

    // 8. Calculate Final Steer Target
    v.dirToTarget.copy(v.target).sub(v.pos).normalize()
    const dotFront = v.forward.dot(v.dirToTarget);
    const steerToTarget = v.forward.cross(v.dirToTarget).y
    
    let targetSteer = obstacleDetected ? avoidanceSteer : steerToTarget
    if (dotFront < 0 && !obstacleDetected) targetSteer = steerToTarget > 0 ? 1 : -1
    
    // Save to cache for next interpolation frames
    cachedLogic.current.targetSteer = targetSteer

    // Stuck logic check
    if (currentSpeed < 1.0) {
        stuckTimer.current += delta * AI_CONFIG.logicUpdateRate
        if (stuckTimer.current > AI_CONFIG.stuckTime) cachedLogic.current.isStuck = true;
    } else {
        stuckTimer.current = 0
        cachedLogic.current.isStuck = false;
    }

    if (controls.current.item && triggerItemInput) {
        triggerItemInput(true);
        setTimeout(() => { controls.current.item = false; }, 100);
    }
  })

  return controls
}