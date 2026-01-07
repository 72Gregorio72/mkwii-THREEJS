import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

const AI_CONFIG = {
  lookAheadDist: 8,       // Distanza per switchare waypoint
  laneWidth: 3.0,         // Larghezza corsia per variazione
  steerReaction: 5.0,     // Velocità sterzata (Fluidità)
  rayLength: 6.0,         // Lunghezza sensori muri
  stuckTime: 1.5          // Secondi prima di fare retromarcia
}

export function useBotAI({ isBot, rigidBody, waypoints }) {
  // 1. FIX: Estraiamo anche 'rapier' per creare l'oggetto Ray
  const { world, rapier } = useRapier()
  
  const controls = useRef({ 
    forward: false, backward: false, left: false, right: false, drift: false 
  })

  const currentWpIndex = useRef(0)
  const currentLaneOffset = useRef(0)
  const currentSteer = useRef(0)
  const stuckTimer = useRef(0)

  const v = useMemo(() => ({
    pos: new THREE.Vector3(),
    dirToTarget: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    target: new THREE.Vector3(),
    rayOrigin: new THREE.Vector3(),
    rayDir: new THREE.Vector3(),
    temp: new THREE.Vector3()
  }), [])

  useEffect(() => {
    currentLaneOffset.current = (Math.random() - 0.5) * AI_CONFIG.laneWidth
  }, [])

  useFrame((state, delta) => {
    if (!isBot || !rigidBody.current || !waypoints || waypoints.length < 2) return

    // --- 1. Dati Fisici ---
    const rbPos = rigidBody.current.translation()
    const rbRot = rigidBody.current.rotation()
    const rbVel = rigidBody.current.linvel()
    const currentSpeed = Math.sqrt(rbVel.x**2 + rbVel.z**2)
    
    v.pos.set(rbPos.x, rbPos.y, rbPos.z)
    const q = new THREE.Quaternion(rbRot.x, rbRot.y, rbRot.z, rbRot.w)
    v.forward.set(0, 0, -1).applyQuaternion(q).normalize()

    // --- 2. Logica Waypoint ---
    let currWp = waypoints[currentWpIndex.current]
    let nextWp = waypoints[(currentWpIndex.current + 1) % waypoints.length]

    const distToCurr = v.pos.distanceToSquared(v.temp.set(currWp.x, v.pos.y, currWp.z))
    const distToNext = v.pos.distanceToSquared(v.temp.set(nextWp.x, v.pos.y, nextWp.z))

    if (distToNext < distToCurr || distToCurr < (AI_CONFIG.lookAheadDist ** 2)) {
      currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length
      const newOffset = (Math.random() - 0.5) * AI_CONFIG.laneWidth
      currentLaneOffset.current = THREE.MathUtils.lerp(currentLaneOffset.current, newOffset, 0.5)
    }

    v.target.set(
      waypoints[currentWpIndex.current].x + currentLaneOffset.current,
      v.pos.y, 
      waypoints[currentWpIndex.current].z + currentLaneOffset.current
    )

    // --- 3. FIX: Raycasting Corretto ---
    let avoidanceSteer = 0.5
    let obstacleDetected = false

    if (world && rapier) {
      v.rayOrigin.copy(v.pos).add(new THREE.Vector3(0, 0.5, 0))
      
      const cast = (angle) => {
        v.rayDir.copy(v.forward).applyAxisAngle(new THREE.Vector3(0,1,0), angle)
        
        // FIX QUI: Creiamo il raggio usando l'export di rapier
        const ray = new rapier.Ray(v.rayOrigin, v.rayDir);
        
        // E lo lanciamo usando il metodo del mondo (senza 'new')
        // argomenti: raggio, maxToi (lunghezza), solid
        const hit = world.castRay(ray, AI_CONFIG.rayLength, true);
        
        // Controlliamo se 'hit' esiste e se la distanza (toi) è minore del limite
        return hit && hit.toi < AI_CONFIG.rayLength
      }

      const hitLeft = cast(0.5)   
      const hitRight = cast(-0.5) 
      const hitCenter = cast(0)   

      if (hitCenter || hitLeft || hitRight) {
        obstacleDetected = true
        if (hitCenter) avoidanceSteer = hitLeft ? -1 : 1
        else if (hitLeft) avoidanceSteer = -1.0
        else if (hitRight) avoidanceSteer = 1.0
      }
    }

    // --- 4. Calcolo Sterzata ---
    v.dirToTarget.copy(v.target).sub(v.pos).normalize()
    const steerToTarget = v.forward.cross(v.dirToTarget).y
    const dotToTarget = v.forward.dot(v.dirToTarget)

    let targetSteer = obstacleDetected ? avoidanceSteer : steerToTarget

    if (dotToTarget < 0 && !obstacleDetected) targetSteer = steerToTarget > 0 ? 1 : -1

    currentSteer.current = THREE.MathUtils.lerp(currentSteer.current, targetSteer, delta * AI_CONFIG.steerReaction)

    // --- 5. Output Controlli ---
    controls.current.forward = true
    controls.current.backward = false

    if (currentSteer.current > 0.1) {
      controls.current.left = true; controls.current.right = false
    } else if (currentSteer.current < -0.1) {
      controls.current.left = false; controls.current.right = true
    } else {
      controls.current.left = false; controls.current.right = false
    }

    if (Math.abs(currentSteer.current) > 0.8 && !controls.current.drift) {
        controls.current.forward = false 
    }

    // --- 6. Anti-Blocco ---
    if (currentSpeed < 1.0) {
      stuckTimer.current += delta
      if (stuckTimer.current > AI_CONFIG.stuckTime) {
        controls.current.forward = false
        controls.current.backward = true
        controls.current.left = !controls.current.left
        controls.current.right = !controls.current.right
      }
    } else {
      stuckTimer.current = 0
    }
  })

  return controls
}