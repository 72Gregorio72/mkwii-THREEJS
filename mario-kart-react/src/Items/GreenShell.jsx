import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame, useGraph } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; // Importante: clona correttamente geometrie e materiali
import { AUDIO_SFX } from '../components/Data';

export const GreenShell = memo(function GreenShell({ position, initVelocity, onDestroy }) {
    // 1. Carica il modello base
    const { scene } = useGLTF('/items/GreenShell.glb'); 
    
    // 2. SOLUZIONE: Usa SkeletonUtils per clonare.
    // Questo crea una copia perfetta indipendente dalla scena originale.
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // 3. (Opzionale) useGraph "idrata" il clone per React, assicurando che luci/materiali funzionino
    const { nodes } = useGraph(clone); 

    const rb = useRef();
    const meshRef = useRef();
    const audioRef = useRef(); // Ref per l'audio di movimento (loop)
    const impactAudioRef = useRef(); // Ref per l'audio di impatto (one-shot)
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        // Fa partire l'audio appena il guscio viene creato
        if (audioRef.current) {
            audioRef.current.play();
        }

        const timer = setTimeout(() => {
            setIsActive(false);
            if (onDestroy) onDestroy();
        }, 30000); 
        return () => clearTimeout(timer);
    }, [onDestroy]);

    useFrame((state, delta) => {
        if (!isActive) return;

        // Rotazione grafica
        if (meshRef.current) {
            meshRef.current.rotation.y += 15 * delta; 
        }

        // Wake up fisico
        if (rb.current) {
            rb.current.wakeUp();
        }
    });

    const handleImpact = (payload) => {
        if (!isActive) return;
        
        // Riproduci suono impatto
        if (impactAudioRef.current) {
            impactAudioRef.current.play();
        }
        
        const targetObj = payload.other.rigidBodyObject;
        const targetName = targetObj?.name || "";

        if (targetName === 'player' || targetName.startsWith('bot')) {
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: targetName } 
            })); 
        }
        setIsActive(false);
        if (onDestroy) onDestroy();
    };

    if (!isActive) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            linearVelocity={initVelocity} 
            type="dynamic" 
            canSleep={false} 
            ccd={true}       
            restitution={0.0} 
            friction={0.0}    
            lockRotations={true} 
            colliders={false}    
            mass={10} 
            userData={{ type: 'item', subtype: 'green_shell' }}
        >
            <BallCollider args={[0.25]} position={[0, 0, 0]} friction={0.0} /> 
            <CylinderCollider 
                args={[0.15, 0.6]} 
                position={[0, 0.35, 0]} 
                onCollisionEnter={handleImpact}
                sensor={false} 
            />
            <PositionalAudio
                ref={audioRef}
                url={AUDIO_SFX.GREEN_SHELL_MOVE}
                distance={5}
                loop
            />
            <PositionalAudio
                ref={impactAudioRef}
                url={AUDIO_SFX.G_R_SHELL_HIT} // Cambia con un SFX di impatto appropriato
                distance={10}
                loop={false}
            />

            {/* 4. Renderizzazione */}
            {/* Group serve da perno per la rotazione */}
            <group ref={meshRef} position={[0, -0.25, 0]} scale={[1.5, 1.5, 1.5]}>
                 {/* primitive inserisce l'oggetto clonato pulito */}
                 <primitive object={clone} /> 
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/items/GreenShell.glb');