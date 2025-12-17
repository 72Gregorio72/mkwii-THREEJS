import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import { Vector3, MathUtils, Raycaster } from 'three'
import { useControls } from '../hooks/useControls' // Assicurati che il percorso sia giusto
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' // Importiamo il tuo nuovo modello
import { KartModel } from '../models/Flame_flyer' // Importiamo il modello del kart

const SETTINGS = {
  maxSpeed: 30,
  acceleration: 0.8,
  turnSpeed: 2.2,
  driftTurnSpeed: 2.8, 
  driftGrip: 0.02, 
  boostStrength: 20, 
  boostDuration: 60, 
}

const START_POS = [-203.00, 15, 291.58]

export function SimpleKart() {
  const { scene } = useThree()
  const controls = useControls()
  
  // STATO
  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(0) 
  const driftVector = useRef(new Vector3(0, 0, 0))
  const velocity = useRef([0, 0, 0])
  const position = useRef([0, 0, 0])

  // REFS VARI
  const isGrounded = useRef(false)
  const raycaster = useRef(new Raycaster())
  const wasDrifting = useRef(false)
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)

  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // REFS VISIVI
  const visualGroupRef = useRef() 
  const frontLeft = useRef()
  const frontRight = useRef()
  const backLeft = useRef()
  const backRight = useRef()

  // --- FISICA (Importante: Definiamo chassisRef qui!) ---
  const [chassisRef, api] = useSphere(() => ({
    mass: 500, 
    position: START_POS, 
    args: [1], 
    fixedRotation: true, 
    linearDamping: 0.1, 
    material: { friction: 0.0, restitution: 0 } 
  }))

  useEffect(() => {
    // 2. IMPOSTA LA ROTAZIONE INIZIALE
    // 0.07 è l'angolo che hai trovato.
    // L'ordine è (X, Y, Z), noi ruotiamo su Y (l'asse verticale).
    api.velocity.set(0, 0, 0)
    api.angularVelocity.set(0, 0, 0)
    api.rotation.set(0, 0.07, 0) 
}, [])

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

  const activateBoost = () => {
    boostTime.current = SETTINGS.boostDuration
    pendingBoost.current = false
    console.log("BOOST ATTIVATO!")
  }

  useFrame((state, delta) => {
    const { forward, backward, left, right, drift } = controls.current
    
    // 1. GROUND CHECK
    const origin = new Vector3(position.current[0], position.current[1], position.current[2])
    const direction = new Vector3(0, -1, 0)
    raycaster.current.set(origin, direction)

    // Nota: Filtriamo per evitare errori se la scena non è ancora pronta
    if (scene) {
        const hits = raycaster.current.intersectObjects(scene.children, true)
        const groundHit = hits.find(hit => {
            let obj = hit.object
            while(obj) {
                if (obj.uuid === visualGroupRef.current?.uuid) return false
                obj = obj.parent
            }
            return true
        })
        isGrounded.current = groundHit && groundHit.distance < 1.3
    }

    // 2. LOGICA BOOST
    if (wasDrifting.current && !drift) {
        if (isGrounded.current) activateBoost()
        else pendingBoost.current = true
    }
    wasDrifting.current = drift 
    if (pendingBoost.current && isGrounded.current) activateBoost()

    // 3. DRIFT HOP
    if (drift && !isJumping.current && driftDirection.current === 0 && (left || right) && isGrounded.current) {
        performHop()
        driftDirection.current = left ? 1 : -1
        api.velocity.set(velocity.current[0], 5, velocity.current[2])
    }
    if (!drift || Math.abs(speed.current) < 1) driftDirection.current = 0

    // 4. MOTORE
    let currentMaxSpeed = SETTINGS.maxSpeed
    let acceleration = SETTINGS.acceleration
    if (boostTime.current > 0) {
        currentMaxSpeed += SETTINGS.boostStrength
        acceleration *= 2
        boostTime.current -= 1
    }

    const topSpeed = driftDirection.current !== 0 ? currentMaxSpeed + 5 : currentMaxSpeed
    let targetSpeed = 0
    if (forward) targetSpeed = topSpeed
    if (backward) targetSpeed = -topSpeed / 2
    
    speed.current = MathUtils.damp(speed.current, targetSpeed, acceleration, delta)

    // 5. STERZO
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

    // 6. FISICA MOVIMENTO
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const finalVelocity = new Vector3()

    if (driftDirection.current !== 0) {
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

    // VISUAL UPDATE
    if (visualGroupRef.current) {
        const boostShake = boostTime.current > 0 ? (Math.random() - 0.5) * 0.1 : 0
        visualGroupRef.current.position.y = -1 + jumpOffset.current.y + boostShake
        
        let targetTilt = 0
        if (driftDirection.current !== 0) targetTilt = driftDirection.current === 1 ? -0.6 : 0.6
        else targetTilt = (left ? -0.2 : 0) + (right ? 0.2 : 0)
        
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
        const wheelie = (forward && Math.abs(speed.current) < 10 && Math.abs(speed.current) > 1) ? -0.15 : 0
        visualGroupRef.current.rotation.x = MathUtils.damp(visualGroupRef.current.rotation.x, wheelie, 3, delta)
    }

    // CAMERA
    const camDist = 9
    const camHeight = 4.5
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const camX = position.current[0] + backVector.x * camDist
    const camZ = position.current[2] + backVector.z * camDist
    state.camera.position.lerp(new Vector3(camX, position.current[1] + camHeight, camZ), 0.15)
    state.camera.lookAt(position.current[0], position.current[1] + 1.5, position.current[2])
	state.camera.far = 10000
	state.camera.near = 0.1
	state.camera.updateProjectionMatrix()

    // ANIMAZIONE RUOTE (Semplice rotazione)
    const wheelRot = speed.current * delta * 0.5
    ;[frontLeft, frontRight, backLeft, backRight].forEach(ref => { if(ref.current) ref.current.rotation.x -= wheelRot })
  })

  return (
    <group ref={chassisRef}>
      <group ref={visualGroupRef} position={[0, -1, 0]}>
          <KartModel 
			// Non serve più passare 'steer' perché il manubrio è fisso
			scale={1} // <--- SE È TROPPO GRANDE O PICCOLA, CAMBIA QUESTO NUMERO (es. 0.01 o 10)
			rotation={[0, Math.PI, 0]} // Ruota di 180° se guarda indietro
			position={[0, 0.5, 0]} 
		/>
          {/* IL TUO NUOVO MODELLO FUNKY KONG */}
          <FunkyKong 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI, 0]} // Ruota 180° se guarda indietro
            steer={(controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)}
            drift={driftDirection.current}
            speed={speed.current}
          />

          {/* RUOTE PROVVISORIE (Per capire dove tocca terra) */}
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
      </group>
    </group>
  )
})