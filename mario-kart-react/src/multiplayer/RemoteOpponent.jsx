import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 
import { disposeObject3D, disposeAudioResources } from '../utils/ThreeJSCleanup';

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

// Import Audio Hook
import { usePositionalKartAudio } from '../hooks/usePositionalKartAudio.js';

const PHYSICS_RADIUS = 1; 
const INTERPOLATION_DELAY = 100; 

// --- COMPONENTE PRINCIPALE ---
export const RemoteOpponent = forwardRef(({ playerId, opponentsDataRef, character, vehicle, isRaceActive = true }, ref) => {
    const rb = useRef();
    
    // Refs visuali separati per gestire nascondi/mostra
    const visualGroupRef = useRef();
    const kartVisualRef = useRef();
    const billVisualRef = useRef();

    const renderBuffer = useRef([]);
    
    const audioGroupRef = useRef(null);
    const [audioGroupMounted, setAudioGroupMounted] = useState(false);
    
    // Stati interni per logica visiva
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    const isSmall = useRef(false);
    const smallTimer = useRef(null);
    const wasStarRef = useRef(false); // Per tracciare quando resettare i materiali

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
            return { x: 0, y: 0, z: 0 };
        }
    }));

    // Caricamento Modello Bullet Bill
    const { scene: billScene } = useGLTF('/items/BulletBill.glb');
    const billClone = useMemo(() => {
        const clone = SkeletonUtils.clone(billScene);
        clone.traverse((obj) => { 
            if (obj.isMesh) {
                obj.frustumCulled = false; 
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
        return clone;
    }, [billScene]);
    
    // Cleanup al dismount
    useEffect(() => {
        return () => {
            disposeObject3D(billClone);
            stopAllAudio();
        };
    }, [billClone, stopAllAudio]);

    // --- LOGICA MOVIMENTO E EFFETTI (60 FPS) ---
    useFrame((state, delta) => {
        // 1. LEGGI I DATI RAW DAL NETWORK REF (Bypassa le props di React)
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData || !rb.current) return;

        // Estrazione dati effetti direttamente dallo stream
        const remoteEffects = serverData.effects || {};
        const isBulletBill = remoteEffects.isBulletBill || false;
        const isStar = remoteEffects.isStar || false;
        const isMega = remoteEffects.isMega || false;
        const isSpinning = remoteEffects.isSpinning || false;

        // --- A. INTERPOLAZIONE MOVIMENTO ---
        renderBuffer.current.push({
            t: Date.now(),
            pos: [serverData.x, serverData.y, serverData.z],
            rot: [serverData.rotation?.x ?? 0, serverData.rotation?.y ?? 0, serverData.rotation?.z ?? 0, serverData.rotation?.w ?? 1]
        });

        if (renderBuffer.current.length > 20) renderBuffer.current.shift();
        
        if (renderBuffer.current.length >= 2) {
             const now = Date.now();
             const renderTime = now - INTERPOLATION_DELAY;
             let i = 0;
             while(i < renderBuffer.current.length - 1 && renderBuffer.current[i+1].t <= renderTime) { i++; }
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

        // --- B. AUDIO UPDATE ---
        const currentSpeed = serverData.speed || 0;
        const isAccelerating = currentSpeed > 0.5;
        const isDrifting = (serverData.drift || 0) !== 0;
        const driftLevel = serverData.driftLevel || 0;
        updateAudio(currentSpeed, isAccelerating, driftLevel, isDrifting);

        // --- C. GESTIONE VISUALE ---
        if (visualGroupRef.current) {
            
            // 1. ROTAZIONE COLPO (Banana)
            if (isHitRef.current || isSpinning) {
                spinTimer.current -= delta;
                visualGroupRef.current.rotation.y += 25 * delta; 
                
                // Resetta l'evento locale solo se è finito il timer e il server non dice più che sta roteando
                if (spinTimer.current <= 0 && !isSpinning) {
                    isHitRef.current = false;
                    visualGroupRef.current.rotation.y = 0; 
                }
            } else {
                // Assicura che il modello torni dritto quando isSpinning diventa false
                visualGroupRef.current.rotation.y = 0; 
            }

            // 2. TOGGLE VISIBILITÀ (Kart vs Bullet Bill)
            if (kartVisualRef.current) kartVisualRef.current.visible = !isBulletBill;
            if (billVisualRef.current) billVisualRef.current.visible = isBulletBill;

            // 3. SCALA (Mega / Small / Normal)
            // Se è Bill, la scala la gestiamo a parte o forziamo 1 sul container e 2.5 sul figlio
            let targetScale = 1;
            if (!isBulletBill) {
                if (isMega) targetScale = 2.5;
                else if (isSmall.current) targetScale = 0.5;
            } else {
                targetScale = 1; // Il container principale sta a 1, il bill dentro è scalato
            }
            
            visualGroupRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), delta * 5);
            
            // 4. COLORE STELLA (Star Power)
            if (isStar) {
                wasStarRef.current = true;
                const time = state.clock.elapsedTime * 5;
                const rainbowColor = new Color().setHSL((time % 1), 0.6, 0.2);
                
                // Applica colore solo al gruppo del KART (non al Bill se non vuoi)
                if (kartVisualRef.current) {
                    kartVisualRef.current.traverse((child) => {
                        if (child.isMesh && child.material) {
                             if (!child.userData.hasCloned) { 
                                 child.material = child.material.clone(); 
                                 child.userData.hasCloned = true; 
                             }
                             child.material.emissive.copy(rainbowColor);
                             child.material.emissiveIntensity = 0.8;
                        }
                    });
                }
            } else if (wasStarRef.current) {
                // RESET: Esegui solo una volta quando la stella finisce
                wasStarRef.current = false;
                if (kartVisualRef.current) {
                    kartVisualRef.current.traverse((child) => {
                        if (child.isMesh && child.userData.hasCloned) {
                             child.material.emissive.setHex(0x000000);
                             child.material.emissiveIntensity = 0;
                        }
                    });
                }
            }
        }
    });

    // Event Listeners per Colpi e Fulmini
    useEffect(() => {
        const handleHit = (e) => {
             if (e.detail?.victimId === playerId) {
                 // Recupera stato attuale dal ref per sicurezza
                 const currentData = opponentsDataRef.current[playerId];
                 const effects = currentData?.effects || {};
                 
                 // Non subire colpo se hai powerup attivi
                 if (effects.isBulletBill || effects.isStar || effects.isMega) return;
                 
                 isHitRef.current = true;
                 spinTimer.current = 1.0; 
             }
        };
        const handleLightning = (e) => {
             if (e.detail?.attackerId !== playerId) {
                 const currentData = opponentsDataRef.current[playerId];
                 const effects = currentData?.effects || {};

                 if (effects.isBulletBill || effects.isStar || effects.isMega) return;
                 
                 // Delay random per realismo e sync
                 setTimeout(() => {
                     isHitRef.current = true;
                     spinTimer.current = 1.0;
                     isSmall.current = true;
                     if (smallTimer.current) clearTimeout(smallTimer.current);
                     smallTimer.current = setTimeout(() => isSmall.current = false, 10000);
                 }, Math.random() * 200 + 100);
             }
        };

        // Ascolta eventi globali (scatenati dal NetworkManager o localmente)
        window.addEventListener('banana-hit', handleHit);
        window.addEventListener('lightning-strike', handleLightning);
        return () => {
            window.removeEventListener('banana-hit', handleHit);
            window.removeEventListener('lightning-strike', handleLightning);
        };
    }, [playerId, opponentsDataRef]); // Importante: opponentsDataRef nelle deps

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            colliders={false} // Disabilita colliders fisici remoti per evitare glitch, usiamo logica custom se serve
            name="opponent"
            userData={{ type: 'opponent', id: playerId }}
        >
            <BallCollider args={[PHYSICS_RADIUS]} />
            
            {/* Gruppo Audio */}
            <group ref={(node) => { audioGroupRef.current = node; if (node && !audioGroupMounted) setAudioGroupMounted(true); }} />
            
            {/* Container Visuale Principale (Scala e Rotazione) */}
            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                
                {/* 1. GRUPPO KART (Modello + Racer) */}
                <group ref={kartVisualRef} position={vehicle.vehicleOffset || [0,0,0]}>
                    <VehicleModel 
                        vehicleConfig={vehicle.modelConfig} 
                        scale={1.4} 
                        rotation={[0, Math.PI, 0]} 
                        isBike={vehicle.isBike} 
                        speed={0}       
                        steer={0}       
                        drift={0} 
                    />

                    <group rotation={[0, Math.PI, 0]}>
                        <RacerModel 
                            isInMenu={false}
                            scale={1.5}
                            characterConfig={character.modelConfig}
                            vehicleConfig={vehicle} 
                            steer={0}
                            drift={0}
                            speed={0}
                            isKart={true}
                            key={vehicle.name + "_racer"}
                        />
                    </group>
                </group>

                {/* 2. GRUPPO BULLET BILL (Visibile solo quando attivo) */}
                {/* Nota: Bill è molto grande, quindi la scala 2.5 è applicata qui direttamente al gruppo figlio */}
                <group ref={billVisualRef} visible={false} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>

            </group>
        </RigidBody>
    );
});