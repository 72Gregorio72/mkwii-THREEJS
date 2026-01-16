import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib'; 

const EXPLOSION_RADIUS = 6;
const FUSE_TIME = 2000;

export const BobOmb = memo(function BobOmb({ position, initVelocity = [0, 0, 0], onDestroy }) {
    const { scene } = useGLTF('/items/BobOmb.glb'); 
    
    // Clonazione Mesh e Materiali (come prima)
    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = child.material.clone();
            }
        });
        return c;
    }, [scene]);

    const rb = useRef();
    
    // Stati locali
    const [isLanded, setIsLanded] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const hitList = useRef(new Set());

    // --- FIX "SALTO": INIZIALIZZAZIONE MANUALE ---
    // Usiamo useEffect con array vuoto [] per applicare la velocità SOLO alla nascita della bomba.
    // In questo modo, i futuri re-render ignorano questo blocco e la fisica non viene disturbata.
    useEffect(() => {
        if (rb.current) {
            // 1. Imposta velocità lineare (Lancio)
            rb.current.setLinvel(
                new THREE.Vector3(initVelocity[0], initVelocity[1], initVelocity[2]), 
                true
            );
        }
    }, []); // <--- Le parentesi vuote sono fondamentali!

    // --- GESTIONE FISICA ---
    const handleCollisionEnter = (payload) => {
        if (isLanded || isExploding) return;

        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";

        if (targetName === 'player' || targetName.startsWith('bot') || targetName.includes('bobomb')) return;

        setIsLanded(true);
    };

    // --- TIMER ESPLOSIONE ---
    useEffect(() => {
        if (isLanded && !isExploding) {
            const timer = setTimeout(() => {
                triggerExplosion();
            }, FUSE_TIME);
            return () => clearTimeout(timer);
        }
    }, [isLanded, isExploding]);

    const triggerExplosion = () => {
        if (isExploding || isFinished) return;
        setIsExploding(true);
        console.log("--- BOOM! ---");

        setTimeout(() => {
            setIsFinished(true);
            if (onDestroy) onDestroy();
        }, 500);
    };

    const handleBodyIntersection = (payload) => {
        if (!isLanded || isExploding) return;
        const targetName = payload.other.rigidBodyObject?.name || "";
        if (targetName === 'player' || targetName.startsWith('bot')) {
            triggerExplosion();
        }
    };

    const handleExplosionHit = (payload) => {
        if (!isExploding) return;
        const targetName = payload.other.rigidBodyObject?.name || "";
        
        if ((targetName === 'player' || targetName.startsWith('bot')) && !hitList.current.has(targetName)) {
            hitList.current.add(targetName);
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: targetName, type: 'explosion' } 
            }));
        }
    };

    // --- ANIMAZIONE VISIVA ---
    useFrame((state) => {
        if (clone && isLanded && !isExploding) {
            const scaleVal = 1.5 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
            clone.scale.set(scaleVal, scaleVal, scaleVal);
            
            clone.traverse((child) => {
                if (child.isMesh && child.material) {
                    const isRed = Math.sin(state.clock.elapsedTime * 25) > 0;
                    child.material.emissive.set(isRed ? 0xff0000 : 0x000000);
                    child.material.emissiveIntensity = isRed ? 1 : 0;
                }
            });
        }
    });

    if (isFinished) return null;

    return (
        <RigidBody 
            ref={rb}
            // NOTA: 'position' qui va bene perché Rapier lo usa come init,
            // ma abbiamo RIMOSSO 'linearVelocity' dalle props!
            position={position}
            
            type="dynamic" 
            colliders={false} 
            mass={5}
            gravityScale={3}
            restitution={isLanded ? 0.0 : 0.4} 
            friction={1.0}
            linearDamping={isLanded ? 5.0 : 0.1}
            angularDamping={isLanded ? 5.0 : 0.5}
            ccd={true}
            onCollisionEnter={handleCollisionEnter}
            userData={{ type: 'item', subtype: 'bobomb' }}
        >
            {!isExploding && (
                <BallCollider 
                    args={[0.4]} 
                    position={[0, 0.4, 0]}
                    sensor={isLanded} 
                    onIntersectionEnter={handleBodyIntersection}
                />
            )}

            {isExploding && (
                <BallCollider 
                    args={[EXPLOSION_RADIUS]} 
                    sensor={true} 
                    onIntersectionEnter={handleExplosionHit}
                />
            )}

            <group>
                {!isExploding ? (
                    <primitive 
                        object={clone} 
                        scale={[1.5, 1.5, 1.5]} 
                        position={[0, 0, 0]} 
                    />
                ) : (
                    <mesh>
                        <sphereGeometry args={[EXPLOSION_RADIUS, 16, 16]} />
                        <meshBasicMaterial color="orange" transparent opacity={0.6} />
                    </mesh>
                )}
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/items/BobOmb.glb');