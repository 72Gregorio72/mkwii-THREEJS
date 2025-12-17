import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler } from 'three' 
import { useControls } from '../hooks/useControls' 
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' 
import { KartModel } from '../models/Flame_flyer' 

const KART_SIZE = 1.0 

const SETTINGS = {
  maxSpeed: 30,
  acceleration: 0.8,
  turnSpeed: 2.2,
  driftTurnSpeed: 2.8, 
  driftGrip: 0.02, 
  boostStrength: 20, 
  boostDuration: 60, 
}

const START_POS = [0, 10, 0] // Abbassato start pos per test

export function SimpleKart() {
  const { scene } = useThree()
  const controls = useControls()
  
  const rigidBody = useRef()

  // STATO
  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(0) 
  const driftVector = useRef(new Vector3(0, 0, 0))
  
  const currentVelocity = useRef(new Vector3())
  const currentPosition = useRef(new Vector3())

  // NUOVO: Ref per stabilizzare la camera
  const cameraTarget = useRef(new Vector3(0, 0, 0))

  const isGrounded = useRef(false)
  const raycaster = useRef(new Raycaster())
  const wasDrifting = useRef(false)
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  const visualGroupRef = useRef() 
  const frontLeft = useRef()
  const frontRight = useRef()
  const backLeft = useRef()
  const backRight = useRef()

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
    if (!rigidBody.current) return;

    // 1. LEGGI DATI
    const rbPos = rigidBody.current.translation();
    const rbVel = rigidBody.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    currentVelocity.current.set(rbVel.x, rbVel.y, rbVel.z);

    const { forward, backward, left, right, drift } = controls.current
    
    // 2. GROUND CHECK
    const origin = currentPosition.current.clone()
    const direction = new Vector3(0, -1, 0)
    raycaster.current.set(origin, direction)

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
        isGrounded.current = groundHit && groundHit.distance < (1.3 * KART_SIZE)
    }

    // 3. LOGICA BOOST
    if (wasDrifting.current && !drift) {
        if (isGrounded.current) activateBoost()
        else pendingBoost.current = true
    }
    wasDrifting.current = drift 
    if (pendingBoost.current && isGrounded.current) activateBoost()

    // 4. DRIFT HOP
    if (drift && !isJumping.current && driftDirection.current === 0 && (left || right) && isGrounded.current) {
        performHop()
        driftDirection.current = left ? 1 : -1
        rigidBody.current.setLinvel({ x: rbVel.x, y: 5, z: rbVel.z }, true)
    }
    if (!drift || Math.abs(speed.current) < 1) driftDirection.current = 0

    // 5. MOTORE
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

    // 6. STERZO
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

    // 7. CALCOLO VELOCITÀ
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

    // 8. APPLICA FISICA
    rigidBody.current.setLinvel({ 
        x: finalVelocity.x, 
        y: rbVel.y, 
        z: finalVelocity.z 
    }, true)

    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // VISUAL UPDATE
    if (visualGroupRef.current) {
        const boostShake = boostTime.current > 0 ? (Math.random() - 0.5) * 0.1 : 0
        visualGroupRef.current.position.y = (-1 * KART_SIZE) + jumpOffset.current.y + boostShake
        
        let targetTilt = 0
        if (driftDirection.current !== 0) targetTilt = driftDirection.current === 1 ? -0.6 : 0.6
        else targetTilt = (left ? -0.2 : 0) + (right ? 0.2 : 0)
        
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
        const wheelie = (forward && Math.abs(speed.current) < 10 && Math.abs(speed.current) > 1) ? -0.15 : 0
        visualGroupRef.current.rotation.x = MathUtils.damp(visualGroupRef.current.rotation.x, wheelie, 3, delta)
    }

    // --- CAMERA FIX: SMOOTH FOLLOW ---
    const camDist = 9 
    const camHeight = 4.5
    
    // Posizione DESIDERATA della camera (dietro al kart)
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const desiredCamPos = new Vector3(
        currentPosition.current.x + backVector.x * camDist,
        currentPosition.current.y + camHeight,
        currentPosition.current.z + backVector.z * camDist
    )

    // Lerp Posizione Camera (0.1 = più liscio/lento, 0.2 = più reattivo)
    state.camera.position.lerp(desiredCamPos, 0.12)

    // TARGET SMOOTH: Invece di guardare il kart (che vibra), guardiamo un punto che lo segue
    const targetPoint = new Vector3(
        currentPosition.current.x, 
        currentPosition.current.y + 1.5, 
        currentPosition.current.z
    )
    // Lerp del punto guardato (questo rimuove l'effetto terremoto rotazionale)
    cameraTarget.current.lerp(targetPoint, 0.2)

    state.camera.lookAt(cameraTarget.current)
    state.camera.far = 10000
    state.camera.near = 0.1
    state.camera.updateProjectionMatrix()

    // RUOTE
    const wheelRot = speed.current * delta * 0.5
    ;[frontLeft, frontRight, backLeft, backRight].forEach(ref => { if(ref.current) ref.current.rotation.x -= wheelRot })
  })

  return (
    <RigidBody 
        ref={rigidBody} 
        position={START_POS} 
        mass={500}
        linearDamping={0.5} // Aumentato damping per ridurre vibrazioni fisiche
        angularDamping={0.5}
        colliders={false} 
        type="dynamic"
        ccd={true} // FIX: Continuous Collision Detection (evita che attraversi il pavimento)
    >
      <BallCollider args={[1 * KART_SIZE]} material={{ friction: 0.0, restitution: 0 }} />
      
      <group 
        ref={visualGroupRef} 
        position={[0, -1 * KART_SIZE, 0]} 
        scale={[KART_SIZE, KART_SIZE, KART_SIZE]}
      >
          <KartModel 
            scale={1} 
            rotation={[0, Math.PI, 0]} 
            position={[0, 0.5, 0]} 
        />
          <FunkyKong 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI, 0]} 
            steer={(controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)}
            drift={driftDirection.current}
            speed={speed.current}
          />
          <WheelPosition position={[-0.6, 0, -0.8]} ref={frontLeft} />
          <WheelPosition position={[0.6, 0, -0.8]} ref={frontRight} />
          <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft} />
          <WheelPosition position={[0.6, 0, 0.8]} ref={backRight} />
      </group>
    </RigidBody>
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