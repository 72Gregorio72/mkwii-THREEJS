import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom' // Importa React Router
import { Characters } from './components/Data'
import { CharacterSelection } from './Scenes/CharacterSelection'
import { VehicleSelection } from './Scenes/VehicleSelection'
import { TrackSelection } from './Scenes/TrackSelection'
import { GameScene } from './Scenes/GameScene'
import { AudioProvider } from './audio/AudioManager'
import { socket } from './multiplayer/socket.js'
import { VEHICLE_DATABASE } from './components/Data'
import { Tracks } from './components/Data'

// Creiamo un piccolo componente per la Home
const MainMenu = () => {
    const navigate = useNavigate();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', gap: '20px' }}>
            <h1>Mario Kart Three.js</h1>
            <button onClick={() => navigate('/character')}>Character Selection</button>
            <button onClick={() => navigate('/game')}>Direct to GameScene (Testing)</button>
        </div>
    );
};

export default function App() {
    
    // State for selections
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [SelectedVehicle, setSelectedVehicle] = useState(VEHICLE_DATABASE.StandardKartS)
    const [SelectedTrack, setSelectedTrack] = useState(Tracks['Daisy Circuit'])
    
    // Data source
    const [availableCharacters, ] = useState(Characters)

    return (
        <AudioProvider>
            <BrowserRouter>
                {/* MODIFICA QUI: Sfondo totalmente azzurro (#87CEEB è SkyBlue) */}
                <div style={{ minHeight: '100vh', backgroundColor: '#3dacf7' }}>
                    
                    <Routes>
                        {/* HOME PAGE */}
                        <Route path="/" element={<MainMenu />} />

                        {/* SELEZIONE PERSONAGGIO */}
                        <Route path="/character" element={
                            <CharacterSelection 
                                onNext={() => {}} 
                                setSelectedCharacter={setSelectedCharacter}
                                availableCharacters={availableCharacters}
                            />
                        } />

                        {/* SELEZIONE VEICOLO */}
                        <Route path="/vehicle" element={
                            <VehicleSelection 
                                selectedCharacter={SelectedCharacter}
                                setSelectedVehicle={setSelectedVehicle} 
                            />
                        } />

                        {/* SELEZIONE PISTA */}
                        <Route path="/track" element={
                            <TrackSelection
                                setSelectedTrack={setSelectedTrack}
                            />
                        } />

                        {/* GIOCO */}
                        <Route path="/game" element={
                            <GameScene
                                socket={socket}
                                character={SelectedCharacter}
                                vehicle={SelectedVehicle}
                                mapPath={SelectedTrack.file} 
                                checkpointPath={SelectedTrack.checkpoints}
                                maxCheckpoints={SelectedTrack.maxCheckpoints || 1}
                                start_pos={SelectedTrack.startPos}
                                selectedTrack={SelectedTrack}
                            />
                        } />
                    </Routes>

                </div>
            </BrowserRouter>
        </AudioProvider>
    )
}