import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber' // Aggiunto useThree
import { useSphere } from '@react-three/cannon'
import { Vector3, MathUtils, Raycaster } from 'three' // Aggiunto Raycaster
import { useControls } from '../hooks/useControls'
import gsap from 'gsap'

const SETTINGS = {
  maxSpeed: 30,
  acceleration: 0.8,
  turnSpeed: 1,
  driftTurnSpeed: 1.8, 
  driftGrip: 0.02, 
  boostStrength: 20, // Forza del boost
  boostDuration: 60, // Durata in frame (circa 1 secondo)
}

export function SimpleKart() {
  const { scene } = useThree() // Ci serve la scena per il Raycaster
  const controls = useControls()
  
  // STATO
  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(0) 
  const driftVector = useRef(new Vector3(0, 0, 0))
  const velocity = useRef([0, 0, 0])
  const position = useRef([0, 0, 0])

  // NUOVI REFS PER IL GROUND CHECK E BOOST
  const isGrounded = useRef(false)
  const raycaster = useRef(new Raycaster())
  const wasDrifting = useRef(false) // Per rilevare il rilascio del tasto
  const pendingBoost = useRef(false) // Se hai rilasciato in aria
  const boostTime = useRef(0) // Timer del boost

  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // REFS VISIVI
  const visualGroupRef = useRef() 
  const frontLeft = useRef()
  const frontRight = useRef()
  const backLeft = useRef()
  const backRight = useRef()

  // FISICA
  const [chassisRef, api] = useSphere(() => ({
    mass: 500, 
    position: [0, 5, 0], 
    args: [1], 
    fixedRotation: true, 
    linearDamping: 0.1, // Damping basso per cadere bene
    material: { friction: 0.0, restitution: 0 } 
  }))

  useEffect(() => api.position.subscribe((p) => (position.current = p)), [api.position])
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity])

  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    gsap.to(jumpOffset.current, {
      y: 0.6,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      onComplete: () => { isJumping.current = false }
    })
  }

  // Funzione per attivare il boost
  const activateBoost = () => {
    boostTime.current = SETTINGS.boostDuration
    pendingBoost.current = false
    console.log("BOOST ATTIVATO!")
  }

  useFrame((state, delta) => {
    const { forward, backward, left, right, drift } = controls.current
    
    // --- 1. RAYCASTER GROUND CHECK ---
    // Lanciamo un raggio dal centro del kart verso il basso
    const origin = new Vector3(position.current[0], position.current[1], position.current[2])
    const direction = new Vector3(0, -1, 0)
    raycaster.current.set(origin, direction)

    // Controlliamo le collisioni con la scena
    // Filtriamo: vogliamo colpire qualcosa che NON sia il kart stesso
    // Nota: in un progetto grande userei i Layers, qui filtriamo per ID se necessario o assumiamo che il kart sia vuoto dentro
    const hits = raycaster.current.intersectObjects(scene.children, true)
    
    // Cerchiamo il primo oggetto colpito che non faccia parte del nostro gruppo visivo
    const groundHit = hits.find(hit => {
        // Ignora oggetti che sono dentro il nostro gruppo visivo (ruote, telaio, ecc)
        let obj = hit.object
        while(obj) {
            if (obj.uuid === visualGroupRef.current?.uuid) return false
            obj = obj.parent
        }
        return true
    })

    // Se la distanza è < 1.3 (Raggio sfera 1.0 + 0.3 margine), siamo a terra
    const wasGrounded = isGrounded.current
    isGrounded.current = groundHit && groundHit.distance < 1.3

    // --- 2. LOGICA RILASCIO DRIFT & PENDING BOOST ---
    
    // Rileviamo se l'utente ha APPENA rilasciato il drift
    if (wasDrifting.current && !drift) {
        if (isGrounded.current) {
            // Se siamo a terra, BOOST SUBITO
            activateBoost()
        } else {
            // Se siamo in aria, mettiamo in coda il boost
            pendingBoost.current = true
            console.log("Boost in coda... aspetto atterraggio")
        }
    }
    wasDrifting.current = drift // Aggiorna stato precedente

    // Se avevamo un boost in sospeso e siamo atterrati ORA
    if (pendingBoost.current && isGrounded.current && !wasGrounded) {
        activateBoost()
    }

    // --- 3. GESTIONE HOP E INIZIO DRIFT ---
    // Il saltino si può fare solo se siamo a terra
    if (drift && !isJumping.current && driftDirection.current === 0 && (left || right) && isGrounded.current) {
        performHop()
        driftDirection.current = left ? 1 : -1
        
        // Piccolo salto fisico reale per staccarsi da terra
        api.velocity.set(velocity.current[0], 5, velocity.current[2])
    }
    
    if (!drift || Math.abs(speed.current) < 1) {
      driftDirection.current = 0
    }

    // --- 4. ACCELERAZIONE E BOOST ---
    
    // Calcoliamo la velocità massima attuale (base + boost)
    let currentMaxSpeed = SETTINGS.maxSpeed
    let acceleration = SETTINGS.acceleration

    // Se il boost è attivo
    if (boostTime.current > 0) {
        currentMaxSpeed += SETTINGS.boostStrength
        acceleration *= 2 // Accelera molto più in fretta col boost
        boostTime.current -= 1 // Decrementa timer
    }

    const topSpeed = driftDirection.current !== 0 ? currentMaxSpeed + 5 : currentMaxSpeed
    let targetSpeed = 0
    if (forward) targetSpeed = topSpeed
    if (backward) targetSpeed = -topSpeed / 2
    
    speed.current = MathUtils.damp(speed.current, targetSpeed, acceleration, delta)

    // --- 5. STERZATA ---
    let turnFactor = 0
    if (driftDirection.current !== 0) {
      const isLeft = driftDirection.current === 1
      if (isLeft) turnFactor = left ? SETTINGS.driftTurnSpeed * 1.5 : (right ? SETTINGS.driftTurnSpeed * 0.1 : SETTINGS.driftTurnSpeed)
      else turnFactor = right ? -SETTINGS.driftTurnSpeed * 1.5 : (left ? -SETTINGS.driftTurnSpeed * 0.1 : -SETTINGS.driftTurnSpeed)
    } else {
      if (Math.abs(speed.current) > 0.5) {
         if (left) turnFactor = SETTINGS.turnSpeed
         if (right) turnFactor = -SETTINGS.turnSpeed
         if (backward) turnFactor *= -1
      }
    }
    rotation.current += turnFactor * delta

    // --- 6. MOVIMENTO ---
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const finalVelocity = new Vector3()

    if (driftDirection.current !== 0) {
        // Se siamo in aria, riduciamo drasticamente il controllo (opzionale, per realismo)
        const airControl = isGrounded.current ? 1 : 0.1
        driftVector.current.lerp(forwardVector, SETTINGS.driftGrip * 60 * delta * airControl)
        finalVelocity.copy(driftVector.current).multiplyScalar(speed.current)
    } else {
        driftVector.current.copy(forwardVector)
        finalVelocity.copy(forwardVector).multiplyScalar(speed.current)
    }

    api.velocity.set(finalVelocity.x, velocity.current[1], finalVelocity.z)
    api.rotation.set(0, rotation.current, 0)
    api.angularVelocity.set(0, 0, 0) 

    // --- VISUALS ---
    if (visualGroupRef.current) {
        // Usiamo jumpOffset per l'animazione, MA aggiungiamo un feedback visivo se siamo in Boost
        const boostShake = boostTime.current > 0 ? (Math.random() - 0.5) * 0.1 : 0
        
        visualGroupRef.current.position.y = -1 + jumpOffset.current.y + boostShake
        
        let targetTilt = 0
        if (driftDirection.current !== 0) targetTilt = driftDirection.current === 1 ? -0.6 : 0.6
        else targetTilt = (left ? -0.2 : 0) + (right ? 0.2 : 0)
        
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
        const wheelie = (forward && Math.abs(speed.current) < 10 && Math.abs(speed.current) > 1) ? -0.15 : 0
        visualGroupRef.current.rotation.x = MathUtils.damp(visualGroupRef.current.rotation.x, wheelie, 3, delta)
    }

    // Camera e Ruote (codice invariato)
    const camDist = 9
    const camHeight = 4.5
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const camX = position.current[0] + backVector.x * camDist
    const camZ = position.current[2] + backVector.z * camDist
    state.camera.position.lerp(new Vector3(camX, position.current[1] + camHeight, camZ), 0.15)
    state.camera.lookAt(position.current[0], position.current[1] + 1.5, position.current[2])

    const wheelRot = speed.current * delta * 0.5
    ;[frontLeft, frontRight, backLeft, backRight].forEach(ref => { if(ref.current) ref.current.rotation.x -= wheelRot })
    const steerVisual = (left ? 0.5 : 0) + (right ? -0.5 : 0)
    if(frontLeft.current) frontLeft.current.rotation.y = steerVisual
    if(frontRight.current) frontRight.current.rotation.y = steerVisual
  })

  return (
    <group ref={chassisRef}>
      {/* Aggiungiamo userData per aiutare il raycaster a ignorare questo gruppo */}
      <group ref={visualGroupRef} position={[0, -1, 0]} userData={{ isKart: true }}>
          {/* TELAIO */}
          <mesh castShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[1, 0.5, 2]} />
            {/* Colore cambia se siamo in boost */}
            <meshStandardMaterial color={driftDirection.current !== 0 ? "#ff9900" : (boostTime.current > 0 ? "cyan" : "red")} />
          </mesh>
          <mesh position={[0, 0.5, 0.8]}>
            <boxGeometry args={[1.2, 0.1, 0.4]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0, 0.5, 1.1]}>
             <boxGeometry args={[0.5, 0.5, 0.5]} />
             <meshStandardMaterial color="silver" />
          </mesh>
          <WheelPosition position={[-0.6, 0, -0.8]} ref={frontLeft} />
          <WheelPosition position={[0.6, 0, -0.8]} ref={frontRight} />
          <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft} />
          <WheelPosition position={[0.6, 0, 0.8]} ref={backRight} />
      </group>
    </group>
  )
}

const WheelPosition = React.forwardRef(({ position }, ref) => {
  return (
    <group position={position} ref={ref}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>
    </group>
  )
})