import React, { useState, useRef, memo, useEffect } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { AUDIO_SFX } from '../components/Data';
import { PositionalAudio } from '@react-three/drei';

export const Banana = memo(function Banana({ position, initVelocity = [0, 0, 0] }) {
    const { scene } = useGLTF('/items/Banana.glb');
    const rb = useRef();
    const [isLanded, setIsLanded] = useState(false);
    const AudioRef = useRef();
    const GroundAudioRef = useRef();
    // Stato per far sparire la banana dopo che è stata colpita
    const [isVisible, setIsVisible] = useState(true);

    const handleCollisionEnter = (payload) => {
        if (isLanded) return;
        const targetName = payload.other.rigidBodyObject?.name || "";
        if (targetName.includes("player") || targetName.includes("bot")) return;
        if (GroundAudioRef)
            GroundAudioRef.current.play();
        setIsLanded(true);
        
    };

    const handleIntersectionEnter = (payload) => {
        if (!isLanded || !isVisible) return;
        
        // Recuperiamo il nome (che corrisponde al racerId nel RigidBody del Kart)
        const targetName = payload.other.rigidBodyObject?.name || "";
        
        // Controlliamo se è un player o un bot
        if (targetName === 'player' || targetName.startsWith('bot')) {
            console.log(`--- BANANA COLPITA DA: ${targetName} ---`);
            
            // MODIFICA FONDAMENTALE: Passiamo l'ID nel dettaglio dell'evento
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: targetName } 
            }));

            // Fai sparire la banana
            setIsVisible(false);
        }
    };

    // Se non è visibile, non renderizzare nulla (rimuovi fisicamente e graficamente)
    if (!isVisible) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            linearVelocity={initVelocity} 
            type="dynamic" 
            linearDamping={isLanded ? 20 : 0.5} 
            angularDamping={isLanded ? 20 : 0.5}
            friction={2.0} 
            colliders={false} 
            mass={3}
            onCollisionEnter={handleCollisionEnter}
            userData={{ type: 'item', subtype: 'banana', isSensor: isLanded }}
        >
            <CylinderCollider 
                args={[0.35, 0.4]} 
                sensor={isLanded} 
                onIntersectionEnter={handleIntersectionEnter}
                position={[0, 0.4, 0]} 
            /> 
            <PositionalAudio
                ref={AudioRef}
                url={AUDIO_SFX.BANANA_THROW}
                distance={7}
                loop={false}
                autoplay={true}
            />
            <PositionalAudio
                ref={GroundAudioRef}
                url={AUDIO_SFX.BANANA_GROUND}
                distance={5}
                loop={false}
            />
            <group scale={[0.015, 0.015, 0.015]} position={[0, 0, 0]}> 
                 <Clone object={scene} /> 
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/items/Banana.glb');