import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
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
import { gsap } from 'gsap'

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

function CinematicCamera({ gameState, playerStartPos, playerStartRot }) {
    const { camera } = useThree();

    useFrame((_state, delta) => {
        if (gameState === 'INTRO') {
            // Panoramica aerea che ruota lentamente
            camera.position.lerp(new THREE.Vector3(60, 100, 60), delta * 0.5);
            camera.lookAt(0, 0, 0);
        } else if (gameState === 'COUNTDOWN') {
            // Calcola la posizione "Dietro il Player" basata sulla rotazione iniziale
            // Creiamo un offset standard (es: 8 unità indietro, 3 unità in alto)
            const offset = new THREE.Vector3(0, 3, -8); 
            
            // Applichiamo la rotazione del player all'offset
            const euler = new THREE.Euler(playerStartRot[0], playerStartRot[1] - Math.PI, playerStartRot[2]);
            offset.applyEuler(euler);

            // Posizione target della camera
            const targetPos = new THREE.Vector3(
                playerStartPos[0] + offset.x,
                playerStartPos[1] + offset.y,
                playerStartPos[2] + offset.z
            );

            // Transizione fluida verso il retro del player
            camera.position.lerp(targetPos, delta * 4);
            
            // Guarda un punto leggermente sopra il player
            const lookAtTarget = new THREE.Vector3(
                playerStartPos[0],
                playerStartPos[1] + 1.5,
                playerStartPos[2]
            );
            camera.lookAt(lookAtTarget);
        }
    });

    return null;
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

	const [gameState, setGameState] = useState('INTRO'); // 'INTRO', 'COUNTDOWN', 'RACING'
    const [countdown, setCountdown] = useState(null);
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false);

	const [networkItems, setNetworkItems] = useState([]);

	const handleRequestSpawn = useCallback((type, position, velocity, extra = {}) => {
		// Helper per estrarre coordinate in modo sicuro
		const getCoords = (val) => {
			if (Array.isArray(val)) return val;
			if (val && typeof val === 'object') return [val.x || 0, val.y || 0, val.z || 0];
			return [0, 0, 0];
		};

		const posArray = getCoords(position);
		const velArray = getCoords(velocity);

		console.log(`Emitting spawn_item: ${type}`, posArray, velArray);

		if (socket) {
			socket.emit('spawn_item', { 
				type, 
				position: posArray, 
				velocity: velArray,
				...extra 
			});
		}
	}, [socket]);

    const handleRequestRemove = useCallback((itemId) => {
        if (socket) socket.emit('remove_item', { itemId });
    }, [socket]);

    const [onlinePlayers, setOnlinePlayers] = useState([]);

	// Calcola se la gara è effettivamente attiva per il movimento
	const isRaceActive = gameState === 'RACING' && !finished && !raceExited;
	const isControlDisabled = gameState !== 'RACING';

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

	const introPlayed = useRef(false);
	const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));

    const [positions, setPositions] = useState(initialPositions);
    const playerRank = positions.find(p => p.id === 'player')?.position || 1;

	useEffect(() => {
        const handleItemCollected = (e) => {
            const { racerId } = e.detail;
            
            if (racerId === 'player') {
                playerRef.current?.triggerItemRoulette(playerRank);
            } else if (racerId.startsWith('bot_')) {
                // Trova il bot specifico e attiva la roulette basata sulla sua posizione attuale
                const botRankInfo = positions.find(p => p.id === racerId);
                const botRank = botRankInfo ? botRankInfo.position : 6;
                botRefs.current[racerId].current?.triggerItemRoulette(botRank);
            }
        };

        window.addEventListener('item-collected', handleItemCollected);
        return () => window.removeEventListener('item-collected', handleItemCollected);
    }, [playerRank, positions]);

	useEffect(() => {
		if (introPlayed.current) return;
			introPlayed.current = true;

			// 1. Setup Camera iniziale (Molto in alto per lo Zoom Out)
			// Supponiamo che il centro della mappa sia [0,0,0]
			// const cam = state.camera; // Dovrai passarlo tramite un componente o ref

			// Fase 1: Zoom out panoramico
			gsap.fromTo(cameraTarget.current, 
				{ x: 0, y: 0, z: 0 }, 
				{ x: 0, y: 5, z: 0, duration: 4 }
			);

			// Fase 2: Transizione al Player e poi Countdown
			const timeline = gsap.timeline({
				onComplete: () => startCountdown()
			});

			// Animazione "volo" dalla mappa al player
			timeline.to(cameraTarget.current, {
				x: playerStartPos[0],
				y: playerStartPos[1] + 2,
				z: playerStartPos[2],
				duration: 3,
				ease: "power2.inOut",
				delay: 1
			});
	}, []);

    const startCountdown = () => {
        setGameState('COUNTDOWN');
        let timer = 3;
        setCountdown(timer);

        const interval = setInterval(() => {
            timer -= 1;
            if (timer > 0) {
                setCountdown(timer);
                // Qui potresti triggerare l'audio SFX_COUNTDOWN
            } else if (timer === 0) {
                setCountdown('START!');
                setGameState('RACING');
                // SFX_RACE_START
            } else {
                setCountdown(null);
                clearInterval(interval);
            }
        }, 1000);
    };

    // 3. REFS & STATE
    // --- STATI UI E AUDIO ---
    const [uiLap, setUiLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 

    // --- REFS ---
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();
    const checkpointPositionsRef = useRef({});
    const playerRef = useRef(); 
    const botRefs = useRef({});

	const opponentsDataRef = useRef({});

    // Inizializza refs per i bot
    for (let i = 0; i < BOT_COUNT; i++) {
        if (!botRefs.current[`bot_${i}`]) {
            botRefs.current[`bot_${i}`] = React.createRef();
        }
    }

    // Stati Variabili
    const [opponents, setOpponents] = useState([]);

    // 4. GESTIONE ITEMS
    const [bananas, setBananas] = useState([]);
    const [shells, setShells] = useState([]); // Green Shells
    const [redShells, setRedShells] = useState([]);
    const [blueShells, setBlueShells] = useState([]);
    const [bobOmbs, setBobOmbs] = useState([]);

	
	useEffect(() => {
		setOnlinePlayers(opponents.map(opp => ({ id: opp.id })));
	}, [opponents]);

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

    // 5. AUDIO & LOGICA DI GIOCO
    const { changeTrack } = useAudio();
    useEffect(() => {
        if(selectedTrack?.soundtrack) changeTrack(selectedTrack.soundtrack, false);
    }, [selectedTrack, changeTrack]);

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

    // Gestione Uscita
    const handleExitRace = useCallback(() => {
        setRaceExited(true);
        setTimeout(() => { onBack(); }, 50);
    }, [onBack]);
    
    // Liste Bersagli (per Gusci Rossi/Blu)
    const targets = useMemo(() => {
        const list = [];"8IdNhLMq4wXKJguIAAAb"
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

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    // --- DETERMINA POSIZIONE PLAYER ---
    // start_12 corrisponde al Player (griglia 12)
    const playerStartPos = gridPositions[12] || start_pos; 
    // Se c'è rotazione nel GLB usala, altrimenti ruota 90° su Y come default
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

			{countdown && (
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					fontSize: '120px',
					fontWeight: '900',
					color: countdown === 'START!' ? '#00ff00' : '#ffff00',
					textShadow: '5px 5px 0px #000',
					zIndex: 1000,
					fontFamily: 'Arial Black, sans-serif'
				}}>
					{countdown}
				</div>
			)}

            <Canvas>
                {/* Audio 3D Listener - DEVE essere prima di qualsiasi kart */}
                <AudioListenerComponent />
                
				<CinematicCamera 
					gameState={gameState} 
					playerStartPos={playerStartPos} 
					playerStartRot={playerStartRot} 
				/>
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
					setItems={setNetworkItems}
					opponentsDataRef={opponentsDataRef}
					gameState={gameState}
                />

                <Physics debug={false}>

                    <Suspense fallback={null}>
                        {networkItems.map((item) => {
							// Validazione dati per evitare crash
							if (!item.position || !item.velocity) return null;

							const pos = new THREE.Vector3().fromArray(item.position);
							const vel = new THREE.Vector3().fromArray(item.velocity);

							const commonProps = {
								position: pos,
								initVelocity: vel,
								onDestroy: () => handleRequestRemove(item.id)
							};

							switch (item.type) {
								case 'banana': 
									return <Banana key={item.id} {...commonProps} />;
								case 'green_shell': 
									return <GreenShell key={item.id} {...commonProps} />;
								case 'red_shell': 
									return <RedShell key={item.id} {...commonProps} targets={targets} waypoints={trackWaypoints} />;
								case 'bomb': 
									return <BobOmb key={item.id} {...commonProps} />;
								// Aggiungi qui altri casi se necessario
								default: 
									return null;
							}
						})}
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
						return (
							<RemoteOpponent 
								key={playerData.id} 
								playerId={playerData.id} // Passa l'ID
								opponentsDataRef={opponentsDataRef} // Passa il Ref globale
								character={Characters.find(c => c.id === playerData.charId) || character} 
								vehicle={VEHICLE_DATABASE[playerData.vehicleId] || vehicle}
								userData={{ type: 'opponent', id: playerData.id }} 
								data={playerData}
							/>
						);
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
								botRefs={botRefs}
								gameState={gameState}
                                vehicleConfig={vehicle} 
								positions={positions}
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
                                isRaceActive={isRaceActive}
                                waypoints={trackWaypoints}
                                rank={playerRank}
                                onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
								onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
								onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
								onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
								onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
                                onHitOpponent={(victimId) => {
                                    socket.emit('player_hit', { victimId: victimId, type: 'bullet-bill' });
                                }}
								socket={socket}
                            />
                        )}
                    </group>

                    {/* BOTS (AI) */}
                    {/* {Array.from({ length: BOT_COUNT }, (_, i) => {
                        const botId = `bot_${i}`;
                        // Mappatura: Bot 0 -> start_1, Bot 1 -> start_2, etc. (o logica inversa)
                        // Qui assumo che i Bot riempiano le posizioni da 1 a 11.
                        const gridIndex = i + 1; 
                        const gridIndex = i; 
                        
                        const botPos = gridPositions[gridIndex] || getGridPosition(start_pos, i);
                        const botPos = gridPositions[gridIndex] || getGridPosition(start_pos, 12);
                        const botRot = gridRotations[gridIndex] || [0, Math.PI / 2, 0];

                        return (
                            <group key={botId} position={[0, 0, 0]}> 
                                <OutsideDriftKart 
                                    ref={botRefs.current[botId]}
                                    userData={{ type: 'racer', id: botId }}
                                    characterConfig={character.modelConfig} 
									gameState={gameState}
                                    vehicleConfig={vehicle} 
                                    START_POS={botPos}
                                    START_ROT={botRot}
                                    START_ROT={botRot}
									positions={positions}
									onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
									onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
									onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
									onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
									onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
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