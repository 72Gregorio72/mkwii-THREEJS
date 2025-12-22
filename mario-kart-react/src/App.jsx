import React, { useState, useRef } from 'react'
import { Physics } from '@react-three/rapier'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'

// --- IMPORTS DEI COMPONENTI FISICI ---
import { SmartMap } from './Tracks/StartMap'
import { OutsideDriftKart } from './components/OutsideDriftKart'
import { InsideDriftBike } from './components/InsideDriftBike'

// --- IMPORTS DEI MODELLI 3D ---
import { Mario } from './models/Mario'
import { FunkyKong } from './models/Funky_kong'
import { StandardKartM } from './models/StandardKartM'
import { FlameRunner } from './models/FlameRunner'
import { FlameFlyer } from './models/Flame_flyer'

import { CharacterSelection } from './CharacterSelection'

// ==========================================
// 1. DATI DI GIOCO (DATABASE)
// ==========================================

const Characters = [
	{ name: 'Mario', sprite: './sprites/MarioMKW.png', model: <Mario scale={0.008} position={[0, -0.5, 0]} isSelection={true} /> },
	{ name: 'Funky Kong', sprite: './sprites/FunkyKong.png', model: <FunkyKong scale={0.008} position={[0, -0.5, 0]} /> }
]

const Veicles = [
	{ name: 'Standard Kart M', sprite: './sprites/StandardKartM.png', car: 'outsideKart', model: <StandardKartM scale={0.008} position={[0, -0.5, 0]} /> },
	{ name: 'Flame Runner', sprite: './sprites/FlameRunner.png', car: 'insideBike',model: <FlameRunner scale={0.008} position={[0, -0.5, 0]} /> },
	{ name: 'Flame Flyer', sprite: './sprites/FlameFlyer.png', car: 'outsideKart',model: <FlameFlyer scale={0.008} position={[0, -0.5, 0]} /> }
]

const Tracks = [
	{ name: 'Start Map', sprite: './sprites/StartMap.png', model: <SmartMap /> }
]

export default function App() {

	const [MenuState, setMenuState] = useState(0)

	const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
	const [SelectedVeicle, setSelectedVeicle] = useState(Veicles[0])
	const [SelectedTrack, setSelectedTrack] = useState(Tracks[0])
	const [availableCharacters, ] = useState(Characters)

	

	return (
		MenuState === 0 ? <CharacterSelection 
							setMenuState={setMenuState} 
							setSelectedCharacter={setSelectedCharacter}
							availableCharacters={availableCharacters}
							/> :
		MenuState === 1 ? console.log('Selected Character:', SelectedCharacter.name):
		null
	)
}