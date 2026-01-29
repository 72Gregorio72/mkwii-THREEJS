import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

const PHYSICS_RADIUS = 1; 
const INTERPOLATION_DELAY = 100; 

// Usiamo forwardRef per permettere al RaceManager di accedere a questo componente
export const RemoteOpponent = forwardRef(({ playerId, opponentsDataRef, character, vehicle, userData, data }, ref) => {
    const rb = useRef();
    const visualGroupRef = useRef();
    const renderBuffer = useRef([]);
    
    // Visual State Refs
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    const isSmall = useRef(false);
    const smallTimer = useRef(null);

    // --- 1. ESPOSIZIONE REF PER IL RACEMANAGER ---
    // Questo permette al RaceManager di fare remoteRefMap.current[id].current.translation()
    useImperativeHandle(ref, () => ({
        translation: () => {
            if (rb.current) return rb.current.translation();
            return { x: data.x, y: data.y, z: data.z };
        }
    }));

    // Caricamento Modelli
    const { scene: billScene } = useGLTF('/items/BulletBill.glb');
    const billClone = useMemo(() => {
        const clone = SkeletonUtils.clone(billScene);
        clone.traverse((obj) => { if (obj.isMesh) obj.frustumCulled = false; });
        return clone;
    }, [billScene]);

    // Gestione Effetti (Ref per evitare closure stale negli event listener)
    const { isBulletBill, isStar, isMega } = data.effects || {};
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        latestEffects.current = { isBulletBill, isStar, isMega };
    }, [isBulletBill, isStar, isMega]);

    // --- 2. LOGICA DI RETE & INTERPOLAZIONE ---
    useFrame((state, delta) => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData || !rb.current) return;

        // Push nel buffer
        renderBuffer.current.push({
            t: Date.now(),
            pos: [serverData.x, serverData.y, serverData.z],
            rot: [
                serverData.rotation?.x ?? 0,
                serverData.rotation?.y ?? 0,
                serverData.rotation?.z ?? 0,
                serverData.rotation?.w ?? 1
            ]
        });

        if (renderBuffer.current.length > 20) renderBuffer.current.shift();
        if (renderBuffer.current.length < 2) return;

        const now = Date.now();
        const renderTime = now - INTERPOLATION_DELAY;
        
        let i = 0;
        for (; i < renderBuffer.current.length - 1; i++) {
            if (renderBuffer.current[i + 1].t > renderTime) break;
        }
        
        const b0 = renderBuffer.current[i];
        const b1 = renderBuffer.current[i + 1];

        if (b0 && b1 && b1.t !== b0.t) {
            const alpha = (renderTime - b0.t) / (b1.t - b0.t);
            const interpX = MathUtils.lerp(b0.pos[0], b1.pos[0], alpha);
            const interpY = MathUtils.lerp(b0.pos[1], b1.pos[1], alpha);
            const interpZ = MathUtils.lerp(b0.pos[2], b1.pos[2], alpha);
            
            const q0 = new Quaternion(...b0.rot);
            const q1 = new Quaternion(...b1.rot);
            q0.slerp(q1, alpha);

            rb.current.setNextKinematicTranslation({ x: interpX, y: interpY, z: interpZ });
            rb.current.setNextKinematicRotation(q0);
        }

        // --- 3. EFFETTI VISIVI (Hit, Scale, Star) ---
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
                        if (!child.userData.hasCloned) {
                            child.material = child.material.clone();
                            child.userData.hasCloned = true;
                        }
                        child.material.emissive.copy(rainbowColor);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            }
        }
    });

    // Event Listeners (Hit & Lightning)
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
            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                <group visible={!isBulletBill}>
                    <group position={vehicle.vehicleOffset || [0,0,0]}>
                        <VehicleModel 
                            vehicleConfig={vehicle.modelConfig} 
                            scale={1.4} rotation={[0, Math.PI, 0]} isBike={vehicle.isBike} speed={0} steer={data.steer || 0} drift={data.drift || 0} 
                        />
                        <group rotation={[0, Math.PI, 0]}>
                            <RacerModel
                                isInMenu={false} isRemote={true} characterConfig={character.modelConfig} vehicleConfig={vehicle} isKart={true} steer={data.steer || 0} drift={data.drift || 0} scale={1.5} speed={0}
                            />
                        </group>
                    </group>
                </group>
                <group visible={isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>
            </group>
        </RigidBody>
    );
});