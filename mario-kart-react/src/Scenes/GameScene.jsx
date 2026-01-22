import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera, Stats, useGLTF } from '@react-three/drei'
import * as THREE from 'three' // Import necessario per Euler/Quaternion

// Importazioni Componenti Interni
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import { CheckpointSystem } from '../Race/CheckPointManager.jsx'
import { RaceManager } from '../Race/RaceManager.jsx'
import { useAudio } from '../audio/AudioManager.jsx'
import { RoadWalls } from '../Tracks/RoadWalls.jsx'
import { LightningAtmosphere } from '../components/effects/LightningAtmosphere.jsx'
import { GameHUD } from '../ui/GameHUD.jsx'
import { ItemBoxesMap } from '../Items/ItemBoxes.jsx'

// Importazioni Items
import { Banana } from '../Items/Banana';
import { GreenShell } from '../Items/GreenShell';
import { RedShell } from '../Items/RedShell';
import { BlueShell } from '../Items/BlueShell.jsx'
import { BobOmb } from '../Items/BobOmb.jsx'

// Importazioni Waypoints (Esempio per DaisyCircuit)
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit.json'
import leftWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_left.json'
import rightWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_right.json'
import trackWaypoints1 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit1.json'
import trackWaypoints2 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit2.json'

const TOTAL_LAPS = 3;
const BOT_COUNT = 11; // 1 Player + 11 Bots = 12 Racers

function WaypointVisualizer({ points, color = 'red' }) {
    return (
        <group> 
            {points.map((p, index) => (
                <mesh key={index} position={[p.x, p.y + 0.1, p.z]}>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}
        </group>
    );
}

// Funzione helper di fallback per calcolare la griglia se il GLB non va
function getGridPosition(startPos, index) {
    const ROW_DIST = 3.5; 
    const COL_DIST = 2.5; 
    
    const row = Math.floor(index / 2);
    const isRight = index % 2 !== 0; 
    
    const xOffset = isRight ? COL_DIST : -COL_DIST;
    const zOffset = row * -ROW_DIST; 
    
    return [
        startPos[0] + xOffset,
        startPos[1], 
        startPos[2] + zOffset 
    ];
}

// --- NUOVO HOOK: CARICAMENTO GRIGLIA DAL GLB ---
function useGridPositions(url) {
    // Carica il GLB solo se l'URL è fornito
    const { scene } = useGLTF(url || ""); // Gestione caso url nullo
    
    const gridData = useMemo(() => {
        if (!url) return { positions: {}, rotations: {} };

        const positions = {};
        const rotations = {};

        scene.traverse((obj) => {
            // Cerca oggetti chiamati start_1, start_2, ecc.
            if (obj.name.startsWith('start_')) {
                const parts = obj.name.split('_');
                const index = parseInt(parts[1]);

                if (!isNaN(index)) {
                    // Salva posizione
                    positions[index] = [obj.position.x, obj.position.y, obj.position.z];

                    // Salva rotazione convertita in Euler [x, y, z]
                    const euler = new THREE.Euler().setFromQuaternion(obj.quaternion);
                    rotations[index] = [euler.x, euler.y, euler.z];
                }
            }
        });
        return { positions, rotations };
    }, [scene, url]);

    return gridData;
}

export function GameScene({ character, vehicle, mapPath, checkpointPath, onBack, start_pos, maxCheckpoints, selectedTrack }) {

    // 1. CARICAMENTO POSIZIONI DI PARTENZA (Grid)
    // Se selectedTrack.gridpos esiste, carica da lì. Altrimenti useremo il fallback.
    const { positions: gridPositions, rotations: gridRotations } = useGridPositions(selectedTrack?.gridpos);

    // --- REFS DATI GARA ---
    const { initialRacersData, initialPositions } = useMemo(() => {
        const data = {
            player: { id: 'player', lap: 1, nextCP: 1, score: 0 }
        };
        const positions = [{ id: 'player', position: 1 }];
        const bots = [];

        for (let i = 0; i < BOT_COUNT; i++) {
            const botId = `bot_${i}`;
            data[botId] = { id: botId, lap: 1, nextCP: 1, score: 0 };
            positions.push({ id: botId, position: i + 2 });
            bots.push({ id: botId, index: i });
        }

        return { initialRacersData: data, initialPositions: positions, botsArray: bots };
    }, []);

    // --- GESTIONE ITEMS ---
    const [bananas, setBananas] = useState([]);
    const [shells, setShells] = useState([]);
    const [redShells, setRedShells] = useState([]);
    const [blueShells, setBlueShells] = useState([]);
    const [bobOmbs, setBobOmbs] = useState([]);

    const handleSpawnBanana = (position, velocity) => {
        setBananas((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    };
    const handleSpawnBobOmb = (position, velocity) => {
        setBobOmbs((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    };
    const destroyBobOmb = (id) => setBobOmbs((prev) => prev.filter(b => b.id !== id));
    const handleSpawnBlueShell = (position, velocity) => {
        setBlueShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    }
    const handleDestroyBlueShell = (id) => setBlueShells((prev) => prev.filter(s => s.id !== id));
    const handleSpawnGreenShell = (position, velocity) => {
        setShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    };
    const handleSpawnRedShell = (position, velocity) => {
        setRedShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    };
    const handleRemoveRedShell = (id) => setRedShells((prev) => prev.filter(s => s.id !== id));
    const handleRemoveShell = (id) => setShells((prev) => prev.filter(s => s.id !== id));

    // --- STATI UI E AUDIO ---
    const [positions, setPositions] = useState(initialPositions);
    const [uiLap, setUiLap] = useState(1);

    // const { changeTrack } = useAudio();
    // useEffect(() => {
    //   changeTrack(selectedTrack.soundtrack, 10);
    // }, []);


    // --- STATO GARA ---
    const [lap, setLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false);

    // --- REFS ---
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();
    const checkpointPositionsRef = useRef({});
    const playerRef = useRef();
    const botRefs = useRef({});
    
    // Inizializza Ref Bots
    for (let i = 0; i < BOT_COUNT; i++) {
        if (!botRefs.current[`bot_${i}`]) {
            botRefs.current[`bot_${i}`] = React.createRef();
        }
    }

    // Callback Checkpoint
    const handleCheckpointTrigger = useCallback((hitIndex, racerId) => {
        if (!racerId || !racersData.current[racerId]) return;

        const racer = racersData.current[racerId];
        
        if (hitIndex === racer.nextCP && hitIndex !== 0) {
            racer.nextCP += 1;
        } 
        else if (hitIndex === 0 && racer.nextCP > maxCheckpoints) {
            racer.lap += 1;
            racer.nextCP = 1;
            if (racerId === 'player') {
                if (racer.lap > TOTAL_LAPS) setFinished(true);
                else setUiLap(racer.lap);
            }
        }
    }, [maxCheckpoints]);

    const playerRank = positions.find(p => p.id === 'player')?.position || 1;

    // Gestione Uscita
    const handleExitRace = useCallback(() => {
        setRaceExited(true);
        setTimeout(() => { onBack(); }, 50);
    }, [onBack]);
    
    // Liste Bersagli (per Gusci Rossi/Blu)
    const targets = useMemo(() => {
        const list = [];
        if (playerRef.current) list.push({ id: 'player', ref: playerRef });
        for (let i = 0; i < BOT_COUNT; i++) {
            const id = `bot_${i}`;
            if (botRefs.current[id]) {
                list.push({ id: id, ref: botRefs.current[id] });
            }
        }
        return list;
    }, []); // Dipendenza vuota: i ref object non cambiano, solo il .current

    const blueShellTargets = useMemo(() => {
        return targets.map(t => {
            const rankInfo = positions.find(p => p.id === t.id);
            return {
                id: t.id,
                ref: t.ref,
                rank: rankInfo ? rankInfo.position : 99 
            };
        });
    }, [targets, positions]);

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    const isRaceActive = !finished && !raceExited;

    // --- DETERMINA POSIZIONE PLAYER ---
    // start_1 corrisponde al Player (griglia 1)
    const playerStartPos = gridPositions[12] || start_pos; 
    // Se c'è rotazione nel GLB usala, altrimenti ruota 90° su Y come default
    const playerStartRot = gridRotations[12] || [0, Math.PI / 2, 0]; 

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* UI HUD */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', fontFamily: 'sans-serif', textShadow: '2px 2px 0 #000' }}>
                <button onClick={handleExitRace} style={{marginBottom: 10, cursor: 'pointer'}}>Exit Race</button>
                <h1 style={{ margin: 0 }}>Pos: {playerRank} / 12</h1>
                <div style={{ fontSize: '40px', fontWeight: 'bold' }}>
                    {finished ? <span style={{color: '#ffdd00'}}>FINISH!</span> : `Lap ${lap} / ${TOTAL_LAPS}`}
                </div>
                <h2 style={{ margin: 0 }}>Lap: {uiLap}</h2>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Target: Check_{nextCheck <= maxCheckpoints ? nextCheck : '0 (Finish)'}
                </div>
            </div>

            <GameHUD lap={uiLap} totalLaps={TOTAL_LAPS} rank={playerRank} />

            <Canvas>
                <LightningAtmosphere />
                <Stats />
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <Environment preset="city" />

                <Physics debug={false}>
                    {/* Items Rendering */}
                    <Suspense fallback={null}>
                         {bananas.map(b => <Banana key={b.id} position={b.position} initVelocity={b.velocity}/>)}
                         {shells.map(s => <GreenShell key={s.id} position={s.position} initVelocity={s.velocity} onDestroy={() => handleRemoveShell(s.id)}/>)}
                         {bobOmbs.map(b => <BobOmb key={b.id} position={b.position} initVelocity={b.velocity} onDestroy={() => destroyBobOmb(b.id)}/>)}
                         {redShells.map(s => <RedShell key={s.id} position={s.position} initVelocity={s.velocity} waypoints={trackWaypoints} targets={targets} ownerId={s.ownerId} onDestroy={() => handleRemoveRedShell(s.id)}/>)}
                         {blueShells.map(s => <BlueShell key={s.id} position={s.position} waypoints={trackWaypoints} targets={blueShellTargets} onDestroy={() => handleDestroyBlueShell(s.id)}/>)}
                    </Suspense>
                    
                    <RaceManager 
                        racersData={racersData}
                        finished={finished}
                        setPositions={setPositions}
                        positions={positions}
                        playerRef={playerRef}
                        botRefs={botRefs}
                        trackPath={trackWaypoints}
                    />
                    
                    <group ref={trackRef}>
                        <SmartMap modelPath={mapPath} scale={1} />
                    </group>

                    <ItemBoxesMap mapModelPath={selectedTrack.itemBoxes} triggerName="Cube" />
                    <RoadWalls modelPath={selectedTrack.road} wallHeight={10} thresholdAngle={20} debug={true} />
                    
                    {checkpointPath && (
                        <CheckpointSystem 
                            url={checkpointPath} 
                            onSystemReady={(posMap) => { checkpointPositionsRef.current = posMap; }}
                            onCheckpointTrigger={(index, racerId) => { handleCheckpointTrigger(index, racerId); }} 
                        />
                    )}

                    {/* PLAYER */}
                    <group position={[0, 10, 0]} > 
                        {vehicle.isBike ? (
                            <InsideDriftBike 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: 'player' }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                vehicleConfig={vehicle} 
                                START_POS={playerStartPos}
                                trackRef={trackRef} 
                                isRaceActive={isRaceActive}
                            />
                        ) : (
                            <OutsideDriftKart 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: 'player' }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                vehicleConfig={vehicle} 
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot} // Usa rotazione GLB
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
                                isRaceActive={isRaceActive}
                                onSpawnBanana={handleSpawnBanana}
                                onSpawnGreenShell={handleSpawnGreenShell}
                                onSpawnRedShell={handleSpawnRedShell}
                                onSpawnBlueShell={handleSpawnBlueShell}
                                onSpawnBomb={handleSpawnBobOmb}
                                waypoints={trackWaypoints}
                                rank={playerRank}
                            />
                        )}
                    </group>

                    {/* BOTS */}
                    {Array.from({ length: BOT_COUNT }, (_, i) => {
                        const botId = `bot_${i}`;
                        // Mappatura: i=0 (Bot 1) -> start_2, i=1 -> start_3...
                        const gridIndex = i; 
                        
                        // Cerca posizione/rotazione nel GLB. Se manca, usa fallback matematico.
                        const botPos = gridPositions[gridIndex] || getGridPosition(start_pos, 12);
                        const botRot = gridRotations[gridIndex] || [0, Math.PI / 2, 0];

                        return (
                            <group key={botId} position={[0, 0, 0]}> 
                                <OutsideDriftKart 
                                    ref={botRefs.current[botId]}
                                    userData={{ type: 'racer', id: botId }}
                                    characterConfig={character.modelConfig} 
                                    vehicleConfig={vehicle} 
                                    START_POS={botPos}
                                    START_ROT={botRot} // Usa rotazione GLB
                                    trackRef={trackRef} 
                                    trackConfig={selectedTrack} 
                                    isBot={true}
                                    paths={[trackWaypoints, trackWaypoints1, trackWaypoints2, leftWaypoints, rightWaypoints]} 
                                    onCheckpoint={(idx) => handleCheckpointTrigger(idx, botId)}
                                /> 
                            </group>
                        );
                    })}
                </Physics>
            </Canvas>
        </div>
    )
}