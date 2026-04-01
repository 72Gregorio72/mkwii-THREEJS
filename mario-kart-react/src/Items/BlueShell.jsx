import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AUDIO_SFX } from '../components/Data';

const SHELL_SPEED = 90;
const FLY_HEIGHT = 8;
const EXPLOSION_RADIUS = 10;

export const BlueShell = memo(function BlueShell({ position, waypoints, targets, onDestroy }) {
    const { scene } = useGLTF('/items/BlueShell.glb');
    const rb = useRef();
    const [isExploding, setIsExploding] = useState(false);
    const hitList = useRef(new Set());
    const explosionAudioRef = useRef();

    console.log('[BlueShell Component] Spawned at position:', position);

    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse(m => { if(m.isMesh) m.material = m.material.clone(); });
        return c;
    }, [scene]);

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        leaderPos: new THREE.Vector3(),
        dir: new THREE.Vector3()
    }), []);

    useEffect(() => {
        if (rb.current) rb.current.wakeUp();
    }, []);

    useFrame((state, delta) => {
        if (isExploding || !rb.current) return;

        const rbTrans = rb.current.translation();
        v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);

        // Trova il primo in classifica (fra tutti i targets: player online e bot)
        const leader = targets?.find(t => t.rank === 1); 
        if (leader?.ref.current) {
            v.leaderPos.set(leader.ref.current.translation().x, leader.ref.current.translation().y, leader.ref.current.translation().z);
            
            console.log('[BlueShell Frame] Position:', { x: rbTrans.x, y: rbTrans.y, z: rbTrans.z }, 'Target:', { x: v.leaderPos.x, y: v.leaderPos.y, z: v.leaderPos.z });
            
            // Segui il leader orizzontalmente (ma cadi verso il basso)
            v.dir.set(v.leaderPos.x - v.pos.x, 0, v.leaderPos.z - v.pos.z).normalize();
            const currentVel = rb.current.linvel();
            rb.current.setLinvel({ x: v.dir.x * 20, y: currentVel.y, z: v.dir.z * 20 }, true);
        } else {
            console.warn('[BlueShell Frame] No leader found in targets');
        }
    });

    const handleImpact = (payload) => {
        if (isExploding) return;
        setIsExploding(true);
        if (explosionAudioRef.current) {
            explosionAudioRef.current.setVolume(2.0);
            explosionAudioRef.current.play();
        }
        
        // AOE Damage - Add extra delay to prevent physics errors
        setTimeout(() => {
            setTimeout(() => {
                if (onDestroy) onDestroy();
            }, 100);
        }, 700);
    };

    const handleAOE = (payload) => {
        const targetObj = payload.other.rigidBodyObject;
        if (!targetObj) return;
        
        const userData = targetObj?.userData;
        const id = userData?.id || targetObj?.name;
        
        // Verifica se è un racer
        const isRacer = userData?.type === 'racer' || userData?.type === 'opponent';
        
        if (id && !hitList.current.has(id) && isRacer) {
            hitList.current.add(id);
            window.dispatchEvent(new CustomEvent('banana-hit', { detail: { victimId: id, type: 'blue_shell' } }));
        }
    };

    return (
        <RigidBody ref={rb} position={position} type="dynamic" gravityScale={1} colliders={false} onCollisionEnter={handleImpact}>
            <BallCollider args={[1]} />
            {isExploding && <BallCollider args={[EXPLOSION_RADIUS]} sensor onIntersectionEnter={handleAOE} />}
            
            <PositionalAudio
                ref={explosionAudioRef}
                url={AUDIO_SFX.BLUE_SHELL_EXPLODE}
                distance={15}
                loop={false}
            />
            
            <group scale={[2, 2, 2]}>
                {!isExploding ? <primitive object={clone} /> : (
                    <mesh>
                        <sphereGeometry args={[EXPLOSION_RADIUS / 2, 32, 32]} />
                        <meshStandardMaterial color="cyan" emissive="blue" emissiveIntensity={5} transparent opacity={0.6} />
                    </mesh>
                )}
            </group>
        </RigidBody>
    );
});