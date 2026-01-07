import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, MathUtils } from 'three'

export function AIBot({ 
  isBot, 
  rigidBodyRef, 
  waypoints, // Array di Vector3
  settings 
}) {
  // Stato simulato dei controlli
  const controls = useRef({ 
    forward: false, 
    backward: false, 
    left: false, 
    right: false, 
    drift: false 
  })

  // Indice del waypoint che il bot sta inseguendo
  const currentWPIndex = useRef(0)
  
  // Variabili temporanee per calcoli vettoriali (evita Garbage Collection)
  const tempPos = new Vector3()
  const tempTarget = new Vector3()
  const tempDir = new Vector3()
  const tempForward = new Vector3()

  useFrame(() => {
    if (!isBot || !rigidBodyRef.current || !waypoints || waypoints.length === 0) return

    // 1. Dove sono?
    const rbPos = rigidBodyRef.current.translation()
    tempPos.set(rbPos.x, rbPos.y, rbPos.z)

    // 2. Qual è il mio obiettivo?
    let target = waypoints[currentWPIndex.current]
    
    // Distanza dal target (ignoriamo l'altezza Y per semplicità di guida)
    const distanceToTarget = MathUtils.euclideanModulo(
      tempPos.x - target.x + (tempPos.z - target.z), 2
    ) // Approssimazione veloce, meglio usare distanceToSquared in 2D

    const dist = Math.sqrt(
        Math.pow(tempPos.x - target.x, 2) + Math.pow(tempPos.z - target.z, 2)
    )

    // 3. Se sono vicino al target, passo al successivo
    // Threshold di 4 o 5 unità funziona bene per un kart size 1
    if (dist < 6.0) {
      currentWPIndex.current = (currentWPIndex.current + 1) % waypoints.length
      target = waypoints[currentWPIndex.current]
    }

    // 4. Calcolo Sterzata
    // Vettore verso il target
    tempTarget.copy(target).sub(tempPos).normalize()
    
    // Vettore "avanti" del kart (ottenuto dalla rotazione del Rigidbody)
    const rotation = rigidBodyRef.current.rotation()
    // Convertiamo quaternione rapier in vettore forward
    // Un modo semplice se hai accesso alla rotazione attuale come ref nel componente padre
    // Ma qui calcoliamolo dai velociy o dalla rotazione fisica:
    const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    tempForward.set(0, 0, -1).applyQuaternion(q).normalize()

    // Prodotto vettoriale (Cross Product) per capire se il target è a destra o sinistra
    // Y positivo = Target a sinistra, Y negativo = Target a destra
    const cross = new Vector3().crossVectors(tempForward, tempTarget)
    
    // Prodotto scalare (Dot Product) per capire se il target è davanti o dietro
    const dot = tempForward.dot(tempTarget)

    // Logica Input
    const steerThreshold = 0.1 // Sensibilità

    controls.current.forward = true // I bot accelerano sempre (puoi aggiungere logica frenata)
    controls.current.backward = false
    
    // Gestione Sterzo
    if (cross.y > steerThreshold) {
        controls.current.left = true
        controls.current.right = false
    } else if (cross.y < -steerThreshold) {
        controls.current.left = false
        controls.current.right = true
    } else {
        controls.current.left = false
        controls.current.right = false
    }

    // Gestione Drift
    // Se la curva è stretta (dot product basso significa che non stiamo guardando il target)
    // E dobbiamo sterzare molto, attiviamo il drift
    if (dot < 0.8 && (controls.current.left || controls.current.right)) {
        controls.current.drift = true
    } else {
        controls.current.drift = false
    }
    
    // Respawn o retromarcia se bloccato (logica opzionale avanzata)
  })

  return controls
}