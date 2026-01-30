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
        if (rb.current) {
            rb.current.wakeUp(); // Fondamentale: sveglia il corpo rigido
            if (initVelocity) {
                rb.current.setLinvel(new THREE.Vector3(...initVelocity), true);
            }
        }
        
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
            if (onDestroy) onDestroy();
        }, 20000);
        return () => clearTimeout(timer);
    }, [waypoints]);

    useFrame((state, delta) => {
        if (!isActive || !rb.current) return;

        const rbTrans = rb.current.translation();
        v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);

        // --- INVIO POSIZIONE AL SERVER ---
        if (socket?.connected && state.clock.elapsedTime % 0.1 < 0.02) { // Throttle per non intasare il socket
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
            const tPos = targetObj.ref.current.translation();
            destination = v.targetPos.set(tPos.x, rbTrans.y, tPos.z);
        } 
        // Altrimenti segue i waypoint
        else if (waypoints.length > 0) {
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
            
            // Applichiamo setLinvel OGNI frame per assicurarci che non si fermi mai
            rb.current.setLinvel({ 
                x: v.dir.x * SHELL_SPEED, 
                y: -8.0, // Forza verso il basso per incollarlo alla pista
                z: v.dir.z * SHELL_SPEED 
            }, true);
            
            rb.current.wakeUp(); // Continua a svegliare il corpo
        }

        // Ricerca target se non ce l'ha
        if (!targetId && targets.length > 0) {
            targets.forEach(t => {
                if (t.id === ownerId || !t.ref.current) return;
                const dist = v.pos.distanceTo(v.targetPos.set(t.ref.current.translation().x, rbTrans.y, t.ref.current.translation().z));
                if (dist < DETECTION_RADIUS) setTargetId(t.id);
            });
        }
    });

    const handleImpact = (payload) => {
        const targetObj = payload.other.rigidBodyObject;
        const victimId = targetObj?.userData?.id || targetObj?.name;

        if (victimId && victimId !== ownerId && (targetObj.name === 'player' || targetObj.name.startsWith('bot') || targetObj.userData?.type === 'opponent')) {
            window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId } }));
            setIsActive(false);
            if (onDestroy) onDestroy();
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