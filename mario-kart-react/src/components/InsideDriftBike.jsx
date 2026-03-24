// import React, { useRef, useState, useMemo, useEffect, forwardRef } from 'react'
// import { useFrame, useThree } from '@react-three/fiber'
// import { RigidBody, BallCollider, CylinderCollider, useRapier } from '@react-three/rapier' 
// import { Vector3, MathUtils, Quaternion, Euler, Color } from 'three' 
// import * as THREE from 'three' 
// import { Html } from '@react-three/drei' 
// import gsap from 'gsap'

// // Assicurati che il percorso di questi import sia corretto nel tuo progetto
// import { useControls as useGameControls } from '../hooks/useControls' 
// import { RacerModel } from '../models/RacerModel'
// import { VehicleModel } from '../models/VehicleModel'
// import { useHitboxHandler } from '../hooks/HitboxHandler' 
// import { useKartAudio } from '../hooks/useKartAudio' 
// import { useBotAI } from '../Bot/UseBotAI'
// import { useAudio, AUDIO_SFX } from '../audio/AudioManager'

// // --- 1. COSTANTI E SETTINGS SPECIFICI MOTO ---
// const KART_SIZE = 1 
// const PHYSICS_RADIUS = 1 

// const cBlue = new THREE.Color(0x00FFFF); 
// // cRed rimosso perché le moto inside drift (solitamente) non hanno il lv2 in MK Wii, o come richiesto

// const DEFAULT_SETTINGS = {
//   maxSpeed: 45,        // Leggermente più veloce di base
//   wheelieSpeed: 55,    // Velocità durante l'impennata
//   maxTurboLimit: 60,        
//   acceleration: 0.20,        
//   deceleration: 2.0,        
//   turnSpeed: 0.9,
//   driftTurnSpeed: 1.1, // Inside drift sterza di più in derapata
//   driftGrip: 0.02, 
//   boostStrength: 0,           
//   boostDuration: 60,        
//   jumpForce: 0,           
//   driftLevel1Time: 1.5,    
//   driftMinSpeed: 10,        
//   slideOutForce: 0.05, 
// }

// // --- 2. SISTEMA PARTICELLE (Spark Texture) ---
// function getNintendoSparkTexture() {
//   if (typeof document === 'undefined') return null;
//   const canvas = document.createElement('canvas');
//   const size = 64; 
//   canvas.width = size; canvas.height = size;
//   const ctx = canvas.getContext('2d');
//   const cx = size / 2; const cy = size / 2;
//   const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
//   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
//   gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
//   ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
//   ctx.fillStyle = "white"; ctx.beginPath();
//   const outerRadius = size * 0.45; const innerRadius = size * 0.15;
//   for (let i = 0; i < 4; i++) {
//     const angle = (i * Math.PI) / 2; 
//     ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
//     const angleInner = angle + Math.PI / 4;
//     ctx.lineTo(cx + Math.cos(angleInner) * innerRadius, cy + Math.sin(angleInner) * innerRadius);
//   }
//   ctx.closePath(); ctx.fill();
//   const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; 
//   return tex;
// }

// // --- 3. COMPONENTE PARTICELLE ---
// const DriftParticles = React.forwardRef((props, ref) => {
//   const { count = 45 } = props; 
//   const points = useRef();
//   const texture = useMemo(() => getNintendoSparkTexture(), []);
//   const [data] = useState(() => ({
//       positions: new Float32Array(count * 3), velocities: new Float32Array(count * 3), 
//       life: new Float32Array(count), sizes: new Float32Array(count)            
//   }));

//   const resetParticle = (i) => {
//     data.positions[i * 3] = (Math.random() - 0.5) * 0.1;
//     data.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
//     data.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
//     data.velocities[i * 3 + 2] = 10 + Math.random() * 8; 
//     data.velocities[i * 3 + 1] = Math.random() * 3; 
//     data.velocities[i * 3] = (Math.random() - 0.5) * 4;
//     data.life[i] = 0.5 + Math.random() * 0.5; 
//   };
//   useMemo(() => { for (let i = 0; i < count; i++) resetParticle(i); }, []);

//   useFrame((state, delta) => {
//     if (!points.current || !ref.current || !ref.current.visible) return;
//     const pos = points.current.geometry.attributes.position.array;
//     for (let i = 0; i < count; i++) {
//       data.life[i] -= delta * 3.5; 
//       if (data.life[i] <= 0) resetParticle(i);
//       else {
//         pos[i * 3] += data.velocities[i * 3] * delta;      
//         pos[i * 3 + 1] += data.velocities[i * 3 + 1] * delta; 
//         pos[i * 3 + 2] += data.velocities[i * 3 + 2] * delta; 
//         data.velocities[i * 3 + 1] -= 9.8 * delta;
//         data.velocities[i * 3 + 2] *= 0.95; data.velocities[i * 3] *= 0.95;
//         if (pos[i * 3 + 1] < -0.2) { pos[i * 3 + 1] = -0.2; data.velocities[i * 3 + 1] *= -0.5; }
//       }
//     }

//     points.current.geometry.attributes.position.needsUpdate = true;
//   });
//   if (!texture) return null;
//   return (<group ref={ref} visible={false}><points ref={points} renderOrder={10}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} /></bufferGeometry><pointsMaterial map={texture} size={0.8} color="white" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} vertexColors={false} /></points></group>);
// });

// function updateSparksColor(level, leftRef, rightRef) {
//     if (!leftRef || !rightRef) return;
//     const show = level > 0;
//     if (leftRef.visible !== show) leftRef.visible = show;
//     if (rightRef.visible !== show) rightRef.visible = show;
//     if (!show) return;
//     // Solo BLU per la moto Inside Drift
//     const targetColor = cBlue; 
//     const applyColor = (obj) => {
//         obj.traverse((child) => {
//             if (child.isPoints || child.isMesh) {
//                 const mat = Array.isArray(child.material) ? child.material[0] : child.material;
//                 if (!mat) return;
//                 if (mat.vertexColors === true) { mat.vertexColors = false; mat.needsUpdate = true; }
//                 if (mat.color && mat.color.isColor) { mat.color.lerp(targetColor, 0.3); }
//             }
//         });
//     };
//     applyColor(leftRef); applyColor(rightRef);
// }

// export const InsideDriftBike = forwardRef((props, ref) => {
//   const { 
//     characterConfig, selectedCharacter, vehicleConfig, START_POS, onCheckpoint, trackConfig, 
//     isBot = false, waypoints = [], SETTINGS = DEFAULT_SETTINGS, START_ROT = [0, 0, 0], paths = [], userData,
//     isRaceActive = true
//   } = props;
  
//   const { scene } = useThree()
//   const controls = useGameControls() 
  
//   // Hook per gestire gli SFX della bike
//   const { updateAudio, startIdleAudio, stopAllAudio } = useKartAudio({ 
//     isBike: true, 
//     isActive: isRaceActive 
//   })
  
//   // Hook per gestire gli SFX generici
//   const { playSfx } = useAudio()
  
//   const { world, rapier } = useRapier()
  
//   const internalRef = useRef(null)
//   const rigidBody = ref || internalRef
  
//   const humanControls = useGameControls() 
//   const botControls = useBotAI({ isBot, rigidBody, paths })
//   const activeControls = isBot ? botControls : humanControls

//   const collisionQueue = useRef([]) 

//   const camConfig = {
//     distance: 7.2, height: 2.3, lookAtHeight: 1.0, stiffness: 0.2, fovBase: 53, fovMax: 55
//   }

//   const initialRotationY = START_ROT ? START_ROT[1] : 0

//   const speedUiRef = useRef() 
//   const driftDirection = useRef(0) 
//   const speed = useRef(0)
//   const rotation = useRef(initialRotationY) 
//   const driftVector = useRef(new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), initialRotationY))

//   const currentPosition = useRef(new Vector3())
//   const cameraTarget = useRef(new Vector3(0, 0, 0))

//   const isGrounded = useRef(false)
//   const driftTime = useRef(0)       
//   const driftLevel = useRef(0)      
//   const pendingBoost = useRef(false)
//   const boostTime = useRef(0)
//   const driftHopLocked = useRef(false)
//   const driftEngageWindow = useRef(false) 
//   const isJumping = useRef(false)
//   const jumpOffset = useRef({ y: 0 }) 
//   const visualGroupRef = useRef() 
//   const backLeft = useRef()
//   const backRight = useRef()
//   const leftSparksRef = useRef()
//   const rightSparksRef = useRef()
  
//   // --- NUOVI REF PER IMPENNATA ---
//   const isWheeling = useRef(false) // Stato attuale
//   const wheeliePressed = useRef(false) // Latch per il toggle del tasto
  
//   const smoothedY = useRef(START_POS ? START_POS[1] : 0)

//   const racerId = userData?.id || (isBot ? "bot" : "player");

//   const v = useMemo(() => ({
//       forwardGlobal: new Vector3(),
//       rayOrigin: new Vector3(),
//       rayDir: new Vector3()
//   }), [])

//   const { checkSurface } = useHitboxHandler({
//     speed, boostTime, SETTINGS, onCheckpoint, maxCheckpoints: trackConfig?.maxCheckpoints || 3,
//     selectedCharacter, playSfx, AUDIO_SFX
//   })

//   // Avvia l'audio IDLE quando la gara inizia
//   useEffect(() => {
//     if (isRaceActive) {
//       // Piccolo delay per assicurarsi che l'audio context sia pronto
//       const timeout = setTimeout(() => {
//         startIdleAudio();
//       }, 100);
//       return () => clearTimeout(timeout);
//     }
//   }, [isRaceActive, startIdleAudio]);

//   // Ferma tutti i suoni quando si esce dalla gara
//   useEffect(() => {
//     if (!isRaceActive) {
//       stopAllAudio();
//     }
//   }, [isRaceActive, stopAllAudio]);

//   const performHop = () => {
//     if (isJumping.current) return
//     isJumping.current = true
//     gsap.to(jumpOffset.current, {
//       y: 0.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out",
//       onComplete: () => { isJumping.current = false }
//     })
//   }

//   const activateBoost = (level) => {
//     // Le moto hanno solo livello 1 solitamente
//     const durationMult = 1.0 
//     boostTime.current = SETTINGS.boostDuration * durationMult
//     pendingBoost.current = false
//   }

//   useFrame((state, delta) => {
//     if (!rigidBody.current) return;

//     // --- 0. GESTIONE COLLISIONI ---
//     if (collisionQueue.current.length > 0) {
//         collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
//         collisionQueue.current = [];
//     }

//     // --- UI Update ---
//     if (!isBot && speedUiRef.current) {
//         const kmh = Math.abs(Math.round(speed.current * 1.5)) 
//         speedUiRef.current.innerText = `${kmh} km/h`
//         const isOver = speed.current > SETTINGS.maxSpeed + 5
//         speedUiRef.current.style.color = isOver ? '#ff3300' : 'white'
//         speedUiRef.current.style.transform = isOver ? `scale(1.1)` : `scale(1)`
//     }

//     // --- Input & Stati ---
//     const rbPos = rigidBody.current.translation();
//     const rbVel = rigidBody.current.linvel();
//     currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    
//     let groundDist = Infinity; 

//     // --- Raycast Logic ---
//     if (scene) {
//         const safeRaycast = (origin, direction, limitDistance) => {
//             try {
//                 raycaster.current.set(origin, direction);
//                 raycaster.current.far = limitDistance; 
//                 const hits = raycaster.current.intersectObjects(scene.children, true);
                
//                 return hits.find(hit => {
//                     let obj = hit.object;
//                     while (obj) {
//                           if (obj.uuid === visualGroupRef.current?.uuid) return false;
//                           obj = obj.parent;
//                     }
//                     return true;
//                 });
//             } catch (e) {
//                 return null;
//             }
//         };

//         const downOrigin = currentPosition.current.clone();
//         downOrigin.y += 0.5; 
//         const groundHit = safeRaycast(downOrigin, new Vector3(0, -1, 0), 5);
        
//         if (groundHit) {
//             groundDist = groundHit.distance - 0.5 - PHYSICS_RADIUS;
//             checkSurface(groundHit.object);
//         }
//         isGrounded.current = groundDist < 0.6;

//         const forwardDir = new Vector3(0, 0, -1)
//             .applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
//             .normalize();
        
//         const frontOrigin = currentPosition.current.clone();
//         frontOrigin.y += 1.0; 
//         const wallHit = safeRaycast(frontOrigin, forwardDir, 3.5);
//         if (wallHit) {
//              checkSurface(wallHit.object);
//         }
//   }
    
//     const { forward, backward, left, right, drift, wheelie } = activeControls.current
    
//     // --- LOGICA IMPENNATA (WHEELIE) ---
//     // 1. Toggle Logic (Premi una volta per attivare, premi di nuovo per disattivare)
//     if (wheelie && !wheeliePressed.current) {
//         // Rilevato fronte di salita del tasto
//         if (isGrounded.current && !drift && Math.abs(speed.current) > 5) {
//              // Toggle stato
//              isWheeling.current = !isWheeling.current;
//         }
//         wheeliePressed.current = true;
//     } else if (!wheelie) {
//         wheeliePressed.current = false;
//     }

//     // 2. Cancellation Logic (Drift cancella impennata)
//     if (drift || backward || !isGrounded.current || speed.current < 2) {
//         if(drift) isWheeling.current = false; // Il drift ha priorità e cancella l'impennata
//     }

//     // --- LOGICA DRIFT (Limitata a Livello 1) ---
//     if (!drift) {
//         driftHopLocked.current = false; driftEngageWindow.current = false 
//         if (driftDirection.current !== 0) {
//             if (driftLevel.current > 0) {
//                 if (isGrounded.current) activateBoost(driftLevel.current);
//                 else pendingBoost.current = true;
//             }
//             driftDirection.current = 0; driftTime.current = 0; driftLevel.current = 0;
//         }
//     } else {
//         if (isGrounded.current && !isJumping.current && driftDirection.current === 0) driftEngageWindow.current = false;
//     }
    
//     // Hop mechanics
//     if (drift && !driftHopLocked.current && isGrounded.current && !isJumping.current) {
//         driftHopLocked.current = true; driftEngageWindow.current = true; 
//         performHop();
//         // Le moto spesso saltano un po' meno dei kart, o uguale
//         rigidBody.current.setLinvel({ x: rbVel.x, y: SETTINGS.jumpForce, z: rbVel.z }, true);
//     }

//     // Drift mechanics
//     if (drift) {
//         // Se stiamo impennando, l'abbiamo cancellato sopra, quindi qui siamo sicuri che isWheeling è false se stiamo driftando
//         if (driftDirection.current === 0 && driftEngageWindow.current) {
//             const rightVector = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
//             if (left) { driftDirection.current = 1; driftVector.current.add(rightVector.multiplyScalar(SETTINGS.slideOutForce)) } 
//             else if (right) { driftDirection.current = -1; driftVector.current.add(rightVector.multiplyScalar(-SETTINGS.slideOutForce)) }
//         }
//         if (driftDirection.current !== 0 && isGrounded.current) {
//              driftTime.current += delta;
//              // MODIFICA: Solo Livello 1 (Scintille Blu)
//              if (driftTime.current > SETTINGS.driftLevel1Time) driftLevel.current = 1;
//              else driftLevel.current = 0;
//         }
//     } else {
//         if (pendingBoost.current && isGrounded.current) activateBoost(1);
//     }
//     updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);
    
//     // --- Engine Speed Calculation ---
//     const isBoosting = boostTime.current > 0
//     if (isBoosting) boostTime.current -= 1
//     const isDrifting = driftDirection.current !== 0
    
//     // Aggiorna audio SFX (motore + drift sounds)
//     updateAudio(speed.current, forward, driftLevel.current, isDrifting);
    
//     // Velocità Base
//     let currentSpeedLimit = SETTINGS.maxSpeed
    
//     if (isBoosting) {
//         currentSpeedLimit = SETTINGS.maxTurboLimit
//     } else if (isWheeling.current) {
//         // AUMENTO VELOCITÀ IMPENNATA
//         currentSpeedLimit = SETTINGS.wheelieSpeed || (SETTINGS.maxSpeed * 1.15);
//     } else if (isDrifting) {
//         currentSpeedLimit += 5 
//     }

//     let targetSpeed = 0
//     if (forward) targetSpeed = currentSpeedLimit
//     if (backward) targetSpeed = -currentSpeedLimit * 0.5
    
//     // Decelerazione
//     const isOverspeeding = speed.current > currentSpeedLimit + 2;

//     if (forward && !isBoosting && isOverspeeding) {
//         speed.current = MathUtils.damp(speed.current, currentSpeedLimit, SETTINGS.deceleration, delta)
//     } else {
//         let currentAccel = SETTINGS.acceleration
//         if (isBoosting) currentAccel *= 2.5
//         else if (!forward && !backward) currentAccel = SETTINGS.deceleration 
//         speed.current = MathUtils.damp(speed.current, targetSpeed, currentAccel, delta)
//     }

//     // --- Steering ---
//     let turnFactor = 0
//     if (isDrifting) {
//         const isLeftDrift = driftDirection.current === 1
//         // Inside Drift Bikes tipicamente sterzano molto stretto
//         if (isLeftDrift) turnFactor = left ? SETTINGS.driftTurnSpeed * 1.5 : (right ? SETTINGS.driftTurnSpeed * 0.1 : SETTINGS.driftTurnSpeed)
//         else turnFactor = right ? -SETTINGS.driftTurnSpeed * 1.5 : (left ? -SETTINGS.driftTurnSpeed * 0.1 : -SETTINGS.driftTurnSpeed)
//     } else {
//         if (Math.abs(speed.current) > 1.0) {
//             const reverseFactor = speed.current < 0 ? -1 : 1
            
//             // PENALITÀ STERZATA IN IMPENNATA
//             let steerMulti = 1.0;
//             if (isWheeling.current) steerMulti = 0.35; // Sterzi molto meno mentre impenni

//             if (left) turnFactor = SETTINGS.turnSpeed * reverseFactor * steerMulti
//             if (right) turnFactor = -SETTINGS.turnSpeed * reverseFactor * steerMulti
//         }
//     }
//     rotation.current += turnFactor * delta
    
//     const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
//     const driftGrip = isDrifting ? SETTINGS.driftGrip : 0.15
//     const airControl = isGrounded.current ? 1 : 0.5 
//     driftVector.current.lerp(forwardVector, driftGrip * 60 * delta * airControl)
//     const finalVelocity = driftVector.current.clone().multiplyScalar(speed.current)


//     // --- FISICA ANTI-WALL & GRAVITÀ ---
//     let isHittingVerticalWall = false
//     if (world && rapier) {
//         v.forwardGlobal.set(0, 0, -1).applyAxisAngle(new Vector3(0,1,0), rotation.current).normalize()
//         v.rayOrigin.copy(currentPosition.current).add(new Vector3(0, 0.5, 0))
//         const ray = new rapier.Ray(v.rayOrigin, v.forwardGlobal)
//         const hit = world.castRay(ray, PHYSICS_RADIUS + 1.0, true) 
//         if (hit && hit.normal && Math.abs(hit.normal.y) < 0.3) {
//             isHittingVerticalWall = true
//         }
//     }

//     let newY = rbVel.y
//     const gravity = 25 * delta;

//     if (!isGrounded.current && !isJumping.current) {
//         newY -= gravity
//         rigidBody.current.applyImpulse({ x: 0, y: -2000000.0, z: 0 }, true)
//     } 
//     else if (isJumping.current) {
//         newY -= 15 * delta 
//     }

//     if (isHittingVerticalWall && newY > 0 && !isJumping.current) {
//         newY = 0 
//     }
    
//     rigidBody.current.setLinvel({ x: finalVelocity.x, y: newY, z: finalVelocity.z }, true)

//     // Rotazione Fisica
//     const q = new Quaternion()
//     q.setFromEuler(new Euler(0, rotation.current, 0))
//     rigidBody.current.setRotation(q, true)
//     rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

//     // --- VISUAL SMOOTHING & WHEELIE VISUALS ---
//     const yDiff = Math.abs(rbPos.y - smoothedY.current);
//     const smoothFactor = yDiff < 0.15 ? 5.0 : 40.0; 
//     smoothedY.current = MathUtils.damp(smoothedY.current, rbPos.y, smoothFactor, delta);

//     // Calcolo Y visuale base
//     let visualLocalY = (smoothedY.current - rbPos.y) - PHYSICS_RADIUS + jumpOffset.current.y;

//     if (visualGroupRef.current) {
//         // Rotazione Z per Drift
//         const driftTilt = isDrifting ? (driftDirection.current * 0.30) : 0; // Le moto piegano di più
        
//         // Rotazione X per Impennata (Wheelie)
//         // Se isWheeling è true, ruotiamo all'indietro (valore negativo su X)
//         const targetWheelieTilt = isWheeling.current ? 0.5 : 0;
        
//         // Offset Y per Impennata (Alzare un po' il modello per non far penetrare la ruota posteriore nel terreno quando ruota)
//         const targetWheelieLift = isWheeling.current ? 0.4 : 0;

//         visualLocalY += targetWheelieLift;

//         // Applicazione trasformazioni visive
//         visualGroupRef.current.position.y = visualLocalY;
        
//         // Lerp per fluidità nell'inizio/fine impennata
//         visualGroupRef.current.rotation.x = MathUtils.lerp(visualGroupRef.current.rotation.x, targetWheelieTilt, 0.1);
//         visualGroupRef.current.rotation.z = MathUtils.lerp(visualGroupRef.current.rotation.z, driftTilt, 0.1);
//     }

//     // Camera Update (Solo Player)
//     if (!isBot) {
//         const overSpeed = Math.max(0, speed.current - SETTINGS.maxSpeed)
//         const boostRange = SETTINGS.maxTurboLimit - SETTINGS.maxSpeed
//         const boostRatio = Math.min(overSpeed / boostRange, 1)
//         const dynamicDistance = camConfig.distance + (boostRatio) 
//         const idealOffset = new Vector3(0, camConfig.height, dynamicDistance)
//         idealOffset.applyAxisAngle(new Vector3(0, 1, 0), rotation.current)
//         const desiredCamPos = new Vector3().copy(currentPosition.current).add(idealOffset)
//         state.camera.position.lerp(desiredCamPos, camConfig.stiffness)
//         const targetLookAt = new Vector3(
//             currentPosition.current.x, currentPosition.current.y + camConfig.lookAtHeight, currentPosition.current.z
//         )
//         cameraTarget.current.lerp(targetLookAt, camConfig.stiffness * 1.5)
//         state.camera.lookAt(cameraTarget.current)
//         state.camera.updateProjectionMatrix()
//     }
//   })

//   const modelSteer = (activeControls.current.left ? 1 : 0) + (activeControls.current.right ? -1 : 0)

//   // --- Handlers Sensore Terra ---
//   const handleGroundEnter = (payload) => {
//      const rootObj = payload.other.rigidBodyObject;
//      if (!rootObj) return;
//      const name = rootObj.name;
//      if (name === socket.id || name === 'bot') return;
//      isGrounded.current = true;
//      let foundName = '';
//      let curr = rootObj;
//      for (let i = 0; i < 3; i++) {
//         if (!curr) break;
//         const n = curr.name || '';
//         if (n.includes('Check_') || n.includes('_boost') || 
//             n.includes('_grass') || n.includes('_outBound') || 
//             n.includes('Road') || n.includes('Floor')) {
//             foundName = n; break;
//         }
//         curr = curr.parent;
//      }
//      if (foundName) collisionQueue.current.push({ name: foundName });
//   }

//   const handleGroundExit = () => { isGrounded.current = false; }

//   return (
//     <RigidBody 
//         ref={rigidBody} 
//         position={START_POS} 
//         rotation={START_ROT}
//         mass={100} 
//         linearDamping={2} 
//         angularDamping={2} 
//         type="dynamic" 
//         ccd={true} 
//         name={racerId} 
//         userData={{ type: 'racer', id: racerId }}
//         colliders={false} 
//         lockRotations={true}
//         restitution={0} 
//         restitutionCombine="min" 
//     >
//       <BallCollider 
//           args={[PHYSICS_RADIUS]} 
//           position={[0, 0, 0]} 
//           friction={0.0}
//           frictionCombine="min"
//           restitution={0}
//           restitutionCombine="min" 
//       />

//       <CylinderCollider 
//           args={[0.2, 0.5]} 
//           position={[0, -PHYSICS_RADIUS + 0.2, 0]} 
//           sensor={true} 
//           onIntersectionEnter={handleGroundEnter}
//           onIntersectionExit={handleGroundExit}
//       />
      
//       {!isBot && (
//         <Html fullscreen style={{ pointerEvents: 'none' }}>
//             <div style={{ position: 'absolute', top: '40px', right: '40px', color: 'white', fontFamily:'sans-serif', fontWeight:'bold', fontSize: '40px', display: 'flex', flexDirection:'column', alignItems:'flex-end' }}>
//                 <span ref={speedUiRef}>0 km/h</span>
//                 <div style={{fontSize:'14px', opacity:0.7, marginTop:5}}>SHIFT: WHEELIE | SPACE: DRIFT</div>
//             </div>
//         </Html>
//       )}

//       <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]} scale={[KART_SIZE, KART_SIZE, KART_SIZE]}>
//             <group position={vehicleConfig.vehicleOffset}>
//                 {/* NOTA: isBike={true} assicura che il modello usi le animazioni da moto se disponibili */}
//                 <VehicleModel 
//                   vehicleConfig={vehicleConfig.modelConfig} scale={1.4} rotation={[0, Math.PI, 0]} 
//                   position={[0, 0, 0]} steer={modelSteer} drift={driftDirection.current} speed={speed.current} isBike={true}
//                 />
//                 <group rotation={[0, Math.PI, 0]}>
//                   <RacerModel 
//                       isInMenu={false} scale={1.5} characterConfig={characterConfig} vehicleConfig={vehicleConfig} 
//                       steer={modelSteer} drift={driftDirection.current} speed={speed.current} isKart={true}
//                     key={vehicleConfig.name + "_racer"}
//                   />
//                 </group>
//             </group>    
//             <WheelPosition position={[-0.6, 0, 0.8]} ref={backLeft}><DriftParticles ref={leftSparksRef} count={45} /></WheelPosition>
//             <WheelPosition position={[0.6, 0, 0.8]} ref={backRight}><DriftParticles ref={rightSparksRef} count={45} /></WheelPosition>
//       </group>
//     </RigidBody>
//   )
// });

// const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))