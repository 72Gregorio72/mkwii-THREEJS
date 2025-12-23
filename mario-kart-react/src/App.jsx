import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { CharacterSelection } from './CharacterSelection'
import { RacerModel } from './models/RacerModel'
import { Characters } from './components/Data'
import { VehicleSelection } from './VehicleSelection'

export default function App() {
    const [MenuState, setMenuState] = useState(0)
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [availableCharacters, ] = useState(Characters)

    return (
        <>
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
				/>
            )}
        </>
    )
}