import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera, Stats, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// --- IMPORTS INTERNI ---
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
import { NetworkManager } from '../multiplayer/NetworkManager.jsx'
import { RemoteOpponent } from '../multiplayer/RemoteOpponent.jsx'
import { VEHICLE_DATABASE, Characters } from '../components/Data.jsx'

// --- IMPORTS ITEMS ---
import { Banana } from '../Items/Banana';
import { GreenShell } from '../Items/GreenShell';
import { RedShell } from '../Items/RedShell';
import { BlueShell } from '../Items/BlueShell.jsx'
import { BobOmb } from '../Items/BobOmb.jsx'
import { AudioListenerComponent } from '../audio/AudioListenerComponent.jsx';

// --- IMPORTS WAYPOINTS ---
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit.json'
import leftWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_left.json'
import rightWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_right.json'
import trackWaypoints1 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit1.json'
import trackWaypoints2 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit2.json'

const TOTAL_LAPS = 3;
const BOT_COUNT = 11; // 1 Player + 11 Bots = 12 Racers

// --- HELPERS ---

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

// Fallback matematico per la griglia se non esiste nel GLB
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

// Hook per estrarre posizioni e rotazioni dai nodi "start_X" del GLB
function useGridPositions(url) {
    const { scene } = useGLTF(url || ""); // Gestione caso url nullo
    
    const gridData = useMemo(() => {
        if (!url) return { positions: {}, rotations: {} };

        const positions = {};
        const rotations = {};

        scene.traverse((obj) => {
            if (obj.name.startsWith('start_')) {
                const parts = obj.name.split('_');
                const index = parseInt(parts[1]);

                if (!isNaN(index)) {
                    positions[index] = [obj.position.x, obj.position.y, obj.position.z];
                    const euler = new THREE.Euler().setFromQuaternion(obj.quaternion);
                    rotations[index] = [euler.x, euler.y, euler.z];
                }
            }
        });
        return { positions, rotations };
    }, [scene, url]);

    return gridData;
}

// --- MAIN COMPONENT ---

export function GameScene({ socket, character, vehicle, mapPath, checkpointPath, onBack, start_pos, maxCheckpoints, selectedTrack }) {

    // 1. CARICAMENTO POSIZIONI DI PARTENZA (Grid)
    const { positions: gridPositions, rotations: gridRotations } = useGridPositions(selectedTrack?.gridpos);

    // 2. SETUP STATI GARA
    const { initialRacersData, initialPositions } = useMemo(() => {
        const data = {
            player: { id: 'player', lap: 1, nextCP: 1, score: 0 }
        };
        const positions = [{ id: 'player', position: 12 }]; // Player parte ultimo (esempio)
        const bots = [];

        for (let i = 0; i < BOT_COUNT; i++) {
            const botId = `bot_${i}`;
            data[botId] = { id: botId, lap: 1, nextCP: 1, score: 0 };
            positions.push({ id: botId, position: i + 1 });
            bots.push({ id: botId, index: i });
        }

        return { initialRacersData: data, initialPositions: positions, botsArray: bots };
    }, []);

    // 3. REFS & STATE
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();
    const checkpointPositionsRef = useRef({});
    const playerRef = useRef(); 
    const botRefs = useRef({});

    // Inizializza refs per i bot
    for (let i = 0; i < BOT_COUNT; i++) {
        if (!botRefs.current[`bot_${i}`]) {
            botRefs.current[`bot_${i}`] = React.createRef();
        }
    }

    // Stati Variabili
    const [opponents, setOpponents] = useState([]);
    const [positions, setPositions] = useState(initialPositions);
    const [uiLap, setUiLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false); 

    // 4. GESTIONE ITEMS
    const [bananas, setBananas] = useState([]);
    const [shells, setShells] = useState([]); // Green Shells
    const [redShells, setRedShells] = useState([]);
    const [blueShells, setBlueShells] = useState([]);
    const [bobOmbs, setBobOmbs] = useState([]);

    // Handlers Spawn
    const handleSpawnBanana = useCallback((position, velocity) => {
        setBananas((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    }, []);

    const handleSpawnGreenShell = useCallback((position, velocity) => {
        setShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    }, []);
    const handleRemoveShell = useCallback((id) => setShells((prev) => prev.filter(s => s.id !== id)), []);

    const handleSpawnRedShell = useCallback((position, velocity, ownerId) => {
        setRedShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity, ownerId }]);
    }, []);
    const handleRemoveRedShell = useCallback((id) => setRedShells((prev) => prev.filter(s => s.id !== id)), []);

    const handleSpawnBlueShell = useCallback((position, velocity) => {
        setBlueShells((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    }, []);
    const handleDestroyBlueShell = useCallback((id) => setBlueShells((prev) => prev.filter(s => s.id !== id)), []);

    const handleSpawnBobOmb = useCallback((position, velocity) => {
        setBobOmbs((prev) => [...prev, { id: Date.now() + Math.random(), position, velocity }]);
    }, []);
    const destroyBobOmb = useCallback((id) => setBobOmbs((prev) => prev.filter(b => b.id !== id)), []);

    const handleActivateLightning = useCallback(() => {
        console.log("⚡ Player used Lightning!");
        
        // 1. Emit to server so it can strike everyone else
        if (socket) {
            socket.emit('use_lightning', { 
                attackerId: socket.id,
            });
        }

    }, [socket]);

    // 5. AUDIO & LOGICA DI GIOCO
    const { changeTrack } = useAudio();
    useEffect(() => {
        if(selectedTrack?.soundtrack) changeTrack(selectedTrack.soundtrack, false);
    }, [selectedTrack]);

    const handleExitRace = useCallback(() => {
        setRaceExited(true);
        setTimeout(() => { onBack(); }, 50);
    }, [onBack]);

    // Checkpoint Trigger
    const handleCheckpointTrigger = useCallback((hitIndex, racerId) => {
        if (!racerId || !racersData.current[racerId]) return;

        const racer = racersData.current[racerId];
        
        if (hitIndex === racer.nextCP && hitIndex !== 0) {
            racer.nextCP += 1;
            if (racerId === 'player') setNextCheck(racer.nextCP);
        } 
        else if (hitIndex === 0 && racer.nextCP > maxCheckpoints) {
            racer.lap += 1;
            racer.nextCP = 1;
            if (racerId === 'player') {
                if (racer.lap > TOTAL_LAPS) setFinished(true);
                else {
                    setUiLap(racer.lap);
                    setNextCheck(1);
                }
            }
        }
    }, [maxCheckpoints]);

    // Calcolo Targets per Gusci (Red/Blue)
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
    }, []); 

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

    const playerRank = positions.find(p => p.id === 'player')?.position || 1;
    const isRaceActive = !finished && !raceExited;

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    // --- POSIZIONAMENTO START ---
    // Assumiamo che start_12 sia il player (ultima posizione in griglia da 12)
    // Se non esiste nel GLB, usiamo il fallback getGridPosition index 11 (0-based)
    const playerStartPos = gridPositions[12] || getGridPosition(start_pos, 11); 
    const playerStartRot = gridRotations[12] || [0, Math.PI / 2, 0]; 

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            
            {/* UI HUD DI DEBUG / PAUSA */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', fontFamily: 'sans-serif', textShadow: '2px 2px 0 #000' }}>
                <button onClick={handleExitRace} style={{marginBottom: 10, cursor: 'pointer'}}>Exit Race</button>
                <h1 style={{ margin: 0 }}>Pos: {playerRank} / {BOT_COUNT + 1}</h1>
                <h2 style={{ margin: 0 }}>Lap: {uiLap} / {TOTAL_LAPS}</h2>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Target: Check_{nextCheck <= maxCheckpoints ? nextCheck : '0 (Finish)'}
                </div>
                {finished && <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#ffdd00' }}>FINISH!</div>}
            </div>

            {/* HUD PRINCIPALE */}
            <GameHUD lap={uiLap} totalLaps={TOTAL_LAPS} rank={playerRank} />

            <Canvas>
                {/* Audio 3D Listener - DEVE essere prima di qualsiasi kart */}
                <AudioListenerComponent />
                
                <LightningAtmosphere />
                <Stats />
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <Environment preset="city" />

                {/* NETWORK MANAGER (Multiplayer) */}
                <NetworkManager 
                    socket={socket} 
                    playerRef={playerRef} 
                    setOpponents={setOpponents} 
                    character={character} 
                    vehicle={vehicle} 
                />

                <Physics debug={false}>

                    {/* ITEMS RENDER */}
                    <Suspense fallback={null}>
                         {bananas.map(b => <Banana key={b.id} position={b.position} initVelocity={b.velocity}/>)}
                         {shells.map(s => <GreenShell key={s.id} position={s.position} initVelocity={s.velocity} onDestroy={() => handleRemoveShell(s.id)}/>)}
                         {bobOmbs.map(b => <BobOmb key={b.id} position={b.position} initVelocity={b.velocity} onDestroy={() => destroyBobOmb(b.id)}/>)}
                         {redShells.map(s => <RedShell key={s.id} position={s.position} initVelocity={s.velocity} waypoints={trackWaypoints} targets={targets} ownerId={s.ownerId} onDestroy={() => handleRemoveRedShell(s.id)}/>)}
                         {blueShells.map(s => <BlueShell key={s.id} position={s.position} waypoints={trackWaypoints} targets={blueShellTargets} onDestroy={() => handleDestroyBlueShell(s.id)}/>)}
                    </Suspense>
                    
                    {/* RACE LOGIC */}
                    <RaceManager 
                        racersData={racersData}
                        finished={finished}
                        setPositions={setPositions}
                        positions={positions}
                        playerRef={playerRef}
                        botRefs={botRefs}
                        trackPath={trackWaypoints}
                    />
                    
                    {/* MAP & COLLIDERS */}
                    <group ref={trackRef}>
                        <SmartMap modelPath={mapPath} scale={1} />
                    </group>
                    
                    <RoadWalls modelPath={selectedTrack.road} wallHeight={10} thresholdAngle={20} debug={false} />
                    <ItemBoxesMap mapModelPath={selectedTrack.itemBoxes} triggerName="Cube" />
                    
                    {checkpointPath && (
                        <CheckpointSystem 
                            url={checkpointPath} 
                            onSystemReady={(posMap) => { checkpointPositionsRef.current = posMap; }}
                            onCheckpointTrigger={(index, racerId) => { handleCheckpointTrigger(index, racerId); }} 
                        />
                    )}

                    {/* OPPONENTI REMOTI (Multiplayer) */}
                    {opponents.map((playerData) => {
                        const remoteChar = Characters.find(c => c.id === playerData.charId) || character;
                        const remoteVehicleConfig = VEHICLE_DATABASE[playerData.vehicleId];
                        const remoteVehicle = remoteVehicleConfig ? { id: playerData.vehicleId, ...remoteVehicleConfig } : vehicle;
                        

                        return <RemoteOpponent 
                            key={playerData.id} 
                            data={playerData}
                            character={remoteChar} 
                            vehicle={remoteVehicle}
                            // FIX 1: ID must be the remote player's ID, not 'player'
                            userData={{ type: 'opponent', id: playerData.id }} 
                        />
                    })}

                    {/* PLAYER LOCALE */}
                    <group position={[0, 10, 0]} > 
                        {vehicle.isBike ? (
                            <InsideDriftBike 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: 'player' }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                vehicleConfig={vehicle} 
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef} 
                                isRaceActive={isRaceActive}
                                // Passa handlers anche alla moto se implementati
                            />
                        ) : (
                            <OutsideDriftKart 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: 'player' }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                vehicleConfig={vehicle} 
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
                                isRaceActive={isRaceActive}
                                waypoints={trackWaypoints}
                                rank={playerRank}
                                onSpawnBanana={handleSpawnBanana}
                                onSpawnGreenShell={handleSpawnGreenShell}
                                onSpawnRedShell={handleSpawnRedShell}
                                onSpawnBlueShell={handleSpawnBlueShell}
                                onSpawnBomb={handleSpawnBobOmb}
                                onActivateLightning={handleActivateLightning}
                                onHitOpponent={(victimId) => {
                                    socket.emit('player_hit', { victimId: victimId, type: 'bullet-bill' });
                                }}
                            />
                        )}
                    </group>

                    {/* BOTS (AI) */}
                    {/* {Array.from({ length: BOT_COUNT }, (_, i) => {
                        const botId = `bot_${i}`;
                        // Mappatura: Bot 0 -> start_1, Bot 1 -> start_2, etc. (o logica inversa)
                        // Qui assumo che i Bot riempiano le posizioni da 1 a 11.
                        const gridIndex = i + 1; 
                        
                        const botPos = gridPositions[gridIndex] || getGridPosition(start_pos, i);
                        const botRot = gridRotations[gridIndex] || [0, Math.PI / 2, 0];

                        return (
                            <group key={botId} position={[0, 0, 0]}> 
                                <OutsideDriftKart 
                                    ref={botRefs.current[botId]}
                                    userData={{ type: 'racer', id: botId }}
                                    characterConfig={character.modelConfig} 
                                    vehicleConfig={vehicle} 
                                    START_POS={botPos}
                                    START_ROT={botRot}
                                    trackRef={trackRef} 
                                    trackConfig={selectedTrack} 
                                    isBot={true}
                                    paths={[trackWaypoints, trackWaypoints1, trackWaypoints2, leftWaypoints, rightWaypoints]} 
                                    onCheckpoint={(idx) => handleCheckpointTrigger(idx, botId)}
                                /> 
                            </group>
                        );
                    })} */}
                </Physics>
            </Canvas>
        </div>
    )
}