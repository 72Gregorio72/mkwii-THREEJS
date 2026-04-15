import React, { useRef, useState, useMemo, forwardRef, useEffect, useImperativeHandle } from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import { RigidBody, BallCollider, CylinderCollider, useRapier } from '@react-three/rapier'
import { Vector3, MathUtils, Quaternion, Euler, Color } from 'three'
import * as THREE from 'three'
import { Html, useGLTF , PositionalAudio } from '@react-three/drei'
import gsap from 'gsap'

// --- IMPORTS CUSTOM ---
import { useControls as useGameControls } from '../hooks/useControls' 
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { useHitboxHandler } from '../hooks/HitboxHandler' 
import { useBotAI } from '../Bot/UseBotAI'
import { usePowerupHandler } from '../Items/PowerupHandler.jsx';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { usePositionalKartAudio } from '../hooks/usePositionalKartAudio';
import { SkeletonUtils } from 'three-stdlib'

import { useBulletBill } from '../Items/BulletBill'; 

// --- 1. COSTANTI E SETTINGS ---
const KART_SIZE = 1 
const PHYSICS_RADIUS = 1 

const STAR_DURATION = 10000; // 10 secondi
const STAR_SPEED_BOOST = 1.15;

const MEGA_DURATION = 12000; // Dura un po' più della stella
const MEGA_SCALE = 2.5;      // Diventa 2.5 volte più grande
const MEGA_SPEED_BOOST = 1.3;

const SMALL_DURATION = 10000; // Rimani piccolo per 10 secondi
const SMALL_SCALE = 0.5;      // Diventi la metà
const SMALL_SPEED_PENALTY = 0.6;

const cBlue = new THREE.Color(0x00BFFF); // Blu drift (azzurro)
const cOrange = new THREE.Color(0xF24807); // Arancione/giallo per drift potente 

const DEFAULT_SETTINGS = {
    maxSpeed: 40,
  maxTurboLimit: 55,        
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
  const { count = 30 } = props; 
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

  const updateCounter = useRef(0);
  useFrame((state, delta) => {
    if (!points.current || !ref.current || !ref.current.visible) return;
    
    // Aggiorna solo ogni 2 frame per ridurre carico
    updateCounter.current++;
    if (updateCounter.current % 2 !== 0) return;
    
    const pos = points.current.geometry.attributes.position.array;
    const adjustedDelta = delta * 2; // Compensa per frame saltati
    
    for (let i = 0; i < count; i++) {
      data.life[i] -= adjustedDelta * 3.5; 
      if (data.life[i] <= 0) resetParticle(i);
      else {
        pos[i * 3] += data.velocities[i * 3] * adjustedDelta;      
        pos[i * 3 + 1] += data.velocities[i * 3 + 1] * adjustedDelta; 
        pos[i * 3 + 2] += data.velocities[i * 3 + 2] * adjustedDelta; 
        data.velocities[i * 3 + 1] -= 9.8 * adjustedDelta;
        data.velocities[i * 3 + 2] *= 0.95; data.velocities[i * 3] *= 0.95;
        if (pos[i * 3 + 1] < -0.2) { pos[i * 3 + 1] = -0.2; data.velocities[i * 3 + 1] *= -0.5; }
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  if (!texture) return null;
  return (<group ref={ref} visible={false}><points ref={points} renderOrder={10}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} /></bufferGeometry><pointsMaterial map={texture} size={0.8} color={0x00BFFF} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} vertexColors={false} /></points></group>);
});

function updateSparksColor(level, leftRef, rightRef) {
    if (!leftRef || !rightRef) return;
    const show = level > 0;
    if (leftRef.visible === show && rightRef.visible === show && !show) return;

    if (leftRef.visible !== show) leftRef.visible = show;
    if (rightRef.visible !== show) rightRef.visible = show;
    if (!show) return;
    
    const targetColor = level === 2 ? cOrange : cBlue;
    const applyColor = (obj) => {
        if(!obj) return;
        const pointChild = obj.children[0]; 
        if (pointChild && pointChild.material && pointChild.material.color.isColor) {
             // Usa copy() per impostare il colore direttamente invece di lerp lento
             pointChild.material.color.copy(targetColor); 
        }
    };
    applyColor(leftRef); applyColor(rightRef); 
}

const WheelPosition = React.forwardRef(({ position, children }, ref) => (<group position={position} ref={ref}>{children}</group>))

// --- 4. SPEED LINES EFFECT ---
const SpeedEffect = ({ boostTimeRef, isBulletBill }) => {
  const meshRef = useRef()
  const count = 12  // Ridotto da 20 a 12 per performance
  const rb = useRef(null);
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

export const OutsideDriftKart = React.memo(forwardRef((props, ref) => {
  const { 
    characterConfig, selectedCharacter, vehicleConfig, START_POS, onCheckpoint, trackConfig, 
    isBot = false, waypoints = [], SETTINGS = DEFAULT_SETTINGS, START_ROT = [0, 0, 0], paths = [], userData,
    isRaceActive = true, onSpawnBanana, onSpawnGreenShell, onSpawnRedShell, rank, onSpawnBlueShell, onSpawnBomb, onHitOpponent, gameState,
	positions, botRefs, socket, finished = false, roomCode, maxSpeed, isTimeTrial, isPaused = false
  } = props;
  
//   const { scene } = useThree()
  const { world, rapier } = useRapier()
  
  // FIX CRITICO: Usa SEMPRE un ref interno distinto da quello esterno per evitare loop infiniti
  const rb = useRef(null) 

  // Caricamento modello Bullet Bill
  const { scene } = useGLTF('/items/BulletBill.glb');

  const isStarActive = useRef(false);
  const starTimer = useRef(null);
  const originalMaterials = useRef(new Map()); // Per salvare i colori originali

  const isMegaActive = useRef(false);
  const megaTimer = useRef(null);

  const isSmall = useRef(false);
  const smallTimer = useRef(null);

  // Refs audio SFX
  const BananaHitAudioRef = useRef();
  const starStateAudioRef = useRef();
  const thunderLoopAudioRef = useRef();
  const thunderSmallAudioRef = useRef();
  const thunderBigAudioRef = useRef();
  const megaMushroomStateAudioRef = useRef();
  const megaMushroomShrinkAudioRef = useRef();
  const megaMushroomUseAudioRef = useRef();

    // --- TIMERS CLEANUP ---
    useEffect(() => {
        return () => {
        // Clear timers to prevent interacting with destroyed Rapier objects
        if (megaTimer.current) clearTimeout(megaTimer.current);
        if (starTimer.current) clearTimeout(starTimer.current);
        if (smallTimer.current) clearTimeout(smallTimer.current);
        
        // Optional: Reset mass immediately if unmounting while mega is active 
        // (Though usually unnecessary since the body is being destroyed anyway)
        isMegaActive.current = false;
        isStarActive.current = false;
        isSmall.current = false;
        };
    }, []);


  const activateMega = () => {
      isMegaActive.current = true;

      if (megaMushroomUseAudioRef.current && megaMushroomStateAudioRef.current) {
        megaMushroomUseAudioRef.current.play();
        megaMushroomStateAudioRef.current.play();
      }
      
      // Abbassa il volume della musica di gioco durante il Mega Fungo
      if (!isBot) duckMusicVolume();
      if (rb.current) {
          rb.current.setAdditionalMass(500, true); // Diventa pesantissimo
      }

      // Timer per disattivare
      if (megaTimer.current) clearTimeout(megaTimer.current);
      megaTimer.current = setTimeout(() => {
          deactivateMega();
      }, MEGA_DURATION);
  };

  const deactivateMega = () => {
      isMegaActive.current = false;
      
      if (megaMushroomStateAudioRef.current) {
            megaMushroomStateAudioRef.current.stop();
      }

      if (megaMushroomShrinkAudioRef.current) {
          megaMushroomShrinkAudioRef.current.play();
      }
      // Reset Massa
      if (rb.current) {
          rb.current.setAdditionalMass(0, true);
      }
      
      // Ripristina il volume della musica di gioco
      if (!isBot) restoreMusicVolume();
  };


  const activateLightning = () => {
      if (isSmall.current) {
          // Se è già piccolo, resettiamo solo il timer invece di far ripartire l'audio
          if (smallTimer.current) clearTimeout(smallTimer.current);
          smallTimer.current = setTimeout(() => {
              deactivateLightning();
          }, SMALL_DURATION);
          return;
      }
      
      isSmall.current = true;
      if (thunderSmallAudioRef.current) {
          if (thunderSmallAudioRef.current.isPlaying) thunderSmallAudioRef.current.stop();
          try {
              thunderSmallAudioRef.current.play();
          } catch (e) {}
      }
      if (thunderLoopAudioRef.current) {
          if (thunderLoopAudioRef.current.isPlaying) thunderLoopAudioRef.current.stop();
          thunderLoopAudioRef.current.setVolume?.(0.5);
          try {
              thunderLoopAudioRef.current.play();
          } catch (e) {}
      }

      if (smallTimer.current) clearTimeout(smallTimer.current);
      smallTimer.current = setTimeout(() => {
          deactivateLightning();
      }, SMALL_DURATION);
  };

  const deactivateLightning = () => {
      isSmall.current = false;
      
      if (thunderLoopAudioRef.current && thunderLoopAudioRef.current.isPlaying) {
          thunderLoopAudioRef.current.stop();
      }
      if (thunderBigAudioRef.current) {
          if (thunderBigAudioRef.current.isPlaying) thunderBigAudioRef.current.stop();
          try {
              thunderBigAudioRef.current.play();
          } catch (e) {}
      }
  };

  const activateStar = () => {
      if (isStarActive.current) return; // Se è già attiva, ignora o resetta timer
      
      isStarActive.current = true;
      if (starStateAudioRef.current) starStateAudioRef.current.play();
      
      // Abbassa il volume della musica di gioco durante la stella
      if (!isBot) duckMusicVolume();
      
      // Salva i materiali originali se non l'hai già fatto (per ripristinare il colore dopo)
      // Nota: Questo è un approccio semplificato. Se i modelli cambiano, va gestito meglio.
      if (visualGroupRef.current) {
          visualGroupRef.current.traverse((child) => {
              if (child.isMesh && child.material) {
                  // Salviamo il colore originale usando l'UUID della mesh come chiave
                  if (!originalMaterials.current.has(child.uuid)) {
                      originalMaterials.current.set(child.uuid, child.material.color.clone());
                  }
              }
          });
      }

      // Timer per disattivare
      if (starTimer.current) clearTimeout(starTimer.current);
      starTimer.current = setTimeout(() => {
          deactivateStar();
      }, STAR_DURATION);
  };

  useEffect(() => {
    // Aspettiamo un attimo che il modello sia montato
    if (visualGroupRef.current) {
        visualGroupRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                // CLONA IL MATERIALE!
                // Ora questo kart ha la sua copia personale del materiale.
                // Modificare questo non influenzerà gli altri.
                child.material = child.material.clone();
            }
        });
    }
  }, []);

  const deactivateStar = () => {
      isStarActive.current = false;
      
      // Ripristina colori originali
      if (visualGroupRef.current) {
          visualGroupRef.current.traverse((child) => {
              if (child.isMesh && child.material && originalMaterials.current.has(child.uuid)) {
                  child.material.color.copy(originalMaterials.current.get(child.uuid));
                  child.material.emissive.setHex(0x000000); // Spegni l'emissive
              }
          });
      }
      if (starStateAudioRef.current) starStateAudioRef.current.stop();
      
      // Ripristina il volume della musica di gioco
      if (!isBot) restoreMusicVolume();
  };
  
  const billScene = useMemo(() => {
    // 1. Clona usando SkeletonUtils (fondamentale per SkinnedMesh)
    const clonedScene = SkeletonUtils.clone(scene);
    
    // 2. Attraversa il modello per assicurarsi che sia sempre renderizzato
    clonedScene.traverse((object) => {
      if (object.isMesh) {
        // Disabilita il culling: il modello viene renderizzato anche se Three.js pensa sia fuori schermo
        // Spesso il bounding box si rompe col clone, causando la sparizione.
        object.frustumCulled = false; 
        
        // Assicuriamoci che materiali e ombre siano attivi
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    
    return clonedScene;
  }, [scene]);


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
  const prevDriftLevel = useRef(0)  // Per tracciare i cambi di livello drift (audio)
  const pendingBoost = useRef(false)
  const driftHopLocked = useRef(false)
  const driftEngageWindow = useRef(false) 
  const isJumping = useRef(false)
  const jumpOffset = useRef({ y: 0 }) 

  const boostTime = useRef(0);


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
  const racerId = userData?.id || (isBot ? "bot" : socket?.id);

  const billVisualsRef = useRef();

      const isLocalPlayer = !isBot && racerId === socket.id;
  

  // Hook per riprodurre effetti sonori (turbo, etc.)
  const { playSfx, duckMusicVolume, restoreMusicVolume } = useAudio()

  // --- LOGICA BULLET BILL ---
  const { isBulletBill, activateBulletBill, bulletBillAudioRefs } = useBulletBill({
      rb: rb, 
      waypoints: waypoints, 
      currentRank: rank || 8,
      onEnd: () => {
         if(rb.current) rb.current.setLinvel({x:0, y:0, z:0}, true);
      },
      // Passa le funzioni di ducking solo per il player locale
      duckMusicVolume: isBot ? null : duckMusicVolume,
      restoreMusicVolume: isBot ? null : restoreMusicVolume,
  });

  const { currentItem, handleItemInput, tripleCount, triggerItemRoulette } = usePowerupHandler({
    boostTime: boostTime, 
    speed: speed,        
    SETTINGS: SETTINGS,    
    position: currentPosition,
    rotation: rotation,
    onSpawnBanana: onSpawnBanana,
	onSpawnBomb: onSpawnBomb,
    onSpawnGreenShell: onSpawnGreenShell,
    onSpawnRedShell: onSpawnRedShell,
    onSpawnBlueShell: onSpawnBlueShell,
	onActivateStar: activateStar,
	activateMega: activateMega,
	racerId: racerId,
    selectedCharacter: selectedCharacter,
    isLocalPlayer: isLocalPlayer,
    kartRef: rb,
    onActivateBulletBill: activateBulletBill,
	socket: socket,
	roomCode: props.roomCode,
    isTimeTrial: isTimeTrial,
    getFirstPlaceRef: () => {
      const firstPlacePos = props.positions?.find(p => p.position === 1);
      if (!firstPlacePos) return null;
      if (firstPlacePos.id === socket?.id) return rb; // Se è il player
      return props.botRefs?.current?.[firstPlacePos.id]; // Altrimenti è un bot
    }
  });

  const botControls = useBotAI({ 
		isBot: isBot || finished, 
		rigidBody: rb, 
		paths: paths || [waypoints],
		currentItem: currentItem,
		triggerItemInput: handleItemInput
	});

  // Controls
  // Passiamo 'rb' (il ref fisico vero) al bot
  const humanControls = useGameControls() 
  const activeControls = (isBot || finished) ? botControls : humanControls


  // Ref e state per il gruppo audio 3D
  const audioGroupRef = useRef(null);
  const [audioGroupMounted, setAudioGroupMounted] = useState(false);

  // Hook per audio 3D spaziale del motore
  const { updateAudio: updateEngineAudio, startIdleAudio, stopAllAudio } = usePositionalKartAudio({
    isBike: false,
    isActive: isRaceActive,
    kartObject: audioGroupMounted ? audioGroupRef.current : null,
    spatialConfig: {
      refDistance: 8,       // Distanza a cui il volume è al 100%
      maxDistance: 100,     // Distanza massima di ascolto
      rolloffFactor: 1.2,   // Attenuazione graduale
      volume: isBot ? 0.5 : 0.9  // Bot più silenziosi
    }
  });

  // Vettori riutilizzabili
  const v = useMemo(() => ({
      forwardGlobal: new Vector3(),
      rayOrigin: new Vector3(),
      rayDir: new Vector3()
  }), [])


  // Controls
  // Passiamo 'rb' (il ref fisico vero) al bot

  // Esposizione Metodi: Usiamo 'ref' esterno, ma chiamiamo metodi su 'rb' interno
    useImperativeHandle(ref, () => ({
        translation: () => {
            const t = rb.current?.translation();
            return t ? { x: t.x, y: t.y, z: t.z } : { x: 0, y: 0, z: 0 };
        },
        rotation: () => {
            const r = rb.current?.rotation();
            return r ? { x: r.x, y: r.y, z: r.z, w: r.w } : { x: 0, y: 0, z: 0, w: 1 };
        },
        linvel: () => {
            const l = rb.current?.linvel();
            return l ? { x: l.x, y: l.y, z: l.z } : { x: 0, y: 0, z: 0 };
        },
    triggerBulletBill: () => activateBulletBill(),
	triggerItemRoulette: (currentRank) => triggerItemRoulette(currentRank),
    resetPosition: (pos, rot) => {
        if(rb.current) {
            rb.current.setTranslation({x: pos[0], y: pos[1], z: pos[2]}, true);
            rb.current.setLinvel({x: 0, y: 0, z: 0}, true);
            rb.current.setAngvel({x: 0, y: 0, z: 0}, true);
            if(rot) {
                const q = new Quaternion().setFromEuler(new Euler(...rot));
                rb.current.setRotation(q, true);
            }
        }
    },
    getEffectState: () => ({
        isBulletBill: isBulletBill,          // From useBulletBill hook
        isStar: isStarActive.current,        // From Ref
        isMega: isMegaActive.current,        // From Ref
        isSmall: isSmall.current,            // From Ref
        isSpinning: isSpinning.current       // Useful for syncing spin-outs
    }),
    getInputState: () => {
          const controls = activeControls.current;
          // Replicate logic: Left = 1, Right = -1
          const currentSteer = (controls.left ? 1 : 0) + (controls.right ? -1 : 0);
          
          return {
              steer: currentSteer, 
              drift: driftDirection.current, // This ref exists in your code, so it's safe
              speed: speed.current,          // Velocità corrente per audio remoto
              driftLevel: driftLevel.current // Livello drift (0, 1=blu, 2=rosso) per audio remoto
          };
      }
  }));
  
	useEffect(() => {
		const handleHit = (eventData) => {
			const victimId = eventData.victimId || eventData.detail?.victimId;
			
			// DEBUG: Apri la console (F12) e controlla se questi due ID coincidano quando colpisci la banana
			// console.log("Controllo Colpo:", { victimId, myLocalId: racerId, mySocketId: socket?.id });

			// Controllo flessibile: colpito se l'ID coincide con racerId O con l'ID del socket
			const isMe = victimId === racerId || (socket && victimId === socket.id);

			if (isMe) {
				// Se ho la stella, il mega fungo o sono Bill, ignoro il colpo
				if (isStarActive.current || isMegaActive.current || isBulletBill) {
					// console.log("Colpo ignorato: Powerup attivo");
					return;
				}

				if (!isSpinning.current) {
					// console.log("AZIONE: Il Kart gira!");
					isSpinning.current = true;
					spinTimer.current = 0.8; 
					speed.current = 0;
					driftLevel.current = 0;
					boostTime.current = 0;
					driftDirection.current = 0;

					if (BananaHitAudioRef.current) {
                        if (BananaHitAudioRef.current.isPlaying) BananaHitAudioRef.current.stop();
                        BananaHitAudioRef.current.setVolume(2.0);
                        try {
						    BananaHitAudioRef.current.play();
                        } catch (e) {}
					}
				}
			}
		};

		const socketHandler = (data) => handleHit(data);
		const windowHandler = (e) => handleHit(e.detail);

		window.addEventListener('banana-hit', windowHandler);
		if (socket) socket.on('banana-hit', socketHandler);

		return () => {
			window.removeEventListener('banana-hit', windowHandler);
			if (socket) socket.off('banana-hit', socketHandler);
		};
	}, [socket, racerId, isBulletBill]);

  const { checkSurface } = useHitboxHandler({
    speed, boostTime, SETTINGS, onCheckpoint, maxCheckpoints: trackConfig?.maxCheckpoints || 3,
    selectedCharacter, playSfx, AUDIO_SFX
  })

  // Audio Lifecycle: avvia idle quando la gara inizia
  useEffect(() => {
    if (isRaceActive && audioGroupRef.current) {
      const timeout = setTimeout(() => {
        startIdleAudio();
      }, 200); // Piccolo delay per assicurarsi che tutto sia inizializzato
      return () => clearTimeout(timeout);
    }
  }, [isRaceActive, startIdleAudio]);

  // Ferma audio quando la gara finisce
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
    const durationMult = level === 2 ? 1.5 : 1.0
    boostTime.current = SETTINGS.boostDuration * durationMult
    pendingBoost.current = false

    // Riproduci audio turbo (solo per il player)
    if (!isBot) {
      // Suono generico turbo drift
      playSfx(AUDIO_SFX.TURBO_DRIFT, 2.0);
      
      // Suono vocale del personaggio (se disponibile)
      if (selectedCharacter?.turbo_sfx && AUDIO_SFX[selectedCharacter.turbo_sfx]) {
        playSfx(AUDIO_SFX[selectedCharacter.turbo_sfx], 0.6);
      }
    }
  }

  // Ref per tracciare ultima collisione e prevenire jitter
  const lastCollisionTime = useRef(0);
  const collisionCooldown = 0.1; // 100ms cooldown tra collisioni

  // --- GESTIONE COLLISIONI FISICHE (RigidBody) ---
  const handleCollisionEnter = (payload) => {

    // COLLISION
    const otherObj = payload.other.rigidBodyObject;
    const otherData = otherObj?.userData;

    if (otherData && otherData.type === 'opponent') {
        const effects = otherData.effects || {};

        // Se l'avversario è Bullet Bill, Stella o Mega Fungo
        if (effects.isBulletBill || effects.isStar || effects.isMega) {
            if (isBulletBill || isStarActive.current || isMegaActive.current) {
                return;
            }

            if (!isSpinning.current) {
               isSpinning.current = true;
               spinTimer.current = 0.45; 
               speed.current = 0; 
               driftLevel.current = 0;
               boostTime.current = 0;
            }
            return;
        }
    }
      // Se siamo Bill, distruggiamo chi tocchiamo
	if (isBulletBill || isStarActive.current || isMegaActive.current) {
		const targetObj = payload.other.rigidBodyObject;
		const otherData = targetObj?.userData;

		if (otherData && (otherData.type === 'opponent' || otherData.type === 'racer')) {
			// console.log(`ATTACK! Hitting: ${otherData.id}`);
			
			// Invia tramite socket solo in multiplayer
			if (socket && roomCode) {
				socket.emit('player_hit', { 
					victimId: otherData.id, 
					type: isBulletBill ? 'bullet' : (isStarActive.current ? 'star' : 'mega') 
				});
			}

			// Dispatch window event per single player (bot locali)
			window.dispatchEvent(new CustomEvent('banana-hit', { 
				detail: { victimId: otherData.id } 
			}));
		}
	}
    
    // Damping verticale per ridurre jitter da collisioni tra kart
    const currentTime = Date.now() / 1000;
    if (currentTime - lastCollisionTime.current > collisionCooldown) {
        const otherData = payload.other.rigidBodyObject?.userData;
        if (otherData && (otherData.type === 'racer' || otherData.type === 'opponent')) {
            // Smorza componente verticale della velocità dopo collisione tra kart
            const vel = rb.current.linvel();
            if (Math.abs(vel.y) > 0.5) {
                rb.current.setLinvel({ x: vel.x, y: vel.y * 0.3, z: vel.z }, true);
            }
            lastCollisionTime.current = currentTime;
        }
    }
  };

  useFrame((state, delta) => {
    try {
      if (!rb.current) return;

      if (!rb.current || gameState !== 'RACING' || isPaused) {
          // Se è in pausa, congela il movimento orizzontale ma mantieni la gravità
          if (isPaused && gameState === 'RACING' && rb.current) {
              const vel = rb.current.linvel();
              rb.current.setLinvel({x: 0, y: vel.y, z: 0}, true);
          } else if (gameState === 'COUNTDOWN' && rb.current) {
              const countdownVel = rb.current.linvel();
              rb.current.setLinvel({x:0, y: countdownVel.y, z:0}, true);
              speed.current = 0;
          }
          return; 
      }

      // Aggiorna posizione corrente per la camera e logica
      const rbPos = rb.current.translation();
      const rbVel = rb.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    
    // Aggiorna UI solo ogni 3 frame per ridurre overhead DOM
    const shouldUpdateUI = !isBot && (frameCounter.current % 3 === 0);
    if (shouldUpdateUI && speedUiRef.current) {
        // FIX: Usa (speed.current || 0) per evitare calcoli su valori nulli/NaN
        const currentSpd = speed.current || 0;
        
        const displaySpeed = isBulletBill ? 120 : Math.abs(Math.round(currentSpd * 1.5));
        
        // Ulteriore sicurezza: se displaySpeed è ancora NaN (es. calcoli strani), forza "0"
        const finalDisplay = isNaN(displaySpeed) ? 0 : displaySpeed.toString();

        speedUiRef.current.innerText = `${finalDisplay} km/h`;
        const isOver = displaySpeed > maxSpeed + 5
        speedUiRef.current.style.color = isBulletBill ? '#ff0000' : (isOver ? '#ff3300' : 'white')
        speedUiRef.current.style.transform = isOver || isBulletBill ? `scale(1.1)` : `scale(1)`
    }

	if (!isBot) {
         let safeSpeed = speed.current;
         if (isNaN(safeSpeed) || !isFinite(safeSpeed)) {
             safeSpeed = 0;
         }

         window.dispatchEvent(new CustomEvent('hud-update', {
             detail: {
                 speed: safeSpeed,
                 item: currentItem     
             }
         }));
     }

	if (isStarActive.current && visualGroupRef.current && frameCounter.current % 2 === 0) {
        const time = state.clock.elapsedTime * 5; 
        
        const rainbowColor = new Color().setHSL((time % 1), 1.0, 0.5); 
        
        visualGroupRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                // 1. Emissive alto per farla brillare
                child.material.emissive.copy(rainbowColor);
                child.material.emissiveIntensity = 0.08; 
            }
        });
    }

	if (visualGroupRef.current) {
        let targetScale = KART_SIZE;

        if (isMegaActive.current) {
            targetScale = KART_SIZE * MEGA_SCALE; // 2.5
        } else if (isSmall.current) {
			targetScale = KART_SIZE * SMALL_SCALE; // 0.5
		}
        
        // Interpolazione fluida
        const currentScale = visualGroupRef.current.scale.x;
        const smoothScale = MathUtils.lerp(currentScale, targetScale, delta * 5);
        
        visualGroupRef.current.scale.set(smoothScale, smoothScale, smoothScale);
    }

    // --- 0. COLLISIONI GROUND (Coda) ---
    if (collisionQueue.current.length > 0) {
        collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
        collisionQueue.current = [];
        collisionQueue.current.forEach((obj) => { if (obj) checkSurface(obj); });
        collisionQueue.current = []; 
    }

    const { forward, backward, left, right, drift, item } = activeControls.current
    handleItemInput(item);

    // -----------------------------------------------------------
    // --- LOGICA BIFORCATA: BULLET BILL vs GUIDA NORMALE ---
    // -----------------------------------------------------------
    
    if (isBulletBill) {
        const velLen = Math.sqrt(rbVel.x**2 + rbVel.z**2);
        speed.current = velLen;
        
        if (velLen > 1.0) {
            const moveAngle = Math.atan2(rbVel.x, rbVel.z) + Math.PI;
            
            rotation.current = moveAngle;

            const targetQ = new Quaternion().setFromEuler(new Euler(0, moveAngle, 0));
            
            const currentQ = new Quaternion().copy(rb.current.rotation());
            currentQ.slerp(targetQ, 10 * delta);
            
            rb.current.setRotation({ x: currentQ.x, y: currentQ.y, z: currentQ.z, w: currentQ.w }, true);
        }

        smoothedY.current = rbPos.y;
        driftLevel.current = 0;
        driftDirection.current = 0;
        
        
    } else {
        
        if (isSpinning.current) {
            spinTimer.current -= delta;
            if (spinTimer.current <= 0) isSpinning.current = false;
        }

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
        if (drift && !driftHopLocked.current && !isJumping.current) {
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
            if (driftDirection.current !== 0) {
                driftTime.current += delta;
                if (driftTime.current > SETTINGS.driftLevel2Time) driftLevel.current = 2;
                else if (driftTime.current > SETTINGS.driftLevel1Time) driftLevel.current = 1;
                else driftLevel.current = 0;
            }
        } else {
            if (pendingBoost.current && isGrounded.current) activateBoost(1);
        }

    // UPDATE SPARKS (SOLO PLAYER)
    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // UPDATE AUDIO 3D (Motore + Drift sounds)
    const isDriftingNow = driftDirection.current !== 0;
    updateEngineAudio(speed.current, forward, driftLevel.current, isDriftingNow);

        // Calcolo Velocità
        const isBoosting = boostTime.current > 0
        if (isBoosting) boostTime.current -= 1
        const isDrifting = driftDirection.current !== 0
        let currentSpeedLimit = maxSpeed
        if (isBoosting) currentSpeedLimit = SETTINGS.maxTurboLimit
        else if (isDrifting) currentSpeedLimit += 5 

		if (isStarActive.current) {
			currentSpeedLimit *= STAR_SPEED_BOOST; // Aumenta max speed (es. 40 -> 56)
		} else if (isMegaActive.current) {
			currentSpeedLimit *= MEGA_SPEED_BOOST; // Aumenta max speed (es. 40 -> 60)
		} else if (isSmall.current) {
			currentSpeedLimit *= SMALL_SPEED_PENALTY; // Diminuisci max speed (es. 40 -> 30)
		}
        
        let targetSpeed = 0
        if (forward) targetSpeed = currentSpeedLimit
        if (backward) targetSpeed = -currentSpeedLimit * 0.5
        
		if (!isStarActive.current) {
			const isOverspeeding = speed.current > (isDrifting ? maxSpeed + 5 : maxSpeed)
			if (forward && !isBoosting && isOverspeeding) {
				speed.current = MathUtils.damp(speed.current, maxSpeed, SETTINGS.deceleration, delta)
			} else {
				let currentAccel = SETTINGS.acceleration
				if (isBoosting) currentAccel *= 3.0;
				if (isStarActive.current || isMegaActive.current) currentAccel *= 2;
				else if (!forward && !backward) currentAccel = SETTINGS.deceleration 
				speed.current = MathUtils.damp(speed.current, targetSpeed, currentAccel, delta)
			}
		} else {
			// Se Star attivo, accelera sempre verso il targetSpeed senza limiti
			let currentAccel = SETTINGS.acceleration * 3.0; 
			if (!forward && !backward) currentAccel = SETTINGS.deceleration; 
			speed.current = MathUtils.damp(speed.current, targetSpeed, currentAccel, delta);
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
        if (world && rapier && (!isBot || frameCounter.current % 5 === 0)) {
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
            if (rb.current) try {
                rb.current.applyImpulse({ x: 0, y: -2000000.0 * delta, z: 0 }, true) 
            } catch (e) {
                console.warn('Rapier physics error:', e);
            }
        } 
        else if (isJumping.current) {
            newY -= 15 * delta 
        }

        if (isHittingVerticalWall && newY > 0 && !isJumping.current) {
            newY = 0 
        }
        
        // Applica Fisica Standard
        if (rb.current) try {
            rb.current.setLinvel({ 
                x: Number(finalVelocity.x), 
                y: Number(newY), 
                z: Number(finalVelocity.z) 
            }, true)
            const q = new Quaternion()
            q.setFromEuler(new Euler(0, rotation.current, 0))
            rb.current.setRotation(q, true)
            rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
        } catch (e) {
            console.warn('Rapier physics error:', e);
            return; // Esci dal frame se la fisica fallisce
        }

        // Visual Smoothing (Ottimizzato per evitare jitter)
        const yDiff = Math.abs(rbPos.y - smoothedY.current);
        
        // Smoothing più aggressivo quando vicino, meno quando lontano
        let smoothFactor;
        if (yDiff < 0.05) {
            smoothFactor = 2.0; // Molto lento per piccole oscillazioni
        } else if (yDiff < 0.2) {
            smoothFactor = 8.0; // Medio
        } else {
            smoothFactor = 20.0; // Veloce per grandi salti
        }
        
        smoothedY.current = MathUtils.damp(
            smoothedY.current, 
            rbPos.y, 
            smoothFactor, 
            delta
        );

        // Applica la posizione smussata solo al gruppo visuale
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
    }

    // --- CAMERA UPDATE (Modificato) ---
    if (!isBot) {
        const effSpeed = isBulletBill ? 100 : speed.current; 
        const overSpeed = Math.max(0, effSpeed - maxSpeed)
        const boostRange = SETTINGS.maxTurboLimit - maxSpeed
        const boostRatio = Math.min(overSpeed / boostRange, 1)
        const dynamicDistance = camConfig.distance + (boostRatio) 
        
        const camRotRef = rotation.current;

        const idealOffset = new Vector3(0, camConfig.height, dynamicDistance)
        idealOffset.applyAxisAngle(new Vector3(0, 1, 0), camRotRef)

        // FIX: Creiamo un vettore base che usa X e Z fisici, ma Y FLUIDA (smoothedY)
        // Aggiungiamo un piccolo offset (+0.5) se la camera sembra troppo bassa
        const smoothedBasePos = new Vector3(
            currentPosition.current.x, 
            smoothedY.current, // <--- QUESTA È LA CHIAVE: Usa la Y interpolata, non fisica
            currentPosition.current.z
        );

        const desiredCamPos = new Vector3().copy(smoothedBasePos).add(idealOffset)
        
        state.camera.position.lerp(desiredCamPos, camConfig.stiffness)

        // FIX: Anche il punto che guardiamo (LookAt) deve usare la Y fluida
        const targetLookAt = new Vector3(
            currentPosition.current.x, 
            smoothedY.current + camConfig.lookAtHeight, // <--- Anche qui
            currentPosition.current.z
        )
        
        cameraTarget.current.lerp(targetLookAt, camConfig.stiffness * 1.5)
        state.camera.lookAt(cameraTarget.current)
        state.camera.updateProjectionMatrix()
    }

	const currentY = rb.current.translation().y;
    if (currentY < -5) { // -5 o un valore sicuramente sotto la pista
        console.warn(`${racerId} fell through world, resetting!`);
        // Riporta il kart in alto nel punto in cui si trova
        rb.current.setTranslation({ x: rbPos.x, y: START_POS[1] + 2, z: rbPos.z }, true);
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    } catch (error) {
      console.error('OutsideDriftKart - Physics frame error:', error);
      // Continua il gioco anche se la fisica ha errori
    }
  })

    useEffect(() => {
        const handleLightningStrike = (data) => {
            const attackerId = data?.attackerId;
            console.log(`LIGHTNING STRIKE RECEIVED ON ${racerId} FROM ${attackerId}`);
            if (attackerId === racerId) { 
                return; 
            }

            if (isBulletBill || isStarActive.current || isMegaActive.current) {
                return;
            }
            activateLightning();    

            if (!isSpinning.current) {
                isSpinning.current = true;
                spinTimer.current = 0.8;
                speed.current = 0;
                if (BananaHitAudioRef.current) {
                    if (BananaHitAudioRef.current.isPlaying) BananaHitAudioRef.current.stop();
                    BananaHitAudioRef.current.setVolume(2.0);
                    try {
                        BananaHitAudioRef.current.play();
                    } catch (e) {}
                }
            }
        };
        
        // Gestione window event per single player (anche per i bot)
        const handleWindowLightning = (e) => {
            const { attackerId } = e.detail;
            if (attackerId === racerId) return; // Non colpire se stesso
            handleLightningStrike({ attackerId });
        };
        
        // IMPORTANTE: Window listener sempre attivo (funziona per bot in single player)
        window.addEventListener('lightning-strike', handleWindowLightning);
        
        // Socket listener solo in multiplayer
        if (socket) {
            socket.on('lightning-strike', handleLightningStrike);
        }
        
        return () => {
            window.removeEventListener('lightning-strike', handleWindowLightning);
            if (socket) socket.off('lightning-strike', handleLightningStrike);
        };
    }, [racerId, isBulletBill, socket]);

  // Visual Steering
  const modelSteer = (activeControls.current.left ? 1 : 0) + (activeControls.current.right ? -1 : 0)

  // Handlers Sensore Terra
  const handleGroundEnter = (payload) => {
     const rootObj = payload.other.rigidBodyObject;
	 checkSurface(rootObj);
     if (!rootObj) return;
     const name = rootObj.name;
     if (name === socket.id || name.startsWith('bot')) return; 
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
    <>
      <RigidBody 
        ref={rb} 
        position={START_POS} 
        rotation={START_ROT}
        mass={isBulletBill ? 1000 : 150}
        linearDamping={3.5}
        angularDamping={5} 
        type="dynamic" 
        ccd={true} 
        name={racerId} 
        userData={{ type: 'racer', id: racerId }}
        colliders={false} 
        lockRotations={true}
        restitution={0}
        restitutionCombine="min" 
        onCollisionEnter={handleCollisionEnter}
      >
        <BallCollider 
            args={[PHYSICS_RADIUS]} 
            position={[0, 0, 0]} 
            friction={0.0}
            frictionCombine="min"
            restitution={0}
            restitutionCombine="min" 
			onCollisionEnter={handleCollisionEnter}
        />

        <CylinderCollider 
           args={[0.2, 0.5]} 
           position={[0, -PHYSICS_RADIUS + 0.2, 0]} 
           sensor={true} 
           onIntersectionEnter={handleGroundEnter}
           onIntersectionExit={handleGroundExit}
        />
        <PositionalAudio
            ref={BananaHitAudioRef}
            url={AUDIO_SFX.KART_SPIN}
            distance={15}
            loop={false}
        />
        <PositionalAudio
            ref={bulletBillAudioRefs.onAudioRef}
            url={AUDIO_SFX.BULLET_BILL_START}
            distance={7}
            loop={false}
        />
        <PositionalAudio
            ref={bulletBillAudioRefs.engineAudioRef}
            url={AUDIO_SFX.BULLET_BILL_STATE}
            distance={7}
            loop={false}
        />
        <PositionalAudio
            ref={bulletBillAudioRefs.offAudioRef}
            url={AUDIO_SFX.BULLET_BILL_OFF}
            distance={7}
            loop={false}
        />
        <PositionalAudio
            ref={starStateAudioRef}
            url={AUDIO_SFX.STAR_LOOP}
            distance={17}
            loop={true}
        />
        <PositionalAudio
            ref={thunderLoopAudioRef}
            url={AUDIO_SFX.THUNDER_LOOP}
            distance={15}
            loop={true}
        />
        <PositionalAudio
            ref={thunderSmallAudioRef}
            url={AUDIO_SFX.THUNDER_SMALL_STATE}
            distance={15}
            loop={false}
        />
        <PositionalAudio
            ref={thunderBigAudioRef}
            url={AUDIO_SFX.THUNDER_BIG_STATE}
            distance={15}
            loop={false}
        />
        <PositionalAudio
            ref={megaMushroomStateAudioRef}
            url={AUDIO_SFX.BIG_MUSHROOM_STATE}
            distance={17}
            loop={true}
        />
        <PositionalAudio
            ref={megaMushroomShrinkAudioRef}
            url={AUDIO_SFX.BIG_MUSHROOM_OFF}
            distance={17}
            loop={false}
        />
        <PositionalAudio
            ref={megaMushroomUseAudioRef}
            url={AUDIO_SFX.BIG_MUSHROOM_USE}
            distance={17}
            loop={false}
        />

        {!isBot && <SpeedEffect boostTimeRef={boostTime} isBulletBill={isBulletBill} />}
        
        {/* --- GRUPPO AUDIO 3D: L'audio viene attaccato a questo gruppo --- */}
        <group ref={(node) => {
          audioGroupRef.current = node;
          if (node && !audioGroupMounted) setAudioGroupMounted(true);
        }} />

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

        <group 
            ref={billVisualsRef} 
            visible={isBulletBill} 
            scale={[2.5, 2.5, 2.5]} 
            position={[0, -PHYSICS_RADIUS + 0.8, 0]} 
        >
             <group rotation={[0, Math.PI, 0]} > 
                 <primitive object={billScene} />
             </group>
        </group>

      </RigidBody>
    </>
  )
}));