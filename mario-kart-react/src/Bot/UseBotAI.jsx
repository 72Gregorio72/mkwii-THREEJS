import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const AI_CONFIG = {
  lookAheadDist: 12.0,    // Distanza media per precisione (nè troppo vicina nè troppo lontana)
  minLookAhead: 4.0,      // Minimo per le curve strette
  maxLaneOffset: 1.8,     // Metri massimi dal centro (+/-)
  
  laneSwitchInterval: 8.0,// OGNI QUANTO CAMBIA LINEA (Secondi) - Molto più "stabile"
  laneSwitchSpeed: 1.5,   // Velocità dello spostamento laterale (più basso = cambio morbido)
  
  steerReaction: 15.0,    // MOLTO ALTO: Sterzo "su binari", reagisce subito
  
  rayLength: 5.0,         
  stuckTime: 1.5,
  debugEnabled: false      
}

export function useBotAI({ isBot, rigidBody, paths }) {
  const { world, rapier } = useRapier()
  const { scene } = useThree() 

  const controls = useRef({ 
    forward: false, backward: false, left: false, right: false, drift: false 
  })

  const activePathIndex = useRef(0)
  const closestWpIndex = useRef(0)
  
  // Gestione Linea
  const currentLaneOffset = useRef(0)
  const targetLaneOffset = useRef(0)
  const laneTimer = useRef(Math.random() * 10) // Start random per non farli cambiare tutti insieme
  
  const currentSteer = useRef(0)
  const stuckTimer = useRef(0)

  // Debug Arrows
  const debugArrows = useRef({}) 

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

  // --- CLEANUP DEBUG ---
  useEffect(() => {
    return () => {
      Object.values(debugArrows.current).forEach(arrow => {
        if (arrow && arrow.parent) arrow.parent.remove(arrow)
      })
      debugArrows.current = {}
    }
  }, [])

  // --- INIT PATH ---
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
    
    // Inizia subito su una linea casuale
    targetLaneOffset.current = (Math.random() - 0.5) * 2 * AI_CONFIG.maxLaneOffset
    currentLaneOffset.current = targetLaneOffset.current
  }, [paths]) 

  useFrame((state, delta) => {
    if (!isBot || !rigidBody.current || !paths || paths.length === 0) return
    
    const currentPath = paths[activePathIndex.current]
    if (!currentPath || currentPath.length < 2) return

    // --- 1. Aggiornamento Dati Fisici ---
    const rbPos = rigidBody.current.translation()
    const rbRot = rigidBody.current.rotation()
    const rbVel = rigidBody.current.linvel()
    const currentSpeed = Math.sqrt(rbVel.x**2 + rbVel.z**2)
    
    v.pos.set(rbPos.x, rbPos.y, rbPos.z)
    const q = new THREE.Quaternion(rbRot.x, rbRot.y, rbRot.z, rbRot.w)
    v.forward.set(0, 0, -1).applyQuaternion(q).normalize()
    
    // Raycast basso per i cordoli
    v.rayOrigin.copy(v.pos).add(new THREE.Vector3(0, 0.35, 0))

    // --- 2. Gestione Indici Percorso ---
    let bestDist = Infinity
    let checkIndex = closestWpIndex.current
    const pathLen = currentPath.length

    // Range di ricerca esteso
    for(let i = -5; i < 25; i++) {
        let idx = (closestWpIndex.current + i);
        if (idx < 0) idx += pathLen;
        idx = idx % pathLen;

        const wp = currentPath[idx]
        const d = (wp.x - v.pos.x)**2 + (wp.z - v.pos.z)**2
        if(d < bestDist) {
            bestDist = d
            checkIndex = idx
        }
    }
    closestWpIndex.current = checkIndex

    // --- 3. Calcolo Target Base ---
    const speedBonus = Math.floor(currentSpeed * 0.5); 
    const lookAheadNodes = Math.max(AI_CONFIG.minLookAhead, Math.floor(AI_CONFIG.lookAheadDist * 0.6) + speedBonus);

    // Indice Target
    const farIndex = (closestWpIndex.current + lookAheadNodes) % pathLen;
    const farWp = currentPath[farIndex];

    // --- 4. Safety Check (Panic Mode per Rotonde) ---
    // Questo serve SOLO se c'è un muro fisico davanti. Se è libero, seguono la linea.
    let finalTargetWp = farWp
    let isSightBlocked = false

    if (world && rapier) {
        v.temp.set(farWp.x, v.pos.y + 0.5, farWp.z) 
        v.sightRayDir.copy(v.temp).sub(v.rayOrigin)
        const distanceToFar = v.sightRayDir.length()
        v.sightRayDir.normalize()

        const sightRay = new rapier.Ray(v.rayOrigin, v.sightRayDir)
        // Check muri/statici
        const hit = world.castRay(sightRay, distanceToFar, true)
        
        if (hit && hit.toi < distanceToFar - 1.5) {
             isSightBlocked = true
        }
    }

    // --- 5. LOGICA LINEA (Cambi Occasionali) ---
    let targetIndexForOffset = farIndex;

    if (isSightBlocked) {
        // PANIC MODE: Muro davanti, dimentica la linea e stai al centro
        const panicIndex = (closestWpIndex.current + 3) % pathLen;
        finalTargetWp = currentPath[panicIndex];
        targetIndexForOffset = panicIndex; 
        
        // Reset immediato al centro
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, 0, 10, delta);
    } else {
        // NORMAL MODE: Segui la linea scelta
        laneTimer.current += delta;
        
        // Cambia decisione solo ogni X secondi
        if (laneTimer.current > AI_CONFIG.laneSwitchInterval) {
            laneTimer.current = 0;
            // Scegli una nuova linea a caso
            targetLaneOffset.current = (Math.random() - 0.5) * 2 * AI_CONFIG.maxLaneOffset;
        }

        // Movimento verso la linea scelta (Smussato ma preciso)
        // NOTA: Ho rimosso il "Safety Clamp" che riduceva l'offset in curva.
        // Ora mantengono la linea anche in curva, a meno che non ci sia un muro (gestito sotto).
        currentLaneOffset.current = THREE.MathUtils.damp(currentLaneOffset.current, targetLaneOffset.current, AI_CONFIG.laneSwitchSpeed, delta);
    }

    // --- 6. Calcolo Vettore Target ---
    const nextWpRef = currentPath[(targetIndexForOffset + 1) % pathLen]
    
    // Calcolo vettore laterale (Destra)
    const roadDir = v.temp.copy(nextWpRef).sub(finalTargetWp).normalize()
    v.pathRight.crossVectors(new THREE.Vector3(0, 1, 0), roadDir).normalize()
    
    // Applica Offset
    v.target.copy(finalTargetWp)
    v.target.addScaledVector(v.pathRight, currentLaneOffset.current) 

    // --- SAFETY CHECK LATERALE ---
    // Verifica che la linea scelta ("Perfect Line") non passi attraverso un muro laterale
    if (world && !isSightBlocked) { 
        v.temp.copy(v.target).sub(v.pos);
        const distToTarget = v.temp.length();
        v.temp.normalize(); 

        const safetyRay = new rapier.Ray(v.rayOrigin, v.temp);
        const safetyHit = world.castRay(safetyRay, distToTarget, true);

        if (safetyHit && safetyHit.toi < distToTarget - 1.0) {
             // La linea scelta colpisce un muro! Annulla l'offset temporaneamente.
             // Non cambiamo targetLaneOffset (così riprova appena finito il muro),
             // ma forziamo currentLaneOffset a 0 adesso.
             currentLaneOffset.current = THREE.MathUtils.lerp(currentLaneOffset.current, 0, delta * 5.0);
             v.target.copy(finalTargetWp); // Reset target fisico al centro
             
             if (AI_CONFIG.debugEnabled && debugArrows.current['sight']) {
                 debugArrows.current['sight'].setColor(new THREE.Color(0xff0000));
             }
        }
    }

    // --- DEBUG VISUAL ---
    if (AI_CONFIG.debugEnabled) {
      if (!debugArrows.current['sight']) {
          const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), v.rayOrigin, 5, 0x0000ff)
          scene.add(arrow)
          debugArrows.current['sight'] = arrow
      }
      const sightArrow = debugArrows.current['sight']
      sightArrow.position.copy(v.rayOrigin)
      const actualDir = v.temp.copy(v.target).sub(v.pos)
      const dist = actualDir.length()
      sightArrow.setDirection(actualDir.normalize())
      sightArrow.setLength(Math.min(dist, 30))
      
      if (sightArrow.material.color.getHex() !== 0xff0000) {
         sightArrow.setColor(isSightBlocked ? new THREE.Color(0xffaa00) : new THREE.Color(0x0088ff))
      }
    } 

    // --- 7. Evitamento Auto ---
    let avoidanceSteer = 0
    let obstacleDetected = false

    const updateArrow = (key, dir, origin, isHit) => {
        if (AI_CONFIG.debugEnabled) {
            if (!debugArrows.current[key]) {
                const arrow = new THREE.ArrowHelper(dir, origin, AI_CONFIG.rayLength, 0x00ff00)
                scene.add(arrow); debugArrows.current[key] = arrow
            }
            const arr = debugArrows.current[key]
            arr.position.copy(origin); arr.setDirection(dir)
            arr.setColor(new THREE.Color(isHit ? 0xff0000 : 0xb6ff00))
        }
    }

    if (world) {
      const cast = (angle, key) => {
        v.rayDir.copy(v.forward).applyAxisAngle(new THREE.Vector3(0,1,0), angle)
        const ray = new rapier.Ray(v.rayOrigin, v.rayDir);
        const hit = world.castRay(ray, AI_CONFIG.rayLength, true);
        const isHit = hit && hit.toi < AI_CONFIG.rayLength
        updateArrow(key, v.rayDir, v.rayOrigin, isHit)
        return isHit
      }
      
      const hitLeft = cast(0.5, 'left'); 
      const hitCenter = cast(0, 'center'); 
      const hitRight = cast(-0.5, 'right')
      
      if (hitCenter || hitLeft || hitRight) {
        obstacleDetected = true
        if (hitCenter) avoidanceSteer = hitLeft ? -1 : (hitRight ? 1 : (Math.random() > 0.5 ? 1 : -1))
        else if (hitLeft) avoidanceSteer = -1.0 
        else if (hitRight) avoidanceSteer = 1.0 
        // Non resettiamo l'offset qui, aggiriamo solo l'auto momentaneamente
      }
    }

    // --- 8. Output Comandi ---
    v.dirToTarget.copy(v.target).sub(v.pos).normalize()
    
    const dotFront = v.forward.dot(v.dirToTarget);
    const steerToTarget = v.forward.cross(v.dirToTarget).y
    
    // Reattività Aumentata per seguire la linea
    let baseReaction = AI_CONFIG.steerReaction;
    if (isSightBlocked) baseReaction *= 2.0; 
    
    let targetSteer = obstacleDetected ? avoidanceSteer : steerToTarget
    
    if (dotFront < 0 && !obstacleDetected) {
        targetSteer = steerToTarget > 0 ? 1 : -1
    }

    currentSteer.current = THREE.MathUtils.lerp(currentSteer.current, targetSteer, delta * baseReaction)

    controls.current.forward = true
    controls.current.backward = false

    if (currentSteer.current > 0.1) {
      controls.current.left = true; controls.current.right = false
    } else if (currentSteer.current < -0.1) {
      controls.current.left = false; controls.current.right = true
    } else {
      controls.current.left = false; controls.current.right = false
    }

    if (currentSpeed < 1.0) {
      stuckTimer.current += delta
      if (stuckTimer.current > AI_CONFIG.stuckTime) {
        controls.current.forward = false; controls.current.backward = true
        controls.current.left = !controls.current.left; controls.current.right = !controls.current.right
      }
    } else {
      stuckTimer.current = 0
    }
  })

  return controls
}