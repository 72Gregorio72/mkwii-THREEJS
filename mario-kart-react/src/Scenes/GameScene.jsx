import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Environment, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import { WaypointRecorder } from '../Bot/WaypointRecorder'
import trackWaypoints from '../Bot/Waypoints/DaisyCircuit.json'

const TOTAL_LAPS = 3;

/**
 * Componente che gestisce i Box Collider dei Checkpoint
 * Carica il GLB, e per ogni oggetto crea un'area sensibile (Sensor)
 */
function CheckpointSystem({ url, onCheckpointTrigger }) {
    const { scene } = useGLTF(url);

    const sensors = useMemo(() => {
        const boxes = [];
        console.log("📂 INIZIO ANALISI GLB CHECKPOINT:", url);
        
        scene.traverse((child) => {
            // Logga ogni singolo oggetto trovato nel file
            if (child.isMesh) {
                const rawName = child.name;
                // Pulisce il nome: tiene solo i numeri. Es: "Cube.001" -> "001" -> 1
                const numberOnly = rawName.replace(/[^0-9]/g, ''); 
                const id = parseInt(numberOnly);

                console.log(`   Found Mesh: "${rawName}" -> ID estratto: ${id}`);
                
                if (!isNaN(id)) {
                    boxes.push({
                        id: id,
                        position: child.position,
                        rotation: child.rotation,
                        scale: child.scale,
                        geometry: child.geometry
                    });
                } else {
                    console.warn(`   ⚠️ IGNORATO: "${rawName}" non contiene numeri validi.`);
                }
            }
        });

        console.log(`✅ TOTALE SENSORI CREATI: ${boxes.length}`);
        // Ordiniamo per sicurezza (1, 2, 3...)
        return boxes.sort((a, b) => a.id - b.id);
    }, [scene, url]);

    return (
        <group>
            {sensors.map((box, index) => (
                <RigidBody
					key={index} 
					type="fixed" 
					colliders="trimesh" // Assicurati che sia 'cuboid' o 'trimesh'
					sensor={true} 
					position={box.position}
					rotation={box.rotation}
					scale={box.scale}
					onIntersectionEnter={(payload) => {
						// --- DEBUG TOTALE ---
						// Stampiamo chiunque entri, così capiamo se il sensore funziona
						console.log("💥 QUALCOSA HA TOCCATO IL CHECKPOINT", box.id);
						console.log("   --> Oggetto:", payload.other.rigidBodyObject?.name);

						// Se l'oggetto si chiama "kart" (come abbiamo impostato sopra), conta il punto
						if (payload.other.rigidBodyObject?.name === 'kart') {
							console.log("✅ È IL KART! VALIDO!");
							onCheckpointTrigger(box.id);
						}
						
						// ALTERNATIVA DI SICUREZZA: 
						// Se non leggi il nome, scommenta la riga sotto per accettare TUTTO per ora:
						// onCheckpointTrigger(box.id);
					}}
				>
                    {/* Visualizzazione DEBUG: Cubo semitrasparente Rosso */}
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
                                // onCheckpoint={handleCheckpoint} <--- NON SERVE PIU' QUI
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
								ref={kartRef}
                            />
                        )}
                    </group>

					{/* === 4. IL BOT (Nemico) === */}
                    <group position={[0, 10, 0]}>
                         <OutsideDriftKart 
                            // Puoi usare lo stesso modello o uno diverso
                            characterConfig={character.modelConfig} 
                            vehicleConfig={vehicle} 
                            
                            // IMPORTANTE: Spostalo leggermente di lato per non spawnare dentro di te!
                            START_POS={[start_pos[0] + 3, start_pos[1], start_pos[2]]} 
                            
                            trackRef={trackRef}
                            trackConfig={selectedTrack}
                            
                            // --- LOGICA BOT ---
                            isBot={true}              // Attiva l'IA
                            waypoints={trackWaypoints} // Passagli i 732 punti
                            
                            // Opzionale: Rendilo un po' più lento del giocatore per testare
                            SETTINGS={{
                                maxSpeed: 35,         // Un po' meno del max (40)
                                acceleration: 0.20,
                                turnSpeed: 0.8,
                                // ... copia gli altri valori di default se servono
                            }}
                        />
                    </group>
					{/* <WaypointRecorder kartRef={isBike ? bikeRef : kartRef} isRecording={true} /> */}
                </Physics>
            </Canvas>
        </div>
    )
}