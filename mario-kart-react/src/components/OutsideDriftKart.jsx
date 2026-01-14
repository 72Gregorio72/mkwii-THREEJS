import React, { useRef, useState, useMemo, forwardRef, useEffect, useImperativeHandle } from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { RigidBody, BallCollider, CylinderCollider, useRapier } from '@react-three/rapier'
import { Vector3, MathUtils, Quaternion, Euler, Color } from 'three'
import * as THREE from 'three'
import { Html, useGLTF } from '@react-three/drei'
import gsap from 'gsap'

// --- IMPORTS CUSTOM ---
import { useControls as useGameControls } from '../hooks/useControls' 
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { useHitboxHandler } from '../hooks/HitboxHandler' 
import { useBotAI } from '../Bot/UseBotAI'
import { useKartAudio } from '../hooks/useKartAudio'
import { usePowerupHandler } from './PowerupHandler';
import { useBulletBill } from '../Items/BulletBill'; 

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

// --- 2. SISTEMA PARTICELLE (Texture) ---
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
    if (leftRef.visible === show && rightRef.visible === show && !show) return;

    if (leftRef.visible !== show) leftRef.visible = show;
    if (rightRef.visible !== show) rightRef.visible = show;
    if (!show) return;
    
    const targetColor = level === 2 ? cRed : cBlue;
    const applyColor = (obj) => {
        if(!obj) return;
        const pointChild = obj.children[0]; 
        if (pointChild && pointChild.material && pointChild.material.color.isColor) {
             pointChild.material.color.lerp(targetColor, 0.3); 
        }
    };
    applyColor(leftRef.current); applyColor(rightRef.current); 
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))

// --- 4. SPEED LINES EFFECT ---
const SpeedEffect = ({ boostTimeRef, isBulletBill }) => {
  const meshRef = useRef()
  const count = 20 
  const { camera, scene } = useThree()
  
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const lines = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 10.0 + Math.random() * 6.0 
      const z = -20 - Math.random() * 30 
      const speed = 2.0 + Math.random() * 1.5 
      temp.push({ angle, radius, z, speed })
    }
    return temp
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Attivo anche se è Bullet Bill
    const isBoosting = boostTimeRef.current > 0 || isBulletBill
    const targetOpacity = isBoosting ? 0.35 : 0 
    
    meshRef.current.material.opacity = MathUtils.lerp(
      meshRef.current.material.opacity,
      targetOpacity,
      delta * 10
    )
    
    const isVisible = meshRef.current.material.opacity > 0.01
    meshRef.current.visible = isVisible
    if (!isVisible) return

    meshRef.current.position.copy(camera.position)
    meshRef.current.quaternion.copy(camera.quaternion)

    lines.forEach((line, i) => {
        line.z += line.speed * 120 * delta 
        if (line.z > 5) line.z = -40 

        dummy.position.set(
            Math.cos(line.angle) * line.radius, 
            Math.sin(line.angle) * line.radius, 
            line.z                              
        )
        dummy.rotation.set(0, 0, line.angle) 
        const depthFactor = MathUtils.mapLinear(line.z, -40, 0, 1.0, 6.0)
        const thickness = Math.max(1.0, depthFactor)
        dummy.scale.set(1, thickness, 1) 
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return createPortal(
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[3.0, 0.03]} /> 
      <meshBasicMaterial 
        color="white" 
        transparent 
        opacity={0} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        depthTest={false}  
        side={THREE.DoubleSide}
      />
    </instancedMesh>,
    scene
  )
}

// --- 5. COMPONENTE PRINCIPALE COMPLETO ---

export const OutsideDriftKart = forwardRef((props, ref) => {
  const { 
    characterConfig, vehicleConfig, START_POS, onCheckpoint, trackConfig, 
    isBot = false, waypoints = [], SETTINGS = DEFAULT_SETTINGS, START_ROT = [0, 0, 0], paths = [], userData,
    isRaceActive = true, onSpawnBanana, onSpawnGreenShell, onSpawnRedShell, rank
  } = props;
  
  const { scene } = useThree()
  const { world, rapier } = useRapier()
  
  // FIX CRITICO: Usa SEMPRE un ref interno distinto da quello esterno per evitare loop infiniti
  const rb = useRef(null) 
  
  // Caricamento modello Bullet Bill
  const { scene: billScene } = useGLTF('/items/BulletBill.glb'); 
  const billVisualsRef = useRef();

  // Controls
  // Passiamo 'rb' (il ref fisico vero) al bot
  const humanControls = useGameControls() 
  const botControls = useBotAI({ isBot, rigidBody: rb, paths }) 
  const activeControls = isBot ? botControls : humanControls
  
  // Audio
  const { updateAudio, startIdleAudio, stopAllAudio } = useKartAudio({ 
    isBike: false, 
    isActive: isRaceActive && !isBot  
  })

  // Coda collisioni
  const collisionQueue = useRef([]) 

  const camConfig = { distance: 7.2, height: 2.3, lookAtHeight: 1.0, stiffness: 0.2, fovBase: 53, fovMax: 55 }
  const initialRotationY = START_ROT ? START_ROT[1] : 0

  // Refs di stato
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
  
  // Refs visuali
  const visualGroupRef = useRef() 
  const backLeft = useRef()
  const backRight = useRef()
  const leftSparksRef = useRef()
  const rightSparksRef = useRef()

  const isSpinning = useRef(false); 
  const spinTimer = useRef(0);
  const frameCounter = useRef(Math.floor(Math.random() * 3)); 
  const smoothedY = useRef(START_POS ? START_POS[1] : 0)
  const racerId = userData?.id || (isBot ? "bot" : "player");

  // Vettori riutilizzabili
  const v = useMemo(() => ({
      forwardGlobal: new Vector3(),
      rayOrigin: new Vector3(),
      rayDir: new Vector3()
  }), [])

  // --- LOGICA BULLET BILL ---
  const { isBulletBill, activateBulletBill } = useBulletBill({
      rb: rb, // Passiamo il ref interno
      waypoints: waypoints, 
      currentRank: rank || 8, // Default a ultimo se rank indefinito
      onEnd: () => {
         // Reset: quando finisce, azzera velocità o dai un piccolo boost
         if(rb.current) rb.current.setLinvel({x:0, y:0, z:0}, true);
      }
  });

  // Esposizione Metodi: Usiamo 'ref' esterno, ma chiamiamo metodi su 'rb' interno
  useImperativeHandle(ref, () => ({
      translation: () => rb.current?.translation(),
      rotation: () => rb.current?.rotation(),
      linvel: () => rb.current?.linvel(),
      triggerBulletBill: () => activateBulletBill()
  }));

  // --- INTEGRATION POWERUP ---
  const { currentItem, handleItemInput } = usePowerupHandler({
    boostTime: boostTime, 
    speed: speed,        
    SETTINGS: SETTINGS,    
    position: currentPosition,
    rotation: rotation,
    onSpawnBanana: onSpawnBanana,
    onSpawnGreenShell: onSpawnGreenShell,
    onSpawnRedShell: onSpawnRedShell,
    kartRef: rb // Passiamo il ref interno anche qui per sicurezza
  });
  
  // Gestione Eventi Colpo
  useEffect(() => {
    const handleBananaHit = (e) => {
        const victimId = e.detail?.victimId;
        // Se siamo Bullet Bill siamo invincibili, ignoriamo il colpo
        if (isBulletBill) return;

        if (victimId === racerId && !isSpinning.current) { 
            console.log(`${racerId} colpito! Spin out!`);
            isSpinning.current = true;
            spinTimer.current = 0.45; 
            speed.current = 0; 
            driftLevel.current = 0;
            boostTime.current = 0;
        }
    };
    window.addEventListener('banana-hit', handleBananaHit);
    return () => window.removeEventListener('banana-hit', handleBananaHit);
  }, [racerId, isBot, isBulletBill]); 

  const { checkSurface } = useHitboxHandler({
    speed, boostTime, SETTINGS, onCheckpoint, maxCheckpoints: trackConfig?.maxCheckpoints || 3
  })

  // Audio Lifecycle
  useEffect(() => {
    if (isRaceActive && !isBot) {
      const timeout = setTimeout(() => { startIdleAudio(); }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isRaceActive, isBot, startIdleAudio]);

  useEffect(() => {
    if (!isRaceActive && !isBot) { stopAllAudio(); }
  }, [isRaceActive, isBot, stopAllAudio]);

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

  // --- GESTIONE COLLISIONI FISICHE (RigidBody) ---
  const handleCollisionEnter = (payload) => {
      // Se siamo Bill, distruggiamo chi tocchiamo
      if (isBulletBill) {
          const targetObj = payload.other.rigidBodyObject;
          const targetName = targetObj?.name || "";
          if (targetName.startsWith('bot') || targetName === 'player') {
              console.log(`BULLET BILL SMASH: ${targetName}`);
              window.dispatchEvent(new CustomEvent('banana-hit', { 
                  detail: { victimId: targetName } 
              }));
          }
      }
  };

  useFrame((state, delta) => {
    if (!rb.current) return;

    // Aggiorna posizione corrente per la camera e logica
    const rbPos = rb.current.translation();
    const rbVel = rb.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    
    // Aggiorna UI
    if (!isBot && speedUiRef.current) {
        // Se siamo Bill, la velocità è alta (es. 85), calcoliamo display
        const displaySpeed = isBulletBill ? 120 : Math.abs(Math.round(speed.current * 1.5));
        speedUiRef.current.innerText = `${displaySpeed} km/h`
        const isOver = displaySpeed > SETTINGS.maxSpeed + 5
        speedUiRef.current.style.color = isBulletBill ? '#ff0000' : (isOver ? '#ff3300' : 'white')
        speedUiRef.current.style.transform = isOver || isBulletBill ? `scale(1.1)` : `scale(1)`
    }

	if (isBulletBill)
		console.log(`BULLET BILL VELOCITÀ: ${Math.abs(Math.round(speed.current * 1.5))} km/h`);

    // --- 0. COLLISIONI GROUND (Coda) ---
    if (collisionQueue.current.length > 0) {
        collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
        collisionQueue.current = [];
        collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
        collisionQueue.current = []; 
    }

    // Input Controllo
    const { forward, backward, left, right, drift, item } = activeControls.current
    handleItemInput(item);

    // Audio Update
    if (!isBot && !isBulletBill) {
      updateAudio(speed.current, forward);
    }

    // -----------------------------------------------------------
    // --- LOGICA BIFORCATA: BULLET BILL vs GUIDA NORMALE ---
    // -----------------------------------------------------------
    
    if (isBulletBill) {
        // A. BULLET BILL MODE
        const velLen = Math.sqrt(rbVel.x**2 + rbVel.z**2);
        speed.current = velLen; // Serve per la camera

        // Rotazione Visiva del Bullet Bill
        if (billVisualsRef.current) {
            // Ruota verso la direzione di movimento
            if (velLen > 0.1) {
                const angle = Math.atan2(rbVel.x, rbVel.z);
                const targetQ = new Quaternion().setFromEuler(new Euler(0, angle, 0));
                billVisualsRef.current.quaternion.slerp(targetQ, 10 * delta);
            }
        }
        
        // Aggiorna smoothedY per quando finisce l'effetto
        smoothedY.current = rbPos.y;
        
        // Reset variabili guida normale
        driftLevel.current = 0;
        driftDirection.current = 0;

    } else {
        // B. GUIDA NORMALE (Standard Kart Physics)
        
        if (isSpinning.current) {
            spinTimer.current -= delta;
            if (spinTimer.current <= 0) isSpinning.current = false;
        }

        // Drift Logic
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
            rb.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true);
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

        // Sparks Update
        if (!isBot) {
            updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);
        }

        // Calcolo Velocità
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

        // Sterzo e Rotazione
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

        // Raycast Anti-Wall & Gravity
        frameCounter.current++;
        let isHittingVerticalWall = false
        if (world && rapier && (!isBot || frameCounter.current % 2 === 0)) {
            v.forwardGlobal.set(0, 0, -1).applyAxisAngle(new Vector3(0,1,0), rotation.current).normalize()
            v.rayOrigin.copy(currentPosition.current).add(new Vector3(0, 0.5, 0))
            const ray = new rapier.Ray(v.rayOrigin, v.forwardGlobal)
            const hit = world.castRay(ray, PHYSICS_RADIUS + 1.0, true) 
            if (hit && hit.normal && Math.abs(hit.normal.y) < 0.3) {
                isHittingVerticalWall = true
            }
        }

        let newY = rbVel.y
        const gravity = 25 * delta;
        if (!isGrounded.current && !isJumping.current) {
            newY -= gravity
            rb.current.applyImpulse({ x: 0, y: -2000000.0 * delta, z: 0 }, true) 
        } 
        else if (isJumping.current) {
            newY -= 15 * delta 
        }

        if (isHittingVerticalWall && newY > 0 && !isJumping.current) {
            newY = 0 
        }
        
        // Applica Fisica Standard
        rb.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)
        const q = new Quaternion()
        q.setFromEuler(new Euler(0, rotation.current, 0))
        rb.current.setRotation(q, true)
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

        // Visual Smoothing (Solo Kart)
        const yDiff = Math.abs(rbPos.y - smoothedY.current);
        const smoothFactor = yDiff < 0.15 ? 5.0 : 40.0; 
        smoothedY.current = MathUtils.damp(smoothedY.current, rbPos.y, smoothFactor, delta);
        const visualLocalY = (smoothedY.current - rbPos.y) - PHYSICS_RADIUS + jumpOffset.current.y;

        if (visualGroupRef.current) {
            const driftTilt = isDrifting ? (driftDirection.current * 0.15) : 0;
            if (isSpinning.current) {
                visualGroupRef.current.rotation.y -= 25 * delta; 
                isSpinning.current = spinTimer.current > 0;
            } else {
                visualGroupRef.current.rotation.y = MathUtils.lerp(visualGroupRef.current.rotation.y, 0, 10 * delta);
            }
            visualGroupRef.current.position.y = visualLocalY;
            visualGroupRef.current.rotation.z = MathUtils.lerp(visualGroupRef.current.rotation.z, driftTilt, 0.1);
        }
    } // END ELSE (Normal Physics)

    // --- CAMERA UPDATE (Sempre attivo, ma adattato) ---
    if (!isBot) {
        // Se Bill attivo, simula una velocità alta per allontanare la camera
        const effSpeed = isBulletBill ? 100 : speed.current; 
        const overSpeed = Math.max(0, effSpeed - SETTINGS.maxSpeed)
        const boostRange = SETTINGS.maxTurboLimit - SETTINGS.maxSpeed
        const boostRatio = Math.min(overSpeed / boostRange, 1)
        const dynamicDistance = camConfig.distance + (boostRatio) 
        
        // Se Bill, usa la rotazione del RB (direzione movimento), altrimenti rotation.current (sterzo)
        const camRotRef = isBulletBill && rb.current ? new Euler().setFromQuaternion(rb.current.rotation()).y : rotation.current;

        const idealOffset = new Vector3(0, camConfig.height, dynamicDistance)
        idealOffset.applyAxisAngle(new Vector3(0, 1, 0), camRotRef)
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

  // Visual Steering
  const modelSteer = (activeControls.current.left ? 1 : 0) + (activeControls.current.right ? -1 : 0)

  // Handlers Sensore Terra
  const handleGroundEnter = (payload) => {
     const rootObj = payload.other.rigidBodyObject;
     if (!rootObj) return;
     const name = rootObj.name;
     if (name === 'player' || name.startsWith('bot')) return; 
     isGrounded.current = true;
     let foundName = '';
     let curr = rootObj;
     for (let i = 0; i < 3; i++) {
        if (!curr) break;
        const n = curr.name || '';
        if (n.startsWith('Check_') || n.includes('Road') || n.includes('Floor')) {
            foundName = n; break;
        }
        curr = curr.parent;
     }
     if (foundName) collisionQueue.current.push({ name: foundName });
  }

  const handleGroundExit = () => { isGrounded.current = false; }

  return (
    // USA rb QUI, non 'ref'
    <RigidBody 
        ref={rb} 
        position={START_POS} 
        rotation={START_ROT}
        mass={isBulletBill ? 1000 : 100} // Aumenta massa se Bill
        linearDamping={2}
        angularDamping={2} 
        type="dynamic" 
        ccd={true} 
        name={racerId} 
        userData={{ type: 'racer', id: racerId }}
        colliders={false} 
        lockRotations={true}
        restitution={0}
        restitutionCombine="min" 
        onCollisionEnter={handleCollisionEnter} // Gestione Smash Bill
    >
      <BallCollider 
          args={[PHYSICS_RADIUS]} 
          position={[0, 0, 0]} 
          friction={0.0}
          frictionCombine="min"
          restitution={0}
          restitutionCombine="min" 
      />

      <CylinderCollider 
         args={[0.2, 0.5]} 
         position={[0, -PHYSICS_RADIUS + 0.2, 0]} 
         sensor={true} 
         onIntersectionEnter={handleGroundEnter}
         onIntersectionExit={handleGroundExit}
      />

      {!isBot && <SpeedEffect boostTimeRef={boostTime} isBulletBill={isBulletBill} />}
      
      {!isBot && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
                <span ref={speedUiRef}>0 km/h</span>
                <div style={{fontSize:'24px', color: '#FFD700', marginTop: 10}}>
                   ITEM: {currentItem}
                </div>
                <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>SPACE TO HOP/DRIFT | E to ITEM</div>
            </div>
        </Html>
      )}

      {/* --- GRUPPO 1: KART NORMALE --- */}
      <group ref={visualGroupRef} visible={!isBulletBill} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
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
          
          {!isBot && (
              <>
                  <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft}><DriftParticles ref={leftSparksRef} count={45} /></WheelPosition>
                  <WheelPosition position={[0.6, 0, 0.8]} ref={backRight}><DriftParticles ref={rightSparksRef} count={45} /></WheelPosition>
              </>
          )}
      </group>

      {/* --- GRUPPO 2: BULLET BILL --- */}
      <group ref={billVisualsRef} visible={isBulletBill} scale={[2.5, 2.5, 2.5]}>
           <primitive object={billScene} />
      </group>

    </RigidBody>
  )
});