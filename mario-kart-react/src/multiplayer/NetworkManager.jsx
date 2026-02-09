import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

// Import Audio Hook
import { usePositionalKartAudio } from '../hooks/usePositionalKartAudio.js';

const PHYSICS_RADIUS = 1; 
const INTERPOLATION_DELAY = 100; 

// --- COMPONENTE VISUALE (FIX T-POSE) ---
// Questo componente gestisce SOLO l'animazione, aggiornandosi ogni frame
const RemoteVisuals = ({ opponentsDataRef, playerId, vehicle, character }) => {
    const [animState, setAnimState] = useState({ speed: 0, steer: 0, drift: 0, driftLevel: 0 });
    
    useFrame(() => {
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData) return;

        // Legge la velocità dal server e aggiorna lo stato locale
        // Questo forza il RacerModel a uscire dalla T-Pose
        setAnimState({
            speed: serverData.speed || 0,
            steer: serverData.steer || 0,
            drift: serverData.drift || 0,
            driftLevel: serverData.driftLevel || 0
        });
    });

    return (
        <group position={vehicle.vehicleOffset || [0,0,0]}>
            <VehicleModel 
                vehicleConfig={vehicle.modelConfig} 
                scale={1.4} 
                rotation={[0, Math.PI, 0]} 
                isBike={vehicle.isBike} 
                speed={animState.speed} 
                steer={animState.steer} 
                drift={animState.drift} 
            />
            <group rotation={[0, Math.PI, 0]}>
                <RacerModel
                    isInMenu={false} 
                    isRemote={true} 
                    characterConfig={character.modelConfig} 
                    vehicleConfig={vehicle} 
                    isKart={true} 
                    steer={animState.steer} 
                    drift={animState.drift} 
                    scale={1.5} 
                    speed={animState.speed} // <--- FONDAMENTALE: Se è 0, va in T-Pose
                />
            </group>
        </group>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const RemoteOpponent = forwardRef(({ playerId, opponentsDataRef, character, vehicle, userData, data, isRaceActive = true }, ref) => {
    const rb = useRef();
    const visualGroupRef = useRef();
    const renderBuffer = useRef([]);
    
    const audioGroupRef = useRef(null);
    const [audioGroupMounted, setAudioGroupMounted] = useState(false);
    
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    const isSmall = useRef(false);
    const smallTimer = useRef(null);

    // Audio Logic
    const { updateAudio, startIdleAudio, stopAllAudio } = usePositionalKartAudio({
        isBike: vehicle?.isBike || false,
        isActive: isRaceActive,
        kartObject: audioGroupMounted ? audioGroupRef.current : null,
        spatialConfig: {
            refDistance: 8,
            maxDistance: 100,
            rolloffFactor: 1.2,
            volume: 0.5
        }
    });

    useEffect(() => {
        if (audioGroupMounted && isRaceActive) startIdleAudio();
        return () => stopAllAudio();
    }, [audioGroupMounted, isRaceActive, startIdleAudio, stopAllAudio]);

    useImperativeHandle(ref, () => ({
        translation: () => {
            if (rb.current) return rb.current.translation();
            return { x: data.x, y: data.y, z: data.z };
        }
    }));

    const { scene: billScene } = useGLTF('/items/BulletBill.glb');
    const billClone = useMemo(() => {
        const clone = SkeletonUtils.clone(billScene);
        clone.traverse((obj) => { if (obj.isMesh) obj.frustumCulled = false; });
        return clone;
    }, [billScene]);

    // Gestione Effetti (usiamo valori di default per evitare undefined)
    const { isBulletBill = false, isStar = false, isMega = false } = data.effects || {};
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        if (!socket) return;

        const onWorldUpdate = (data) => {
            const allPlayers = data.players || [];
            const others = allPlayers.filter(p => p.id !== socket.id);
            
            // 1. Aggiorna sempre i dati fisici/posizionali nel Ref (per il loop di gioco fluido)
            others.forEach(p => {
                opponentsDataRef.current[p.id] = p;
            });

            // 3. FIX: Controllo se la composizione o i DETTAGLI dei giocatori sono cambiati
            // Creiamo una stringa unica che rappresenta ID + Personaggio + Veicolo di tutti
            const currentSignature = others
                .map(p => `${p.id}:${p.charId}:${p.vehicleId}`)
                .sort()
                .join('|');

            // Se la firma è diversa da quella salvata (es. qualcuno ha caricato la skin), aggiorniamo lo stato React
            if (currentSignature !== rosterSignature.current) {
                console.log("Roster update detected:", currentSignature);
                rosterSignature.current = currentSignature;
                setOpponents(others);
            }
        };
        const handleLightning = (e) => {
             if (e.detail?.attackerId !== playerId) {
                 if (latestEffects.current.isBulletBill || latestEffects.current.isStar || latestEffects.current.isMega) return;
                 setTimeout(() => {
                     isHitRef.current = true;
                     spinTimer.current = 1.0;
                     isSmall.current = true;
                     if (smallTimer.current) clearTimeout(smallTimer.current);
                     smallTimer.current = setTimeout(() => isSmall.current = false, 10000);
                 }, Math.random() * 400);
             }
        };
        window.addEventListener('banana-hit', handleHit);
        window.addEventListener('lightning-strike', handleLightning);
        return () => {
            window.removeEventListener('banana-hit', handleHit);
            window.removeEventListener('lightning-strike', handleLightning);
        };
    }, [playerId]);

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            colliders={false} 
            name="opponent"
            userData={{ type: 'opponent', id: playerId }}
        >
            <BallCollider args={[PHYSICS_RADIUS]} />
            
            <group ref={(node) => { audioGroupRef.current = node; if (node && !audioGroupMounted) setAudioGroupMounted(true); }} />
            
            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                <group visible={!isBulletBill}>
                    {/* Qui usiamo il componente RemoteVisuals che si aggiorna ogni frame */}
                    <RemoteVisuals 
                        opponentsDataRef={opponentsDataRef}
                        playerId={playerId}
                        vehicle={vehicle}
                        character={character}
                    />
                </group>
                <group visible={!!isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>
            </group>
        </RigidBody>
    );
});