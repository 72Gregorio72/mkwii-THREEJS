import React, { useState, useRef, useCallback, useMemo	, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera, Stats } from '@react-three/drei'
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit.json'
import leftWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_left.json'
import rightWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_right.json'
import trackWaypoints1 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit1.json'
import trackWaypoints2 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit2.json'
import { CheckpointSystem } from '../Race/CheckPointManager.jsx'
import { RaceManager } from '../Race/RaceManager.jsx'
import { useAudio } from '../audio/AudioManager.jsx'
import { RoadWalls } from '../Tracks/RoadWalls.jsx'
import { Banana } from '../Items/Banana';

const TOTAL_LAPS = 3;
const BOT_COUNT = 11; // 1 Player + 11 Bots = 12 Racers

// Funzione helper per calcolare la griglia di partenza
// index 0 = Player, index 1..11 = Bots
function getGridPosition(startPos, index) {
    const ROW_DIST = 3.5; // Distanza tra le file (profondità)
    const COL_DIST = 2.5; // Distanza laterale
    
    // Calcoliamo la fila e se è destra/sinistra
    const row = Math.floor(index / 2);
    const isRight = index % 2 !== 0; 
    
    // Offset
    const xOffset = isRight ? COL_DIST : -COL_DIST;
    const zOffset = row * -ROW_DIST; // Vanno indietro rispetto alla start_pos
    
    return [
        startPos[0] + xOffset,
        startPos[1], // Y rimane uguale
        startPos[2] + zOffset // Z va indietro
    ];
}

/**
 * Componente che gestisce i Box Collider dei Checkpoint
 * Carica il GLB, e per ogni oggetto crea un'area sensibile (Sensor)
 */
export function GameScene({ character, vehicle, mapPath, checkpointPath, onBack, start_pos, maxCheckpoints, selectedTrack }) {

    // --- REFS DATI ---
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

	const [bananas, setBananas] = useState([]);

	const handleSpawnBanana = (position, velocity) => { // <--- Aggiungi velocity
        const newBanana = {
            id: Date.now() + Math.random(),
            position: position,
            velocity: velocity // <--- Salvalo nell'oggetto
        };
        setBananas((prev) => [...prev, newBanana]);
    };

    // --- REFS FISICI ---
    const [positions, setPositions] = useState(initialPositions);
    const [uiLap, setUiLap] = useState(1);
    
    const audioContext = useAudio();
    const changeTrack = audioContext?.changeTrack;

    useEffect(() => {
        if (changeTrack && selectedTrack?.name === 'Daisy Circuit') {
          changeTrack('RACE_DAISY_CIRCUIT', false);
        } else if (changeTrack && selectedTrack?.name === 'Luigi Circuit') {
          changeTrack('RACE_LUIGI_CIRCUIT', false);
        } else if (changeTrack && selectedTrack?.name === 'Coconut Mall') {
          changeTrack('RACE_COCONUT_MALL', false);
        }
    }, [changeTrack, selectedTrack]);

    // --- STATO GARA ---
    const [lap, setLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false);  // Stato per quando l'utente esce dalla gara

    // --- REFS ---
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();

        // Controllo sicurezza
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

	const checkpointPositionsRef = useRef({});

	const playerRef = useRef();

    const botRefs = useRef({});
    
    // Inizializza i ref per tutti i 11 bot
	for (let i = 0; i < BOT_COUNT; i++) {
		if (!botRefs.current[`bot_${i}`]) {
			botRefs.current[`bot_${i}`] = React.createRef();
		}
    }

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    // Funzione per gestire l'uscita dalla gara
    const handleExitRace = useCallback(() => {
        setRaceExited(true);  // Ferma immediatamente tutti gli SFX
        // Piccolo delay per assicurarsi che gli audio si fermino prima di cambiare scena
        setTimeout(() => {
            onBack();
        }, 50);
    }, [onBack]);

    // Calcola se la gara è attiva (non finita e non uscito)
    const isRaceActive = !finished && !raceExited;

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* UI HUD */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', fontFamily: 'sans-serif', textShadow: '2px 2px 0 #000' }}>
                <button onClick={handleExitRace} style={{marginBottom: 10, cursor: 'pointer'}}>Exit Race</button>
                <h1 style={{ margin: 0 }}>Pos: {playerRank} / 2</h1>
                <div style={{ fontSize: '40px', fontWeight: 'bold' }}>
                    {finished ? <span style={{color: '#ffdd00'}}>FINISH!</span> : `Lap ${lap} / ${TOTAL_LAPS}`}
                </div>
                <h2 style={{ margin: 0 }}>Lap: {uiLap}</h2>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  Target: Check_{nextCheck <= maxCheckpoints ? nextCheck : '0 (Finish)'}
            </div>
        </div>

        <Canvas>
				<Stats />
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <Environment preset="city" />

				{/* <WaypointVisualizer points={trackWaypoints} color="blue" />
				<WaypointVisualizer points={leftWaypoints} color="green" />
				<WaypointVisualizer points={rightWaypoints} color="red" />
				<WaypointVisualizer points={trackWaypoints1} color="yellow" />
				<WaypointVisualizer points={trackWaypoints2} color="orange" /> */}
				

                <Physics debug={true}>

					<Suspense fallback={null}>
						{bananas.map((b) => (
							<Banana 
								key={b.id} 
								position={b.position} 
								initVelocity={b.velocity}
							/>
						))}
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
					<RoadWalls 
						modelPath={selectedTrack.road}
						wallHeight={10}
						thresholdAngle={20}
						debug={true}
					/>
                    {checkpointPath && (
                        <CheckpointSystem 
                            url={checkpointPath} 
                            onSystemReady={(posMap) => {
                                checkpointPositionsRef.current = posMap;
                            }}
                            onCheckpointTrigger={(index, racerId) => {
                                handleCheckpointTrigger(index, racerId); 
                            }} 
                        />
                    )}

                    {/* PLAYER */}
                    <group position={[0, 10, 0]} > 
                        {vehicle.isBike ? (
                            <InsideDriftBike 
                                ref={playerRef} // USA playerRef
                                userData={{ type: 'racer', id: 'player' }} // FONDAMENTALE PER IL CHECKPOINT
                                characterConfig={character.modelConfig}
                                vehicleConfig={vehicle} 
                                START_POS={start_pos}
                                trackRef={trackRef} 
                                // onCheckpoint={handleCheckpoint} <--- NON SERVE PIU' QUI (se hai rimosso il raycast)
                                isRaceActive={isRaceActive}
                            />
                        ) : (
                            <OutsideDriftKart 
                                ref={playerRef} // USA playerRef
                                userData={{ type: 'racer', id: 'player' }} // FONDAMENTALE PER IL CHECKPOINT
                                characterConfig={character.modelConfig}
                                vehicleConfig={vehicle} 
                                START_POS={start_pos}
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
                                START_ROT={[0, 90, 0]}
                                isRaceActive={isRaceActive}
								onSpawnBanana={handleSpawnBanana}
                            />
                        )}
                    </group>

                    {Array.from({ length: BOT_COUNT }, (_, i) => {
						const botId = `bot_${i}`;
						const gridPos = getGridPosition(start_pos, i + 1); // +1 perché player è index 0
						
						return (
							<group key={botId} position={[0, 10, 0]}> 
								<OutsideDriftKart 
									ref={botRefs.current[botId]}
									userData={{ type: 'racer', id: botId }}
									characterConfig={character.modelConfig} 
									vehicleConfig={vehicle} 
									START_POS={gridPos}
									trackRef={trackRef} 
									trackConfig={selectedTrack} 
									isBot={true}
									paths={[trackWaypoints, trackWaypoints1, trackWaypoints2, leftWaypoints, rightWaypoints]} 
									START_ROT={[0, 90, 0]}
									onCheckpoint={(idx) => handleCheckpointTrigger(idx, botId)}
								/> 
							</group>
						);
					})}
					

					{/* === 4. IL BOT (Nemico) === */}
                    <group position={[0, 10, 0]}>
                         <OutsideDriftKart 
                            characterConfig={character.modelConfig} 
                            vehicleConfig={vehicle} 
                            
                            START_POS={[start_pos[0] + 3, start_pos[1], start_pos[2]]} 
                            trackRef={trackRef}
                            trackConfig={selectedTrack}
                            isBot={true}              // Attiva l'IA
                            waypoints={trackWaypoints} // Passagli i 732 punti
                            isRaceActive={isRaceActive}
                        />
                    </group>
                </Physics>
            </Canvas>
        </div>
    )
}