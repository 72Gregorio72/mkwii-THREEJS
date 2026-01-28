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

export const RemoteOpponent = ({ data, character, vehicle, userData }) => {
    const racerId = userData?.id || "player";
    const rb = useRef();
    const visualGroupRef = useRef(); 
    
    // Visual State Refs
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    
    // Load Bullet Bill Model
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

    // Destructure effects
    const { isBulletBill, isStar, isMega } = data.effects || {};

    // --- FIX: Store latest effects in a Ref so Event Listener can read them without re-rendering ---
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        latestEffects.current = { isBulletBill, isStar, isMega };
    }, [isBulletBill, isStar, isMega]);

    const isSmall = useRef(false);
    const smallTimer = useRef(null);

    const activateLightning = () => {
      isSmall.current = true;
      if (smallTimer.current) clearTimeout(smallTimer.current);
      smallTimer.current = setTimeout(() => deactivateLightning, 10000);     
    };

    const deactivateLightning = () => {
      isSmall.current = false;
    };

    // --- 1. HANDLE STANDARD HITS (Banana/Shell/Bomb) ---
    useEffect(() => {
        const handleHit = (e) => {
            const victimId = e.detail?.victimId;
            const type = e.detail?.type || 'standard';

            // Check ID
            if (victimId === data.id) {
                // Check Invincibility using the REF (Always fresh)
                const { isBulletBill, isStar, isMega } = latestEffects.current;
                
                if (isBulletBill || isStar || isMega) return;

                console.log(`Remote opponent ${data.id} hit by ${type}`);
                isHitRef.current = true;
                spinTimer.current = 1.0; 
            }
        };

        window.addEventListener('banana-hit', handleHit);
        return () => window.removeEventListener('banana-hit', handleHit);
    }, [data.id]); // Run ONCE per ID change (practically once)


    // --- 2. HANDLE LIGHTNING STRIKE ---
    useEffect(() => {
        const handleLightningStrike = (e) => {
            const attackerId = e.detail?.attackerId;
            
            // FIX: Access values from the Ref, not the props directly
            // Also removed the .current error from previous code
            const { isBulletBill, isStar, isMega } = latestEffects.current;

            if (isBulletBill || isStar || isMega) {
                console.log(`Remote Opponent ${data.id} BLOCKING lightning (Invincible)`);
                return;
            }
            
            const delay = Math.random() * 500;
    
            setTimeout(() => {
                if (!rb.current) return;
    
                console.log(`${data.id} hit by LIGHTNING from ${attackerId}`);
    
                isHitRef.current = true;
                spinTimer.current = 1.0; 
                activateLightning();
    
            }, delay);
        };
    
        window.addEventListener('lightning-strike', handleLightningStrike);
        return () => window.removeEventListener('lightning-strike', handleLightningStrike);
        // FIX: Removed [data.id, isBulletBill...] dependency. This listener is now stable.
    }, []); 


    useFrame((state, delta) => {
        if (!rb.current) return;

        // ... [PHYSICS INTERPOLATION CODE REMAINS THE SAME] ...
        const targetPos = new Vector3(data.x, data.y, data.z);
        const targetRot = new Quaternion(
            data.rotation?.x ?? 0, data.rotation?.y ?? 0, data.rotation?.z ?? 0, data.rotation?.w ?? 1
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
            if (isHitRef.current) {
                spinTimer.current -= delta;
                visualGroupRef.current.rotation.y += 25 * delta; 
                if (spinTimer.current <= 0) {
                    isHitRef.current = false;
                    visualGroupRef.current.rotation.y = 0; 
                }
            } else {
                visualGroupRef.current.rotation.y = MathUtils.lerp(visualGroupRef.current.rotation.y, 0, 10 * delta);
            }

            // Scale handling
            let targetScale = 1;
            if (isMega) targetScale = 2.5;
            else if (isSmall.current) targetScale = 0.5;

            const currentScale = visualGroupRef.current.scale.x;
            const smoothScale = MathUtils.lerp(currentScale, targetScale, delta * 5);
            visualGroupRef.current.scale.set(smoothScale, smoothScale, smoothScale);

            // Star Power
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
            } else {
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
                <group visible={!isBulletBill}>
                    <group position={vehicle.vehicleOffset || [0,0,0]}>
                        <VehicleModel 
                            vehicleConfig={vehicle.modelConfig} 
                            scale={1.4} rotation={[0, Math.PI, 0]} isBike={vehicle.isBike} speed={0} steer={data.steer || 0} drift={data.drift || 0} 
                        />
                        <group rotation={[0, Math.PI, 0]}>
                            <RacerModel
                                isInMenu={false} isRemote={true} characterConfig={character.modelConfig} vehicleConfig={vehicle} isKart={true} steer={data.steer || 0} drift={data.drift || 0} scale={1.5} speed={0} key={vehicle.name + "_racer"}
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
}