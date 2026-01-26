import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useGLTF , PositionalAudio} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { MathUtils } from 'three';
import { AUDIO_SFX } from '../components/Data';

// --- CONFIGURAZIONE ---
const SHELL_SPEED = 90;
const FLY_HEIGHT = 8;
const LOCK_DISTANCE = 15;
const HOVER_TIME = 1.0;

// --- CONFIGURAZIONE ESPLOSIONE ---
const EXPLOSION_RADIUS = 10; // Raggio ampio per il blu
const EXPLOSION_DURATION = 700; // Durata visiva dell'esplosione (ms)

export const BlueShell = memo(function BlueShell({ position, waypoints, targets, ownerId, onDestroy }) {
    // 1. Caricamento e Clonazione Modello (Lo facciamo diventare Blu)
    const { scene } = useGLTF('/items/BlueShell.glb');
    const clone = useMemo(() => {
        const c = SkeletonUtils.clone(scene);
        c.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                // Colore Blu Elettrico / Spiny Shell
                child.castShadow = true;
            }
        });
        return c;
    }, [scene]);

    // Riferimenti Audio
    const chaseAudioRef = useRef();
    const lockingAudioRef = useRef();
    const explosionAudioRef = useRef();

    const rb = useRef();
    const meshGroupRef = useRef();
    const explosionMeshRef = useRef();
    
    // Stati della logica di volo
    const [phase, setPhase] = useState('CHASING'); // 'CHASING' | 'LOCKING' | 'DIVING'
    
    // Stati dell'esplosione
    const [isExploding, setIsExploding] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const hitList = useRef(new Set()); // Per evitare doppi colpi AOE

    // Waypoint management
    const currentWpIndex = useRef(0);
    const isInitialized = useRef(false);
    const hoverTimer = useRef(0);

    // Vettori riutilizzabili
    const v = useMemo(() => ({
        pos: new THREE.Vector3(),
        leaderPos: new THREE.Vector3(),
        nextWp: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        targetSpot: new THREE.Vector3()
    }), []);

    // Timer di sicurezza (vita massima totale)
    useEffect(() => {
        const timer = setTimeout(() => {
           triggerExplosionSequence(); // Se si incastra, esplode comunque
        }, 35000);
        return () => clearTimeout(timer);
    }, []);

    // Inizializzazione Waypoint vicino
    useEffect(() => {
        if (!waypoints || waypoints.length === 0) return;
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
        currentWpIndex.current = (closestIdx + 1) % waypoints.length;
        isInitialized.current = true;
    }, [waypoints, position]);

    // --- LOGICA DI INNESCO ESPLOSIONE ---
    const triggerExplosionSequence = () => {
        if (isExploding || isFinished) return;
        setIsExploding(true);
        console.log("--- BLUE SHELL BOOM! ---");

        // Ferma immediatamente il corpo fisico
        if(rb.current) {
             rb.current.setLinvel({x:0, y:0, z:0}, true);
             rb.current.setGravityScale(0, true);
        }

        // Rimuovi la bomba dopo l'animazione
        setTimeout(() => {
            setIsFinished(true);
            if (onDestroy) onDestroy();
        }, EXPLOSION_DURATION);
    }

    useFrame((state, delta) => {
        if (isFinished || !rb.current || !isInitialized.current) return;

        // --- ANIMAZIONE VISIVA ESPLOSIONE ---
        if (isExploding && explosionMeshRef.current) {
            // Espansione sfera blu
            const currentScale = explosionMeshRef.current.scale.x;
            const scaleVal = MathUtils.lerp(currentScale, EXPLOSION_RADIUS, delta * 10);
            explosionMeshRef.current.scale.set(scaleVal, scaleVal, scaleVal);
            
            // Pulsazione luminosità/opacità
            const flash = Math.sin(state.clock.elapsedTime * 30) * 0.5 + 0.5;
            explosionMeshRef.current.material.opacity = 0.4 + flash * 0.4;
            explosionMeshRef.current.material.emissiveIntensity = 1 + flash * 2;
            return; // Se sta esplodendo, non si muove più
        }

        // --- LOGICA DI MOVIMENTO (Solo se non sta esplodendo) ---
        
        const rbTrans = rb.current.translation();
        v.pos.set(rbTrans.x, rbTrans.y, rbTrans.z);

        // Rotazione visiva modello
        if (meshGroupRef.current) {
            meshGroupRef.current.rotation.y += (phase === 'LOCKING' ? 30 : 15) * delta;
            if (phase === 'CHASING') {
                meshGroupRef.current.position.y = -0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.5;
            } else {
                meshGroupRef.current.position.y = 0;
            }
        }

        // Trova il leader
        let activeLeader = null;
        const leaderObj = targets.find(t => t.rank === 1); 
        if (leaderObj && leaderObj.ref.current) {
            activeLeader = leaderObj;
            v.leaderPos.copy(leaderObj.ref.current.translation());
        }

        // MACCHINA A STATI MOVIMENTO
        if (phase === 'CHASING') {
            if (activeLeader) {
                const distXZ = Math.sqrt(Math.pow(v.pos.x - v.leaderPos.x, 2) + Math.pow(v.pos.z - v.leaderPos.z, 2));
                if (distXZ < LOCK_DISTANCE) {
                    setPhase('LOCKING');
                    hoverTimer.current = 0;
                    return;
                }
            }
            // Waypoint logic...
            const wp = waypoints[currentWpIndex.current];
            v.nextWp.set(wp.x, wp.y + FLY_HEIGHT, wp.z);
            if (v.pos.distanceTo(v.nextWp) < 8) { 
                currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
                const next = waypoints[currentWpIndex.current];
                v.nextWp.set(next.x, next.y + FLY_HEIGHT, next.z);
            }
            v.dir.subVectors(v.nextWp, v.pos).normalize();
            const targetYVel = (v.nextWp.y - v.pos.y) * 2;
            rb.current.setLinvel({ x: v.dir.x * SHELL_SPEED, y: targetYVel, z: v.dir.z * SHELL_SPEED }, true);
        }
        else if (phase === 'LOCKING') {
            if (!activeLeader) { setPhase('CHASING'); return; }
            if (lockingAudioRef.current) lockingAudioRef.current.play();
            hoverTimer.current += delta;
            v.targetSpot.set(v.leaderPos.x, v.leaderPos.y + 7, v.leaderPos.z);
            v.dir.subVectors(v.targetSpot, v.pos);
            rb.current.setLinvel({ x: v.dir.x * 12, y: v.dir.y * 12, z: v.dir.z * 12 }, true);
            if (hoverTimer.current > HOVER_TIME) setPhase('DIVING');
        }
        else if (phase === 'DIVING') {
            if (explosionAudioRef.current)
                explosionAudioRef.current.play();
            rb.current.setLinvel({ x: 0, y: -180, z: 0 }, true);
        }
    });

    // --- GESTIONE COLLISIONI FISICHE (Impatto iniziale) ---
    const handleCollision = (payload) => {
        if (phase !== 'DIVING' || isExploding) return;

        const targetObj = payload.other.rigidBodyObject;
        const hitName = targetObj?.name || "";
        console.log(`BLUE SHELL IMPACT on ${hitName}`);

        // Inizia la sequenza di esplosione
        triggerExplosionSequence();

        // Se ha colpito direttamente un giocatore, segnalalo subito
        if (hitName === 'player' || hitName.startsWith('bot')) {
             hitList.current.add(hitName); // Aggiungi alla lista per evitare doppio danno AOE
             window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: hitName, type: 'blue_shell_direct' }
            }));
        }
    };

    // --- GESTIONE DANNI AOE (Area of Effect) ---
    const handleExplosionHit = (payload) => {
        if (!isExploding) return;
        const targetName = payload.other.rigidBodyObject?.name || "";
        
        // Colpisci solo player/bot che non siano già stati colpiti dall'impatto diretto
        if ((targetName === 'player' || targetName.startsWith('bot')) && !hitList.current.has(targetName)) {
            console.log(`BLUE SHELL AOE HIT: ${targetName}`);
            hitList.current.add(targetName);
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: targetName, type: 'blue_shell_aoe' } 
            }));
        }
    };

    if (isFinished) return null;

    return (
        <RigidBody 
            ref={rb}
            position={[position[0], position[1] + 5, position[2]]}
            type="dynamic" 
            colliders={false}
            lockRotations={true}
            gravityScale={0} 
            ccd={true}
            userData={{ type: 'item', subtype: 'blue_shell' }}
        >
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
             {/* A. COLLIDER FISICI (Disattivati durante l'esplosione per non interferire) */}
             {!isExploding && (
                <>
                    <BallCollider args={[1]} />
                    <CylinderCollider 
                        args={[1, 5]} 
                        position={[0, -0.5, 0]} 
                        onCollisionEnter={handleCollision}
                        sensor={false}
                    />
                </>
            )}

            {/* B. COLLIDER ESPLOSIONE AOE (Attivo solo durante esplosione) */}
            {isExploding && (
                <BallCollider 
                    args={[EXPLOSION_RADIUS]} 
                    sensor={true} 
                    onIntersectionEnter={handleExplosionHit}
                />
            )}

            <group ref={meshGroupRef} scale={[2, 2, 2]}>
                 {!isExploding ? (
                    // --- MODELLO GUSCIO BLU ---
                     <>
                        <primitive object={clone} />
                        <pointLight color="#0066ff" intensity={8} distance={15} />
                     </>
                 ) : (
                    // --- MODELLO ESPLOSIONE BLU ---
                    // Usiamo una mesh sferica semplice che viene scalata nel useFrame
                    <mesh ref={explosionMeshRef}>
                        <sphereGeometry args={[1, 32, 32]} /> {/* Raggio base 1, scalato dopo */}
                        <meshStandardMaterial 
                            color="#0088ff" 
                            emissive="#0044ff"
                            emissiveIntensity={2}
                            transparent 
                            opacity={0.8} 
                            toneMapped={false} // Per colori più brillanti stile "energia"
                        />
                        <pointLight color="#0088ff" intensity={30} distance={25} decay={2} />
                    </mesh>
                 )}
            </group>
        </RigidBody>
    );
});