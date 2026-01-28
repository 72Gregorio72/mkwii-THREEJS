import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';

export const RedShell = memo(function RedShell({ position, initVelocity, waypoints, targets, onDestroy }) {
    const { scene } = useGLTF('/items/RedShell.glb'); 
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const rb = useRef();
    const [isActive, setIsActive] = useState(true);
    const [targetId, setTargetId] = useState(null); 
    const currentWpIndex = useRef(0);

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        targetPos: new THREE.Vector3()
    }), []);

    useEffect(() => {
        if (rb.current) rb.current.wakeUp();
        const timer = setTimeout(() => {
            setIsActive(false);
            if (onDestroy) onDestroy();
        }, 20000);
        return () => clearTimeout(timer);
    }, []);

    useFrame((_state, delta) => {
        if (!isActive || !rb.current) return;

        const rbPos = rb.current.translation();
        v.pos.set(rbPos.x, rbPos.y, rbPos.z);

        // Ricerca target se non presente
        if (!targetId) {
            let nearest = null;
            let minDist = 40;
            targets.forEach(t => {
                if (!t.ref.current) return;
                const dist = v.pos.distanceTo(v.targetPos.set(t.ref.current.translation().x, rbPos.y, t.ref.current.translation().z));
                if (dist < minDist) { minDist = dist; nearest = t.id; }
            });
            if (nearest) setTargetId(nearest);
        }

        // Calcolo traiettoria
        let targetPoint = null;
        if (targetId) {
            const t = targets.find(t => t.id === targetId);
            if (t?.ref.current) targetPoint = v.targetPos.set(t.ref.current.translation().x, rbPos.y, t.ref.current.translation().z);
        }

        if (!targetPoint && waypoints.length > 0) {
            const wp = waypoints[currentWpIndex.current];
            targetPoint = v.targetPos.set(wp.x, rbPos.y, wp.z);
            if (v.pos.distanceTo(targetPoint) < 5) currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
        }

        if (targetPoint) {
            v.dir.subVectors(targetPoint, v.pos).normalize();
            rb.current.setLinvel({ x: v.dir.x * 60, y: -2, z: v.dir.z * 60 }, true);
        }
    });

    const handleImpact = (payload) => {
        const name = payload.other.rigidBodyObject?.name || "";
        if (name.includes("player") || name.startsWith("bot") || name.includes("opponent")) {
            window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId: payload.other.rigidBodyObject.userData?.id || name } }));
            setIsActive(false);
            if (onDestroy) onDestroy();
        }
    };

    if (!isActive) return null;

    return (
        <RigidBody ref={rb} position={position} type="dynamic" colliders={false} onCollisionEnter={handleImpact}>
            <BallCollider args={[0.4]} friction={0.0} />
            <PositionalAudio url={AUDIO_SFX.RED_SHELL_MOVE} distance={5} loop autoplay />
            <group scale={[1.5, 1.5, 1.5]} position={[0, -0.2, 0]}>
                <primitive object={clone} />
            </group>
        </RigidBody>
    );
});