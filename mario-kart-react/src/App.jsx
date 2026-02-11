import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Characters } from './components/Data'
import { CharacterSelection } from './Scenes/CharacterSelection'
import { VehicleSelection } from './Scenes/VehicleSelection'
import { TrackSelection } from './Scenes/TrackSelection'
import { InfoAndTos } from './Scenes/InfoAndTos.jsx'
import { GameScene } from './Scenes/GameScene'
import { RoomSelection } from './Scenes/RoomSelection'
import { WaitingRoom } from './Scenes/WaitingRoom'
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
            <button onClick={() => navigate('/room')}>Multiplayer</button>
            <button onClick={() => navigate('/character')}>Solo Play</button>
            <button onClick={() => navigate('/game')}>Direct to GameScene (Testing)</button>
            <button onClick={() => navigate('/info')}>Privacy and TOS</button>
        </div>
    );
};

export default function App() {
    
    // State for selections
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [SelectedVehicle, setSelectedVehicle] = useState(VEHICLE_DATABASE.StandardKartS)
    const [SelectedTrack, setSelectedTrack] = useState(Tracks['Daisy Circuit'])
    
    // Room state
    const [roomCode, setRoomCode] = useState(null)
    const [isHost, setIsHost] = useState(false)
    
    // Data source
    const [availableCharacters, ] = useState(Characters)

    const handleCreateRoom = (code) => {
        setRoomCode(code);
        setIsHost(true);
        // Emit to server
        socket.emit('create_room', { roomCode: code });
    };

    const handleJoinRoom = (code) => {
        setRoomCode(code);
        setIsHost(false);
        // Emit to server
        socket.emit('join_room', { roomCode: code });
    };

    return (
        <AudioProvider>
            <BrowserRouter>
                {/* MODIFICA QUI: Sfondo totalmente azzurro (#87CEEB è SkyBlue) */}
                <div style={{ minHeight: '100vh', backgroundColor: '#3dacf7' }}>
                    
                    <Routes>
                        {/* HOME PAGE */}
                        <Route path="/" element={<MainMenu />} />

                        {/* ROOM SELECTION */}
                        <Route path="/room" element={
                            <RoomSelection 
                                onCreateRoom={handleCreateRoom}
                                onJoinRoom={handleJoinRoom}
                                socket={socket}
                                setSelectedTrack={setSelectedTrack}
                            />
                        } />
						
						{/* INFO AND TOS */}
                        <Route path="/info" element={
                            <InfoAndTos />
                        } />

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
                                roomCode={roomCode}
                                isHost={isHost}
                                socket={socket}
                            />
                        } />

                        {/* WAITING ROOM */}
                        <Route path="/waiting" element={
                            <WaitingRoom
                                roomCode={roomCode}
                                isHost={isHost}
                                socket={socket}
                                selectedTrack={SelectedTrack}
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
                                roomCode={roomCode}
                                isHostProp={isHost}
                            />
                        } />
                    </Routes>

                </div>
            </BrowserRouter>
        </AudioProvider>
    )
}