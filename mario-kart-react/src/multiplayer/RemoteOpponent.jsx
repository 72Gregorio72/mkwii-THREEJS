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

// --- NUOVO COMPONENTE PER GESTIRE LE ANIMAZIONI ---
// Questo componente legge i dati in tempo reale e aggiorna solo la parte visiva
const RemoteVisuals = ({ opponentsDataRef, playerId, vehicle, character }) => {
    // Usiamo dei ref per i valori correnti per fare lo smoothing (Lerp)
    const currentSpeed = useRef(0);
    const currentSteer = useRef(0);
    const currentDrift = useRef(0);
    
    // Stato per passare i dati puliti ai componenti figli
    const [animData, setAnimData] = useState({ speed: 0, steer: 0, drift: 0 });

    const prevPos = useRef(new Vector3());
    const isFirstFrame = useRef(true);

    useFrame((state, delta) => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData) return;

        // 1. Calcolo Velocità Basato sulla Posizione (Anti T-Pose)
        const pos = new Vector3(serverData.x, serverData.y, serverData.z);
        let calculatedSpeed = 0;

        if (!isFirstFrame.current) {
            const dist = pos.distanceTo(prevPos.current);
            // Evitiamo divisioni per zero o delta troppo piccoli
            if (delta > 0.01) {
                calculatedSpeed = dist / delta;
            }
        } else {
            isFirstFrame.current = false;
        }
        prevPos.current.copy(pos);

        // 2. LOGICA "DEADZONE" (Soglia minima)
        // Se la velocità è inferiore a 0.5 (molto lento/fermo), forziamola a 0
        // Questo impedisce alle ruote di girare quando il kart è fermo ma "vibra" per la fisica
        if (calculatedSpeed < 0.5) calculatedSpeed = 0;

        // 3. SMOOTHING (Lerp)
        // Invece di passare da 0 a 20 in un frame, ci arriviamo gradualmente.
        // Il fattore 10 * delta rende la transizione fluida ma reattiva.
        currentSpeed.current = MathUtils.lerp(currentSpeed.current, calculatedSpeed, 10 * delta);
        
        // Smooth anche per lo sterzo per evitare scatti delle ruote anteriori
        const targetSteer = serverData.steer || 0;
        currentSteer.current = MathUtils.lerp(currentSteer.current, targetSteer, 10 * delta);

        // Drift non ha bisogno di molto smoothing, è on/off o graduale
        currentDrift.current = serverData.drift || 0;

        // 4. Aggiorniamo lo stato (che aggiorna RacerModel e VehicleModel)
        setAnimData({
            speed: currentSpeed.current,
            steer: currentSteer.current,
            drift: currentDrift.current
        });
    });

    return (
        <group position={vehicle.vehicleOffset || [0,0,0]}>
            <VehicleModel 
                vehicleConfig={vehicle.modelConfig} 
                scale={1.4} 
                rotation={[0, Math.PI, 0]} 
                isBike={vehicle.isBike} 
                // Passiamo i dati "puliti" e interpolati
                speed={animData.speed}       
                steer={animData.steer}       
                drift={animData.drift} 
                // Nota: Rimuovi isRemote={true} da qui se VehicleModel lo usa per bloccare le animazioni
                // oppure assicurati che VehicleModel non abbia "if (isRemote) return"
            />
            <group rotation={[0, Math.PI, 0]}>
                <RacerModel
                    isInMenu={false} 
                    // isRemote={true} // <-- Rimuovi o metti false se vuoi le animazioni complete
                    characterConfig={character.modelConfig} 
                    vehicleConfig={vehicle} 
                    isKart={true} 
                    steer={animData.steer}   
                    drift={animData.drift} 
                    scale={1.5} 
                    speed={animData.speed}
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
    
    // Audio group ref
    const audioGroupRef = useRef(null);
    const [audioGroupMounted, setAudioGroupMounted] = useState(false);
    
    // Visual State Refs
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

    // Gestione Effetti
    const { isBulletBill = false, isStar = false, isMega = false } = data.effects || {};
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        latestEffects.current = { isBulletBill, isStar, isMega };
    }, [isBulletBill, isStar, isMega]);

    // LOGICA MOVIMENTO (Interpolazione e Audio)
    useFrame((state, delta) => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData || !rb.current) return;

        // ... [Codice Buffer Interpolazione invariato] ...
        renderBuffer.current.push({
            t: Date.now(),
            pos: [serverData.x, serverData.y, serverData.z],
            rot: [serverData.rotation?.x ?? 0, serverData.rotation?.y ?? 0, serverData.rotation?.z ?? 0, serverData.rotation?.w ?? 1]
        });

        if (renderBuffer.current.length > 20) renderBuffer.current.shift();
        
        // Interpolazione fisica
        if (renderBuffer.current.length >= 2) {
             const now = Date.now();
             const renderTime = now - INTERPOLATION_DELAY;
             let i = 0;
             while(i < renderBuffer.current.length - 1 && renderBuffer.current[i+1].t <= renderTime) {
                 i++;
             }
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

        // Audio Update
        const currentSpeed = serverData.speed || 0;
        const isAccelerating = currentSpeed > 0.5;
        const isDrifting = (serverData.drift || 0) !== 0;
        const driftLevel = serverData.driftLevel || 0;
        updateAudio(currentSpeed, isAccelerating, driftLevel, isDrifting);

        // Effetti Visivi (Scale, Hit) - Logica invariata
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
            // ... [Codice Star invariato] ...
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

    // ... [Event Listeners invariati] ...
    useEffect(() => {
        const handleHit = (e) => {
             if (e.detail?.victimId === playerId) {
                 const { isBulletBill, isStar, isMega } = latestEffects.current;
                 if (isBulletBill || isStar || isMega) return;
                 isHitRef.current = true;
                 spinTimer.current = 1.0; 
             }
        };
        const handleLightning = (e) => {
             if (e.detail?.attackerId !== playerId) {
                 const { isBulletBill, isStar, isMega } = latestEffects.current;
                 if (isBulletBill || isStar || isMega) return;
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
                
                {/* Visualizzazione Normale del Kart/Personaggio */}
                <group visible={!isBulletBill}>
                    {/* USIAMO IL NUOVO COMPONENTE PER LE ANIMAZIONI */}
                    <RemoteVisuals 
                        opponentsDataRef={opponentsDataRef}
                        playerId={playerId}
                        vehicle={vehicle}
                        character={character}
                    />
                </group>

                {/* Visualizzazione Bullet Bill */}
                <group visible={!!isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>

            </group>
        </RigidBody>
    );
});