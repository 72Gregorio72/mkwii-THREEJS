import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import { useControls } from '../hooks/useControls' 
import { Sparkles } from '@react-three/drei' 
import gsap from 'gsap'
import { FunkyKong } from '../models/Funky_kong' 
import { KartModel } from '../models/Flame_flyer' 

const KART_SIZE = 0.8 

const SETTINGS = {
  maxSpeed: 40,
  acceleration: 0.8,
  turnSpeed: 1,
  driftTurnSpeed: 1.1, 
  driftGrip: 0.02, 
  boostStrength: 20, 
  boostDuration: 60,
  jumpForce: 2,       
  gravityMultiplier: 0.1, 
  downforce: 1,       
  // Tempi per caricare il mini-turbo
  driftLevel1Time: 1.5, // Scintille BLU
}

const START_POS = [-200, 10, 270] 

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
  const driftTime = useRef(0)      // Timer accumulo drift
  const driftLevel = useRef(0)     // 0 = Null, 1 = Blu, 2 = Rosso
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  // REFS VISUALI
  const visualGroupRef = useRef() 
  // Anchor points per le particelle (fissi, non ruotano)
  const backLeft = useRef()
  const backRight = useRef()
  // Refs diretti ai componenti Sparkles per cambiare colore
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    gsap.to(jumpOffset.current, {
      y: 0.3,             // <--- RIDOTTO: Si alza meno visivamente
      duration: 0.1,      // <--- PIÙ VELOCE: Scatto rapido
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      onComplete: () => { isJumping.current = false }
    })
  }

  const activateBoost = (level) => {
    // Se level è 2 (rosso) il boost dura di più (1.5x)
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
    origin.y += 1.0 // <--- ALZATO a 1.0 (era 0.5) per sicurezza
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
			// Ricordati di sottrarre l'offset che hai aggiunto sopra (1.0)
			groundDistance = groundHit.distance - 1.0 
		}
    }

    const sphereRadius = 1.0 * KART_SIZE
    isGrounded.current = groundDistance < (sphereRadius + 0.5)

    // 3. LOGICA DRIFT & MINI-TURBO
    const isDrifting = drift && isGrounded.current && Math.abs(speed.current) > 8; // Min speed to drift

    if (isDrifting && driftDirection.current !== 0) {
        // Stiamo driftando: accumula tempo
        driftTime.current += delta;
        
        // Determina il livello delle scintille
        if (driftTime.current > SETTINGS.driftLevel1Time) {
            driftLevel.current = 1; // Blu
        } else {
            driftLevel.current = 0; // In caricamento (nessuna scintilla)
        }
    } else {
        // Non stiamo driftando. Controlliamo se abbiamo appena rilasciato un drift carico.
        if (wasDrifting.current && !drift) {
            if (driftLevel.current > 0) {
                if (isGrounded.current) activateBoost(driftLevel.current);
                else pendingBoost.current = true; // Salva il boost se sei in aria
            }
        }
        
        // Reset stato drift
        driftTime.current = 0;
        driftLevel.current = 0;
    }
    
    wasDrifting.current = drift;
    
    // Aggiorna visivamente le scintille (Colore e Visibilità)
    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);
    
    if (pendingBoost.current && isGrounded.current) {
        // Attiva un boost pendente (livello base se non salvato, qui semplificato)
        activateBoost(1); 
    }

    // 4. DRIFT HOP
    if (drift && !isJumping.current && driftDirection.current === 0 && (left || right) && isGrounded.current) {
        performHop()
        driftDirection.current = left ? 1 : -1
        rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true)
    }
    if (!drift || Math.abs(speed.current) < 1) driftDirection.current = 0

    // 5. MOTORE
    let currentMaxSpeed = SETTINGS.maxSpeed
    let acceleration = SETTINGS.acceleration
    if (boostTime.current > 0) {
        currentMaxSpeed += SETTINGS.boostStrength
        acceleration *= 3 // Scatto più rapido col boost
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

    // 7. CALCOLO VELOCITÀ X/Z
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

    // 8. FIX RIMBALZI E GRAVITÀ MIGLIORATO
    let newY = rbVel.y
    
    // -- A. GESTIONE SALITA (Anti-Climb) --
    // Se stiamo salendo (newY > 0) e NON stiamo saltando:
    if (newY > 0 && !isJumping.current) {
        // Se la salita è piccola (micro-rimbalzo o asperità), la annulliamo per restare incollati.
        if (newY < 2) {
             newY = 0 
        } else {
             // Se è una rampa vera (salita forte), la freniamo solo un po'
             newY *= 0.5 
        }
    }

	// -- B. GRAVITÀ (Caduta) --
    if (!isGrounded.current && !isJumping.current) {
        // Caduta normale pesante
        newY -= 9.81 * 4.0 * delta 
    } else if (isJumping.current) {
        // Gravità durante il salto (per renderlo secco)
        newY -= 9.81 * 5.0 * delta 
    }

    // -- C. SNAP TO GROUND (Calamita Intelligente) --
    // Applichiamo la forza verso il basso SOLO se siamo sospesi un po' (floating),
    // MA NON se siamo già piantati a terra (groundDistance < 0.05).
    // Questo evita il conflitto con Rapier che ti spinge in su.
    const isFloating = groundDistance > 0.05 && groundDistance < 1.5
    
    if (isFloating && !isJumping.current) {
        // Spinta extra verso il basso per riattaccarsi, ma senza settare velocità fisse
        newY -= 20 * delta; 
    }

    // Snap to ground
    const isSnapZone = groundDistance < (sphereRadius + 1.5)
    if (isSnapZone && !isJumping.current) {
        if (newY > 0) newY = -1; 
        newY -= 10 * delta; 
    }

    rigidBody.current.setLinvel({ 
        x: finalVelocity.x, 
        y: newY, 
        z: finalVelocity.z 
    }, true)

    // Rotazione e Pulizia
    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // --- VISUAL & CAMERA ---
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

    // Camera
    const camDist = 9 
    const camHeight = 4.5
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
    state.camera.updateProjectionMatrix()
    
    // *** NOTA: Animazione rotazione ruote rimossa come richiesto ***
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
          args={[1 * KART_SIZE]} 
          material={{ friction: 0.0, restitution: 0 }} 
      />
      
      <group 
        ref={visualGroupRef} 
        position={[0, -1 * KART_SIZE, 0]} 
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
          
          {/* WheelPosition ora è invisibile, serve solo per ancorare le particelle */}
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

// *** COMPONENTE ANCORA (Invisibile) ***
const WheelPosition = React.forwardRef(({ position, children }, ref) => {
  return (
    <group position={position} ref={ref}>
      {children}
    </group>
  )
})

// *** PARTICELLE DRIFT (Grandi, Dense, Blu Elettrico) ***
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

// *** LOGICA GESTIONE COLORI ***
const cBlue = new Color("#00aeffff") // Blu Elettrico
const cRed = new Color("#FF2200")  // Rosso Fuoco

function updateSparksColor(level, leftRef, rightRef) {
    if (!leftRef || !rightRef) return
    
    // Mostra solo se il drift è caricato almeno al livello 1
    const show = level > 0 
    
    leftRef.visible = show
    rightRef.visible = show

    if (show) {
        let targetColor = level === 2 ? cRed : cBlue
        
        // Applica il colore alle mesh interne create da Drei Sparkles
        leftRef.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.lerp(targetColor, 0.5)
                // Aumenta l'emissive per renderle brillanti al buio
                if (child.material.emissive) {
                    child.material.emissive = targetColor
                    child.material.emissiveIntensity = 2
                }
            }
        })
        rightRef.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.lerp(targetColor, 0.5)
                if (child.material.emissive) {
                    child.material.emissive = targetColor
                    child.material.emissiveIntensity = 2
                }
            }
        })
    }
}