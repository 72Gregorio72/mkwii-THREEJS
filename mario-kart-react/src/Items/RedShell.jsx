import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';
import { useCallback } from 'react';

const SHELL_SPEED = 70; 
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
    const initialDirection = useRef(new THREE.Vector3(0, 0, 1));
    const isDestroyedRef = useRef(false); 
    const searchTargetCounter = useRef(0); 

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        forward: new THREE.Vector3(),
        nextWp: new THREE.Vector3()
    }), []);

    // 1. CALCOLO VELOCITÀ SICURO (Anti-NaN)
    const velocityVec = useMemo(() => {
        if (!initVelocity) return new THREE.Vector3(0, 0, 1);
        if (Array.isArray(initVelocity) && initVelocity.length >= 3) {
            return new THREE.Vector3(initVelocity[0] || 0, initVelocity[1] || 0, initVelocity[2] || 0);
        }
        if (initVelocity.x !== undefined) {
            return new THREE.Vector3(initVelocity.x || 0, initVelocity.y || 0, initVelocity.z || 0);
        }
        return new THREE.Vector3(0, 0, 1); // Fallback
    }, [initVelocity]);

    // Inizializza la direzione base
    useEffect(() => {
        initialDirection.current.copy(velocityVec).normalize();
    }, [velocityVec]);

    // 2. GESTIONE TIMER E CLEANUP
    useEffect(() => {
        console.log(`[RedShell ${id}] INIT - targets ricevuti: ${targets.length}`, targets);
        
        const timer = setTimeout(() => {
            setIsActive(false);
        }, 20000);
        
        return () => clearTimeout(timer);
    }, [id, targets]);

    useEffect(() => {
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

    const getAllAvailableTargets = useCallback(() => {
        const allTargets = [];
        
        if (playerRef?.current) {
            allTargets.push({ id: socket?.id || 'player', ref: playerRef });
        }
        
        if (botRefs?.current && Object.keys(botRefs.current).length > 0) {
            Object.entries(botRefs.current).forEach(([botId, botRef]) => {
                if (botRef?.current) {
                    allTargets.push({ id: botId, ref: botRef });
                }
            });
        }
        
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
            if (!rbTrans || typeof rbTrans.x !== 'number') return;
            v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);
        } catch (e) {
            return; // RigidBody non ancora pronto, skippa
        }

        if (socket?.connected && roomCode && state.clock.elapsedTime % 0.1 < 0.02) { 
            socket.emit('update_item', {
                id,
                position: { x: rbTrans.x, y: rbTrans.y, z: rbTrans.z },
                type: 'red_shell'
            });
        }

        if (meshRef.current) meshRef.current.rotation.y += 20 * delta;
        
        if (debugSphereRef.current) {
            debugSphereRef.current.position.copy(v.pos);
        }

        let direction = initialDirection.current.clone();

        if (targetId) {
            const availableTargets = getAllAvailableTargets();
            const targetObj = availableTargets.find(t => t.id === targetId);
            
            if (targetObj?.ref?.current) {
                try {
                    if (typeof targetObj.ref.current.translation === 'function') {
                        const tPos = targetObj.ref.current.translation();
                        if (tPos && typeof tPos.x === 'number' && typeof tPos.z === 'number') {
                            direction.set(tPos.x - v.pos.x, 0, tPos.z - v.pos.z).normalize();
                        }
                    }
                } catch (e) {
                    console.log(`[RedShell ${id}] Errore durante il targeting:`, e.message);
                }
            } else {
                setTargetId(null);
            }
        }

        try {
            rb.current.setLinvel({ 
                x: direction.x * SHELL_SPEED, 
                y: -8.0, 
                z: direction.z * SHELL_SPEED 
            }, true);
            
            // rb.current.wakeUp(); <-- rimosso, wakeUp continuo non è raccomandato. 
            // setLinvel(..., true) "sveglia" già automaticamente il corpo (il parametro 'true' fa proprio questo).
        } catch (e) {
        }

        searchTargetCounter.current++;
        if (!targetId && searchTargetCounter.current % 5 === 0) {
            const availableTargets = getAllAvailableTargets();
            
            if (availableTargets.length > 0) {
                let closestTarget = null;
                let closestDist = DETECTION_RADIUS;
                
                availableTargets.forEach(t => {
                    if (t.id === ownerId || !t.ref?.current) return;
                    if (typeof t.ref.current.translation !== 'function') return;
                    
                    try {
                        const tTrans = t.ref.current.translation();
                        if (!tTrans || typeof tTrans.x !== 'number' || typeof tTrans.z !== 'number') return;
                        
                        const dist = v.pos.distanceTo(v.targetPos.set(tTrans.x, rbTrans.y, tTrans.z));
                        
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestTarget = t.id;
                        }
                    } catch (e) {}
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

        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (victimId && victimId !== ownerId && isRacer) {
            setIsActive(false);
            isDestroyedRef.current = true;
            
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
            <RigidBody 
                ref={rb}
                position={position}
                linearVelocity={[velocityVec.x, velocityVec.y, velocityVec.z]}
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