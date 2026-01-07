import React, { useState } from 'react'
import { Characters } from './components/Data'
import { CharacterSelection } from './Scenes/CharacterSelection'
import { VehicleSelection } from './Scenes/VehicleSelection'
import { TrackSelection } from './Scenes/TrackSelection'
import { GameScene } from './Scenes/GameScene' // Import the new component

export default function App() {

    const [MenuState, setMenuState] = useState(-1)
    
    // State for selections
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [SelectedVehicle, setSelectedVehicle] = useState(null)
	const [SelectedTrack, setSelectedTrack] = useState(null)
    // Data source
    const [availableCharacters, ] = useState(Characters)

    return (
        <div style={{ backgroundImage: "url(/sprites/skybox.jpg)", minHeight: '100vh' }}>

			{MenuState === -1 && (
				<button onClick={() => setMenuState(0)}>Character Selection</button>
			)}

            {MenuState === 0 && (
                <CharacterSelection 
                    setMenuState={setMenuState} 
                    setSelectedCharacter={setSelectedCharacter}
                    availableCharacters={availableCharacters}
                />
            )}

            {MenuState === 1 && (
                <VehicleSelection 
                    setMenuState={setMenuState} 
                    selectedCharacter={SelectedCharacter}
                    // Pass the setter so we save the vehicle
                    setSelectedVehicle={setSelectedVehicle} 
                />
            )}

			{MenuState === 2 && (
				<TrackSelection
					setMenuState={setMenuState}
					setSelectedTrack={setSelectedTrack}
				/>
			)}

            {MenuState === 3 && (
				<GameScene 
					character={SelectedCharacter}
					vehicle={SelectedVehicle}
					
					// Passiamo i dati dinamici dalla pista selezionata
					mapPath={SelectedTrack.file} 
					checkpointPath={SelectedTrack.checkpoints} // <--- NUOVO
					maxCheckpoints={SelectedTrack.maxCheckpoints || 1} // <--- NUOVO
					start_pos={SelectedTrack.startPos}
					selectedTrack={SelectedTrack}
					onBack={() => setMenuState(0)}
				/>
			)}
		</div>
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