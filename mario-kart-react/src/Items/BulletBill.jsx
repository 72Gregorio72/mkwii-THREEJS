import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PositionalAudio } from '@react-three/drei';
import { AUDIO_SFX } from '../components/Data';

const BILL_SPEED = 70; // Molto veloce
const MIN_DURATION = 7.5;
const MAX_DURATION = 12.0;
const OVERTAKE_LIMIT = 5; // Termina dopo aver superato 5 avversari

export function useBulletBill({ rb, waypoints, currentRank, onEnd, duckMusicVolume, restoreMusicVolume }) {
    const [isActive, setIsActive] = useState(false);
    
    // Reft per gli SFX
    const engineAudioRef = useRef();
    const onAudioRef = useRef();
    const offAudioRef = useRef();

    // Refs per la logica
    const timer = useRef(0);
    const startRank = useRef(null); // Posizione al momento dell'attivazione
    const currentWpIndex = useRef(0);
    
    // Vettori riutilizzabili per non creare garbage collection
    const v = useRef({
        pos: new THREE.Vector3(),
        nextWp: new THREE.Vector3(),
        dir: new THREE.Vector3(),
    }).current;

    const activate = () => {
        if (!waypoints || waypoints.length === 0) return;
        
        setIsActive(true);
        timer.current = 0;
        startRank.current = currentRank;

        if (rb.current) {
            const pos = rb.current.translation();
            let closestDist = Infinity;
            let closestIdx = 0;
            for(let i=0; i<waypoints.length; i++) {
                const d = (pos.x - waypoints[i].x)**2 + (pos.z - waypoints[i].z)**2;
                if(d < closestDist) { closestDist = d; closestIdx = i; }
            }
            currentWpIndex.current = (closestIdx + 1) % waypoints.length;
        }

        if (onAudioRef.current) {
            onAudioRef.current.setVolume(2.0);
            onAudioRef.current.play();
        }
        if (engineAudioRef.current) {
            engineAudioRef.current.setVolume(1.7);
            engineAudioRef.current.play();
        }
        
        // Abbassa il volume della musica di gioco durante il Bullet Bill
        if (duckMusicVolume) duckMusicVolume();
        
        // console.log("BULLET BILL ATTIVATO! Rank iniziale:", currentRank);
    };

    const deactivate = () => {
        setIsActive(false);
        if (onEnd) onEnd();
        
        if (engineAudioRef.current && engineAudioRef.current.isPlaying) {
            engineAudioRef.current.stop();
        }
        if (offAudioRef.current) {
            offAudioRef.current.setVolume(2.0);
            offAudioRef.current.play();
        }
        
        // Ripristina il volume della musica di gioco
        if (restoreMusicVolume) restoreMusicVolume();
        
        // console.log("BULLET BILL TERMINATO.");
    };

    useFrame((state, delta) => {
        if (!isActive || !rb.current) return;

        timer.current += delta;

        // 1. GESTIONE DURATA E SORPASSI
        const overtakes = (startRank.current || currentRank) - currentRank; // Es. Partito 8°, ora 3° -> 5 sorpassi
        const isLeader = currentRank === 1;

        if (timer.current >= MAX_DURATION) {
            deactivate();
            return;
        }
        if (timer.current >= MIN_DURATION) {
            if (overtakes >= OVERTAKE_LIMIT || isLeader) {
                deactivate();
                return;
            }
        }

        const currentPos = rb.current.translation();
        v.pos.set(currentPos.x, currentPos.y, currentPos.z);
        
        const targetWp = waypoints[currentWpIndex.current];
        v.nextWp.set(targetWp.x, v.pos.y, targetWp.z); // Mantieni altezza attuale

        // Distanza dal waypoint
        const dist = v.pos.distanceTo(v.nextWp);
        
        // Se vicino, passa al prossimo
        if (dist < 6.0) {
            currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
        }

        // Calcola direzione e velocità
        v.dir.subVectors(v.nextWp, v.pos).normalize();

        rb.current.setLinvel({ 
            x: v.dir.x * BILL_SPEED, 
            y: -5.0, 
            z: v.dir.z * BILL_SPEED 
        }, true);

        const targetRot = Math.atan2(v.dir.x, v.dir.z);
        const currentRot = rb.current.rotation(); 
    });

    return { 
        isBulletBill: isActive, 
        activateBulletBill: activate,
        bulletBillAudioRefs: {
            engineAudioRef,
            onAudioRef,
            offAudioRef
        }
    };
}