import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const AI_CONFIG = {
  lookAheadDist: 12.0,
  minLookAhead: 4.0,
  maxLaneOffset: 1.8,
  laneSwitchInterval: 8.0,
  laneSwitchSpeed: 1.5,
  steerReaction: 15.0,
  rayLength: 5.0,
  stuckTime: 1.5,
  debugEnabled: false,
  logicUpdateRate: 4,
  itemUseChance: 1,
  minDistanceToAttack: 20,
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

  // Cache dei risultati logici tra un frame e l'altro
  const cachedLogic = useRef({
    targetSteer: 0,
    isStuck: false,
    speed: 0
  })

  const activePathIndex = useRef(0)
  const closestWpIndex = useRef(0)
  const currentLaneOffset = useRef(0)
  const targetLaneOffset = useRef(0)
  const laneTimer = useRef(Math.random() * 10)
  const currentSteer = useRef(0)
  const stuckTimer = useRef(0)
  const debugArrows = useRef({})

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

    // 1. Find Closest WP
    let bestDist = Infinity
    let checkIndex = closestWpIndex.current
    const pathLen = currentPath.length
    for(let i = -5; i < 25; i++) {
        let idx = (closestWpIndex.current + i);
        if (idx < 0) idx += pathLen;
        idx = idx % pathLen;
        const wp = currentPath[idx]
        const d = (wp.x - v.pos.x)**2 + (wp.z - v.pos.z)**2
        if(d < bestDist) { bestDist = d; checkIndex = idx; }
    }
    closestWpIndex.current = checkIndex

    // 2. Target Calculation
    const speedBonus = Math.floor(currentSpeed * 0.5); 
    const lookAheadNodes = Math.max(AI_CONFIG.minLookAhead, Math.floor(AI_CONFIG.lookAheadDist * 0.6) + speedBonus);
    const farIndex = (closestWpIndex.current + lookAheadNodes) % pathLen;
    const farWp = currentPath[farIndex];

    // 3. Sight Check (Raycast 1)
    let isSightBlocked = false
    let finalTargetWp = farWp
    
    if (world && rapier) {
        v.temp.set(farWp.x, v.pos.y + 0.5, farWp.z) 
        v.sightRayDir.copy(v.temp).sub(v.rayOrigin)
        const distanceToFar = v.sightRayDir.length()
        v.sightRayDir.normalize()
        const sightRay = new rapier.Ray(v.rayOrigin, v.sightRayDir)
        const hit = world.castRay(sightRay, distanceToFar, true)
        if (hit && hit.toi < distanceToFar - 1.5) { isSightBlocked = true }
    }

    // 4. Lane Logic
    let targetIndexForOffset = farIndex;
    if (isSightBlocked) {
        const panicIndex = (closestWpIndex.current + 3) % pathLen;
        finalTargetWp = currentPath[panicIndex];
        targetIndexForOffset = panicIndex; 
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, 0, 10, delta * AI_CONFIG.logicUpdateRate);
    } else {
        laneTimer.current += delta * AI_CONFIG.logicUpdateRate; // Adjust delta for skipped frames
        if (laneTimer.current > AI_CONFIG.laneSwitchInterval) {
            laneTimer.current = 0;
            targetLaneOffset.current = (Math.random() - 0.5) * 2 * AI_CONFIG.maxLaneOffset;
        }
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, targetLaneOffset.current, AI_CONFIG.laneSwitchSpeed, delta * AI_CONFIG.logicUpdateRate);
    }

    const nextWpRef = currentPath[(targetIndexForOffset + 1) % pathLen]
    const roadDir = v.temp.copy(nextWpRef).sub(finalTargetWp).normalize()
    v.pathRight.crossVectors(new THREE.Vector3(0, 1, 0), roadDir).normalize()
    v.target.copy(finalTargetWp).addScaledVector(v.pathRight, currentLaneOffset.current) 

    // 5. Safety Side Ray (Raycast 2 - Only if needed)
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

    // 6. Car Avoidance (Multiple Raycasts)
    let avoidanceSteer = 0
    let obstacleDetected = false
    
    if (world) {
      // Ottimizzazione: Riduciamo la frequenza o il numero di raggi se FPS bassi
      // Per ora manteniamo i 3 raggi ma vengono eseguiti 1/4 delle volte grazie al return sopra
      const cast = (angle) => {
        v.rayDir.copy(v.forward).applyAxisAngle(new THREE.Vector3(0,1,0), angle)
        const ray = new rapier.Ray(v.rayOrigin, v.rayDir);
        const hit = world.castRay(ray, AI_CONFIG.rayLength, true);
        return hit && hit.toi < AI_CONFIG.rayLength
      }
      
      const hitLeft = cast(0.5); 
      const hitCenter = cast(0); 
      const hitRight = cast(-0.5);
      
      if (hitCenter || hitLeft || hitRight) {
        obstacleDetected = true
        if (hitCenter) avoidanceSteer = hitLeft ? -1 : (hitRight ? 1 : (Math.random() > 0.5 ? 1 : -1))
        else if (hitLeft) avoidanceSteer = -1.0 
        else if (hitRight) avoidanceSteer = 1.0 
      }
    }

    // 7. Calculate Final Steer Target
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