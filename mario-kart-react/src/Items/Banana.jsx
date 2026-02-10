import React, { useState, useRef, memo, useEffect } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { AUDIO_SFX } from '../components/Data';
import { PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';

export const Banana = memo(function Banana({ position, initVelocity = [0, 0, 0], onDestroy }) {
    const { scene } = useGLTF('/items/Banana.glb');
    const rb = useRef();
    const [isLanded, setIsLanded] = useState(false);
    const [isHit, setIsHit] = useState(false);
    const GroundAudioRef = useRef();

    // 1. Inizializzazione Fisica: Sveglia il corpo e applica il lancio
    useEffect(() => {
        if (rb.current) {
            rb.current.wakeUp();
            // Applichiamo la velocità iniziale passata dal server/lancio
            rb.current.setLinvel(new THREE.Vector3(...initVelocity), true);
        }
    }, [initVelocity]);

    const handleCollisionEnter = (payload) => {
        if (isLanded || isHit) return;
        
        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";
        
        // Se tocca qualcosa che non è un racer (suolo/muri)
        if (!targetName.includes("player") && !targetName.startsWith("bot") && !targetName.includes("opponent")) {
            if (GroundAudioRef.current) {
                GroundAudioRef.current.setVolume(2.5);
                GroundAudioRef.current.play();
            }
            setIsLanded(true);
            
            // Invece di cambiare tipo in static (che causerebbe il glitch), 
            // fermiamo l'oggetto e aumentiamo il damping
            rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            rb.current.setLinearDamping(20);
            rb.current.setAngularDamping(20);
        }
    };

    const handleIntersectionEnter = (payload) => {
        if (isHit) return;
        
        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";
        const userData = targetObj?.userData;
        
		// console.log(`Banana hit detected with ${targetName}`);

        if (targetName === 'player' || targetName.startsWith('bot') || (userData && userData.type === 'opponent')) {
            setIsHit(true);
            
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: userData?.id || targetName } 
            }));
            
            // Delay destruction slightly to allow physics to settle
            setTimeout(() => {
                if (onDestroy) onDestroy();
            }, 100);
        }
    };

    return (
        <RigidBody 
            ref={rb}
            // Importante: non passare position come prop reattiva se vuoi che la fisica la muova
            position={position} 
            type="dynamic" // DEVE essere dynamic per muoversi
            colliders={false} 
            canSleep={false}
            onCollisionEnter={handleCollisionEnter}
            userData={{ type: 'item', subtype: 'banana' }}
        >
            {/* Hitbox principale */}
            <CylinderCollider 
                args={[0.2, 0.4]} 
                sensor={isLanded} // Usiamo sensor per gestire l'impatto con i kart senza bloccarli fisicamente
                onIntersectionEnter={handleIntersectionEnter}
                position={[0, 0.2, 0]} 
            /> 
            
            {/* Modello visivo: ora seguirà correttamente il RigidBody */}
            <group visible={!isHit}>
                <PositionalAudio url={AUDIO_SFX.BANANA_THROW} distance={7} loop={false} autoplay />
                <PositionalAudio ref={GroundAudioRef} url={AUDIO_SFX.BANANA_GROUND} distance={5} loop={false} />
                <group scale={[0.015, 0.015, 0.015]}> 
                     <Clone object={scene} /> 
                </group>
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/items/Banana.glb');