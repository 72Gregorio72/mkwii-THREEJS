import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';

const SHELL_SPEED = 70; // Velocità aumentata per superare attriti
const DETECTION_RADIUS = 50; 
const WAYPOINT_REACHED_DIST = 6;

export const RedShell = memo(function RedShell({ id, position, initVelocity, waypoints = [], targets = [], ownerId, onDestroy, socket }) {
    const { scene } = useGLTF('/items/RedShell.glb'); 
    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse(child => { if (child.isMesh) child.material = child.material.clone(); });
        return c;
    }, [scene]);

    const homingAudioRef = useRef();
    const rb = useRef();
    const meshRef = useRef();
    const [isActive, setIsActive] = useState(true);
    const [targetId, setTargetId] = useState(null); 
    const currentWpIndex = useRef(0);
    const isInitialized = useRef(false);

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        forward: new THREE.Vector3(),
        nextWp: new THREE.Vector3()
    }), []);

    // 1. INIZIALIZZAZIONE FISICA (FORZA IL MOVIMENTO)
    useEffect(() => {
        if (homingAudioRef.current) {
            homingAudioRef.current.setVolume(2.0);
            homingAudioRef.current.play();
        }
        
        // Ritarda l'inizializzazione per assicurarsi che il RigidBody sia pronto
        const initTimer = setTimeout(() => {
            if (rb.current) {
                try {
                    rb.current.wakeUp(); // Fondamentale: sveglia il corpo rigido
                    if (initVelocity) {
                        rb.current.setLinvel(new THREE.Vector3(...initVelocity), true);
                    }
                } catch (e) {
                    console.warn('Failed to initialize RedShell physics:', e);
                }
            }
        }, 0);
        
        // Calcola waypoint più vicino allo spawn
        if (waypoints && waypoints.length > 0) {
            let closestDist = Infinity;
            let closestIdx = 0;
            const startPos = new THREE.Vector3(...position);
            waypoints.forEach((wp, i) => {
                const d = startPos.distanceToSquared(new THREE.Vector3(wp.x, wp.y, wp.z));
                if (d < closestDist) { closestDist = d; closestIdx = i; }
            });
            currentWpIndex.current = (closestIdx + 1) % waypoints.length;
            isInitialized.current = true;
        }

        
        const timer = setTimeout(() => {
            setIsActive(false);
            // Aspetta che React smonta il componente
            setTimeout(() => {
                if (onDestroy) onDestroy();
            }, 100);
        }, 20000);
        
        // Cleanup
        return () => {
            clearTimeout(initTimer);
            clearTimeout(timer);
        };
    }, [waypoints]);

    useFrame((state, delta) => {
        if (!isActive || !rb.current) return;

        let rbTrans;
        try {
            rbTrans = rb.current.translation();
            if (!rbTrans) return;
            v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);
        } catch (e) {
            // RigidBody non ancora pronto
            return;
        }

        // --- INVIO POSIZIONE AL SERVER ---
        if (socket?.connected && roomCode && state.clock.elapsedTime % 0.1 < 0.02) { // Throttle per non intasare il socket
            socket.emit('update_item', {
                id,
                position: { x: rbTrans.x, y: rbTrans.y, z: rbTrans.z },
                type: 'red_shell'
            });
        }

        if (meshRef.current) meshRef.current.rotation.y += 20 * delta;

        // --- LOGICA TARGETING / WAYPOINT ---
        let destination = null;

        // Se ha un target, lo segue
        const targetObj = targets.find(t => t.id === targetId);
        if (targetId && targetObj?.ref.current) {
            try {
                const tPos = targetObj.ref.current.translation();
                if (tPos) {
                    destination = v.targetPos.set(tPos.x, rbTrans.y, tPos.z);
                }
            } catch (e) {
                // Target non disponibile, usa waypoints
            }
        } 
        // Altrimenti segue i waypoint
        if (!destination && waypoints.length > 0) {
            const wp = waypoints[currentWpIndex.current];
            v.nextWp.set(wp.x, rbTrans.y, wp.z);

            if (v.pos.distanceTo(v.nextWp) < WAYPOINT_REACHED_DIST) {
                currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
            }
            destination = v.nextWp;
        }

        // --- APPLICAZIONE VELOCITÀ ---
        if (destination) {
            v.dir.subVectors(destination, v.pos).normalize();
            
            try {
                // Applichiamo setLinvel OGNI frame per assicurarci che non si fermi mai
                rb.current.setLinvel({ 
                    x: v.dir.x * SHELL_SPEED, 
                    y: -8.0, // Forza verso il basso per incollarlo alla pista
                    z: v.dir.z * SHELL_SPEED 
                }, true);
                
                rb.current.wakeUp(); // Continua a svegliare il corpo
            } catch (e) {
                // Ignora errori se il RigidBody non è pronto
            }
        }

        // Ricerca target se non ce l'ha - SOLO DAVANTI
        if (!targetId && targets.length > 0) {
            let closestTarget = null;
            let closestDist = DETECTION_RADIUS;
            
            targets.forEach(t => {
                if (t.id === ownerId || !t.ref.current) return;
                try {
                    const tTrans = t.ref.current.translation();
                    if (tTrans) {
                        // Calcola direzione verso il target
                        const toTarget = new THREE.Vector3(
                            tTrans.x - v.pos.x,
                            0, // Ignora Y per il controllo direzionale
                            tTrans.z - v.pos.z
                        ).normalize();
                        
                        // Calcola la direzione di movimento del guscio (basata su velocità attuale)
                        const shellDirection = v.dir.clone().normalize();
                        
                        // Prodotto scalare: > 0 = davanti, < 0 = dietro
                        const dotProduct = shellDirection.dot(toTarget);
                        
                        // Solo target davanti (angolo < 90 gradi)
                        if (dotProduct > 0) {
                            const dist = v.pos.distanceTo(v.targetPos.set(tTrans.x, rbTrans.y, tTrans.z));
                            
                            // Trova il target più vicino davanti
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestTarget = t.id;
                            }
                        }
                    }
                } catch (e) {
                    // Target non accessibile
                }
            });
            
            if (closestTarget) {
                setTargetId(closestTarget);
            }
        }
    });

    const handleImpact = (payload) => {
        if (!isActive) return;
        
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const victimId = userData?.id || targetObj?.name;

        // Verifica se è un racer e non è il proprietario
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (victimId && victimId !== ownerId && isRacer) {
            setIsActive(false);
            
            window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId } }));
            
            // Delay destruction to prevent physics errors
            setTimeout(() => {
                if (onDestroy) onDestroy();
            }, 100);
        }
    };

    if (!isActive) return null;

    return (
        <RigidBody 
            ref={rb}
            position={position}
            type="dynamic" 
            colliders={false}
            lockRotations={true}
            onCollisionEnter={handleImpact}
        >
            <BallCollider args={[0.4]} friction={0.0} restitution={0.0} />
            <CylinderCollider args={[0.2, 0.7]} position={[0, 0.35, 0]} sensor />
            <PositionalAudio ref={homingAudioRef} url={AUDIO_SFX.RED_SHELL_MOVE} distance={10} loop autoplay/>
            <group ref={meshRef} position={[0, -0.3, 0]} scale={[1.5, 1.5, 1.5]}>
                <primitive object={clone} />
            </group>
        </RigidBody>
    );
});