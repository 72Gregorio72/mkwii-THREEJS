import React, { useState, useRef, memo, useEffect } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { AUDIO_SFX } from '../components/Data';
import { PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';

function playAudioSafely(audio, volume) {
    if (!audio) return;
    if (typeof volume === 'number') audio.setVolume(volume);
    if (audio.isPlaying) {
        audio.stop();
    }
    audio.play();
}

export const Banana = memo(function Banana({ position, initVelocity = [0, 0, 0], onDestroy }) {
    const { scene } = useGLTF('/items/Banana.glb');
    const rb = useRef();
    const [isLanded, setIsLanded] = useState(false);
    const [isHit, setIsHit] = useState(false);
    const GroundAudioRef = useRef();
    const isDestroyedRef = useRef(false); // Previeni double-destruction

    // 1. Inizializzazione Fisica: Sveglia il corpo e applica il lancio
    useEffect(() => {
        if (rb.current) {
            rb.current.wakeUp();
            // Applichiamo la velocità iniziale passata dal server/lancio
            rb.current.setLinvel(new THREE.Vector3(...initVelocity), true);
        }
    }, [initVelocity]);

    useEffect(() => {
        // Cleanup aggiuntivo quando il componente viene distrutto
        return () => {
            if (!isDestroyedRef.current && (isHit || isLanded)) {
                isDestroyedRef.current = true;
                try {
                    if (onDestroy) onDestroy();
                } catch (e) {
                    console.warn('Error during Banana cleanup:', e);
                }
            }
        };
    }, [isHit, isLanded, onDestroy]);

    const handleCollisionEnter = (payload) => {
        if (isLanded || isHit) return;
        
        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";
        
        // Se tocca qualcosa che non è un racer (suolo/muri)
        if (!targetName.includes("player") && !targetName.startsWith("bot") && !targetName.includes("opponent")) {
			playAudioSafely(GroundAudioRef.current, 2.5);
            setIsLanded(true);
            
            // Invece di cambiare tipo in static (che causerebbe il glitch), 
            // fermiamo l'oggetto e aumentiamo il damping
            try {
                rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
                rb.current.setLinearDamping(20);
                rb.current.setAngularDamping(20);
            } catch (e) {
                console.warn('Error setting damping:', e);
            }
        }
    };

    const handleIntersectionEnter = (payload) => {
        if (isHit || isDestroyedRef.current) return;
        
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const targetName = targetObj?.name || "";

        // Identifica se è un racer (player, bot o opponent)
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (isRacer) {
            setIsHit(true);
            isDestroyedRef.current = true; // Marca come distrutto subito
            
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: userData?.id || targetName } 
            }));
            
            try {
                if (onDestroy) onDestroy();
            } catch (e) {
                console.warn('Error during Banana destruction:', e);
            }
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