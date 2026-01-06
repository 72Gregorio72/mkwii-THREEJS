import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import { useControls } from '../hooks/useControls' 
import { Sparkles, Html } from '@react-three/drei' 
import gsap from 'gsap'

import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { useHitboxHandler } from '../utils/HitboxHandler'

const KART_SIZE = 1 
const PHYSICS_RADIUS = 1.2 
const VISUAL_OFFSET = 0; 

const SETTINGS = {
  maxSpeed: 50, 
  maxTurboLimit: 90, 
  acceleration: 0.25, 
  deceleration: 2.0,       
  turnSpeed: 0.9, 
  driftTurnSpeed: 0.6, 
  driftGrip: 0.02, 
  boostStrength: 0,        
  boostDuration: 60, 
  jumpForce: 1.5, 
  driftLevel1Time: 1.5, 
  driftMinSpeed: 10,       
}

const cBlue = new Color("#00aeff") 
const cRed = new Color("#ff3300")  

// AGGIUNGI trackRef ALLE PROPS
export function InsideDriftBike({ characterConfig, vehicleConfig, START_POS, onCheckpoint, trackRef }) {
  const { scene } = useThree()
  const controls = useControls()
  
  // --- Refs Fisica e Stato ---
  const rigidBody = useRef()
  const speedUiRef = useRef() 

  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(0) 
  const driftVector = useRef(new Vector3(0, 0, 0))
  const currentVelocity = useRef(new Vector3())
  const currentPosition = useRef(new Vector3())
  const cameraTarget = useRef(new Vector3(0, 0, 0))
  const isGrounded = useRef(false)
  
  const raycaster = useRef(new Raycaster()) 
  
  const driftTime = useRef(0)      
  const driftLevel = useRef(0)     
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  const driftHopLocked = useRef(false)
  const driftEngageWindow = useRef(false) 
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // --- Refs Visuali ---
  const visualGroupRef = useRef() 
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  if (!vehicleConfig || !characterConfig) return null;

  const { checkSurface } = useHitboxHandler({
    speed,
    boostTime,
    SETTINGS
  })

  // --- RESPAWN ASINCRONO ---
  const handleRespawn = () => {
      setTimeout(() => {
          if (!rigidBody.current) return;
          console.log("♻️ Safe Respawn Triggered");
          
          speed.current = 0;
          rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

          const pos = Array.isArray(START_POS) 
            ? { x: START_POS[0], y: START_POS[1], z: START_POS[2] }
            : { x: START_POS.x, y: START_POS.y, z: START_POS.z };

          rigidBody.current.setTranslation(pos, true);
      }, 0);
  };

  // --- CHECKPOINT ASINCRONO ---
  const handleCheckpointHit = (index) => {
      setTimeout(() => {
          if (onCheckpoint) {
              onCheckpoint(index);
          }
      }, 0);
  };

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

    // --- UI Update ---
    if (speedUiRef.current) {
        const kmh = Math.abs(Math.round(speed.current * 1.5)) 
        speedUiRef.current.innerText = `${kmh} km/h`
        const isOver = speed.current > SETTINGS.maxSpeed + 5
        speedUiRef.current.style.color = isOver ? '#ff3300' : 'white'
        speedUiRef.current.style.transform = isOver ? `scale(1.1)` : `scale(1)`
    }

    const { forward, backward, left, right, drift } = controls.current
    
    // Lettura stato fisico
    const rbPos = rigidBody.current.translation();
    const rbVel = rigidBody.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    currentVelocity.current.set(rbVel.x, rbVel.y, rbVel.z);

    // -----------------------------------------------------------------
    // 1. RAYCAST GROUND (Safe Mode: Usa trackRef)
    // -----------------------------------------------------------------
    const origin = currentPosition.current.clone()
    origin.y += 0.5 
    raycaster.current.set(origin, new Vector3(0, -1, 0))
    raycaster.current.far = 5 
    
    let groundDistance = Infinity
    
    // FIX PRINCIPALE: Usiamo trackRef invece di scene.children
    // Questo impedisce di colpire il veicolo stesso e causare il crash Rust
    if (trackRef && trackRef.current) {
        const hits = raycaster.current.intersectObjects([trackRef.current], true)
        const groundHit = hits[0] // Prendiamo il primo
        
        if (groundHit) {
            groundDistance = groundHit.distance - 0.5 - PHYSICS_RADIUS
            
            const status = checkSurface(groundHit.object)
            
            if (status.type === 'checkpoint') handleCheckpointHit(status.index);
            if (status.type === 'outbound') {
                handleRespawn();
                return; // STOP FRAME
            }
        }
    }
    isGrounded.current = groundDistance < 0.6

    // -----------------------------------------------------------------
    // 2. RAYCAST FORWARD (Safe Mode: Usa trackRef)
    // -----------------------------------------------------------------
    const sensorOrigin = currentPosition.current.clone()
    sensorOrigin.y += 0.5 
    const forwardDir = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    sensorOrigin.add(forwardDir.clone().multiplyScalar(0.8)) 

    raycaster.current.set(sensorOrigin, forwardDir)
    raycaster.current.far = 3.0

    if (trackRef && trackRef.current) {
        const hits = raycaster.current.intersectObjects([trackRef.current], true)
        const forwardHit = hits[0]

        if (forwardHit) {
             // Ignora collisioni con la strada "normale" per il muro frontale
             if (!forwardHit.object.name.includes("Road") && !forwardHit.object.name.includes("Floor")) {
                const status = checkSurface(forwardHit.object)
                
                if (status.type === 'checkpoint') handleCheckpointHit(status.index);
                if (status.type === 'outbound') {
                    handleRespawn();
                    return; // STOP FRAME
                }
             }
        }
    }

    // --- LOGICA DI GUIDA (INVARIATA) ---

    if (!drift) {
        driftHopLocked.current = false
        driftEngageWindow.current = false 
        if (driftDirection.current !== 0) {
            if (driftLevel.current > 0 && isGrounded.current) activateBoost(driftLevel.current);
            else if (driftLevel.current > 0) pendingBoost.current = true;
            driftDirection.current = 0;
            driftTime.current = 0;
            driftLevel.current = 0;
        }
    } else {
        if (isGrounded.current && !isJumping.current && driftDirection.current === 0) driftEngageWindow.current = false;
    }

    if (drift && !driftHopLocked.current && isGrounded.current && !isJumping.current) {
        driftHopLocked.current = true; 
        driftEngageWindow.current = true; 
        performHop();
        rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true);
    }

    if (drift) {
        if (driftDirection.current === 0 && driftEngageWindow.current) {
            if (left) driftDirection.current = 1;
            else if (right) driftDirection.current = -1;
        }
        if (driftDirection.current !== 0 && isGrounded.current) {
             driftTime.current += delta;
             driftLevel.current = driftTime.current > SETTINGS.driftLevel1Time ? 1 : 0;
        }
    } else {
        if (pendingBoost.current && isGrounded.current) activateBoost(1);
    }

    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // Speed Logic
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

    // Turn Logic
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

    // Physics Application
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

    // Visuals Update
    if (visualGroupRef.current) {
        const speedShake = speed.current > SETTINGS.maxSpeed + 5 ? (Math.random() - 0.5) * 0.05 : 0
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS + VISUAL_OFFSET) + jumpOffset.current.y + speedShake;

        let targetTilt = 0
        if (isDrifting) targetTilt = driftDirection.current === 1 ? -0.5 : 0.5
        else targetTilt = (left ? -0.15 : 0) + (right ? 0.15 : 0)
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
    }

    // Camera Update
    const baseFov = 75
    state.camera.fov = baseFov
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const desiredCamPos = new Vector3(
        currentPosition.current.x + backVector.x * 6,
        currentPosition.current.y + 2.5,
        currentPosition.current.z + backVector.z * 6
    )
    state.camera.position.lerp(desiredCamPos, 0.2)
    cameraTarget.current.lerp(new Vector3(currentPosition.current.x, currentPosition.current.y + 2.0, currentPosition.current.z), 0.2)
    state.camera.lookAt(cameraTarget.current)
  })

  const steerVal = (controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)

  return (
    <RigidBody ref={rigidBody} position={START_POS} mass={100} linearDamping={0.5} angularDamping={0.5} colliders={false} type="dynamic" ccd={true} restitution={0}>
      <BallCollider args={[PHYSICS_RADIUS]} material={{ friction: 0.0, restitution: 0 }} />
      
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span ref={speedUiRef}>0 km/h</span>
            <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>SPACE TO HOP/DRIFT</div>
        </div>
      </Html>

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS + VISUAL_OFFSET, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
          <group position={vehicleConfig.vehicleOffset}>
                  <VehicleModel 
                  vehicleConfig={vehicleConfig.modelConfig} 
                  scale={1.4}
                  rotation={[0, Math.PI, 0]} 
                  position={[0, 0, 0]}
                  steer={steerVal}
                  drift={driftDirection.current}
                  speed={speed.current}
                  isBike={true}
                  />
                  <group rotation={[0, Math.PI, 0]}>
                  <RacerModel 
                      isInMenu={false}
                      scale={1.5}
                      characterConfig={characterConfig}
                      vehicleConfig={vehicleConfig} 
                      steer={steerVal} 
                      drift={driftDirection.current} 
                      speed={speed.current}
                      isKart={true}
                      key={vehicleConfig.name + "_racer"}
                  />
                  </group>
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