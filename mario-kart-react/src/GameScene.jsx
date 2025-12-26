import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import { SmartMap } from './Tracks/SmartMap'
import { OutsideDriftKart } from './components/OutsideDriftKart'
import { InsideDriftBike } from './components/InsideDriftBike'

export function GameScene({ character, vehicle, mapPath, onBack }) {
    
    // Safety Check: se non c'è veicolo selezionato, non crashare
    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    const isBike = vehicle.isBike;

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white' }}>
                <button onClick={onBack}>Exit Race</button>
            </div>

            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                <Environment preset="city" />

                <Physics>
                    <SmartMap modelPath={mapPath} scale={1} />

                    <group position={[0, 2, 0]}>
                        {isBike ? (
                            <InsideDriftBike 
                                // character.modelConfig contiene { file: "...", scale: ... }
                                characterConfig={character.modelConfig}
                                // vehicle contiene TUTTO l'oggetto del database
                                vehicleConfig={vehicle} 
                            />
                        ) : (
                            <OutsideDriftKart 
                                characterConfig={character.modelConfig}
                                vehicleConfig={vehicle} 
                            />
                        )}
                    </group>
                </Physics>
            </Canvas>
        </div>
    )
}