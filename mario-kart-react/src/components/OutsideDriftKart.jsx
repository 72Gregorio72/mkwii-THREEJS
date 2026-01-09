import React, { useRef, useState, useMemo, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider, CylinderCollider, useRapier } from '@react-three/rapier' // Aggiunto useRapier
import { Vector3, MathUtils, Quaternion, Euler, Color } from 'three' 
import * as THREE from 'three' 
import { Html } from '@react-three/drei' 
import gsap from 'gsap'

import { useControls as useGameControls } from '../hooks/useControls' 
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { useHitboxHandler } from '../hooks/HitboxHandler' 
import { useBotAI } from '../Bot/UseBotAI'

// --- 1. COSTANTI E SETTINGS ---
const KART_SIZE = 1 
const PHYSICS_RADIUS = 1 

const cBlue = new THREE.Color(0x00FFFF); 
const cRed = new THREE.Color(0xFF3300); 

const DEFAULT_SETTINGS = {
  maxSpeed: 40,
  maxTurboLimit: 50,       
  acceleration: 0.25,       
  deceleration: 2.0,       
  turnSpeed: 0.9,
  driftTurnSpeed: 0.9, 
  driftGrip: 0.02, 
  boostStrength: 0,        
  boostDuration: 60,       
  jumpForce: 0,          
  driftLevel1Time: 1.5,    
  driftLevel2Time: 3.0,  
  driftMinSpeed: 10,       
  slideOutForce: 0.08,
}

// --- 2. SISTEMA PARTICELLE (Spark Texture) ---
function getNintendoSparkTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const size = 64; 
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2; const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "white"; ctx.beginPath();
  const outerRadius = size * 0.45; const innerRadius = size * 0.15;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2; 
    ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
    const angleInner = angle + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(angleInner) * innerRadius, cy + Math.sin(angleInner) * innerRadius);
  }
  ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; 
  return tex;
}

// --- 3. COMPONENTE PARTICELLE ---
const DriftParticles = React.forwardRef((props, ref) => {
  const { count = 45 } = props; 
  const points = useRef();
  const texture = useMemo(() => getNintendoSparkTexture(), []);
  const [data] = useState(() => ({
      positions: new Float32Array(count * 3), velocities: new Float32Array(count * 3), 
      life: new Float32Array(count), sizes: new Float32Array(count)           
  }));

  const resetParticle = (i) => {
    data.positions[i * 3] = (Math.random() - 0.5) * 0.1;
    data.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    data.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    data.velocities[i * 3 + 2] = 10 + Math.random() * 8; 
    data.velocities[i * 3 + 1] = Math.random() * 3; 
    data.velocities[i * 3] = (Math.random() - 0.5) * 4;
    data.life[i] = 0.5 + Math.random() * 0.5; 
  };
  useMemo(() => { for (let i = 0; i < count; i++) resetParticle(i); }, []);

  useFrame((state, delta) => {
    if (!points.current || !ref.current || !ref.current.visible) return;
    const pos = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      data.life[i] -= delta * 3.5; 
      if (data.life[i] <= 0) resetParticle(i);
      else {
        pos[i * 3] += data.velocities[i * 3] * delta;     
        pos[i * 3 + 1] += data.velocities[i * 3 + 1] * delta; 
        pos[i * 3 + 2] += data.velocities[i * 3 + 2] * delta; 
        data.velocities[i * 3 + 1] -= 9.8 * delta;
        data.velocities[i * 3 + 2] *= 0.95; data.velocities[i * 3] *= 0.95;
        if (pos[i * 3 + 1] < -0.2) { pos[i * 3 + 1] = -0.2; data.velocities[i * 3 + 1] *= -0.5; }
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  if (!texture) return null;
  return (<group ref={ref} visible={false}><points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} /></bufferGeometry><pointsMaterial map={texture} size={0.8} color="white" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} vertexColors={false} /></points></group>);
});

function updateSparksColor(level, leftRef, rightRef) {
    if (!leftRef || !rightRef) return;
    const show = level > 0;
    if (leftRef.visible !== show) leftRef.visible = show;
    if (rightRef.visible !== show) rightRef.visible = show;
    if (!show) return;
    const targetColor = level === 2 ? cRed : cBlue;
    const applyColor = (obj) => {
        obj.traverse((child) => {
            if (child.isPoints || child.isMesh) {
                const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                if (!mat) return;
                if (mat.vertexColors === true) { mat.vertexColors = false; mat.needsUpdate = true; }
                if (mat.color && mat.color.isColor) { mat.color.lerp(targetColor, 0.3); }
            }
        });
    };
    applyColor(leftRef); applyColor(rightRef);
}

// --- 4. COMPONENTE PRINCIPALE ---

export const OutsideDriftKart = forwardRef((props, ref) => {
  const { 
    characterConfig, vehicleConfig, START_POS, onCheckpoint, trackConfig, 
    isBot = false, waypoints = [], SETTINGS = DEFAULT_SETTINGS, START_ROT = [0, 0, 0], paths = [], userData
  } = props;
  
  const { scene } = useThree()
  const { world, rapier } = useRapier() // Hook Rapier per accesso al mondo fisico
  
  const internalRef = useRef(null)
  const rigidBody = ref || internalRef
  
  const humanControls = useGameControls() 
  const botControls = useBotAI({ isBot, rigidBody, paths })
  const activeControls = isBot ? botControls : humanControls

  // Coda collisioni (Sicurezza Thread)
  const collisionQueue = useRef([]) 

  const camConfig = {
    distance: 7.2, height: 2.3, lookAtHeight: 1.0, stiffness: 0.2, fovBase: 53, fovMax: 55
  }

  const initialRotationY = START_ROT ? START_ROT[1] : 0

  const speedUiRef = useRef() 
  const driftDirection = useRef(0) 
  const speed = useRef(0)
  const rotation = useRef(initialRotationY) 
  const driftVector = useRef(new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), initialRotationY))

  const currentPosition = useRef(new Vector3())
  const cameraTarget = useRef(new Vector3(0, 0, 0))

  const isGrounded = useRef(false)
  const driftTime = useRef(0)      
  const driftLevel = useRef(0)     
  const pendingBoost = useRef(false)
  const boostTime = useRef(0)
  const driftHopLocked = useRef(false)
  const driftEngageWindow = useRef(false) 
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 
  const visualGroupRef = useRef() 
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  const racerId = userData?.id || (isBot ? "bot" : "player");

  // Helper vectors per la fisica (evita Garbage Collection)
  const v = useMemo(() => ({
      forwardGlobal: new Vector3(),
      rayOrigin: new Vector3(),
      rayDir: new Vector3()
  }), [])

  const { checkSurface } = useHitboxHandler({
    speed, boostTime, SETTINGS, onCheckpoint, maxCheckpoints: trackConfig?.maxCheckpoints || 3
  })

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

    // --- 0. GESTIONE COLLISIONI SICURA ---
    if (collisionQueue.current.length > 0) {
        collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
        collisionQueue.current = [];
    }

    // --- UI Update ---
    if (!isBot && speedUiRef.current) {
        const kmh = Math.abs(Math.round(speed.current * 1.5)) 
        speedUiRef.current.innerText = `${kmh} km/h`
        const isOver = speed.current > SETTINGS.maxSpeed + 5
        speedUiRef.current.style.color = isOver ? '#ff3300' : 'white'
        speedUiRef.current.style.transform = isOver ? `scale(1.1)` : `scale(1)`
    }

    // --- Input & Stati ---
    const rbPos = rigidBody.current.translation();
    const rbVel = rigidBody.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    const { forward, backward, left, right, drift } = activeControls.current
    
    // Logica Drift & Boost (Invariata)
    if (!drift) {
        driftHopLocked.current = false; driftEngageWindow.current = false 
        if (driftDirection.current !== 0) {
            if (driftLevel.current > 0) {
                if (isGrounded.current) activateBoost(driftLevel.current);
                else pendingBoost.current = true;
            }
            driftDirection.current = 0; driftTime.current = 0; driftLevel.current = 0;
        }
    } else {
        if (isGrounded.current && !isJumping.current && driftDirection.current === 0) driftEngageWindow.current = false;
    }
    if (drift && !driftHopLocked.current && isGrounded.current && !isJumping.current) {
        driftHopLocked.current = true; driftEngageWindow.current = true; 
        performHop();
        rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true);
    }
    if (drift) {
        if (driftDirection.current === 0 && driftEngageWindow.current) {
            const rightVector = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
            if (left) { driftDirection.current = 1; driftVector.current.add(rightVector.multiplyScalar(SETTINGS.slideOutForce)) } 
            else if (right) { driftDirection.current = -1; driftVector.current.add(rightVector.multiplyScalar(-SETTINGS.slideOutForce)) }
        }
        if (driftDirection.current !== 0 && isGrounded.current) {
             driftTime.current += delta;
             if (driftTime.current > SETTINGS.driftLevel2Time) driftLevel.current = 2;
             else if (driftTime.current > SETTINGS.driftLevel1Time) driftLevel.current = 1;
             else driftLevel.current = 0;
        }
    } else {
        if (pendingBoost.current && isGrounded.current) activateBoost(1);
    }
    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // Engine Speed Calculation
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

    // Steering
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
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.15
    const airControl = isGrounded.current ? 1 : 0.5 
    driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
    const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)


    // -----------------------------------------------------------------------------------
    // --- FISICA ANTI-WALL CLIMBING & DOWNFORCE ---
    // -----------------------------------------------------------------------------------
    
    // 1. Rileva se stiamo colpendo un Muro Verticale
    let isHittingVerticalWall = false
    if (world && rapier) {
        // Direzione fronte globale
        v.forwardGlobal.set(0, 0, -1).applyAxisAngle(new Vector3(0,1,0), rotation.current).normalize()
        
        // Raycast dal centro del kart (alzato da terra) in avanti
        v.rayOrigin.copy(currentPosition.current).add(new Vector3(0, 0.5, 0))
        
        // Ray length: raggio fisico + margine. Es. 1.5m
        const ray = new rapier.Ray(v.rayOrigin, v.forwardGlobal)
        const hit = world.castRay(ray, PHYSICS_RADIUS + 1.0, true) // Solid=true
        
        // Se colpisce qualcosa e la normale Y è vicina a 0 (superficie verticale)
        if (hit && hit.normal && Math.abs(hit.normal.y) < 0.3) {
			isHittingVerticalWall = true
		}
    }

    // 2. Calcolo nuova Y (Gravità)
    let newY = rbVel.y
    const gravity = 25 * delta;

    if (!isGrounded.current && !isJumping.current) {
        // Applica gravità normale se siamo in aria
        newY -= gravity
        
        // DOWNFORCE EXTRA: Se non stiamo saltando, spingi giù per evitare che fluttui sui muri
        // Questo impulso è fondamentale per l'effetto "incollato a terra"
        rigidBody.current.applyImpulse({ x: 0, y: -2000000.0, z: 0 }, true)
    } 
    else if (isJumping.current) {
        newY -= 15 * delta // Gravità ridotta durante l'hop
    }

    // 3. WALL CLAMP: Se colpiamo un muro E stiamo salendo (Y > 0) -> BLOCCA Y
    // Questo impedisce fisicamente al kart di salire
    if (isHittingVerticalWall && newY > 0 && !isJumping.current) {
        newY = 0 // Annulla ascesa
    }
    
    // Applica le velocità finali
    rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

    // -----------------------------------------------------------------------------------

    // Rotazione (Locking handled by RigidBody prop, but we update rotation manually)
    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // Visual Update
    if (visualGroupRef.current) {
        const driftTilt = isDrifting ? (driftDirection.current * 0.15) : 0;
        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y
        visualGroupRef.current.rotation.z = MathUtils.lerp(visualGroupRef.current.rotation.z, driftTilt, 0.1) 
    }

    // Camera Update (Solo Player)
    if (!isBot) {
        const overSpeed = Math.max(0, speed.current - SETTINGS.maxSpeed)
        const boostRange = SETTINGS.maxTurboLimit - SETTINGS.maxSpeed
        const boostRatio = Math.min(overSpeed / boostRange, 1)
        const dynamicDistance = camConfig.distance + (boostRatio) 
        const idealOffset = new Vector3(0, camConfig.height, dynamicDistance)
        idealOffset.applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
        const desiredCamPos = new Vector3().copy(currentPosition.current).add(idealOffset)
        state.camera.position.lerp(desiredCamPos, camConfig.stiffness)
        const targetLookAt = new Vector3(
            currentPosition.current.x, currentPosition.current.y + camConfig.lookAtHeight, currentPosition.current.z
        )
        cameraTarget.current.lerp(targetLookAt, camConfig.stiffness * 1.5)
        state.camera.lookAt(cameraTarget.current)
        state.camera.updateProjectionMatrix()
    }
  })

  const modelSteer = (activeControls.current.left ? 1 : 0) + (activeControls.current.right ? -1 : 0)

  // --- Handlers Sensore Terra ---
  const handleGroundEnter = (payload) => {
     const rootObj = payload.other.rigidBodyObject;
     if (!rootObj) return;
     const name = rootObj.name;
     if (name === 'player' || name === 'bot') return;
     
     isGrounded.current = true;
     
     let foundName = '';
     let curr = rootObj;
     for (let i = 0; i < 3; i++) {
        if (!curr) break;
        const n = curr.name || '';
        if (n.includes('Check_') || n.includes('_boost') || 
            n.includes('_grass') || n.includes('_outBound') || 
            n.includes('Road') || n.includes('Floor')) {
            foundName = n; break;
        }
        curr = curr.parent;
     }
     if (foundName) collisionQueue.current.push({ name: foundName });
  }

  const handleGroundExit = () => { isGrounded.current = false; }

  return (
    <RigidBody 
        ref={rigidBody} 
        position={START_POS} 
        rotation={START_ROT}
        mass={100} 
        linearDamping={2}  // Aumentato leggermente per ridurre il jitter dopo un urto
        angularDamping={2} 
        type="dynamic" 
        ccd={true} 
        name={racerId} 
        userData={{ 
            type: 'racer', 
            id: racerId // <--- Passa l'ID univoco (es. "bot_0", "bot_1") invece di "bot" generico
        }}
        colliders={false} 
        lockRotations={true}
        
        // --- NO BOUNCE SETTINGS ---
        restitution={0}            // Rimbalzo nullo
        restitutionCombine="min"   // <--- FONDAMENTALE: Vince sempre il valore più basso (0)
    >
      {/* 1. SFERA (Ruota per rampe e terreno) */}
      <BallCollider 
          args={[PHYSICS_RADIUS]} 
          position={[0, 0, 0]} 
          friction={0.0}
          frictionCombine="min"
          // Applica anche qui per sicurezza
          restitution={0}
          restitutionCombine="min" 
      />

      {/* 2. PARAURTI CILINDRICO (Anti-Climb Bumper) */}
      <CylinderCollider 
          args={[0.5, PHYSICS_RADIUS + 0.1]} 
          position={[0, -0.1, 0]} 
          friction={0.0}
          frictionCombine="min"
          // Applica anche qui per sicurezza
          restitution={0}
          restitutionCombine="min" 
      />

      {/* 3. SENSORE TERRA (Logic Only) */}
      <CylinderCollider 
         args={[0.2, 0.5]} 
         position={[0, -PHYSICS_RADIUS + 0.2, 0]} 
         sensor={true} 
         onIntersectionEnter={handleGroundEnter}
         onIntersectionExit={handleGroundExit}
      />
      
      {!isBot && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
                <span ref={speedUiRef}>0 km/h</span>
                <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>SPACE TO HOP/DRIFT</div>
            </div>
        </Html>
      )}

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
            <group position={vehicleConfig.vehicleOffset}>
                <VehicleModel 
                  vehicleConfig={vehicleConfig.modelConfig} scale={1.4} rotation={[0, Math.PI, 0]} 
                  position={[0, 0, 0]} steer={modelSteer} drift={driftDirection.current} speed={speed.current} isBike={true}
                />
                <group rotation={[0, Math.PI, 0]}>
                  <RacerModel 
                      isInMenu={false} scale={1.5} characterConfig={characterConfig} vehicleConfig={vehicleConfig} 
                      steer={modelSteer} drift={driftDirection.current} speed={speed.current} isKart={true}
                    key={vehicleConfig.name + "_racer"}
                  />
                </group>
            </group>    
            <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft}><DriftParticles ref={leftSparksRef} count={45} /></WheelPosition>
            <WheelPosition position={[0.6, 0, 0.8]} ref={backRight}><DriftParticles ref={rightSparksRef} count={45} /></WheelPosition>
      </group>
    </RigidBody>
  )
});

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))