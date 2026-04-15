import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, useRevoluteJoint } from '@react-three/rapier'
import { Vector3, Quaternion, Euler } from 'three'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { disposeObject3D } from '../utils/ThreeJSCleanup'

// Configurazione fisica base (simile al tuo kart giocatore)
const BOT_CONFIG = {
    maxSpeed: 20,
    acceleration: 0.8,
    turnSpeed: 3.5
};

export function BotKart({ startPos, waypoints, botId, modelPath }) {
    const chassisRef = useRef();
    const { scene } = useGLTF(modelPath || '/models/kart_standard.glb');
    
    // Memoizza il clone per evitare ricreazioni
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    
    // Stato del bot
    const [currentWpIndex, setCurrentWpIndex] = useState(0);
    
    // Cleanup al dismount
    useEffect(() => {
        return () => {
            disposeObject3D(clone);
        };
    }, [clone]);

    useFrame((state, delta) => {
        if (!chassisRef.current || !waypoints || waypoints.length === 0) return;

        // 1. DOVE SONO?
        const currentPos = chassisRef.current.translation();
        const currentPosVec = new Vector3(currentPos.x, currentPos.y, currentPos.z);
        
        // 2. DOVE VADO? (Target attuale)
        const targetWp = waypoints[currentWpIndex];
        const targetVec = new Vector3(targetWp.position.x, targetWp.position.y, targetWp.position.z);

        // 3. CALCOLO DISTANZA
        const distance = currentPosVec.distanceTo(targetVec);

        // Se sono vicino al target (es. 5 metri), passo al prossimo!
        if (distance < 5) {
            const nextIndex = (currentWpIndex + 1) % waypoints.length;
            setCurrentWpIndex(nextIndex);
            // Opzionale: un po' di "wobble" o errore umano per non farli sembrare treni
        }

        // 4. FISICA DI GUIDA (Steering Behavior base)
        
        // Calcoliamo il vettore direzione verso il target
        const direction = new Vector3().subVectors(targetVec, currentPosVec).normalize();
        
        // Otteniamo la rotazione attuale del bot
        const currentRot = chassisRef.current.rotation();
        const currentEuler = new Euler().setFromQuaternion(new Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w));
        
        // Calcoliamo l'angolo desiderato (Arcotangente di x, z)
        // Nota: in Three/Rapier spesso Y è UP. Quindi usiamo x e z per la direzione.
        const targetAngle = Math.atan2(direction.x, direction.z);
        
        // Differenza tra angolo attuale e target
        let angleDiff = targetAngle - currentEuler.y;

        // Normalizziamo l'angolo tra -PI e PI per trovare la via più breve
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Applicare rotazione (Torque) - Sterzata
        // Se angleDiff è positivo, gira a sinistra/destra.
        // Moltiplichiamo per turnSpeed.
        chassisRef.current.applyTorqueImpulse({ x: 0, y: angleDiff * BOT_CONFIG.turnSpeed * delta, z: 0 }, true);

        // Applicare Motore (Impulse in avanti)
        // Calcoliamo il vettore "avanti" locale del kart
        const forward = new Vector3(0, 0, 1).applyEuler(currentEuler);
        
        // Se stiamo andando troppo veloce, non accelerare
        const vel = chassisRef.current.linvel();
        const speed = Math.sqrt(vel.x**2 + vel.z**2);

        if (speed < BOT_CONFIG.maxSpeed) {
            // Riduciamo l'accelerazione se stiamo curvando molto (per non derapare troppo)
            const speedFactor = Math.max(0.2, 1 - Math.abs(angleDiff)); 
            chassisRef.current.applyImpulse(
                forward.multiplyScalar(BOT_CONFIG.acceleration * speedFactor), 
                true
            );
        }
    });

    return (
        <group>
            <RigidBody
                ref={chassisRef}
                position={startPos}
                name={`bot_${botId}`}
                colliders="cuboid"
                mass={150}
                linearDamping={0.5}
                angularDamping={5.0}
            >
                <primitive object={clone} scale={1} rotation={[0, Math.PI, 0]} />
            </RigidBody>
        </group>
    );
}