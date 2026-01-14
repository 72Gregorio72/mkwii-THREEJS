import React, { useState, useRef, memo } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';

// Usa 'memo' per dire a React: "Se la prop position iniziale non cambia, non ricalcolare nulla qui"
// Questo lascia che sia Rapier a gestire interamente il movimento.
export const Banana = memo(function Banana({ position, initVelocity = [0, 0, 0] }) {
    const { scene } = useGLTF('/items/Banana.glb');
    const rb = useRef();
    const [isLanded, setIsLanded] = useState(false);

    const handleCollisionEnter = (payload) => {
        if (isLanded) return;
        const targetName = payload.other.rigidBodyObject?.name || "";
        // Ignora player/bot
        if (targetName.includes("player") || targetName.includes("bot")) return;

        setIsLanded(true);
    };

    const handleIntersectionEnter = (payload) => {
        if (!isLanded) return;
        
        const targetName = payload.other.rigidBodyObject?.name || "";
        if (targetName.includes('player')) {
            console.log("--- KART SCIVOLATO! ---");
            // Qui metterai la logica per rallentare il kart
        }
    };

    return (
        <RigidBody 
            ref={rb}
            position={position}
            
            // --- QUI APPLICHI LA FORZA ---
            // linearVelocity imposta la velocità iniziale al momento dello spawn.
            // Una volta toccata terra, il damping la fermerà.
            linearVelocity={initVelocity} 
            
            type="dynamic" 
            
            // Quando atterra, aumenta damping per fermare la spinta residua
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
                // ... onIntersectionEnter ...
                position={[0, 0.4, 0]} 
            /> 

            <group scale={[0.015, 0.015, 0.015]} position={[0, 0, 0]}> 
                 <Clone object={scene} /> 
            </group>
        </RigidBody>
    );
});

useGLTF.preload('/items/Banana.glb');