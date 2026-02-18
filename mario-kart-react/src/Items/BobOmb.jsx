import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib'; 
import { AUDIO_SFX } from '../components/Data'; 

const EXPLOSION_RADIUS = 6;
const FUSE_TIME = 2000;

export const BobOmb = memo(function BobOmb({ position, initVelocity = [0, 0, 0], onDestroy }) {
    const { scene } = useGLTF('/items/BobOmb.glb'); 
    const rb = useRef();
    const ExplosionAudioRef = useRef();

    const [isLanded, setIsLanded] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const hitList = useRef(new Set());

    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.material = child.material.clone();
            }
        });
        return c;
    }, [scene]);

    // FISICA: Sveglia e applica lancio
    useEffect(() => {
        if (rb.current) {
            rb.current.wakeUp();
            rb.current.setLinvel(new THREE.Vector3(...initVelocity), true);
        }
    }, []);

    const triggerExplosion = () => {
        if (isExploding || isFinished) return;
        setIsExploding(true);
        if (ExplosionAudioRef.current) {
            ExplosionAudioRef.current.setVolume(2.0);
            ExplosionAudioRef.current.play();
        }

        setTimeout(() => {
            setIsFinished(true);
            // Additional delay to ensure physics cleanup completes
            setTimeout(() => {
                if (onDestroy) onDestroy(); // Rimuove l'oggetto dal server
            }, 100);
        }, 500);
    };

    const handleCollisionEnter = (payload) => {
        if (isLanded || isExploding) return;
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        // La bomba atterra quando tocca qualcosa che NON è un racer
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        if (!isRacer) {
            setIsLanded(true);
        }
    };

    const handleExplosionHit = (payload) => {
        if (!isExploding) return;
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const targetName = targetObj?.name || "";
        const id = userData?.id || targetName;
        
        // Identifica se è un racer
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (isRacer && !hitList.current.has(id)) {
            hitList.current.add(id);
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: id, type: 'explosion' } 
            }));
        }
    };

    useEffect(() => {
        if (isLanded && !isExploding) {
            const timer = setTimeout(() => triggerExplosion(), FUSE_TIME);
            return () => clearTimeout(timer);
        }
    }, [isLanded, isExploding]);

    useFrame((state) => {
        if (clone && isLanded && !isExploding) {
            // Animazione "pulsante" pre-esplosione
            const scaleVal = 1.5 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
            clone.scale.set(scaleVal, scaleVal, scaleVal);
            clone.traverse((c) => {
                if (c.isMesh) {
                    const isRed = Math.sin(state.clock.elapsedTime * 25) > 0;
                    c.material.emissive.set(isRed ? 0xff0000 : 0x000000);
                    c.material.emissiveIntensity = isRed ? 1 : 0;
                }
            });
        }
    });

    if (isFinished) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            type="dynamic" 
            colliders={false} 
            mass={2}
            onCollisionEnter={handleCollisionEnter}
        >
            <BallCollider args={[0.5]} friction={1} />
            {isExploding && <BallCollider args={[EXPLOSION_RADIUS]} sensor onIntersectionEnter={handleExplosionHit} />}
            
            <PositionalAudio ref={ExplosionAudioRef} url={AUDIO_SFX.BOB_OMB_EXPLODE} distance={15} loop={false} />
            <group scale={[1.5, 1.5, 1.5]}>
                {!isExploding ? <primitive object={clone} /> : (
                    <mesh>
                        <sphereGeometry args={[EXPLOSION_RADIUS, 16, 16]} />
                        <meshBasicMaterial color="orange" transparent opacity={0.5} />
                    </mesh>
                )}
            </group>
        </RigidBody>
    );
});