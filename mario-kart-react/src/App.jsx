import React, { useState, useEffect } from 'react'
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
import { MainMenu } from './Scenes/MainMenu.jsx'

// Creiamo un piccolo componente per la Home
const TitleScreen = () => {
    const navigate = useNavigate();
    // Stato per gestire l'avvio e l'animazione
    const [isStarting, setIsStarting] = useState(false);

    // Funzione per navigare al menu
    const handleStart = () => {
        // Evita attivazioni multiple se è già in corso l'avvio
        if (isStarting) return;

        setIsStarting(true);

        // Aspetta 500ms (mezzo secondo) per mostrare l'animazione prima di cambiare pagina
        setTimeout(() => {
            navigate('/menu');
        }, 1000);
    };

    // Aggiunge un listener per la tastiera quando il componente viene montato
    useEffect(() => {
        const handleKeyDown = (e) => {
            handleStart();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isStarting, navigate]); // Aggiunto isStarting alle dipendenze

    return (
        <div 
            onClick={handleStart}
            className="w-screen h-screen cursor-pointer flex flex-col items-center justify-end pb-16 relative overflow-hidden"
        >
            {/* Immagine di sfondo */}
            {/* Nota: Ho reimpostato bg-cover come richiesto in precedenza per coprire tutto lo schermo */}
            <div 
                className="w-screen h-screen bg-white bg-contain bg-center bg-no-repeat flex flex-col items-center justify-end pb-20"
                style={{ backgroundImage: "url('/sprites/TitleScreen.jpg')" }}
            />

            {/* Scritta lampeggiante */}
            <h1 
                className={`
                    z-10 font-bold text-4xl tracking-wider font-sans uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,1)]
                    transition-all duration-300 ease-out
                    ${isStarting 
                        ? 'scale-130 text-gray-400 opacity-75'  // Stile quando premuto: ingrandisce, diventa giallo, opacità fissa
                        : 'text-white animate-pulse'                 // Stile normale: bianco che lampeggia
                    }
                `}
            >
                Press A button
            </h1>
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
                <div style={{ minHeight: '100vh', backgroundColor: '#87CEEB' }}>
                    
                    <Routes>
                        <Route path="/" element={<TitleScreen />} />

                        {/* HOME PAGE */}
                        <Route path="/menu" element={<MainMenu />} />

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