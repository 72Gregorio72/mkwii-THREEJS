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
const MEGA_SPEED_BOOST = 1.15;

const SMALL_DURATION = 10000; // Rimani piccolo per 10 secondi
const SMALL_SCALE = 0.5;      // Diventi la metà
const SMALL_SPEED_PENALTY = 0.6;

const cBlue = new THREE.Color(0x00BFFF); // Blu drift (azzurro)
const cOrange = new THREE.Color(0xF24807); // Arancione/giallo per drift potente 

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
  return (<group ref={ref} visible={false}><points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} /></bufferGeometry><pointsMaterial map={texture} size={0.8} color={0x00BFFF} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={true} vertexColors={false} /></points></group>);
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
  const count = 20 
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
	positions, botRefs, socket,
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


  const activateMega = () => {
      isMegaActive.current = true;
      console.log("Attivazione MEGA FUNGOasdasd!");
      if (megaMushroomUseAudioRef.current && megaMushroomStateAudioRef.current) {
        megaMushroomUseAudioRef.current.play();
        megaMushroomStateAudioRef.current.play();
      }
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
  };


  const activateLightning = () => {
      isSmall.current = true;
      
      // THUNDER_SMALL_STATE: quando diventi piccolo
      if (thunderSmallAudioRef.current) {
          thunderSmallAudioRef.current.currentTime = 0;
          thunderSmallAudioRef.current.play();
      }
      // THUNDER_LOOP: loop mentre sei piccolo
      if (thunderLoopAudioRef.current) {
          thunderLoopAudioRef.current.currentTime = 0;
          thunderLoopAudioRef.current.play();
      }

      if (smallTimer.current) clearTimeout(smallTimer.current);
      smallTimer.current = setTimeout(() => {
          deactivateLightning();
      }, SMALL_DURATION);
  };

  const deactivateLightning = () => {
      isSmall.current = false;
      
      // Ferma THUNDER_LOOP
      if (thunderLoopAudioRef.current) {
          thunderLoopAudioRef.current.pause();
          thunderLoopAudioRef.current.currentTime = 0;
      }
      // THUNDER_BIG_STATE: quando torni grande
      if (thunderBigAudioRef.current) {
          thunderBigAudioRef.current.currentTime = 0;
          thunderBigAudioRef.current.play();
      }
  };

  const activateStar = () => {
      if (isStarActive.current) return; // Se è già attiva, ignora o resetta timer
      
      isStarActive.current = true;
      if (starStateAudioRef.current) starStateAudioRef.current.play();
      
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

  const billVisualsRef = useRef();

  // Controls
  // Passiamo 'rb' (il ref fisico vero) al bot
  const humanControls = useGameControls() 
  const activeControls = isBot ? botControls : humanControls

  // Hook per riprodurre effetti sonori (turbo, etc.)
  const { playSfx } = useAudio()

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
  const racerId = userData?.id || (isBot ? "bot" : "player");


  // --- LOGICA BULLET BILL ---
  const { isBulletBill, activateBulletBill, bulletBillAudioRefs } = useBulletBill({
      rb: rb, 
      waypoints: waypoints, 
      currentRank: rank || 8,
      onEnd: () => {
         if(rb.current) rb.current.setLinvel({x:0, y:0, z:0}, true);
      }
  });

    const isLocalPlayer = !isBot && racerId === 'player';
  
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
    isLocalPlayer: isLocalPlayer, // Solo il player locale sente l'audio della roulette
    kartRef: rb,
    onActivateBulletBill: activateBulletBill,
	socket: socket
  });

  const botControls = useBotAI({ 
		isBot, 
		rigidBody: rb, 
		paths,
		currentItem: currentItem,
		triggerItemInput: handleItemInput
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
    translation: () => rb.current?.translation() || { x: 0, y: 0, z: 0 },
    rotation: () => rb.current?.rotation() || { x: 0, y: 0, z: 0, w: 1 },
    linvel: () => rb.current?.linvel() || { x: 0, y: 0, z: 0 },
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
              drift: driftDirection.current // This ref exists in your code, so it's safe
          };
      }
  }));
  
  // Gestione Eventi Colpo
  useEffect(() => {
    const handleBananaHit = (e) => {
        const victimId = e.detail?.victimId;
        // Se siamo Bullet Bill siamo invincibili, ignoriamo il colpo
        if (isBulletBill || isStarActive.current || isMegaActive.current) return;

        if (victimId === racerId && !isSpinning.current) { 
            if (BananaHitAudioRef)
                BananaHitAudioRef.current.play();
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

  // --- GESTIONE COLLISIONI FISICHE (RigidBody) ---
  const handleCollisionEnter = (payload) => {

    // COLLISION
    const otherObj = payload.other.rigidBodyObject;
    const otherData = otherObj?.userData;

    if (otherData && otherData.type === 'opponent') {
        const effects = otherData.effects || {};

        // Se l'avversario è Bullet Bill, Stella o Mega Fungo
        if (effects.isBulletBill || effects.isStar || effects.isMega) {
            
            // Se io sono invincibile, ignora
            if (isBulletBill || isStarActive.current || isMegaActive.current) {
                return;
            }

            console.log(`COLPITO DA EFFETTO NEMICO: ${otherData.id}`);

            // 3. Applica la penalità (Spin Out)
            if (!isSpinning.current) {
               isSpinning.current = true;
               spinTimer.current = 0.45; 
               speed.current = 0; 
               driftLevel.current = 0;
               boostTime.current = 0;
            }
            return; // Esci per evitare altre logiche di collisione standard
        }
    }
      // Se siamo Bill, distruggiamo chi tocchiamo
      if (isBulletBill) {
          const targetObj = payload.other.rigidBodyObject;
          const targetName = targetObj?.name || "";
          const otherData = targetObj?.userData;

          if (targetName.startsWith('bot') || targetName === 'player'
                || (otherData && otherData.type === 'opponent')) {
              console.log(`BULLET BILL SMASH: ${targetName}`);
              window.dispatchEvent(new CustomEvent('banana-hit', { 
                  detail: { victimId: targetName } 
              }));
              if (otherData && otherData.type === 'opponent' && onHitOpponent) {
                onHitOpponent(otherData.id); 
            }
          }
      }

	  if (isStarActive.current || isMegaActive.current) {
          const targetObj = payload.other.rigidBodyObject;
          const targetName = targetObj?.name || "";
          const otherData = targetObj?.userData;
          
          // Se tocchiamo un bot o un player
          if (targetName.startsWith('bot') || targetName === 'player'
        || (otherData && otherData.type === 'opponent')) {
              console.log(`STAR SMASH: ${targetName}`);
              
              // Invia evento danno
              window.dispatchEvent(new CustomEvent('banana-hit', { 
                  detail: { victimId: targetName, type: 'star_hit' } 
              }));
              if (otherData && otherData.type === 'opponent' && onHitOpponent) {
                onHitOpponent(otherData.id);
              }
              // Opzionale: Dai una spinta fisica via al nemico
              // payload.other.rigidBody.applyImpulse({x:0, y:10, z:0}, true);
          }
      }
  };

  useFrame((state, delta) => {
    if (!rb.current) return;

	if (!rb.current || gameState !== 'RACING') {
        // Forza la velocità a 0 finché non finisce il countdown
        if(gameState === 'COUNTDOWN') {
            rb.current.setLinvel({x:0, y: rb.current.linvel().y, z:0}, true);
            speed.current = 0;
        }
        return; 
    }

    // Aggiorna posizione corrente per la camera e logica
    const rbPos = rb.current.translation();
    const rbVel = rb.current.linvel();
    currentPosition.current.set(rbPos.x, rbPos.y, rbPos.z);
    
    // Aggiorna UI
    if (!isBot && speedUiRef.current) {
        // FIX: Usa (speed.current || 0) per evitare calcoli su valori nulli/NaN
        const currentSpd = speed.current || 0;
        
        const displaySpeed = isBulletBill ? 120 : Math.abs(Math.round(currentSpd * 1.5));
        
        // Ulteriore sicurezza: se displaySpeed è ancora NaN (es. calcoli strani), forza "0"
        const finalDisplay = isNaN(displaySpeed) ? 0 : displaySpeed.toString();

        speedUiRef.current.innerText = `${finalDisplay} km/h`;
        const isOver = displaySpeed > SETTINGS.maxSpeed + 5
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

	if (isBulletBill)
		console.log(`BULLET BILL VELOCITÀ: ${Math.abs(Math.round(speed.current * 1.5))} km/h`);

	if (isStarActive.current && visualGroupRef.current) {
        // Velocità cambio colore
        const time = state.clock.elapsedTime * 5; 
        
        // Calcola colore arcobaleno (HSL)
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

    // Input Controllo
    const { forward, backward, left, right, drift, item } = activeControls.current
    handleItemInput(item);

    // -----------------------------------------------------------
    // --- LOGICA BIFORCATA: BULLET BILL vs GUIDA NORMALE ---
    // -----------------------------------------------------------
    
    if (isBulletBill) {
        // A. BULLET BILL MODE
        const velLen = Math.sqrt(rbVel.x**2 + rbVel.z**2);
        speed.current = velLen;
        
        if (velLen > 1.0) {
            // Calcola l'angolo di movimento basato sulla velocità
            // Nota: Math.PI serve se il modello "guarda indietro" di default, altrimenti rimuovilo
            const moveAngle = Math.atan2(rbVel.x, rbVel.z) + Math.PI;
            
            // Aggiorniamo la ref di rotazione per la camera
            rotation.current = moveAngle;

            // --- FIX: Ruotiamo fisicamente il RigidBody ---
            // Creiamo un quaternione target basato sulla direzione
            const targetQ = new Quaternion().setFromEuler(new Euler(0, moveAngle, 0));
            
            // Otteniamo la rotazione corrente e facciamo un slerp (interpolazione) morbido
            const currentQ = new Quaternion().copy(rb.current.rotation());
            currentQ.slerp(targetQ, 10 * delta);
            
            // Applichiamo la rotazione al corpo fisico
            rb.current.setRotation(currentQ, true);
        }

        smoothedY.current = rbPos.y;
        driftLevel.current = 0;
        driftDirection.current = 0;
        
        // Rimuoviamo la logica billVisualsRef qui, non serve più ruotare il figlio dinamicamente
        
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

    // UPDATE SPARKS (SOLO PLAYER)
    updateSparksColor(driftLevel.current, leftSparksRef.current, rightSparksRef.current);

    // UPDATE AUDIO 3D (Motore)
    const isDriftingNow = driftDirection.current !== 0;
    updateEngineAudio(speed.current, forward, isDriftingNow);

        // Calcolo Velocità
        const isBoosting = boostTime.current > 0
        if (isBoosting) boostTime.current -= 1
        const isDrifting = driftDirection.current !== 0
        let currentSpeedLimit = SETTINGS.maxSpeed
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
			const isOverspeeding = speed.current > (isDrifting ? SETTINGS.maxSpeed + 5 : SETTINGS.maxSpeed)
			if (forward && !isBoosting && isOverspeeding) {
				speed.current = MathUtils.damp(speed.current, SETTINGS.maxSpeed, SETTINGS.deceleration, delta)
			} else {
				let currentAccel = SETTINGS.acceleration
				if (isBoosting) currentAccel *= 2.5
				if (isStarActive.current) currentAccel *= 2;
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

		const smoothingSpeed = isGrounded.current ? 12.0 : 5.0; 

		smoothedY.current = MathUtils.damp(
			smoothedY.current, 
			rbPos.y, 
			smoothingSpeed, 
			delta
		);

		// Applica la posizione smussata solo al gruppo visuale, non al corpo fisico
		if (visualGroupRef.current) {
			// Calcoliamo l'offset rispetto alla posizione fisica reale
			const visualLocalY = (smoothedY.current - rbPos.y) - PHYSICS_RADIUS + jumpOffset.current.y;
			visualGroupRef.current.position.y = visualLocalY;
		}

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
        const overSpeed = Math.max(0, effSpeed - SETTINGS.maxSpeed)
        const boostRange = SETTINGS.maxTurboLimit - SETTINGS.maxSpeed
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
  })

    useEffect(() => {
		const handleLightningStrike = (e) => {
			const attackerId = e.detail?.attackerId;

			// SE SONO IO CHE L'HO LANCIATO, IGNORO
			if (attackerId === socket.id || attackerId === racerId) { 
				return; 
			}

			// SE SONO INVINCIBILE, IGNORO
			if (isBulletBill || isStarActive.current || isMegaActive.current) {
				return;
			}

			// 1. Rimpicciolisci
			activateLightning();    

			// 2. Effetto "Banana Hit" (Spin out e stop velocità)
			if (!isSpinning.current) {
				isSpinning.current = true;
				spinTimer.current = 0.8; // Un po' più lungo per il fulmine
				speed.current = 0;
				if (BananaHitAudioRef.current) BananaHitAudioRef.current.play();
			}
		};
		window.addEventListener('lightning-strike', handleLightningStrike);
		return () => window.removeEventListener('lightning-strike', handleLightningStrike);
	}, [racerId, isBulletBill, socket.id]);

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
    <>
      <RigidBody 
        ref={rb} 
        position={START_POS} 
        rotation={START_ROT}
        mass={isBulletBill ? 1000 : 100}
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
        onCollisionEnter={handleCollisionEnter}
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
        <PositionalAudio
            ref={BananaHitAudioRef}
            url={AUDIO_SFX.KART_SPIN}
            distance={10}
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