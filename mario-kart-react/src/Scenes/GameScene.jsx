import React, { useState, useRef, useCallback, useMemo	 } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Environment, PerspectiveCamera, useGLTF, Line, Stats } from '@react-three/drei'
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import { WaypointRecorder } from '../Bot/WaypointRecorder'
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit.json'
import leftWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_left.json'
import rightWaypoints from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit_right.json'
import trackWaypoints1 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit1.json'
import trackWaypoints2 from '../Bot/Waypoints/DaisyCircuit/DaisyCircuit2.json'
import { CheckpointSystem } from '../Race/CheckPointManager.jsx'
import { RaceManager } from '../Race/RaceManager.jsx'
import { RoadWalls } from '../Tracks/RoadWalls.jsx'

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
function WaypointVisualizer({ points, color }) {
  const linePoints = useMemo(() => {
    if (!points) return []
    // Convertiamo l'array di oggetti {x,y,z} in array di array [x,y,z]
    // Alziamo la Y di 1 metro per vederla bene sopra la strada
    return points.map(p => [p.x, p.y + 1.0, p.z])
  }, [points])
  return (
    <Line
      points={linePoints}       // Array di vettori [x, y, z]
      color={color}               // Colore richiesto
      lineWidth={3}             // Spessore della linea
      dashed={false}            // Linea continua
    />
  )
}

/**
 * Componente che gestisce i Box Collider dei Checkpoint
 * Carica il GLB, e per ogni oggetto crea un'area sensibile (Sensor)
 */
export function GameScene({ character, vehicle, mapPath, checkpointPath, onBack, start_pos, maxCheckpoints, selectedTrack }) {

    // --- REFS DATI ---
    const { initialRacersData, initialPositions, botsArray } = useMemo(() => {
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

    // --- REFS FISICI ---
    const [positions, setPositions] = useState(initialPositions);
    const [uiLap, setUiLap] = useState(1);
    const [finished, setFinished] = useState(false);

    // --- REFS ---
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();
    
    const racerRefs = useRef({});

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

	const racers = [playerRef, botRefs];
	
	// Inizializza i ref per tutti i 11 bot
	for (let i = 0; i < BOT_COUNT; i++) {
		if (!botRefs.current[`bot_${i}`]) {
			botRefs.current[`bot_${i}`] = React.createRef();
		}
	}

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white' }}>
                 <h1>Pos: {playerRank} / 2</h1>
                 <h2>Lap: {uiLap}</h2>
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
				

                <Physics debug={false}>
                    
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
					

                </Physics>
            </Canvas>
        </div>
    )
}