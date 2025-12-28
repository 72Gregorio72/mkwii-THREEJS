import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
// Alias per evitare conflitti con i tuoi controlli di gioco
import { useControls as useGameControls } from '../hooks/useControls' 
import { useControls as useLeva, Leva } from 'leva'
import { Sparkles, Html } from '@react-three/drei' 
import gsap from 'gsap'

// --- 1. IMPORTA I MODELLI REALI ---
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'

const KART_SIZE = 1 
const PHYSICS_RADIUS = 1.2 

const SETTINGS = {
  maxSpeed: 50,
  maxTurboLimit: 90,       
  acceleration: 0.25,       
  deceleration: 2.0,       
  turnSpeed: 0.9,
  driftTurnSpeed: 0.9, 
  driftGrip: 0.02, 
  boostStrength: 0,        
  boostDuration: 60,       
  jumpForce: 1.5,          
  driftLevel1Time: 1.5,    
  driftMinSpeed: 10,       
  slideOutForce: 0.3,
}

const START_POS = [-200, 10, 270] 
const cBlue = new Color("#00aeff") 
const cRed = new Color("#ff3300")  

export function OutsideDriftKart({ characterConfig, vehicleConfig }) {
  const { scene } = useThree()
  const controls = useGameControls() // I tuoi controlli (WASD/Gamepad)
  
  // --- CONFIGURAZIONE DEBUG & CAMERA ---
  const DEBUG_MODE = true; // <--- IMPOSTA SU FALSE PER NASCONDERE IL PANNELLO

  // Configuriamo i parametri della camera con Leva
  const camConfig = useLeva('Camera Settings', {
    distance: { value: 7.0, min: 2, max: 20, step: 0.1 },
    height: { value: 3.5, min: 1, max: 10, step: 0.1 },
    lookAtHeight: { value: 1.0, min: -2, max: 5, step: 0.1 },
    stiffness: { value: 0.15, min: 0.01, max: 1, step: 0.01 }, // 0.01 = lento, 1.0 = istantaneo
    fovBase: { value: 75, min: 40, max: 120 },
    fovMax: { value: 90, min: 40, max: 140 },
  })
  
  const rigidBody = useRef()
  const speedUiRef = useRef() 

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
  const driftTime = useRef(0)      
  const driftLevel = useRef(0)     
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  const driftHopLocked = useRef(false)
  const driftEngageWindow = useRef(false) 
  
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // REFS VISUALI
  const visualGroupRef = useRef() 
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    
    gsap.to(jumpOffset.current, {
      y: 0.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out",
      onComplete: () => { isJumping.current = false }
    })
  }

  const activateBoost = (level) => {
    const durationMult = level === 2 ? 1.5 : 1.0
    boostTime.current = SETTINGS.boostDuration * durationMult
    pendingBoost.current = false
  }

  useFrame((state, delta) => {
    if (!rigidBody.current) return;

    // --- UI ---
    if (speedUiRef.current) {
        const kmh = Math.abs(Math.round(speed.current * 1.5)) 
        speedUiRef.current.innerText = `${kmh} km/h`
        const isOver = speed.current > SETTINGS.maxSpeed + 5
        speedUiRef.current.style.color = isOver ? '#ff3300' : 'white'
        speedUiRef.current.style.transform = isOver ? `scale(1.1)` : `scale(1)`
    }

    // 1. LEGGI DATI
    const rbPos = rigidBody.current.translation();
    const rbVel = rigidBody.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    currentVelocity.current.set(rbVel.x, rbVel.y, rbVel.z);

    const { forward, backward, left, right, drift } = controls.current
    
    // 2. GROUND CHECK
    const origin = currentPosition.current.clone()
    origin.y += 0.1 
    raycaster.current.set(origin, new Vector3(0, -1, 0))
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
        if (groundHit) groundDistance = groundHit.distance - 0.1 - PHYSICS_RADIUS
    }
    isGrounded.current = groundDistance < 0.6

    // --- 3. LOGICA DRIFT & HOP ---
    if (!drift) {
        driftHopLocked.current = false
        driftEngageWindow.current = false 
        if (driftDirection.current !== 0) {
            if (driftLevel.current > 0) {
                if (isGrounded.current) activateBoost(driftLevel.current);
                else pendingBoost.current = true;
            }
            driftDirection.current = 0;
            driftTime.current = 0;
            driftLevel.current = 0;
        }
    } else {
        if (isGrounded.current && !isJumping.current && driftDirection.current === 0) {
            driftEngageWindow.current = false;
        }
    }

    if (drift && !driftHopLocked.current && isGrounded.current && !isJumping.current) {
        driftHopLocked.current = true; 
        driftEngageWindow.current = true; 
        performHop();
        rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true);
    }

    if (drift) {
        if (driftDirection.current === 0 && driftEngageWindow.current) {
            const rightVector = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
            if (left) {
                driftDirection.current = 1;
                driftVector.current.add(rightVector.multiplyScalar(SETTINGS.slideOutForce))
            } 
            else if (right) {
                driftDirection.current = -1;
                driftVector.current.add(rightVector.multiplyScalar(-SETTINGS.slideOutForce))
            }
        }
        if (driftDirection.current !== 0 && isGrounded.current) {
             driftTime.current += delta;
             driftLevel.current = driftTime.current > SETTINGS.driftLevel1Time ? 1 : 0;
        }
    } else {
        if (pendingBoost.current && isGrounded.current) activateBoost(1);
    }

    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // 4. MOTORE
    const isBoosting = boostTime.current > 0
    if (isBoosting) boostTime.current -= 1

    const isDrifting = driftDirection.current !== 0
    let currentSpeedLimit = SETTINGS.maxSpeed
    if (isBoosting) currentSpeedLimit = SETTINGS.maxTurboLimit
    else if (isDrifting) currentSpeedLimit += 5 

    let targetSpeed = 0
    if (forward) targetSpeed = currentSpeedLimit
    if (backward) targetSpeed = -currentSpeedLimit * 0.5
    
    const isOverspeeding = speed.current > (isDrifting ? SETTINGS.maxSpeed + 5 : SETTINGS.maxSpeed)
    if (forward && !isBoosting && isOverspeeding) {
        speed.current = MathUtils.damp(speed.current, SETTINGS.maxSpeed, SETTINGS.deceleration, delta)
    } else {
        let currentAccel = SETTINGS.acceleration
        if (isBoosting) currentAccel *= 2.5
        else if (!forward && !backward) currentAccel = SETTINGS.deceleration 
        
        speed.current = MathUtils.damp(speed.current, targetSpeed, currentAccel, delta)
    }

    // 5. STERZO
    let turnFactor = 0
    if (isDrifting) {
        const isLeftDrift = driftDirection.current === 1
        if (isLeftDrift) turnFactor = left ? SETTINGS.driftTurnSpeed * 1.5 : (right ? SETTINGS.driftTurnSpeed * 0.1 : SETTINGS.driftTurnSpeed)
        else turnFactor = right ? -SETTINGS.driftTurnSpeed * 1.5 : (left ? -SETTINGS.driftTurnSpeed * 0.1 : -SETTINGS.driftTurnSpeed)
    } else {
        if (Math.abs(speed.current) > 1.0) {
            const reverseFactor = speed.current < 0 ? -1 : 1
            if (left) turnFactor = SETTINGS.turnSpeed * reverseFactor
            if (right) turnFactor = -SETTINGS.turnSpeed * reverseFactor
        }
    }
    rotation.current += turnFactor * delta

    // 6. FISICA
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.15
    const airControl = isGrounded.current ? 1 : 0.5 

    driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
    const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)

    let newY = rbVel.y
    if (!isGrounded.current && !isJumping.current) newY -= 20 * delta 
    else if (isJumping.current) newY -= 15 * delta
    
    if (groundDistance > 0.05 && groundDistance < 0.8 && !isJumping.current && newY > 0) {
        newY = -5 
    }

    rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // VISUAL UPDATE
    if (visualGroupRef.current) {
        const speedShake = speed.current > SETTINGS.maxSpeed + 5 ? (Math.random() - 0.5) * 0.05 : 0
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y + speedShake
        visualGroupRef.current.rotation.z = 0 
    }

    // --- NUOVA LOGICA CAMERA (Corretta e controllata da Leva) ---
    
    // 1. Definiamo l'offset ideale (relativo al retro del kart)
    const idealOffset = new Vector3(0, camConfig.height, camConfig.distance)
    
    // 2. Ruotiamo l'offset in base alla rotazione attuale del kart
    idealOffset.applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    
    // 3. Posizione Target = Posizione Kart + Offset Ruotato
    const desiredCamPos = new Vector3().copy(currentPosition.current).add(idealOffset)

    // 4. Interpolazione fluida verso la posizione target
    state.camera.position.lerp(desiredCamPos, camConfig.stiffness)

    // 5. LookAt logic: Guardiamo il kart (più un offset in altezza per non guardare il pavimento)
    const targetLookAt = new Vector3(
        currentPosition.current.x,
        currentPosition.current.y + camConfig.lookAtHeight,
        currentPosition.current.z
    )
    
    cameraTarget.current.lerp(targetLookAt, camConfig.stiffness * 1.5) // Un po' più veloce del movimento
    state.camera.lookAt(cameraTarget.current)
    
    // 6. FOV dinamico
    const speedRatio = Math.min(Math.abs(speed.current) / SETTINGS.maxTurboLimit, 1)
    const targetFov = MathUtils.lerp(camConfig.fovBase, camConfig.fovMax, speedRatio)
    state.camera.fov = MathUtils.damp(state.camera.fov, targetFov, 2.0, delta)
    state.camera.updateProjectionMatrix()
  })

  // Calcolo dati sterzo per passare al componente Character
  const steerVal = (controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)

  return (
    <RigidBody ref={rigidBody} position={START_POS} mass={100} linearDamping={0.5} angularDamping={0.5} colliders={false} type="dynamic" ccd={true} restitution={0}>
      
      {/* !!! RIMOSSO <Leva /> DA QUI !!! 
         Il pannello apparirà comunque grazie all'hook useLeva.
         Non mettere mai componenti HTML/UI nudi dentro il Canvas 3D.
      */}

      <BallCollider args={[PHYSICS_RADIUS]} material={{ friction: 0.0, restitution: 0 }} />
      
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span ref={speedUiRef}>0 km/h</span>
            <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>SPACE TO HOP/DRIFT</div>
        </div>
      </Html>

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
            {/* ... tutto il resto dei modelli rimane identico ... */}
            <VehicleModel 
              vehicleConfig={vehicleConfig.modelConfig} 
              scale={1}
              rotation={[0, Math.PI, 0]} 
              position={[0, 0, 0]}
              steer={steerVal}
              drift={driftDirection.current}
              speed={speed.current}
              isBike={true}
            />
            
            <group rotation={[0, Math.PI, 0]}>
              <RacerModel 
                  characterConfig={characterConfig}
                  vehicleConfig={vehicleConfig} 
                  steer={steerVal} 
                  drift={driftDirection.current} 
                  speed={speed.current}
                  isKart={true}
                key={vehicleConfig.name + "_racer"}
              />
            </group>
  
            <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft}><DriftSparks ref={leftSparksRef} /></WheelPosition>
            <WheelPosition position={[0.6, 0, 0.8]} ref={backRight}><DriftSparks ref={rightSparksRef} /></WheelPosition>
      </group>
    </RigidBody>
  )
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))
const DriftSparks = React.forwardRef((props, ref) => (
    <group position={[0, 0.2, 1]} ref={ref} visible={false}>
        <Sparkles count={10} scale={[0.6, 0.3, 1.5]} size={30} speed={1.2} opacity={1} color={"#0066FF"} noise={0.1}/>
    </group>
))

function updateSparksColor(level, leftRef, rightRef) {
    if (!leftRef || !rightRef) return
    const show = level > 0 
    leftRef.visible = show
    rightRef.visible = show
    if (show) {
        let targetColor = level === 2 ? cRed : cBlue
        leftRef.traverse((c) => { if(c.isMesh) { c.material.color.lerp(targetColor, 0.4); c.material.emissive = targetColor } })
        rightRef.traverse((c) => { if(c.isMesh) { c.material.color.lerp(targetColor, 0.4); c.material.emissive = targetColor } })
    }
}