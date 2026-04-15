import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';
import { useCallback } from 'react';

const SHELL_SPEED = 70; // Velocità aumentata per superare attriti
const DETECTION_RADIUS = 50; 
const WAYPOINT_REACHED_DIST = 6;

export const RedShell = memo(function RedShell({ id, position, initVelocity, targets = [], ownerId, onDestroy, socket, playerRef, botRefs = {}, remoteRefMap = {}, roomCode }) {
    const { scene } = useGLTF('/items/RedShell.glb'); 
    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse(child => { if (child.isMesh) child.material = child.material.clone(); });
        return c;
    }, [scene]);

    const homingAudioRef = useRef();
    const rb = useRef();
    const meshRef = useRef();
    const debugSphereRef = useRef();
    const [isActive, setIsActive] = useState(true);
    const [targetId, setTargetId] = useState(null);
    const initialDirection = useRef(new THREE.Vector3());
    const isDestroyedRef = useRef(false); // Previeni double-destruction
    const searchTargetCounter = useRef(0); // Debounce per ricerca target

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        forward: new THREE.Vector3(),
        nextWp: new THREE.Vector3()
    }), []);

    // 1. INIZIALIZZAZIONE FISICA (FORZA IL MOVIMENTO)
    useEffect(() => {
        console.log(`[RedShell ${id}] INIT - targets ricevuti: ${targets.length}`, targets);
        
        // Memorizza la direzione iniziale
        if (initVelocity) {
            initialDirection.current.set(...initVelocity).normalize();
        } else {
            initialDirection.current.set(0, 0, 1); // Direzione di default
        }
        
        // Inizializzazione immediata della fisica
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
        
        const timer = setTimeout(() => {
            setIsActive(false);
        }, 20000);
        
        // Cleanup
        return () => {
            clearTimeout(timer);
        };
    }, [position, initVelocity, id]);

    useEffect(() => {
        // Cleanup aggiuntivo quando il componente viene smontato (isActive diventa false)
        if (!isActive) {
            return () => {
                if (!isDestroyedRef.current) {
                    isDestroyedRef.current = true;
                    try {
                        if (onDestroy) onDestroy();
                    } catch (e) {
                        console.warn('Error during RedShell cleanup:', e);
                    }
                }
            };
        }
    }, [isActive, onDestroy]);

    // Monitora quando cambiano i targets
    useEffect(() => {
        console.log(`[RedShell ${id}] Targets CHANGED: ${targets.length} targets disponibili`, targets.map(t => ({ id: t.id, hasRef: !!t.ref?.current })));
    }, [targets, id]);

    // Raccoglie tutti i target disponibili dai ref passati direttamente
    const getAllAvailableTargets = useCallback(() => {
        const allTargets = [];
        
        // Aggiungi player
        if (playerRef?.current) {
            allTargets.push({ id: socket?.id || 'player', ref: playerRef });
        }
        
        // Aggiungi bot locali - CORRETTO: botRefs.current
        if (botRefs?.current && Object.keys(botRefs.current).length > 0) {
            Object.entries(botRefs.current).forEach(([botId, botRef]) => {
                if (botRef?.current) {
                    allTargets.push({ id: botId, ref: botRef });
                }
            });
        }
        
        // Aggiungi opponents remoti (solo in multiplayer)
        if (roomCode && remoteRefMap?.current && Object.keys(remoteRefMap.current).length > 0) {
            Object.entries(remoteRefMap.current).forEach(([oppId, oppRef]) => {
                if (oppRef?.current) {
                    allTargets.push({ id: oppId, ref: oppRef });
                }
            });
        }
        
        return allTargets;
    }, [playerRef, botRefs, remoteRefMap, roomCode, socket?.id]);

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
        
        // Aggiorna posizione sfera debug
        if (debugSphereRef.current) {
            debugSphereRef.current.position.copy(v.pos);
        }

        // --- LOGICA TARGETING / MOVIMENTO LINEARE ---
        let direction = initialDirection.current.clone();

        // Se ha un target, lo segue - usa getAllAvailableTargets per validare il target
        if (targetId) {
            const availableTargets = getAllAvailableTargets();
            const targetObj = availableTargets.find(t => t.id === targetId);
            
            if (targetObj?.ref?.current) {
                try {
                    // Double-check che il ref sia valido
                    if (typeof targetObj.ref.current.translation === 'function') {
                        const tPos = targetObj.ref.current.translation();
                        if (tPos && typeof tPos.x === 'number' && typeof tPos.z === 'number') {
                            direction.set(tPos.x - v.pos.x, 0, tPos.z - v.pos.z).normalize();
                        }
                    }
                } catch (e) {
                    // Target non disponibile, continua dritto
                    console.log(`[RedShell ${id}] Errore durante il targeting:`, e.message);
                }
            } else {
                // Target non più disponibile, resetta
                setTargetId(null);
            }
        }

        // --- APPLICAZIONE VELOCITÀ ---
        try {
            // Applichiamo setLinvel OGNI frame per assicurarci che non si fermi mai
            rb.current.setLinvel({ 
                x: direction.x * SHELL_SPEED, 
                y: -8.0, // Forza verso il basso per incollarlo alla pista
                z: direction.z * SHELL_SPEED 
            }, true);
            
            rb.current.wakeUp(); // Continua a svegliare il corpo
        } catch (e) {
            // Ignora errori se il RigidBody non è pronto
        }

        // Ricerca target se non ce l'ha - DEBOUNCED (ogni 5 frame)
        searchTargetCounter.current++;
        if (!targetId && searchTargetCounter.current % 5 === 0) {
            const availableTargets = getAllAvailableTargets();
            
            if (availableTargets.length > 0) {
                let closestTarget = null;
                let closestDist = DETECTION_RADIUS;
                
                availableTargets.forEach(t => {
                    if (t.id === ownerId || !t.ref?.current) {
                        return;
                    }
                    
                    // Verifica che sia un RigidBody valido PRIMA di accedervi
                    if (typeof t.ref.current.translation !== 'function') {
                        return;
                    }
                    
                    try {
                        const tTrans = t.ref.current.translation();
                        
                        // Verifica che la translation sia valida
                        if (!tTrans || typeof tTrans.x !== 'number' || typeof tTrans.z !== 'number') {
                            return;
                        }
                        
                        const dist = v.pos.distanceTo(v.targetPos.set(tTrans.x, rbTrans.y, tTrans.z));
                        
                        // Trova il target più vicino nel raggio di rilevamento
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestTarget = t.id;
                        }
                    } catch (e) {
                        // Ignora errori da RigidBody corrotti
                    }
                });
                
                if (closestTarget) {
                    console.log(`[RedShell ${id}] ✓ Target trovato: ${closestTarget}`);
                    setTargetId(closestTarget);
                }
            }
        }
    });

    const handleImpact = (payload) => {
        if (!isActive || isDestroyedRef.current) return;
        
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const victimId = userData?.id || targetObj?.name;

        // Verifica se è un racer e non è il proprietario
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (victimId && victimId !== ownerId && isRacer) {
            setIsActive(false);
            isDestroyedRef.current = true; // Marca come distrutto subito
            
            window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId } }));
            
            try {
                if (onDestroy) onDestroy();
            } catch (e) {
                console.warn('Error during RedShell destruction:', e);
            }
        }
    };

    if (!isActive) return null;

    return (
        <>
            {/* Sfera debug per visualizzare il raggio di rilevamento */}
            {/* <Sphere ref={debugSphereRef} args={[DETECTION_RADIUS, 8, 8]} transparent opacity={0.15} wireframe>
                <meshBasicMaterial color="#ff0000" />
            </Sphere> */}
            
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
                <PositionalAudio ref={homingAudioRef} url={AUDIO_SFX.RED_SHELL_MOVE} distance={10} loop autoplay volume={2} />
                <group ref={meshRef} position={[0, -0.3, 0]} scale={[1.5, 1.5, 1.5]}>
                    <primitive object={clone} />
                </group>
            </RigidBody>
        </>
    );
});