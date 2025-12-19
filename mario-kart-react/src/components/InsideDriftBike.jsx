import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import { useControls } from '../hooks/useControls' 
import { Sparkles, Html } from '@react-three/drei' 
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' 
// Assumiamo che tu abbia convertito il modello della Flame Runner
import { FlameRunner } from '../models/FlameRunner' 

const KART_SIZE = 1       
const PHYSICS_RADIUS = 1.2   

const SETTINGS = {
  maxSpeed: 45,            // Le moto sono spesso leggermente più veloci
  maxTurboLimit: 85,       
  acceleration: 0.25,      // Accelerazione scattante
  deceleration: 1.0,       
  turnSpeed: 1.0,          // Sterzata base reattiva

  // --- INSIDE DRIFT SETTINGS ---
  // Rotazione rapidissima: la moto "spezza" la curva
  driftTurnSpeed: 2.2, 
  // Grip Altissimo: Il vettore segue il muso immediatamente. Niente slittamento laterale.
  driftGrip: 0.12, 
  
  boostStrength: 0,        
  boostDuration: 60,       
  jumpForce: 1.5,          
  driftLevel1Time: 1.5,    
  driftMinSpeed: 10,       
}

const START_POS = [-200, 10, 270] 
const cBlue = new Color("#00aeff") 
const cRed = new Color("#ff3300")  

export function InsideDriftBike() {
  const { scene } = useThree()
  const controls = useControls()
  
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
  // Le moto hanno una scia centrale posteriore solitamente, o due vicine
  const exhaustRef = useRef()
  const sparksRef = useRef()

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

    updateSparksColor(driftLevel.current, sparksRef.current);

    // 4. MOTORE
    const isBoosting = boostTime.current > 0
    if (isBoosting) boostTime.current -= 1

    const isDrifting = driftDirection.current !== 0
    let currentSpeedLimit = SETTINGS.maxSpeed
    if (isBoosting) currentSpeedLimit = SETTINGS.maxTurboLimit
    else if (isDrifting) currentSpeedLimit += 3 // Le moto mantengono alta velocità in curva

    let targetSpeed = 0
    if (forward) targetSpeed = currentSpeedLimit
    if (backward) targetSpeed = -currentSpeedLimit * 0.5
    
    speed.current = MathUtils.damp(speed.current, targetSpeed, isBoosting ? SETTINGS.acceleration * 2 : SETTINGS.acceleration, delta)

    // 5. STERZO (INSIDE DRIFT LOGIC)
    let turnFactor = 0
    if (isDrifting) {
        const isLeftDrift = driftDirection.current === 1
        
        let steerInput = 0
        if (left) steerInput = 1
        if (right) steerInput = -1

        // Base aggressiva
        const baseDriftTurn = SETTINGS.driftTurnSpeed * driftDirection.current

        // LOGICA INSIDE:
        // Se drifti a sinistra e premi sinistra -> Curva STRETTISSIMA
        // Se drifti a sinistra e premi destra -> Allarghi (ma rimani in traiettoria inside)
        
        if (isLeftDrift) {
             if (steerInput === 1) turnFactor = baseDriftTurn * 1.5 // Tight Inside
             else if (steerInput === -1) turnFactor = baseDriftTurn * 0.8 // Wide
             else turnFactor = baseDriftTurn * 1.1 // Neutral is still tight
        } else {
             // Right Drift
             if (steerInput === -1) turnFactor = baseDriftTurn * 1.5 // Tight Inside
             else if (steerInput === 1) turnFactor = baseDriftTurn * 0.8 // Wide
             else turnFactor = baseDriftTurn * 1.1
        }
    } else {
        if (Math.abs(speed.current) > 1.0) {
            const reverseFactor = speed.current < 0 ? -1 : 1
            if (left) turnFactor = SETTINGS.turnSpeed * reverseFactor
            if (right) turnFactor = -SETTINGS.turnSpeed * reverseFactor
        }
    }
    rotation.current += turnFactor * delta

    // 6. FISICA VETTORIALE (INSIDE DRIFT)
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    
    // Per Inside Drift: DriftGrip è ALTO. Il vettore velocità si allinea quasi subito.
    // Questo elimina l'effetto "saponetta" e crea l'effetto "binario".
    const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.20
    const airControl = isGrounded.current ? 1 : 0.5 

    driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
    const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)

    // Gravità
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

    // VISUAL UPDATE (IL "PIEGARE" DELLA MOTO)
    if (visualGroupRef.current) {
        const speedShake = speed.current > SETTINGS.maxSpeed + 5 ? (Math.random() - 0.5) * 0.05 : 0
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y + speedShake
        
        let targetTilt = 0
        // Le moto si inclinano MOLTO di più dei kart
        if (isDrifting) {
            // Drift Tilt aggressivo: ~45 gradi (0.8 rad)
            targetTilt = driftDirection.current === 1 ? -0.8 : 0.8
        } else {
            // Steering Tilt normale
            targetTilt = (left ? -0.4 : 0) + (right ? 0.4 : 0)
        }
        
        // Lerp veloce per dare la sensazione di peso che si sposta
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 10, delta)
    }

    // CAMERA
    const baseFov = 80 // FOV leggermente più alto per le moto
    const extraFov = Math.min((Math.abs(speed.current) / SETTINGS.maxTurboLimit) * 20, 30)
    state.camera.fov = MathUtils.lerp(state.camera.fov, baseFov + extraFov, 0.1)

    // La camera delle moto è più stretta e segue rigidamente la rotazione (perché non c'è drift laterale)
    const backVector = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const desiredCamPos = new Vector3(
        currentPosition.current.x + backVector.x * 6,
        currentPosition.current.y + 2.8,
        currentPosition.current.z + backVector.z * 6
    )
    state.camera.position.lerp(desiredCamPos, 0.2)
    cameraTarget.current.lerp(new Vector3(currentPosition.current.x, currentPosition.current.y + 2.0, currentPosition.current.z), 0.2)
    state.camera.lookAt(cameraTarget.current)
    state.camera.updateProjectionMatrix()
  })

  return (
    <RigidBody ref={rigidBody} position={START_POS} mass={100} linearDamping={0.5} angularDamping={0.5} colliders={false} type="dynamic" ccd={true} restitution={0}>
      <BallCollider args={[PHYSICS_RADIUS]} material={{ friction: 0.0, restitution: 0 }} />
      
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span ref={speedUiRef}>0 km/h</span>
            <div style={{fontSize:'14px', opacity:0.7, marginTop:5, textAlign:'right'}}>
                INSIDE DRIFT BIKE<br/>
                FLAME RUNNER
            </div>
        </div>
      </Html>

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
          {/* FlameRunner ruotata di 180 gradi come i kart precedenti se necessario */}
          <FlameRunner scale={1} rotation={[0, Math.PI, 0]} position={[0, 0, 0]} />
          
          {/* FunkyKong adattato per stare sulla moto (position Y potrebbe richiedere tuning a seconda del modello) */}
          <FunkyKong position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]} steer={(controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)} drift={driftDirection.current} speed={speed.current}/>
          
          {/* Scintille singole centrali o doppie strette per la moto */}
          <WheelPosition position={[0, 0, 0.8]} ref={exhaustRef}><DriftSparks ref={sparksRef} /></WheelPosition>
      </group>
    </RigidBody>
  )
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))
const DriftSparks = React.forwardRef((props, ref) => (
    <group position={[0, 0.2, 1]} ref={ref} visible={false}>
        {/* Scintille blu/rosse */}
        <Sparkles count={15} scale={[0.5, 0.5, 1.5]} size={40} speed={1.2} opacity={1} color={"#0066FF"} noise={0.2}/>
    </group>
))

function updateSparksColor(level, sparksRef) {
    if (!sparksRef) return
    const show = level > 0 
    sparksRef.visible = show
    if (show) {
        let targetColor = level === 2 ? cRed : cBlue
        sparksRef.traverse((c) => { if(c.isMesh) { c.material.color.lerp(targetColor, 0.4); c.material.emissive = targetColor } })
    }
}