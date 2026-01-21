import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const SHELL_SPEED = 65;
const DETECTION_RADIUS = 40; // Distanza entro la quale aggancia il bersaglio
const WAYPOINT_REACHED_DIST = 5;

export const RedShell = memo(function RedShell({ position, initVelocity, waypoints, targets, ownerId, onDestroy }) {
    // 1. Caricamento Modello (uguale al GreenShell ma rosso - qui usiamo lo stesso glb per esempio, o cambialo)
    const { scene } = useGLTF('/items/RedShell.glb'); // Idealmente '/items/RedShell.glb'
    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        // Se usi il modello verde, coloriamolo di rosso al volo
        c.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
        return c;
    }, [scene]);

    const rb = useRef();
    const meshRef = useRef();
    const [isActive, setIsActive] = useState(true);
    const [targetId, setTargetId] = useState(null); // ID del bersaglio agganciato
    
    // Indice del waypoint corrente
    const currentWpIndex = useRef(0);
    const isInitialized = useRef(false);

    // Vettori di supporto per evitare allocazioni nel loop
    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        forward: new THREE.Vector3(),
        nextWp: new THREE.Vector3()
    }), []);

    // Timer di vita (leggermente meno del verde perché va veloce)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsActive(false);
            if (onDestroy) onDestroy();
        }, 25000);
        return () => clearTimeout(timer);
    }, [onDestroy]);

    // Inizializzazione: Trova il waypoint più vicino per non partire dall'inizio
    useEffect(() => {
        if (!waypoints || waypoints.length === 0) return;
        
        // Calcola il punto più vicino sulla pista rispetto alla posizione di spawn
        let closestDist = Infinity;
        let closestIdx = 0;
        const startPos = new THREE.Vector3(...position);

        for(let i=0; i<waypoints.length; i++) {
            const d = startPos.distanceToSquared(new THREE.Vector3(waypoints[i].x, waypoints[i].y, waypoints[i].z));
            if(d < closestDist) {
                closestDist = d;
                closestIdx = i;
            }
        }
        // Puntiamo al prossimo per avere subito la direzione giusta
        currentWpIndex.current = (closestIdx + 1) % waypoints.length;
        isInitialized.current = true;
    }, [waypoints, position]);

    useFrame((state, delta) => {
        if (!isActive || !rb.current || !isInitialized.current) return;

        // 1. Aggiorna posizione corrente
        const rbTranslation = rb.current.translation();
        v.pos.set(rbTranslation.x, rbTranslation.y, rbTranslation.z);

        // Effetto grafico rotazione
        if (meshRef.current) meshRef.current.rotation.y += 20 * delta;

        // --- LOGICA DI TARGETING ---
        let activeTargetPosition = null;

        // Se abbiamo già un target agganciato, prendiamo la sua posizione
        if (targetId) {
            const targetObj = targets.find(t => t.id === targetId);
            if (targetObj && targetObj.ref.current) {
                const tPos = targetObj.ref.current.translation();
                activeTargetPosition = v.targetPos.set(tPos.x, tPos.y, tPos.z);
            } else {
                setTargetId(null); // Target perso (uscito o distrutto)
            }
        } 
        
        // Se NON abbiamo un target, cerchiamo qualcuno DAVANTI
        if (!targetId) {
            // Direzione corrente del guscio (velocità normalizzata)
            const vel = rb.current.linvel();
            v.forward.set(vel.x, 0, vel.z).normalize();

            let bestCandidate = null;
            let minDistance = DETECTION_RADIUS;

            for (const t of targets) {
                // Non colpire chi l'ha lanciato
                if (t.id === ownerId) continue; 
                if (!t.ref.current) continue;

                const tTrans = t.ref.current.translation();
                v.targetPos.set(tTrans.x, tTrans.y, tTrans.z);
                
                const dist = v.pos.distanceTo(v.targetPos);
                
                // Controllo distanza
                if (dist < minDistance) {
                    // Controllo se è "Davanti" tramite Dot Product
                    v.dir.subVectors(v.targetPos, v.pos).normalize();
                    const dot = v.forward.dot(v.dir);

                    // Se dot > 0.5 è nell'arco frontale (~60 gradi)
                    if (dot > 0.5) {
                        minDistance = dist;
                        bestCandidate = t.id;
                    }
                }
            }

            if (bestCandidate) {
                setTargetId(bestCandidate);
                console.log("RED SHELL LOCKED ON:", bestCandidate);
            }
        }

        // --- MOVIMENTO ---
        let destination = null;

        if (targetId && activeTargetPosition) {
            // FASE 2: HOMING
            // Punta direttamente al kart nemico
            destination = activeTargetPosition;
        } else {
            // FASE 1: FOLLOW TRACK
            if (!waypoints || waypoints.length === 0) return;
            
            const wp = waypoints[currentWpIndex.current];
            v.nextWp.set(wp.x, v.pos.y, wp.z); // Ignoriamo la Y del waypoint, manteniamo altezza guscio

            // Controllo distanza per cambio waypoint
            if (v.pos.distanceTo(v.nextWp) < WAYPOINT_REACHED_DIST) {
                currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
                // Ricalcola subito il prossimo target
                const nextWp = waypoints[currentWpIndex.current];
                v.nextWp.set(nextWp.x, v.pos.y, nextWp.z);
            }
            destination = v.nextWp;
        }

        // Calcolo velocità finale
        v.dir.subVectors(destination, v.pos).normalize();
        
        // Applichiamo la velocità. 
        // Y = -5 per simulare gravità forte e tenerlo incollato a terra (o usa raycast per hover)
        rb.current.setLinvel({ 
            x: v.dir.x * SHELL_SPEED, 
            y: -5.0, 
            z: v.dir.z * SHELL_SPEED 
        }, true);
        
        // Sveglia la fisica
        rb.current.wakeUp();
    });

    const handleImpact = (payload) => {
        if (!isActive) return;
        const targetObj = payload.other.rigidBodyObject;
        const hitName = targetObj?.name || "";

        // Distruggi su impatto con Player, Bot o Muri (escludi pavimento/checkpoint)
        // Nota: Il RedShell ignora i rimbalzi sui muri perché segue la pista, 
        // ma se tocca un muro per errore è meglio distruggerlo o farlo scivolare.
        // Qui lo facciamo esplodere se tocca un veicolo.
        
        if (hitName === 'player' || hitName.startsWith('bot')) {
            // Non colpire se stessi all'istante (piccolo grace period gestito dalla posizione iniziale)
            if (hitName !== ownerId) {
                console.log(`--- RED SHELL HIT: ${hitName} ---`);
                window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId: hitName } }));
                setIsActive(false);
                if (onDestroy) onDestroy();
            }
        } else if (hitName !== 'floor') {
             // Opzionale: distruzione contro muri
             setIsActive(false);
             if (onDestroy) onDestroy();
        }
    };

    if (!isActive) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            linearVelocity={initVelocity} 
            type="dynamic" 
            colliders={false}
            lockRotations={true} // Gestiamo noi la direzione, non si ribalta
            ccd={true}
            userData={{ type: 'item', subtype: 'red_shell' }}
        >
            {/* Collider fisico piccolo per scivolare */}
            <BallCollider args={[0.3]} position={[0, 0, 0]} friction={0.0} restitution={0.0} />

            {/* Trigger per impatto */}
            <CylinderCollider 
                args={[0.2, 0.7]} 
                position={[0, 0.35, 0]} 
                onCollisionEnter={handleImpact}
                sensor={false} 
            />

            <group ref={meshRef} position={[0, -0.3, 0]} scale={[1.5, 1.5, 1.5]}>
                <primitive object={clone} />
            </group>
        </RigidBody>
    );
});