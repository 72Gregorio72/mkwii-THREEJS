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
    const [phase, setPhase] = useState('CHASING'); 
    const [isExploding, setIsExploding] = useState(false);
    const hitList = useRef(new Set());
    const currentWpIndex = useRef(0);
    const chaseAudioRef = useRef();
    const lockingAudioRef = useRef();
    const explosionAudioRef = useRef();

    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse(m => { if(m.isMesh) m.material = m.material.clone(); });
        return c;
    }, [scene]);

    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        leaderPos: new THREE.Vector3(),
        nextWp: new THREE.Vector3(),
        dir: new THREE.Vector3()
    }), []);

    useEffect(() => {
        if (rb.current) rb.current.wakeUp();
    }, []);

    useFrame((state, delta) => {
        if (isExploding || !rb.current) return;

        const rbTrans = rb.current.translation();
        v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);

        // Trova il primo in classifica
        const leader = targets.find(t => t.rank === 1); 
        if (leader?.ref.current) {
            v.leaderPos.set(leader.ref.current.translation().x, leader.ref.current.translation().y, leader.ref.current.translation().z);
        }

        if (phase === 'CHASING') {
            if (chaseAudioRef.current) {
                chaseAudioRef.current.setVolume(2.0);
                chaseAudioRef.current.play();
            }
            // Se vicino al leader, passa a fase LOCKING/DIVING
            if (v.pos.distanceTo(v.leaderPos) < 15) {
                setPhase('DIVING');
                if (lockingAudioRef.current) {
                    lockingAudioRef.current.setVolume(2.0);
                    lockingAudioRef.current.play();
                }
            } else {
                // Segue i waypoint a mezz'aria
                const wp = waypoints[currentWpIndex.current];
                if (wp) {
                    v.nextWp.set(wp.x, wp.y + FLY_HEIGHT, wp.z);
                    if (v.pos.distanceTo(v.nextWp) < 8) currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
                    v.dir.subVectors(v.nextWp, v.pos).normalize();
                    rb.current.setLinvel({ x: v.dir.x * SHELL_SPEED, y: (v.nextWp.y - v.pos.y) * 2, z: v.dir.z * SHELL_SPEED }, true);
                }
            }
        } else if (phase === 'DIVING') {
            // Picchiata verso il leader
            v.dir.subVectors(v.leaderPos, v.pos).normalize();
            rb.current.setLinvel({ x: v.dir.x * 20, y: -100, z: v.dir.z * 20 }, true);
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
        <RigidBody ref={rb} position={position} type="dynamic" gravityScale={0} colliders={false} onCollisionEnter={handleImpact}>
            <BallCollider args={[1]} />
            {isExploding && <BallCollider args={[EXPLOSION_RADIUS]} sensor onIntersectionEnter={handleAOE} />}
            
            <PositionalAudio
                ref={chaseAudioRef}
                url={AUDIO_SFX.BLUE_SHELL_LOOP}
                distance={10}
                loop={true}
                autoplay={true}
            />
            <PositionalAudio
                ref={lockingAudioRef}
                url={AUDIO_SFX.BLUE_SHELL_ABOVE}
                distance={10}
                loop={true}
            />
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