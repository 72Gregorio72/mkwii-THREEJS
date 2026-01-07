import React, { useState, useRef, useCallback, useMemo	 } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Environment, PerspectiveCamera, useGLTF, Line } from '@react-three/drei'
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import { WaypointRecorder } from '../Bot/WaypointRecorder'
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit.json'

const TOTAL_LAPS = 3;


function WaypointVisualizer({ points }) {
  const linePoints = useMemo(() => {
    if (!points) return []
    // Convertiamo l'array di oggetti {x,y,z} in array di array [x,y,z]
    // Alziamo la Y di 1 metro per vederla bene sopra la strada
    return points.map(p => [p.x, p.y + 1.0, p.z])
  }, [points])

  return (
    <Line
      points={linePoints}       // Array di vettori [x, y, z]
      color="red"               // Colore richiesto
      lineWidth={3}             // Spessore della linea
      dashed={false}            // Linea continua
    />
  )
}

/**
 * Componente che gestisce i Box Collider dei Checkpoint
 * Carica il GLB, e per ogni oggetto crea un'area sensibile (Sensor)
 */
function CheckpointSystem({ url, onCheckpointTrigger }) {
    const { scene } = useGLTF(url);
    
    // Coda per gestire gli urti "dopo" il calcolo fisico
    const hitsQueue = useRef([]);

    const sensors = useMemo(() => {
        const boxes = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                const rawName = child.name;
                const numberOnly = rawName.replace(/[^0-9]/g, ''); 
                const id = parseInt(numberOnly);
                
                if (!isNaN(id)) {
                    boxes.push({
                        id: id,
                        position: child.position,
                        rotation: child.rotation,
                        scale: child.scale,
                        geometry: child.geometry
                    });
                }
            }
        });
        return boxes.sort((a, b) => a.id - b.id);
    }, [scene, url]);

    // Processiamo la coda degli urti al frame successivo (o fuori dal ciclo fisico)
    useFrame(() => {
        if (hitsQueue.current.length > 0) {
            // Processa ogni urto registrato
            hitsQueue.current.forEach((hitId) => {
                onCheckpointTrigger(hitId);
            });
            // Svuota la coda
            hitsQueue.current = [];
        }
    });

    return (
        <group>
            {sensors.map((box, index) => (
                <RigidBody
                    key={index} 
                    type="fixed" 
                    colliders="trimesh" 
                    sensor={true} 
                    position={box.position}
                    rotation={box.rotation}
                    scale={box.scale}
                    onIntersectionEnter={(payload) => {
                        // 1. LEGGERO E SICURO: Non loggare oggetti complessi qui!
                        // 2. Verifica solo il nome se esiste
                        const other = payload.other.rigidBodyObject;
                        if (other && (other.name === 'player' || other.name === 'bot')) {
                            // 3. NON eseguire logica qui. Mettilo in coda.
                            // Evitiamo duplicati nello stesso frame
                            if (!hitsQueue.current.includes(box.id)) {
                                hitsQueue.current.push(box.id);
                            }
                        }
                    }}
                >
                    <mesh geometry={box.geometry}>
                        <meshBasicMaterial visible={false} />
                    </mesh>
                </RigidBody>
            ))}
        </group>
    );
}


export function GameScene({ character, vehicle, mapPath, checkpointPath, onBack, start_pos, maxCheckpoints, selectedTrack }) {
    
    // --- STATO GARA ---
    const [lap, setLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 
    const [finished, setFinished] = useState(false);

    // --- REFS ---
    const lastCheckTime = useRef(0);
    const trackRef = useRef(); // Serve ancora per la pista fisica (SmartMap)
	const kartRef = useRef();
	const bikeRef = useRef();

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;
    const isBike = vehicle.isBike;

    // --- LOGICA GIRI ---
    const handleCheckpoint = useCallback((hitIndex) => {
        if (finished) return;

        const now = Date.now();
        if (now - lastCheckTime.current < 500) return;

        console.log(`🏁 CHECKPOINT TOCCATO -> ID: ${hitIndex} | Atteso: ${nextCheck}`);

        // CASO 1: Checkpoint Intermedio Corretto
        if (hitIndex === nextCheck && hitIndex !== 0) {
            console.log("✅ Checkpoint Valido!");
            setNextCheck(prev => prev + 1);
            lastCheckTime.current = now; 
        } else if (hitIndex === 0 && nextCheck > maxCheckpoints) {
            console.log("🏆 GIRO COMPLETATO!");
            
            setLap(prevLap => {
                const newLap = prevLap + 1;
                if (newLap > TOTAL_LAPS) {
                    setFinished(true);
                    return prevLap; 
                }
                return newLap;
            });

            setNextCheck(1); 
            lastCheckTime.current = now; 
        }
    }, [finished, nextCheck, maxCheckpoints]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {/* UI HUD */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', fontFamily: 'sans-serif', textShadow: '2px 2px 0 #000' }}>
                <button onClick={onBack} style={{marginBottom: 10, cursor: 'pointer'}}>Exit Race</button>
                <div style={{ fontSize: '40px', fontWeight: 'bold' }}>
                    {finished ? <span style={{color: '#ffdd00'}}>FINISH!</span> : `Lap ${lap} / ${TOTAL_LAPS}`}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      Target: Check_{nextCheck <= maxCheckpoints ? nextCheck : '0 (Finish)'}
                </div>
            </div>

            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <Environment preset="city" />

				<WaypointVisualizer points={trackWaypoints} />

                <Physics debug={false}> {/* Metti debug={true} per vedere i box collider verdi/rossi */}
                    
                    {/* 1. LA PISTA (Solida) */}
                    <group ref={trackRef}>
                        <SmartMap modelPath={mapPath} scale={1} />
                    </group>

                    {/* 2. I CHECKPOINT (Sensori Invisibili) */}
                    {/* Sostituiamo il <Gltf> statico con il nostro sistema intelligente */}
                    {checkpointPath && (
                        <CheckpointSystem 
                            url={checkpointPath} 
                            onCheckpointTrigger={handleCheckpoint} 
                        />
                    )}

                    {/* 3. I VEICOLI */}
                    {/* Nota: Non serve più passare handleCheckpoint al veicolo, perché ora è il box che rileva il veicolo, non viceversa */}
                    <group position={[0, 10, 0]} ref={isBike ? bikeRef : kartRef}>
                        {isBike ? (
                            <InsideDriftBike 
                                characterConfig={character.modelConfig}
                                vehicleConfig={vehicle} 
                                START_POS={start_pos}
                                // onCheckpoint={handleCheckpoint} <--- NON SERVE PIU' QUI (se hai rimosso il raycast)
                                trackRef={trackRef} 
                            />
                        ) : (
                            <OutsideDriftKart 
                                characterConfig={character.modelConfig}
                                vehicleConfig={vehicle} 
                                START_POS={start_pos}
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
								ref={kartRef}
                            />
                        )}
                    </group>

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
                        />
                    </group>
					{/* <WaypointRecorder kartRef={isBike ? bikeRef : kartRef} isRecording={true} /> */}
                </Physics>
            </Canvas>
        </div>
    )
}