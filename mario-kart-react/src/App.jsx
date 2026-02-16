import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Characters, VEHICLE_DATABASE, Tracks } from './components/Data'
import { CharacterSelection } from './Scenes/CharacterSelection'
import { VehicleSelection } from './Scenes/VehicleSelection'
import { TrackSelection } from './Scenes/TrackSelection'
import { InfoAndTos } from './Scenes/InfoAndTos.jsx'
import { GameScene } from './Scenes/GameScene'
import { RoomSelection } from './Scenes/RoomSelection'
import { WaitingRoom } from './Scenes/WaitingRoom'
import { AudioProvider, useAudio, AUDIO_SFX } from './audio/AudioManager'
import { socket } from './multiplayer/socket.js'
import { MainMenu } from './Scenes/MainMenu.jsx'
import { Register } from './Scenes/Register.jsx'
import { Login } from './Scenes/Login.jsx'
import { Profile } from './Scenes/ProfilePage.jsx'


// --- COMPONENTE TITLE SCREEN (SCHERMATA INIZIALE) ---
const TitleScreen = () => {
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);
    const { changeTrack, enableSmoothLoop, playSfx } = useAudio();

    // Setup Audio
    useEffect(() => {
        changeTrack('MENU', 2000);
        enableSmoothLoop();
    }, [changeTrack, enableSmoothLoop]);
    
    // Gestione Start
    const handleStart = () => {
        if (isStarting) return;
        
        setIsStarting(true);
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);

        // Attesa breve prima di cambiare pagina
        setTimeout(() => {
            navigate('/menu');
        }, 600);
    };

    // Listener Tastiera
    useEffect(() => {
        const handleKeyDown = () => {
            handleStart();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isStarting, navigate]);

    // Stile del testo (Bordo nero netto stile Mario Kart)
    const textStyle = {
        WebkitTextStroke: '1.5px black',
        textShadow: '3px 3px 0 #000'
    };

    return (
        <div 
            onClick={handleStart}
            // MODIFICA QUI: bg-white invece di bg-black per lo sfondo generale
            className="w-screen h-screen cursor-pointer flex flex-col items-center justify-end pb-20 relative overflow-hidden bg-white"
        >
            {/* INIEZIONE CSS PER ANIMAZIONE GHOST */}
            <style>{`
                @keyframes ghostRipple {
                    0% {
                        transform: scale(1);
                        opacity: 0.4;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
                .animate-ghost-ripple {
                    animation: ghostRipple 0.6s infinite ease-out;
                }
            `}</style>

           <div
                className="w-screen h-screen bg-white bg-contain bg-center bg-no-repeat flex flex-col items-center justify-end pb-20"
                style={{ backgroundImage: "url('/sprites/TitleScreen.jpg')" }}
            />

            <div className="relative z-10 flex justify-center items-center">
                
                {!isStarting && (
                    <h1 
                        className="absolute font-bold text-4xl tracking-wider font-sans uppercase text-white select-none whitespace-nowrap animate-ghost-ripple"
                        style={textStyle}
                    >
                        Press A button
                    </h1>
                )}

                <h1 
                    className={`
                        relative font-bold text-4xl tracking-wider font-sans uppercase text-white select-none whitespace-nowrap
                        transition-transform duration-100 ease-out
                        ${isStarting 
                            ? 'scale-110 opacity-100' // FEEDBACK
                            : 'animate-pulse'         // IDLE
                        }
                    `}
                    style={textStyle}
                >
                    Press A button
                </h1>
            </div>
        </div>
    );
};

// --- APP PRINCIPALE ---
export default function App() {
    
    // State for selections
    const [SelectedCharacter, setSelectedCharacter] = useState(Characters[0])
    const [SelectedVehicle, setSelectedVehicle] = useState(VEHICLE_DATABASE.StandardKartS)
    const [SelectedTrack, setSelectedTrack] = useState(Tracks['Daisy Circuit'])
    
    // Room state
    const [roomCode, setRoomCode] = useState(null)
    const [roomId, setRoomId] = useState(null)
    const [isHost, setIsHost] = useState(false)

    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    });

    const [userName, setUsername] = useState(() => {
        return sessionStorage.getItem('userName') || null; 
    });

    const handleLogin = (user) => {
        sessionStorage.setItem('isLoggedIn', 'true');
        if(user) {
            sessionStorage.setItem('userName', user);
            setUsername(user);
        }
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        sessionStorage.setItem('isLoggedIn', 'false');
        sessionStorage.removeItem('userName');
        setUsername(null);
        setIsLoggedIn(false);
    };

    // Data source
    const [availableCharacters, ] = useState(Characters)

    // Socket Room Listener
    useEffect(() => {
        if (!socket) return;
        const handleRoomState = (data) => {
            if (data.roomId) {
                setRoomId(data.roomId);
            }
        };
        socket.on('room_state', handleRoomState);
        return () => socket.off('room_state', handleRoomState);
    }, []);

    const handleCreateRoom = (code) => {
        setRoomCode(code);
        setIsHost(true);
        socket.emit('create_room', { roomCode: code });
    };

    const handleJoinRoom = (code) => {
        setRoomCode(code);
        setIsHost(false);
        socket.emit('join_room', { roomCode: code });
    };

    return (
        <AudioProvider>
            <BrowserRouter>
                {/* Il container principale */}
                <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
                    
                    <Routes>
                        <Route path="/" element={<TitleScreen />} />

                        <Route path="/menu" element={<MainMenu loggedIn={isLoggedIn} />} /> {/* mettere true loggedIn per testare le gare */}

                        <Route path="/room" element={
                            <RoomSelection 
                                onCreateRoom={handleCreateRoom}
                                onJoinRoom={handleJoinRoom}
                                socket={socket}
                                setSelectedTrack={setSelectedTrack}
                            />
                        } />
                        
                        <Route path="/info" element={
                            <InfoAndTos />
                        } />

                        <Route path="/register" element={
                            <Register onRegistrationSuccess={handleLogin} setUsername={setUsername}/>
                        } />

                        <Route path="/login" element={
                            <Login onLoginSuccess={handleLogin} setUsername={setUsername}/>
                        } />

                        <Route path="/profile" element={
                            <Profile setLoggedIn={handleLogout} userName={userName} isLoggedIn={isLoggedIn}/>
                        } />

                        <Route path="/character" element={
                            <CharacterSelection 
                                onNext={() => {}} 
                                setSelectedCharacter={setSelectedCharacter}
                                availableCharacters={availableCharacters}
                            />
                        } />

                        <Route path="/vehicle" element={
                            <VehicleSelection 
                                selectedCharacter={SelectedCharacter}
                                setSelectedVehicle={setSelectedVehicle} 
                            />
                        } />

                        <Route path="/track" element={
                            <TrackSelection
                                setSelectedTrack={setSelectedTrack}
                                roomCode={roomCode}
                                isHost={isHost}
                                socket={socket}
                            />
                        } />

                        <Route path="/waiting" element={
                            <WaitingRoom
                                roomCode={roomCode}
                                roomId={roomId}
                                isHost={isHost}
                                socket={socket}
                                selectedTrack={SelectedTrack}
                                setSelectedTrack={setSelectedTrack}
                            />
                        } />

                        {['/game', '/debug'].map((path) => (
                            <Route 
                                key={path}
                                path={path} 
                                element={
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
                                        roomId={roomId}
                                        isHostProp={isHost}
                                    />
                                } 
                            />
                        ))}
                    </Routes>

                </div>
            </BrowserRouter>
        </AudioProvider>
    )
}