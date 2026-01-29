import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
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
    const velocityVec = useMemo(() => new THREE.Vector3(...initVelocity), [initVelocity]);

    useEffect(() => {
        if (homingAudioRef.current) {
            homingAudioRef.current.setVolume(2.0);
            homingAudioRef.current.play();
        }
        if (rb.current) {
            rb.current.wakeUp();
            rb.current.setLinvel(velocityVec, true);
        }
        const timer = setTimeout(() => {
            setIsActive(false);
            if (onDestroy) onDestroy();
        }, 15000); 
        return () => clearTimeout(timer);
    }, []);

    useFrame((_state, delta) => {
        if (!isActive || !rb.current) return;
        
        // Mantiene la velocità costante (Network Sync simulato)
        const currentVel = rb.current.linvel();
        rb.current.setLinvel({ x: velocityVec.x, y: currentVel.y, z: velocityVec.z }, true);
        
        if (meshRef.current) meshRef.current.rotation.y += 15 * delta;
    });

    const handleImpact = (payload) => {
        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";
        const userData = targetObj?.userData;

        if (targetName === 'player' || targetName.startsWith('bot') || (userData && userData.type === 'opponent')) {
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: userData?.id || targetName } 
            })); 
            setIsActive(false);
            if (onDestroy) onDestroy();
        }
    };

    if (!isActive) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
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