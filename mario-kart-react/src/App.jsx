import React, { useState } from 'react'
import { Characters } from './components/Data'
import { CharacterSelection } from './CharacterSelection'
import { VehicleSelection } from './VehicleSelection'
import { GameScene } from './GameScene' // Import the new component

export default function App() {
    const [MenuState, setMenuState] = useState(0)
    
    // State for selections
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [SelectedVehicle, setSelectedVehicle] = useState(null)
    
    // Data source
    const [availableCharacters, ] = useState(Characters)

    return (
        <>
            {/* STATE 0: Character Selection */}
            {MenuState === 0 && (
                <CharacterSelection 
                    setMenuState={setMenuState} 
                    setSelectedCharacter={setSelectedCharacter}
                    availableCharacters={availableCharacters}
                />
            )}

            {/* STATE 1: Vehicle Selection */}
            {MenuState === 1 && (
                <VehicleSelection 
                    setMenuState={setMenuState} 
                    selectedCharacter={SelectedCharacter}
                    // Pass the setter so we save the vehicle
                    setSelectedVehicle={setSelectedVehicle} 
                />
            )}

            {/* STATE 2: The Game (Map Spawn) */}
            {MenuState === 2 && (
                <GameScene 
                    character={SelectedCharacter}
                    vehicle={SelectedVehicle}
                    // Load the specific map you requested
                    mapPath="./LuigiCircuit_colliders.glb" 
                    onBack={() => setMenuState(0)}
                />
            )}
        </>
    )
}

{/*
			<>
		 <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
			<ambientLight intensity={3} />
			<pointLight position={[10, 10, 10]} intensity={1} castShadow />
			<Physics>
				 < RacerModel
					characterConfig={SelectedCharacter}
					steer={0}
					drift={0}
					debug={true}
					position={[0, 1, 0]}
					key={SelectedCharacter.id}
				/>
				 <OrbitControls />
				    < OutsideDriftKart
					position={[0, 1, 0]}
					scale={0.01}
					charModel={Mario}
					vehicleModel={StandardKartM}
					/>
				< OutsideDriftKart
					position={[0, 1, 0]}
					scale={0.01}
					charModel={Mario}
					bikeModel={StandardKartM}
					/>
				<Environment preset="sunset" />
				<SmartMap 
					modelPath="/LuigiCircuit_colliders.glb" 
					scale={1} 
				/>
			</Physics>
		</Canvas> 
			
		</>*/}