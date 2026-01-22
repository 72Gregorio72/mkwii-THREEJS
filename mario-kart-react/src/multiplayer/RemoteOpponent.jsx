import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

const PHYSICS_RADIUS = 1; 

export const RemoteOpponent = ({ data, character, vehicle }) => {
    const rb = useRef();
    const visualGroupRef = useRef(); 
    
    // --- 1. NEW: VISUAL STATE REFS (Fixes "isHit is not defined") ---
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    
    // Load Bullet Bill Model
    const { scene: billScene } = useGLTF('/items/BulletBill.glb');

    // Clone Bullet Bill properly
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

    const { isBulletBill, isStar, isMega, isSmall } = data.effects || {};

    // --- 2. LISTENER FOR HIT EVENT ---
    useEffect(() => {
        const handleHit = (e) => {
            const victimId = e.detail?.victimId;
            
            // If the server says THIS opponent was hit
            if (victimId === data.id) {
                console.log(`Visual spin triggered for remote opponent: ${data.id}`);
                isHitRef.current = true;
                spinTimer.current = 1.0; // Spin for 1 second
            }
        };

        window.addEventListener('banana-hit', handleHit);
        return () => window.removeEventListener('banana-hit', handleHit);
    }, [data.id]);

    useFrame((state, delta) => {
        if (!rb.current) return;

        // --- A. PHYSICAL INTERPOLATION (Smooth Movement) ---
        const targetPos = new Vector3(data.x, data.y, data.z);
        const targetRot = new Quaternion(
            data.rotation?.x ?? 0, 
            data.rotation?.y ?? 0, 
            data.rotation?.z ?? 0, 
            data.rotation?.w ?? 1
        );

        const currentPos = rb.current.translation();
        const currentRot = rb.current.rotation();

        const lerpedX = MathUtils.lerp(currentPos.x, targetPos.x, delta * 15);
        const lerpedY = MathUtils.lerp(currentPos.y, targetPos.y, delta * 15);
        const lerpedZ = MathUtils.lerp(currentPos.z, targetPos.z, delta * 15);

        const curQ = new Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
        curQ.slerp(targetRot, delta * 15);

        rb.current.setNextKinematicTranslation({ x: lerpedX, y: lerpedY, z: lerpedZ });
        rb.current.setNextKinematicRotation(curQ);
        
        // --- B. VISUAL EFFECTS ---
        if (visualGroupRef.current) {
            
            // 1. HANDLE SPIN ANIMATION (Using Refs)
            if (isHitRef.current) {
                spinTimer.current -= delta;
                
                // Spin fast on Y axis
                visualGroupRef.current.rotation.y += 25 * delta; 

                if (spinTimer.current <= 0) {
                    isHitRef.current = false;
                    // Reset visual rotation
                    visualGroupRef.current.rotation.y = 0; 
                }
            } else {
                // Smoothly return to 0 if not spinning
                visualGroupRef.current.rotation.y = MathUtils.lerp(visualGroupRef.current.rotation.y, 0, 10 * delta);
            }

            // 2. SCALE (Mega / Small)
            let targetScale = 1;
            if (isMega) targetScale = 2.5;
            else if (isSmall) targetScale = 0.5;

            const currentScale = visualGroupRef.current.scale.x;
            const smoothScale = MathUtils.lerp(currentScale, targetScale, delta * 5);
            visualGroupRef.current.scale.set(smoothScale, smoothScale, smoothScale);

            // 3. STAR POWER (Rainbow)
            if (isStar) {
                const time = state.clock.elapsedTime * 5;
                const rainbowColor = new Color().setHSL((time % 1), 1.0, 0.5);

                visualGroupRef.current.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Clone material once to avoid shared material issues
                        if (!child.userData.hasCloned) {
                            child.material = child.material.clone();
                            child.userData.hasCloned = true;
                        }
                        child.material.emissive.copy(rainbowColor);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            } else {
                // Reset Star Color
                visualGroupRef.current.traverse((child) => {
                    if (child.isMesh && child.material && child.userData.hasCloned) {
                        child.material.emissive.setHex(0x000000);
                    }
                });
            }
        }
    });

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            position={[data.x, data.y, data.z]} 
            colliders={false} 
            name="opponent"
            userData={{ 
                type: 'opponent', 
                id: data.id, 
                effects: { isBulletBill, isStar, isMega } 
            }}
        >
            <BallCollider args={[PHYSICS_RADIUS]} position={[0, 0, 0]} />

            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                
                {/* 1. NORMAL KART */}
                <group visible={!isBulletBill}>
                    <group position={vehicle.vehicleOffset || [0,0,0]}>
                        <VehicleModel 
                            vehicleConfig={vehicle.modelConfig} 
                            scale={1.4} 
                            rotation={[0, Math.PI, 0]} 
                            isBike={vehicle.isBike}
                            speed={0} 
                            steer={data.steer || 0} 
                            drift={data.drift || 0} 
                        />
                        <group rotation={[0, Math.PI, 0]}>
                            <RacerModel
                                isInMenu={false}
                                isRemote={true} 
                                characterConfig={character.modelConfig} 
                                vehicleConfig={vehicle} 
                                isKart={true}
                                steer={data.steer || 0}   
                                drift={data.drift || 0}   
                                scale={1.5}
                                speed={0} 
                                key={vehicle.name + "_racer"}
                            />
                        </group>
                    </group>
                </group>

                {/* 2. BULLET BILL */}
                <group visible={isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>

            </group>
        </RigidBody>
    );
}