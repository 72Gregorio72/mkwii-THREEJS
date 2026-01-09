import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier' 
import { Vector3, MathUtils, Raycaster, Quaternion, Euler, Color } from 'three' 
import * as THREE from 'three' 
import { Html } from '@react-three/drei' 
import gsap from 'gsap'

// --- TUOI IMPORT CUSTOM ---
import { useControls as useGameControls } from '../hooks/useControls' 
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { useHitboxHandler } from '../hooks/HitboxHandler' 
import { useKartAudio } from '../hooks/useKartAudio' 

// --- 1. COSTANTI E SETTINGS ---
const KART_SIZE = 1 
const PHYSICS_RADIUS = 1.2 

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
  jumpForce: 1.5,          
  driftLevel1Time: 1.5,
  driftMinSpeed: 10,       
  slideOutForce: 0.08,
  
  // --- SETTINGS MOTO ---
  wheelieSpeedBonus: 10,   
  wheelieTurnReduction: 0.3, 
}

// --- 2. SISTEMA PARTICELLE ---
function getNintendoSparkTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const size = 64; 
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "white";
  ctx.beginPath();
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.15;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2; 
    ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
    const angleInner = angle + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(angleInner) * innerRadius, cy + Math.sin(angleInner) * innerRadius);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true; 
  return tex;
}

const DriftParticles = React.forwardRef((props, ref) => {
  const { count = 45 } = props; 
  const points = useRef();
  const texture = useMemo(() => getNintendoSparkTexture(), []);
  const [data] = useState(() => ({
      positions: new Float32Array(count * 3),
      velocities: new Float32Array(count * 3), 
      life: new Float32Array(count),           
      sizes: new Float32Array(count)           
  }));

  const resetParticle = (i) => {
    data.positions[i * 3] = (Math.random() - 0.5) * 0.1;
    data.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    data.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    data.velocities[i * 3 + 2] = 10 + Math.random() * 8; 
    data.velocities[i * 3 + 1] = Math.random() * 3; 
    data.velocities[i * 3] = (Math.random() - 0.5) * 4;
    data.life[i] = 0.5 + Math.random() * 0.5; 
    data.sizes[i] = Math.random(); 
  };

  useMemo(() => { for (let i = 0; i < count; i++) resetParticle(i); }, []);

  useFrame((state, delta) => {
    if (!points.current || !ref.current || !ref.current.visible) return;
    const pos = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      data.life[i] -= delta * 3.5; 
      if (data.life[i] <= 0) {
        resetParticle(i);
      } else {
        pos[i * 3] += data.velocities[i * 3] * delta;     
        pos[i * 3 + 1] += data.velocities[i * 3 + 1] * delta; 
        pos[i * 3 + 2] += data.velocities[i * 3 + 2] * delta; 
        data.velocities[i * 3 + 1] -= 9.8 * delta;
        data.velocities[i * 3 + 2] *= 0.95;
        data.velocities[i * 3] *= 0.95;
        if (pos[i * 3 + 1] < -0.2) {
            pos[i * 3 + 1] = -0.2;
            data.velocities[i * 3 + 1] *= -0.5; 
        }
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!texture) return null;
  return (
    <group ref={ref} visible={false}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial map={texture} size={0.8} color="white" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} vertexColors={false} />
      </points>
    </group>
  );
});

// --- 3. HELPER COLORE ---
function updateSparksColor(level, sparksRef) {
    if (!sparksRef) return;
    const show = level > 0;
    if (sparksRef.visible !== show) sparksRef.visible = show;
    if (!show) return;
    const targetColor = cBlue;
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
    applyColor(sparksRef);
}


// --- 4. COMPONENTE PRINCIPALE MOTO ---

export function InsideDriftBike({ 
  characterConfig, 
  vehicleConfig, 
  START_POS, 
  onCheckpoint, 
  trackConfig, 
  SETTINGS = DEFAULT_SETTINGS,
  isRaceActive = true  // Prop per sapere se la gara è attiva
}) {
  const { scene } = useThree()
  const controls = useGameControls() 
  
  // Hook per gestire gli SFX della bike
  const { updateAudio, startIdleAudio, stopAllAudio } = useKartAudio({ 
    isBike: true, 
    isActive: isRaceActive 
  }) 
  
  const camConfig = {
    distance: 7.2,
    height: 2.3,
    lookAtHeight: 1.0,
    stiffness: 0.2, // MANTENIAMO BASSO per l'effetto elastico su X e Z
    fovBase: 53,
    fovMax: 55
  }

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

  const isWheelie = useRef(false)
  // --- STATI PER IL TOGGLE IMPENNATA ---
  const isWheelieActive = useRef(false)   
  const wasWheeliePressed = useRef(false) 

  const visualGroupRef = useRef() 
  const centerSparksRef = useRef()

  const { checkSurface } = useHitboxHandler({
    speed,
    boostTime,
    SETTINGS,
    onCheckpoint,
    maxCheckpoints: trackConfig?.maxCheckpoints || 3
  })

  // Avvia l'audio IDLE quando la gara inizia
  useEffect(() => {
    if (isRaceActive) {
      // Piccolo delay per assicurarsi che l'audio context sia pronto
      const timeout = setTimeout(() => {
        startIdleAudio();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isRaceActive, startIdleAudio]);

  // Ferma tutti i suoni quando si esce dalla gara
  useEffect(() => {
    if (!isRaceActive) {
      stopAllAudio();
    }
  }, [isRaceActive, stopAllAudio]);

  const performHop = () => {
    if (isJumping.current) return
    isJumping.current = true
    
    gsap.to(jumpOffset.current, {
      y: 0.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out",
      onComplete: () => { isJumping.current = false }
    })
  }

  const activateBoost = (level) => {
    const durationMult = 1.0
    boostTime.current = SETTINGS.boostDuration * durationMult
    pendingBoost.current = false
  }

  useFrame((state, delta) => {
    if (!rigidBody.current) return;

    if (speedUiRef.current) {
        const kmh = Math.abs(Math.round(speed.current * 1.5)) 
        speedUiRef.current.innerText = `${kmh} km/h`
        const isOver = speed.current > SETTINGS.maxSpeed + 5
        speedUiRef.current.style.color = isOver ? '#ff3300' : 'white'
        speedUiRef.current.style.transform = isOver ? `scale(1.1)` : `scale(1)`
    }

    const rbPos = rigidBody.current.translation();
    const rbVel = rigidBody.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    currentVelocity.current.set(rbVel.x, rbVel.y, rbVel.z);

    const { forward, backward, left, right, drift, wheelie } = controls.current
    
    // Aggiorna l'audio SFX della bike
    updateAudio(speed.current, forward);
    
    let groundDist = Infinity; 

    // --- Raycast Logic ---
    if (scene) {
        const safeRaycast = (origin, direction, limitDistance) => {
            try {
                raycaster.current.set(origin, direction);
                raycaster.current.far = limitDistance; 
                const hits = raycaster.current.intersectObjects(scene.children, true);
                
                return hits.find(hit => {
                    let obj = hit.object;
                    while (obj) {
                          if (obj.uuid === visualGroupRef.current?.uuid) return false;
                          obj = obj.parent;
                    }
                    return true;
                });
            } catch (e) {
                return null;
            }
        };

        const downOrigin = currentPosition.current.clone();
        downOrigin.y += 0.5; 
        const groundHit = safeRaycast(downOrigin, new Vector3(0, -1, 0), 5);
        
        if (groundHit) {
            groundDist = groundHit.distance - 0.5 - PHYSICS_RADIUS;
            checkSurface(groundHit.object);
        }
        isGrounded.current = groundDist < 0.6;

        const forwardDir = new Vector3(0, 0, -1)
            .applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
            .normalize();
        
        const frontOrigin = currentPosition.current.clone();
        frontOrigin.y += 1.0; 
        const wallHit = safeRaycast(frontOrigin, forwardDir, 3.5);
        if (wallHit) {
             checkSurface(wallHit.object);
        }
    }

    // --- Logic Drift ---
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
             
             if (driftTime.current > SETTINGS.driftLevel1Time) {
                driftLevel.current = 1;
             } else {
                driftLevel.current = 0;
             }
        }
    } else {
        if (pendingBoost.current && isGrounded.current) activateBoost(1);
    }

    updateSparksColor(driftLevel.current, centerSparksRef.current);

    // --- NUOVA LOGICA IMPENNATA (TOGGLE) ---
    // 1. Rileva il click singolo
    if (wheelie && !wasWheeliePressed.current) {
        isWheelieActive.current = !isWheelieActive.current; // Switch ON/OFF
    }
    wasWheeliePressed.current = wheelie;

    // 2. Condizioni di reset automatico (Disattiva se...)
    if (
        drift ||                        // Stai driftando
        Math.abs(speed.current) < 10 || // Vai troppo piano
        !forward                        // (Opzionale) Hai lasciato il gas
    ) {
        isWheelieActive.current = false;
    }

    // 3. Applica stato finale
    isWheelie.current = isWheelieActive.current && !isJumping.current && !drift;

    // Engine
    const isBoosting = boostTime.current > 0
    if (isBoosting) boostTime.current -= 1

    const isDrifting = driftDirection.current !== 0
    
    let currentSpeedLimit = SETTINGS.maxSpeed
    
    if (isBoosting) {
        currentSpeedLimit = SETTINGS.maxTurboLimit;
    } 
    else if (isWheelie.current) {
        currentSpeedLimit = SETTINGS.maxSpeed + (SETTINGS.wheelieSpeedBonus || 10);
    }
    else if (isDrifting) {
        currentSpeedLimit += 5; 
    }

    let targetSpeed = 0
    if (forward) targetSpeed = currentSpeedLimit
    if (backward) targetSpeed = -currentSpeedLimit * 0.5
    
    const isOverspeeding = speed.current > (currentSpeedLimit + 5)
    if (forward && !isBoosting && isOverspeeding) {
        speed.current = MathUtils.damp(speed.current, currentSpeedLimit, SETTINGS.deceleration, delta)
    } else {
        let currentAccel = SETTINGS.acceleration
        if (isBoosting) currentAccel *= 2.5
        else if (!forward && !backward) currentAccel = SETTINGS.deceleration 
        
        speed.current = MathUtils.damp(speed.current, targetSpeed, currentAccel, delta)
    }

    // Sterzo
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

    if (isWheelie.current) {
        turnFactor *= (SETTINGS.wheelieTurnReduction || 0.3);
    }

    rotation.current += turnFactor * delta

    // Fisica Movimento
    const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
    const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.15
    const airControl = isGrounded.current ? 1 : 0.5 

    driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
    const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)

    // Fisica Gravità
    let newY = rbVel.y
    const gravity = 25 * delta;

    if (!isGrounded.current && !isJumping.current) {
        newY -= gravity
    } 
    else if (isJumping.current) {
        newY -= 15 * delta
    } 
    else {
        if (groundDist > 0.1) {
             newY = -3 
        } 
        else if (newY > 0) {
             newY = 0 
        }
    }

    rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

    const q = new Quaternion()
    q.setFromEuler(new Euler(0, rotation.current, 0))
    rigidBody.current.setRotation(q, true)
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // --- VISUALI ---
    if (visualGroupRef.current) {
        const speedShake = 0; 
        
        // Tilt Z per Drift
        const driftTilt = isDrifting ? (driftDirection.current * 0.15) : 0;
        
        // Tilt X per Impennata (POSITIVO = naso giù, NEGATIVO = naso su)
        const targetWheelieTilt = isWheelie.current ? 0.4 : 0;

        visualGroupRef.current.position.y = (-PHYSICS_RADIUS) + jumpOffset.current.y + speedShake
        
        visualGroupRef.current.rotation.z = MathUtils.lerp(visualGroupRef.current.rotation.z, driftTilt, 0.1)
        visualGroupRef.current.rotation.x = MathUtils.lerp(visualGroupRef.current.rotation.x, targetWheelieTilt, 0.1)
    }

    // --- CAMERA ---

    // MODIFICA: Distanza fissa, non si allontana mai

    const dynamicDistance = camConfig.distance 
    const idealOffset = new Vector3(0, camConfig.height, dynamicDistance)
    idealOffset.applyAxisAngle(new Vector3(0, 1, 0), rotation.current)

    const desiredCamPos = new Vector3().copy(currentPosition.current).add(idealOffset)
    state.camera.position.lerp(desiredCamPos, camConfig.stiffness)

    const targetLookAt = new Vector3(
        currentPosition.current.x,
        currentPosition.current.y + camConfig.lookAtHeight,
        currentPosition.current.z
    )
    cameraTarget.current.lerp(targetLookAt, camConfig.stiffness * 1.5)
    state.camera.lookAt(cameraTarget.current)
    state.camera.updateProjectionMatrix()
  })

  const steerVal = (controls.current.left ? 1 : 0) + (controls.current.right ? -1 : 0)

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
        name="kart" 
        restitution={0}
        onIntersectionEnter={({ other }) => {
            const obj = other.rigidBodyObject || other.parent();
            if (obj) checkSurface(obj); 
        }}
    >
      <BallCollider args={[PHYSICS_RADIUS]} material={{ friction: 0.0, restitution: 0 }} />
      
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span ref={speedUiRef}>0 km/h</span>
            <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>
                {isWheelie.current ? <span style={{color:'#ffff00'}}>WHEELIE!</span> : "PRESS TO WHEELIE"}
            </div>
        </div>
      </Html>

      <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
            <group position={vehicleConfig.vehicleOffset}>

                <VehicleModel 
                  vehicleConfig={vehicleConfig.modelConfig} 
                  scale={1.4}
                  rotation={[0, Math.PI, 0]} 
                  position={[0, 0, 0]}
                  steer={steerVal}
                  drift={driftDirection.current}
                  speed={speed.current}
                  isKart={true}
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
  
            <WheelPosition position={[0, 0, 1.0]}>
                <DriftParticles ref={centerSparksRef} count={60} />
            </WheelPosition>
      </group>
    </RigidBody>
  )
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))