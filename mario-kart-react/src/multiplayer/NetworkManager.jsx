import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

// Import Audio Hook
import { usePositionalKartAudio } from '../hooks/usePositionalKartAudio.js';

const PHYSICS_RADIUS = 1; 
const INTERPOLATION_DELAY = 100; 

// --- COMPONENTE VISUALE (FIX T-POSE) ---
// Questo componente gestisce SOLO l'animazione, aggiornandosi ogni frame
const RemoteVisuals = ({ opponentsDataRef, playerId, vehicle, character }) => {
    const [animState, setAnimState] = useState({ speed: 0, steer: 0, drift: 0, driftLevel: 0 });
    
    useFrame(() => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData) return;

        // Legge la velocità dal server e aggiorna lo stato locale
        // Questo forza il RacerModel a uscire dalla T-Pose
        setAnimState({
            speed: serverData.speed || 0,
            steer: serverData.steer || 0,
            drift: serverData.drift || 0,
            driftLevel: serverData.driftLevel || 0
        });
    });

    return (
        <group position={vehicle.vehicleOffset || [0,0,0]}>
            <VehicleModel 
                vehicleConfig={vehicle.modelConfig} 
                scale={1.4} 
                rotation={[0, Math.PI, 0]} 
                isBike={vehicle.isBike} 
                speed={animState.speed} 
                steer={animState.steer} 
                drift={animState.drift} 
            />
            <group rotation={[0, Math.PI, 0]}>
                <RacerModel
                    isInMenu={false} 
                    isRemote={true} 
                    characterConfig={character.modelConfig} 
                    vehicleConfig={vehicle} 
                    isKart={true} 
                    steer={animState.steer} 
                    drift={animState.drift} 
                    scale={1.5} 
                    speed={animState.speed} // <--- FONDAMENTALE: Se è 0, va in T-Pose
                />
            </group>
        </group>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const RemoteOpponent = forwardRef(({ playerId, opponentsDataRef, character, vehicle, userData, data, isRaceActive = true }, ref) => {
    const rb = useRef();
    const visualGroupRef = useRef();
    const renderBuffer = useRef([]);
    
    const audioGroupRef = useRef(null);
    const [audioGroupMounted, setAudioGroupMounted] = useState(false);
    
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    const isSmall = useRef(false);
    const smallTimer = useRef(null);

    // Audio Logic
    const { updateAudio, startIdleAudio, stopAllAudio } = usePositionalKartAudio({
        isBike: vehicle?.isBike || false,
        isActive: isRaceActive,
        kartObject: audioGroupMounted ? audioGroupRef.current : null,
        spatialConfig: {
            refDistance: 8,
            maxDistance: 100,
            rolloffFactor: 1.2,
            volume: 0.5
        }
    });

    useEffect(() => {
        if (audioGroupMounted && isRaceActive) startIdleAudio();
        return () => stopAllAudio();
    }, [audioGroupMounted, isRaceActive, startIdleAudio, stopAllAudio]);

    useImperativeHandle(ref, () => ({
        translation: () => {
            if (rb.current) return rb.current.translation();
            return { x: data.x, y: data.y, z: data.z };
        }
    }));

    const { scene: billScene } = useGLTF('/items/BulletBill.glb');
    const billClone = useMemo(() => {
        const clone = SkeletonUtils.clone(billScene);
        clone.traverse((obj) => { if (obj.isMesh) obj.frustumCulled = false; });
        return clone;
    }, [billScene]);

    // Gestione Effetti (usiamo valori di default per evitare undefined)
    const { isBulletBill = false, isStar = false, isMega = false } = data.effects || {};
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        latestEffects.current = { isBulletBill, isStar, isMega };
    }, [isBulletBill, isStar, isMega]);

    // LOGICA FISICA E AUDIO
    useFrame((state, delta) => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData || !rb.current) return;

        // Buffer per interpolazione
        renderBuffer.current.push({
            t: Date.now(),
            pos: [serverData.x, serverData.y, serverData.z],
            rot: [serverData.rotation?.x ?? 0, serverData.rotation?.y ?? 0, serverData.rotation?.z ?? 0, serverData.rotation?.w ?? 1]
        });
        if (renderBuffer.current.length > 20) renderBuffer.current.shift();
        
        // Interpolazione Posizione
        if (renderBuffer.current.length >= 2) {
             const now = Date.now();
             const renderTime = now - INTERPOLATION_DELAY;
             let i = 0;
             while(i < renderBuffer.current.length - 1 && renderBuffer.current[i+1].t <= renderTime) i++;
             
             const b0 = renderBuffer.current[i];
             const b1 = renderBuffer.current[i + 1];

             if (b0 && b1) {
                 const alpha = Math.min(1, Math.max(0, (renderTime - b0.t) / (b1.t - b0.t)));
                 const interpX = MathUtils.lerp(b0.pos[0], b1.pos[0], alpha);
                 const interpY = MathUtils.lerp(b0.pos[1], b1.pos[1], alpha);
                 const interpZ = MathUtils.lerp(b0.pos[2], b1.pos[2], alpha);
                 
                 const q0 = new Quaternion(...b0.rot);
                 const q1 = new Quaternion(...b1.rot);
                 q0.slerp(q1, alpha);

                 rb.current.setNextKinematicTranslation({ x: interpX, y: interpY, z: interpZ });
                 rb.current.setNextKinematicRotation(q0);
             }
        }

        // Update Audio
        const currentSpeed = serverData.speed || 0;
        updateAudio(currentSpeed, currentSpeed > 0.5, serverData.driftLevel || 0, (serverData.drift || 0) !== 0);

        // Effetti Visivi (Scale, Hit)
        if (visualGroupRef.current) {
            if (isHitRef.current) {
                spinTimer.current -= delta;
                visualGroupRef.current.rotation.y += 25 * delta; 
                if (spinTimer.current <= 0) {
                    isHitRef.current = false;
                    visualGroupRef.current.rotation.y = 0; 
                }
            }
            let targetScale = isMega ? 2.5 : (isSmall.current ? 0.5 : 1);
            visualGroupRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), delta * 5);
            
            if (isStar) {
                const time = state.clock.elapsedTime * 5;
                const rainbowColor = new Color().setHSL((time % 1), 1.0, 0.5);
                visualGroupRef.current.traverse((child) => {
                    if (child.isMesh && child.material) {
                         if (!child.userData.hasCloned) { child.material = child.material.clone(); child.userData.hasCloned = true; }
                         child.material.emissive.copy(rainbowColor);
                         child.material.emissiveIntensity = 0.5;
                    }
                });
            }
        }
    });

    useEffect(() => {
        const handleHit = (e) => {
             if (e.detail?.victimId === playerId) {
                 if (latestEffects.current.isBulletBill || latestEffects.current.isStar || latestEffects.current.isMega) return;
                 isHitRef.current = true;
                 spinTimer.current = 1.0; 
             }
        };
        const handleLightning = (e) => {
             if (e.detail?.attackerId !== playerId) {
                 if (latestEffects.current.isBulletBill || latestEffects.current.isStar || latestEffects.current.isMega) return;
                 setTimeout(() => {
                     isHitRef.current = true;
                     spinTimer.current = 1.0;
                     isSmall.current = true;
                     if (smallTimer.current) clearTimeout(smallTimer.current);
                     smallTimer.current = setTimeout(() => isSmall.current = false, 10000);
                 }, Math.random() * 400);
             }
        };
        window.addEventListener('banana-hit', handleHit);
        window.addEventListener('lightning-strike', handleLightning);
        return () => {
            window.removeEventListener('banana-hit', handleHit);
            window.removeEventListener('lightning-strike', handleLightning);
        };
    }, [playerId]);

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            colliders={false} 
            name="opponent"
            userData={{ type: 'opponent', id: playerId }}
        >
            <BallCollider args={[PHYSICS_RADIUS]} />
            
            <group ref={(node) => { audioGroupRef.current = node; if (node && !audioGroupMounted) setAudioGroupMounted(true); }} />
            
            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                <group visible={!isBulletBill}>
                    {/* Qui usiamo il componente RemoteVisuals che si aggiorna ogni frame */}
                    <RemoteVisuals 
                        opponentsDataRef={opponentsDataRef}
                        playerId={playerId}
                        vehicle={vehicle}
                        character={character}
                    />
                </group>
                <group visible={!!isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>
            </group>
        </RigidBody>
    );
});