import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';
import * as THREE from 'three';

export const GreenShell = memo(function GreenShell({ position, initVelocity, onDestroy }) {
    const { scene } = useGLTF('/items/GreenShell.glb'); 
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const rb = useRef();
    const meshRef = useRef();
    const homingAudioRef = useRef();
    const [isActive, setIsActive] = useState(true);
    const isDestroyedRef = useRef(false);

    // 1. Rendiamo l'inizializzazione del vettore a prova di bomba (evita i NaN)
    const velocityVec = useMemo(() => {
        if (!initVelocity) return new THREE.Vector3(0, 0, 0);
        if (Array.isArray(initVelocity) && initVelocity.length >= 3) {
            return new THREE.Vector3(initVelocity[0] || 0, initVelocity[1] || 0, initVelocity[2] || 0);
        }
        if (initVelocity.x !== undefined) {
            return new THREE.Vector3(initVelocity.x || 0, initVelocity.y || 0, initVelocity.z || 0);
        }
        return new THREE.Vector3(0, 0, 0);
    }, [initVelocity]);

    useEffect(() => {
        // Rimuoviamo la roba fisica da qui. Gestiamo solo il timer di distruzione.
        const timer = setTimeout(() => {
            setIsActive(false);
        }, 15000);
        
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isActive) {
            return () => {
                if (!isDestroyedRef.current) {
                    isDestroyedRef.current = true;
                    try {
                        if (onDestroy) onDestroy();
                    } catch (e) {
                        console.warn('Error during GreenShell cleanup:', e);
                    }
                }
            };
        }
    }, [isActive, onDestroy]);

    useFrame((_state, delta) => {
        if (!isActive || !rb.current) return;
        
        try {
            // Rimosso il controllo isKinematic buggato. 
            // linvel() fallirà dolcemente nel blocco catch se il body non è pronto.
            const currentVel = rb.current.linvel();
            if (currentVel && typeof currentVel.y === 'number') {
                rb.current.setLinvel({ x: velocityVec.x, y: currentVel.y, z: velocityVec.z }, true);
            }
        } catch (e) {
            // Ignora in modo silenzioso finché Wasm non è pronto
        }
        
        if (meshRef.current) meshRef.current.rotation.y += 15 * delta;
    });

    const handleImpact = (payload) => {
        if (!isActive || isDestroyedRef.current) return;
        
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const targetName = targetObj?.name || "";

        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (isRacer) {
            setIsActive(false);
            isDestroyedRef.current = true;
            
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: userData?.id || targetName } 
            }));
            
            try {
                if (onDestroy) onDestroy();
            } catch (e) {
                console.warn('Error during GreenShell destruction:', e);
            }
        }
    };

    if (!isActive) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            linearVelocity={[velocityVec.x, velocityVec.y, velocityVec.z]} 
            type="dynamic" 
            ccd={true}       
            restitution={1.0} 
            friction={0.0}    
            lockRotations={true} 
            colliders={false}    
            mass={5} 
            onCollisionEnter={handleImpact}
        >
            <BallCollider args={[0.3]} friction={0.0} restitution={1.0} /> 
            <PositionalAudio ref={homingAudioRef} url={AUDIO_SFX.GREEN_SHELL_MOVE} distance={10} loop autoplay volume={2}/>
            <group ref={meshRef} position={[0, -0.2, 0]} scale={[1.5, 1.5, 1.5]}>
                 <primitive object={clone} /> 
            </group>
        </RigidBody>
    );
});