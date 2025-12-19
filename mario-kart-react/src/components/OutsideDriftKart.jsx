import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import { useControls } from '../hooks/useControls' 
import { Sparkles, Html } from '@react-three/drei' 
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' 
import { KartModel } from '../models/Flame_flyer' 

const KART_SIZE = 1       
const PHYSICS_RADIUS = 1.2   

// CONFIGURAZIONE OUTSIDE DRIFT
const SETTINGS = {
  maxSpeed: 40,
  maxTurboLimit: 80,       
  acceleration: 0.2,       
  deceleration: 1.0,       
  turnSpeed: 0.8,
  
  // --- OUTSIDE DRIFT MODIFICATO ---
  // Meno rotazione su se stesso (era 1.8, ora 1.0)
  driftTurnSpeed: 1.0, 
  // Più grip per chiudere l'angolo (era 0.006, ora 0.015)
  // Più alto è questo numero, meno il kart scivola laterale ("saponetta")
  driftGrip: 0.015, 
  
  boostStrength: 0,        
  boostDuration: 60,       
  jumpForce: 1.5,          
  driftLevel1Time: 1.5,    
  driftMinSpeed: 10,       
}

const START_POS = [-200, 10, 270] 
const cBlue = new Color("#00aeff") 
const cRed = new Color("#ff3300")  

export function OutsideDriftKart() {
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
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    
    // Un salto leggermente più alto per enfatizzare l'ingresso in derapata
    gsap.to(jumpOffset.current, {
      y: 0.4, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out",
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

    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // 4. MOTORE
    const isBoosting = boostTime.current > 0
    if (isBoosting) boostTime.current -= 1

    const isDrifting = driftDirection.current !== 0
    let currentSpeedLimit = SETTINGS.maxSpeed
    if (isBoosting) currentSpeedLimit = SETTINGS.maxTurboLimit
    else if (isDrifting) currentSpeedLimit += 2 // Outside drift guadagna meno velocità in curva rispetto all'inside

    let targetSpeed = 0
    if (forward) targetSpeed = currentSpeedLimit
    if (backward) targetSpeed = -currentSpeedLimit * 0.5
    
    // Smorzamento inerziale
    speed.current = MathUtils.damp(speed.current, targetSpeed, isBoosting ? SETTINGS.acceleration * 2 : SETTINGS.acceleration, delta)

    // 5. STERZO (OUTSIDE DRIFT LOGIC)
    let turnFactor = 0
    if (isDrifting) {
        const isLeftDrift = driftDirection.current === 1
        
        // Logica OUTSIDE:
        // Se drifti a sinistra e premi sinistra -> Stringi la curva (ma scivoli comunque)
        // Se drifti a sinistra e premi destra -> Allarghi la curva (drift wide)
        // Se non premi nulla -> Curva standard larga
        
        let steerInput = 0
        if (left) steerInput = 1
        if (right) steerInput = -1

        // Base turn speed durante il drift
        const baseDriftTurn = SETTINGS.driftTurnSpeed * driftDirection.current

        // Modificatore basato sull'input:
        // Se l'input è nella stessa direzione del drift (es. Left Drift + Left Key), aumentiamo la rotazione (stringe)
        // Se l'input è opposto, rallentiamo la rotazione o andiamo leggermente contro (allarga)
        if (isLeftDrift) {
             if (steerInput === 1) turnFactor = baseDriftTurn * 1.2 // Stringe
			 else if (steerInput === -1) {
				 turnFactor = baseDriftTurn * 0.1 // Allarga (controsterzo)
				 // Sposta leggermente a sinistra durante il controsterzo
				 const leftShift = new Vector3(-0.05, 0, 0)
				 const currentPos = rigidBody.current.translation()
				 rigidBody.current.setTranslation({ x: currentPos.x + leftShift.x, y: currentPos.y, z: currentPos.z }, true)
			 }
             else turnFactor = baseDriftTurn * 0.8 // Neutro
        } else {
             // Right Drift
             if (steerInput === -1) turnFactor = baseDriftTurn * 1.2 // Stringe
             else if (steerInput === 1){
				 turnFactor = baseDriftTurn * 0.1 // Allarga (controsterzo)
				 // Sposta leggermente a destra durante il controsterzo
				 const rightShift = new Vector3(0.05, 0, 0)
				 const currentPos = rigidBody.current.translation()
				 rigidBody.current.setTranslation({ x: currentPos.x + rightShift.x, y: currentPos.y, z: currentPos.z }, true)
			 }
             else turnFactor = baseDriftTurn * 0.8
        }

    } else {
        // Sterzo normale (Grip solido)
        if (Math.abs(speed.current) > 1.0) {
            const reverseFactor = speed.current < 0 ? -1 : 1
            if (left) turnFactor = SETTINGS.turnSpeed * reverseFactor
            if (right) turnFactor = -SETTINGS.turnSpeed * reverseFactor
        }
    }
    rotation.current += turnFactor * delta

    // 6. FISICA VETTORIALE (IL CUORE DELL'OUTSIDE DRIFT)
    // Calcoliamo dove il muso sta puntando
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    
    // In Outside Drift, il grip è molto basso.
    // Questo significa che driftVector (dove stiamo andando davvero) ci mette molto tempo 
    // a raggiungere forwardVector (dove stiamo guardando).
    // Risultato: Il kart ruota, ma continua ad andare dritto/largo per un po' = SCIVOLAMENTO ESTERNO.
    const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.15 
    const airControl = isGrounded.current ? 1 : 0.2 // Meno controllo in aria

    driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
    
    const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)

    // Gravità custom
    let newY = rbVel.y
    if (!isGrounded.current && !isJumping.current) newY -= 20 * delta 
    else if (isJumping.current) newY -= 15 * delta
    
    // Stick to ground
    if (groundDistance > 0.05 && groundDistance < 0.8 && !isJumping.current && newY > 0) {
        newY = -5 
    }

    rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

    // Applichiamo la rotazione
    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // VISUAL UPDATE
    if (visualGroupRef.current) {
        const speedShake = speed.current > SETTINGS.maxSpeed + 5 ? (Math.random() - 0.5) * 0.05 : 0
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y + speedShake
        
        // Tilt Visuale:
        // In outside drift, il kart non piega tanto "dentro" la curva come le moto inside.
        // Spesso si inclina leggermente o rimane abbastanza piatto, con un po' di rollio opposto se si controsterza.
        let targetTilt = 0
        if (isDrifting) {
            // Un tilt leggero nella direzione del drift, ma meno aggressivo dell'inside
            targetTilt = driftDirection.current === 1 ? -0.25 : 0.25 
        } else {
            targetTilt = (left ? -0.15 : 0) + (right ? 0.15 : 0)
        }
        
        visualGroupRef.current.rotation.z = MathUtils.damp(visualGroupRef.current.rotation.z, targetTilt, 8, delta)
    }

    // CAMERA
    // La camera nell'outside drift spesso deve "inseguire" un po' di più perché il kart ruota molto rispetto alla traiettoria
    const baseFov = 75
    const extraFov = Math.min((Math.abs(speed.current) / SETTINGS.maxTurboLimit) * 20, 30)
		state.camera.fov = MathUtils.lerp(state.camera.fov, baseFov + (extraFov / 10), 0.1)

    // Calcoliamo la posizione della camera basandoci sul VETTORE DI MOVIMENTO (driftVector) invece che sulla ROTAZIONE pura
    // Questo aiuta a non far venire il mal di mare quando il kart ruota bruscamente ma sta ancora scivolando
    const camDir = isDrifting ? driftVector.current.clone().negate() : new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    
    const desiredCamPos = new Vector3(
        currentPosition.current.x + camDir.x * 7, // Camera un po' più lontana
        currentPosition.current.y + 3.0,
        currentPosition.current.z + camDir.z * 7
    )
    
    state.camera.position.lerp(desiredCamPos, 0.15) // Lerp leggermente più morbido
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
                OUTSIDE DRIFT<br/>
                SPACE TO HOP
            </div>
        </div>
      </Html>

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
          <KartModel scale={1} rotation={[0, Math.PI, 0]} position={[0, 0.5, 0]} />
          <FunkyKong position={[0, 0, 0]} rotation={[0, Math.PI, 0]} steer={(controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)} drift={driftDirection.current} speed={speed.current}/>
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