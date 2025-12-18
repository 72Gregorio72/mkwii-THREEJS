import React, { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import { useControls } from '../hooks/useControls' 
import { Sparkles } from '@react-three/drei' 
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' 
import { KartModel } from '../models/Flame_flyer' 

// --- CONFIGURAZIONE DIMENSIONI ---
const KART_SIZE = 0.8        
const PHYSICS_RADIUS = 1.2   

// --- CONFIGURAZIONE FISICA ---
const SETTINGS = {
  maxSpeed: 60,
  acceleration: 0.8,
  turnSpeed: 0.8,
  driftTurnSpeed: 1.0, 
  driftGrip: 0.02, 
  
  boostStrength: 25,       
  boostDuration: 60,       
  
  jumpForce: 1.5,          
  driftLevel1Time: 1.5,    
}

const START_POS = [-200, 10, 270] 

// --- COLORI DRIFT ---
const cBlue = new Color("#00aeff") 
const cRed = new Color("#ff3300")  

export function SimpleKart() {
  const { scene } = useThree()
  const controls = useControls()
  
  const rigidBody = useRef()

  // STATO FISICA
  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(0) 
  const driftVector = useRef(new Vector3(0, 0, 0))
  
  const currentVelocity = useRef(new Vector3())
  const currentPosition = useRef(new Vector3())
  const cameraTarget = useRef(new Vector3(0, 0, 0))

  const isGrounded = useRef(false)
  const raycaster = useRef(new Raycaster())
  
  // STATO DRIFT & BOOST
  const wasDrifting = useRef(false)
  const driftTime = useRef(0)      
  const driftLevel = useRef(0)     
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // REFS VISUALI
  const visualGroupRef = useRef() 
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  // --- ANIMAZIONE SALTO (HOP) ---
  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    gsap.to(jumpOffset.current, {
      y: 0.3,             
      duration: 0.1,      
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      onComplete: () => { isJumping.current = false }
    })
  }

  // --- ATTIVAZIONE BOOST ---
  const activateBoost = (level) => {
    const durationMult = level === 2 ? 1.5 : 1.0
    boostTime.current = SETTINGS.boostDuration * durationMult
    pendingBoost.current = false
    console.log(`BOOST ATTIVATO! Livello: ${level}`)
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
    const rayOriginOffset = 0.1
    origin.y += rayOriginOffset 
    const direction = new Vector3(0, -1, 0)
    raycaster.current.set(origin, direction)

    let groundDistance = Infinity
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
        if (groundHit) {
            groundDistance = groundHit.distance - rayOriginOffset - PHYSICS_RADIUS
        }
    }

    isGrounded.current = groundDistance < 0.6

    // 3. LOGICA DRIFT
    const isDrifting = drift && isGrounded.current && Math.abs(speed.current) > 10;

    if (isDrifting && driftDirection.current !== 0) {
        driftTime.current += delta;
        if (driftTime.current > SETTINGS.driftLevel1Time) {
            driftLevel.current = 1;
        } else {
            driftLevel.current = 0;
        }
    } else {
        if (wasDrifting.current && !drift) {
            if (driftLevel.current > 0) {
                if (isGrounded.current) activateBoost(driftLevel.current);
                else pendingBoost.current = true; 
            }
        }
        driftTime.current = 0;
        driftLevel.current = 0;
    }
    
    wasDrifting.current = drift;
    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);
    
    if (pendingBoost.current && isGrounded.current) {
        activateBoost(1); 
    }

    // 4. HOP
    if (drift && !isJumping.current && driftDirection.current === 0 && (left || right) && isGrounded.current) {
        performHop()
        driftDirection.current = left ? 1 : -1
        rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true)
    }
    if (!drift || Math.abs(speed.current) < 1) driftDirection.current = 0

    // 5. MOTORE & BOOST
    let currentMaxSpeed = SETTINGS.maxSpeed
    let acceleration = SETTINGS.acceleration
    
    if (boostTime.current > 0) {
        currentMaxSpeed += SETTINGS.boostStrength 
        acceleration *= 3.0                       
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

    // 7. MOVIMENTO
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const finalVelocity = new Vector3()

    if (driftDirection.current !== 0) {
        const airControl = isGrounded.current ? 1 : 0.2
        driftVector.current.lerp(forwardVector, SETTINGS.driftGrip * 60 * delta * airControl)
        finalVelocity.copy(driftVector.current).multiplyScalar(speed.current)
    } else {
        driftVector.current.copy(forwardVector)
        finalVelocity.copy(forwardVector).multiplyScalar(speed.current)
    }

    // --- 8. FIX GRAVITÀ & SNAP AVANZATO (Anti-Bump) ---
    let newY = rbVel.y
    
    // A. FILTRO DOSSI (Anti-Bump)
    // Se stiamo andando verso l'alto (newY > 0) e non stiamo saltando volontariamente:
    if (newY > 0 && !isJumping.current) {
        // SOGLIA DI TOLLERANZA: 3.0
        // Se la spinta in su è inferiore a 3 (dosso piccolo), la ignoriamo completamente (0).
        // Se è superiore a 3 (rampa vera), la lasciamo passare ma smorzata (0.5).
        if (newY < 3.0) { 
             newY = 0 
        } else {
             newY *= 0.5 
        }
    }

    // B. GRAVITÀ
    if (!isGrounded.current && !isJumping.current) {
        newY -= 9.81 * 4.0 * delta 
    } else if (isJumping.current) {
        newY -= 9.81 * 5.0 * delta 
    }

    // C. SNAP TO GROUND (Calamita Aggressiva)
    // Se siamo appena staccati da terra (floating), forziamo giù.
    const isFloating = groundDistance > 0.05 && groundDistance < 1.0
    if (isFloating && !isJumping.current) {
        // Se stiamo ancora salendo per inerzia dopo un dosso, uccidi la salita
        if (newY > 0) newY = 0; 
        // Spinta in giù aumentata a 10 (era 20) per incollare subito
        newY -= 10 * delta; 
    }

    rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

    // Rotazione
    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // --- VISUAL & CAMERA ---
    if (visualGroupRef.current) {
        const boostShake = boostTime.current > 0 ? (Math.random() - 0.5) * 0.1 : 0
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y + boostShake
        
        let targetTilt = 0
        if (driftDirection.current !== 0) targetTilt = driftDirection.current === 1 ? -0.6 : 0.6
        else targetTilt = (left ? -0.2 : 0) + (right ? 0.2 : 0)
        
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
        // const wheelie = (forward && Math.abs(speed.current) < 10 && Math.abs(speed.current) > 1) ? -0.15 : 0
        // visualGroupRef.current.rotation.x = MathUtils.damp(visualGroupRef.current.rotation.x, wheelie, 3, delta)
    }

    // Camera
    const camDist = 9
    const camHeight = 2.2
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const desiredCamPos = new Vector3(
        currentPosition.current.x + backVector.x * camDist,
        currentPosition.current.y + camHeight,
        currentPosition.current.z + backVector.z * camDist
    )
    state.camera.position.lerp(desiredCamPos, 0.12)
    const targetPoint = new Vector3(
        currentPosition.current.x, 
        currentPosition.current.y + 1.5, 
        currentPosition.current.z
    )
    cameraTarget.current.lerp(targetPoint, 0.2)
    state.camera.lookAt(cameraTarget.current)
    state.camera.far = 10000
    state.camera.near = 0.1
	state.camera.fov = 45
    state.camera.updateProjectionMatrix()
  })

  return (
    <RigidBody 
        ref={rigidBody} 
        position={START_POS} 
        mass={100} 
        linearDamping={0.5} 
        angularDamping={0.5}
        colliders={false} 
        type="dynamic"
        ccd={true} 
        restitution={0}
    >
      <BallCollider 
          args={[PHYSICS_RADIUS]} 
          material={{ friction: 0.0, restitution: 0 }} 
      />
      
      <group 
        ref={visualGroupRef} 
        position={[0, -PHYSICS_RADIUS, 0]} 
        scale={[KART_SIZE, KART_SIZE, KART_SIZE]}
      >
          <KartModel scale={1} rotation={[0, Math.PI, 0]} position={[0, 0.5, 0]} />
          <FunkyKong 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI, 0]} 
            steer={(controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)}
            drift={driftDirection.current}
            speed={speed.current}
          />
          
          <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft}>
              <DriftSparks ref={leftSparksRef} />
          </WheelPosition>
          
          <WheelPosition position={[0.6, 0, 0.8]} ref={backRight}>
              <DriftSparks ref={rightSparksRef} />
          </WheelPosition>
      </group>
    </RigidBody>
  )
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (
    <group position={position} ref={ref}>{children}</group>
))

const DriftSparks = React.forwardRef((props, ref) => {
    return (
        <group position={[0, 0.2, 1]} ref={ref} visible={false}>
            <Sparkles 
                count={10}
                scale={[0.6, 0.3, 1.5]}
                size={30}
                speed={1.2}
                opacity={1} 
                color={"#0066FF"}
                noise={0.1}
            />
        </group>
    )
})

function updateSparksColor(level, leftRef, rightRef) {
    if (!leftRef || !rightRef) return
    const show = level > 0 
    leftRef.visible = show
    rightRef.visible = show

    if (show) {
        let targetColor = level === 2 ? cRed : cBlue
        
        leftRef.traverse((child) => {
             if (child.isMesh && child.material) {
                 child.material.color.lerp(targetColor, 0.4)
                 if (child.material.emissive) {
                     child.material.emissive = targetColor
                     child.material.emissiveIntensity = 2
                 }
             } 
        })
        rightRef.traverse((child) => {
             if (child.isMesh && child.material) {
                 child.material.color.lerp(targetColor, 0.4)
                 if (child.material.emissive) {
                     child.material.emissive = targetColor
                     child.material.emissiveIntensity = 2
                 }
             } 
        })
    }
}