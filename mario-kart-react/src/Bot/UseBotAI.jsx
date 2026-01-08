import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const AI_CONFIG = {
  lookAheadDist: 30,      // Distanza ideale (rettilinei)
  minLookAhead: 8,       // Distanza di emergenza (curve strette/ostacoli)
  laneWidth: 4.0,         
  steerReaction: 15.0,     
  rayLength: 6.0,         // Raggi corti per evitare auto
  stuckTime: 1.5,
  decisionCooldown: 3.0   
}

export function useBotAI({ isBot, rigidBody, paths }) {
  const { world, rapier } = useRapier()
  const { scene } = useThree() 

  const controls = useRef({ 
    forward: false, backward: false, left: false, right: false, drift: false 
  })

  // Stati logici
  const activePathIndex = useRef(0)
  const currentWpIndex = useRef(0) // Questo "corre" avanti di 50m
  const closestWpIndex = useRef(0) //  Questo traccia dove è l'auto REALE
  
  const currentLaneOffset = useRef(0)
  const targetLaneOffset = useRef(0)
  const humanizeTimer = useRef(0)
  
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
    sightRayDir: new THREE.Vector3() // Nuovo vettore per la linea di vista
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
    
    // Assegnazione percorso casuale
    activePathIndex.current = Math.floor(Math.random() * paths.length)
    const currentPath = paths[activePathIndex.current]
    const rbPos = rigidBody.current.translation()
    
    // Troviamo il punto più vicino per iniziare
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
    currentWpIndex.current = closestIndex // All'inizio coincidono
    
    targetLaneOffset.current = (Math.random() - 0.5) * AI_CONFIG.laneWidth
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
    
    // Origine raggio un po' alzata per non colpire il pavimento stesso
    v.rayOrigin.copy(v.pos).add(new THREE.Vector3(0, 0.8, 0))

    // --- 2. Gestione Indici Percorso ---
    // A. Trova indice realmente più vicino all'auto (per il fallback corto)
    // Non facciamo un loop completo per performance, cerchiamo solo nei prossimi 10
    let bestDist = Infinity
    let checkIndex = closestWpIndex.current
    for(let i=0; i<10; i++) {
        const idx = (closestWpIndex.current + i) % currentPath.length
        const wp = currentPath[idx]
        const d = (wp.x - v.pos.x)**2 + (wp.z - v.pos.z)**2
        if(d < bestDist) {
            bestDist = d
            checkIndex = idx
        }
    }
    closestWpIndex.current = checkIndex

    // B. Gestione indice "Lontano" (Target ideale a 50m)
    let currWp = currentPath[currentWpIndex.current]
    let nextWp = currentPath[(currentWpIndex.current + 1) % currentPath.length]
    
    // Distanza dal "cursore target" attuale
    const distToCurrTarget = v.pos.distanceToSquared(v.temp.set(currWp.x, v.pos.y, currWp.z))
    
    // Se siamo più vicini di 50m (2500 dist^2), spingiamo il target più avanti
    if (distToCurrTarget < (AI_CONFIG.lookAheadDist ** 2)) {
      currentWpIndex.current = (currentWpIndex.current + 1) % currentPath.length
    }

    // --- 3. Umanizzazione Corsia ---
    humanizeTimer.current += delta
    if (humanizeTimer.current > 2.0) { 
        targetLaneOffset.current = (Math.random() - 0.5) * AI_CONFIG.laneWidth
        humanizeTimer.current = -(Math.random() * 2.0)
    }
    currentLaneOffset.current = THREE.MathUtils.lerp(currentLaneOffset.current, targetLaneOffset.current, delta * 0.5)


    // --- 4. CALCOLO TARGET INTELLIGENTE (Corner Cutting Logic) ---
    
    // Target LONTANO (default)
    const farWp = currentPath[currentWpIndex.current]
    
    // Target VICINO (fallback sicuro)
    // Prendiamo un punto qualche indice avanti rispetto a dove siamo fisicamente
    const safeLookAheadNodes = 4 // ~10-15 metri avanti in base alla densità dei punti
    const nearIndex = (closestWpIndex.current + safeLookAheadNodes) % currentPath.length
    const nearWp = currentPath[nearIndex]

    let finalTargetWp = farWp
    let isCuttingCorner = false

    // Raycast verso il target LONTANO per vedere se tagliamo l'erba
    if (world && rapier) {
        v.temp.set(farWp.x, v.pos.y + 0.8, farWp.z) // Target aggiustato in altezza
        v.sightRayDir.copy(v.temp).sub(v.rayOrigin)
        const distanceToFar = v.sightRayDir.length()
        v.sightRayDir.normalize()

        const sightRay = new rapier.Ray(v.rayOrigin, v.sightRayDir)
        // Raycast che ignora gli oggetti dinamici se configurati, ma colpisce statici (muri, terreno)
        // true = colpisce tutto. Controlliamo la distanza
        const hit = world.castRay(sightRay, distanceToFar, true)
        
        // Se colpiamo qualcosa prima di arrivare al target (tolleranza 1 metro), stiamo tagliando
        if (hit && hit.toi < distanceToFar - 1.0) {
             isCuttingCorner = true
        }
    }

    // Se stiamo tagliando la curva, usiamo il target VICINO
    if (isCuttingCorner) {
        finalTargetWp = nearWp
    }

    // --- DEBUG VISUAL: Linea di Vista (Sight Line) ---
    // Blu = Vedo il target lontano (Rettilineo)
    // Arancione = Vista bloccata, uso target vicino (Curva)
    if (!debugArrows.current['sight']) {
        const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), v.rayOrigin, 5, 0x0000ff)
        scene.add(arrow)
        debugArrows.current['sight'] = arrow
    }
    const sightArrow = debugArrows.current['sight']
    sightArrow.position.copy(v.rayOrigin)
    
    // Direzione visuale
    const actualDir = v.temp.set(finalTargetWp.x, v.pos.y, finalTargetWp.z).sub(v.pos)
    const dist = actualDir.length()
    sightArrow.setDirection(actualDir.normalize())
    sightArrow.setLength(Math.min(dist, 30)) // Cap lunghezza visiva
    sightArrow.setColor(isCuttingCorner ? new THREE.Color(0xffaa00) : new THREE.Color(0x0088ff))


    // --- 5. Calcolo Vettore Target Finale con Offset ---
    // Calcoliamo la "destra" del percorso nel punto del target scelto
    const targetNextIndex = (isCuttingCorner ? nearIndex : currentWpIndex.current) + 1
    const nextWpRef = currentPath[targetNextIndex % currentPath.length]
    const roadDir = v.temp.copy(nextWpRef).sub(finalTargetWp).normalize()
    v.pathRight.crossVectors(new THREE.Vector3(0, 1, 0), roadDir).normalize()
    
    v.target.copy(finalTargetWp)
    v.target.addScaledVector(v.pathRight, currentLaneOffset.current) // Applica offset corsia

    // --- 6. Raycasting Corto (Evitamento Auto) ---
    // (Uguale a prima, ma con visualizzazione helper)
    let avoidanceSteer = 0
    let obstacleDetected = false

    const updateArrow = (key, dir, origin, isHit) => {
        if (!debugArrows.current[key]) {
            const arrow = new THREE.ArrowHelper(dir, origin, AI_CONFIG.rayLength, 0x00ff00)
            scene.add(arrow); debugArrows.current[key] = arrow
        }
        const arr = debugArrows.current[key]
        arr.position.copy(origin); arr.setDirection(dir)
        arr.setColor(new THREE.Color(isHit ? 0xff0000 : 0xb6ff00))
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
      const hitLeft = cast(0.6, 'left'); const hitCenter = cast(0, 'center'); const hitRight = cast(-0.6, 'right')
      if (hitCenter || hitLeft || hitRight) {
        obstacleDetected = true
        if (hitCenter) avoidanceSteer = hitLeft ? -1 : 1
        else if (hitLeft) avoidanceSteer = -1.0
        else if (hitRight) avoidanceSteer = 1.0
        targetLaneOffset.current = 0 
      }
    }

    // --- 7. Output Comandi ---
    v.dirToTarget.copy(v.target).sub(v.pos).normalize()
    const steerToTarget = v.forward.cross(v.dirToTarget).y
    
    // Logica sterzo migliorata: Se siamo in "mode curva" (isCuttingCorner), sterziamo più aggressivi
    let reactionSpeed = isCuttingCorner ? AI_CONFIG.steerReaction * 1.5 : AI_CONFIG.steerReaction

    let targetSteer = obstacleDetected ? avoidanceSteer : steerToTarget
    
    // Fix inversione se target è dietro (raro con la nuova logica, ma sicurezza)
    if (v.forward.dot(v.dirToTarget) < 0 && !obstacleDetected) targetSteer = steerToTarget > 0 ? 1 : -1

    currentSteer.current = THREE.MathUtils.lerp(currentSteer.current, targetSteer, delta * reactionSpeed)

    controls.current.forward = true
    controls.current.backward = false

    // Deadzone sterzo
    if (currentSteer.current > 0.1) {
      controls.current.left = true; controls.current.right = false
    } else if (currentSteer.current < -0.1) {
      controls.current.left = false; controls.current.right = true
    } else {
      controls.current.left = false; controls.current.right = false
    }

    // Freno a mano se sterzata estrema
    if (Math.abs(currentSteer.current) > 0.9 && !controls.current.drift) {
        controls.current.forward = false 
    }

    // Anti-Blocco (Reset)
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