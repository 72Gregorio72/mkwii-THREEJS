import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Characters, VEHICLE_DATABASE, Tracks, grandPrixList } from './components/Data'
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
import { SinglePlayer } from './Scenes/SinglePlayer.jsx'
import { GrandPrix } from './Scenes/GrandPrix.jsx'
import { WinScene } from './Scenes/WinScene.jsx'
import { Friends } from './Scenes/Friends.jsx'


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
    
    // State for Grand Prix
    const [selectedGrandPrix, setSelectedGrandPrix] = useState(grandPrixList[0])

    // Room state
    const [roomCode, setRoomCode] = useState(null)
    const [roomId, setRoomId] = useState(null)
    const [isHost, setIsHost] = useState(false)

    const [ccsSpeed, setCcsSpeed] = useState(40)

    const [ hostLeft, setHostLeft ] = useState(false) 

    const [isTimeTrial, setIsTimeTrial] = useState(false)
    const [isGrandPrix, setIsGrandPrix] = useState(false)

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUsername] = useState(null);

    const [ raceResults, setRaceResults ] = useState([SelectedCharacter, Characters[9], Characters[16], Characters[3], Characters[4], Characters[5], Characters[6], Characters[7], Characters[8], Characters[1], Characters[10], Characters[11]]);

    useEffect(() => {
        const fetchLoginStatus = async () => {
            if (!socket || !socket.id) return;
            
            try {
                const response = await fetch(`/api/getIsLoggedIn?socketId=${socket.id}`);
                const text = await response.text();


                const user = text ? JSON.parse(text) : null;

                if (user && user.isLoggedIn) {
                    setIsLoggedIn(true);
                    setUsername(user.username);
                } else {
                    setIsLoggedIn(false);
                    setUsername(null);
                }
            } catch (error) {
                console.error('Errore nel recupero dello stato di login:', error);
            }
        };

        socket.on('connect', fetchLoginStatus);

        if (socket.connected) {
            fetchLoginStatus();
        }

        return () => {
            socket.off('connect', fetchLoginStatus);
        };
    }, []);

    const handleLogin = (user) => {
        if(user) {
            setUsername(user);
        }
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: userName }),
            });
            
            sessionStorage.removeItem('accessToken');
            
            if (socket) {
                socket.disconnect();
                socket.connect();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
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

    const handleCreateRoom = (code, username) => {
        setRoomCode(code);
        setIsHost(true);
        socket.emit('create_room', { roomCode: code, username: username });
    };

    const handleJoinRoom = (code, username) => {
        setRoomCode(code);
        setIsHost(false);
        socket.emit('join_room', { roomCode: code, username: username });
    };

    const resetRoomState = () => {
        setRoomCode('');
        setRoomId('');
        setIsHost(false);
        setSelectedTrack(Tracks['Daisy Circuit']);
        setSelectedCharacter(Characters[0]);
        setSelectedVehicle(VEHICLE_DATABASE.StandardKartS);
        setIsGrandPrix(false);
        setIsTimeTrial(false);
    };

    return (
        <AudioProvider>
            <BrowserRouter>
                {/* Il container principale */}
                <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
                    
                    <Routes>
                        <Route path="/" element={<TitleScreen />} />

                        <Route path="/menu" element={<MainMenu loggedIn={isLoggedIn} hostLeft={hostLeft} setHostLeft={setHostLeft} />} /> {/* mettere true loggedIn per testare le gare */}

                        <Route path="/room" element={
                            <RoomSelection 
                                onCreateRoom={handleCreateRoom}
                                onJoinRoom={handleJoinRoom}
                                socket={socket}
                                setSelectedTrack={setSelectedTrack}
                                username={userName}
                                loggedIn={isLoggedIn}
                            />
                        } />
                        
                        <Route path="/info" element={
                            <InfoAndTos />
                        } />

                        <Route path="/register" element={
                            <Register onRegistrationSuccess={handleLogin} setUsername={setUsername} socket={socket}/>
                        } />

                        <Route path="/login" element={
                            <Login onLoginSuccess={handleLogin} setUsername={setUsername} socket={socket}/>
                        } />

                        <Route path="/profile" element={
                            <Profile setLoggedIn={handleLogout} userName={userName} isLoggedIn={isLoggedIn} setUsername={setUsername} socket={socket}/>
                        } />

                        <Route path="/friends" element={
                            <Friends userName={userName}/>
                        }/>

                        <Route path="/character" element={
                            <CharacterSelection 
                                onNext={() => {}} 
                                setSelectedCharacter={setSelectedCharacter}
                                availableCharacters={availableCharacters}
                            />
                        } />

                        <Route path="/single_player" element={
                            <SinglePlayer isLoggedIn={isLoggedIn} setIsTimeTrial={setIsTimeTrial} setCcs={setCcsSpeed} setIsGrandPrix={setIsGrandPrix} isGrandPrix={isGrandPrix}
                            />
                        } />

						<Route path="/grandprix" element={
							<GrandPrix setSelectedGrandPrix={setSelectedGrandPrix}/>
						} />

                        <Route path="/vehicle" element={
                            <VehicleSelection 
                                selectedCharacter={SelectedCharacter}
                                setSelectedVehicle={setSelectedVehicle}
                                isGrandPrix={isGrandPrix}
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
                                resetRoomState={resetRoomState}
                                setHostLeft={setHostLeft}
                            />
                        } />

                        <Route path="/endGrandPrix" element={
                            <WinScene selectedCup={selectedGrandPrix} raceResults={raceResults} socket={socket} setRaceResults={setRaceResults}/>
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
                                        isTimeTrial={isTimeTrial}
                                        ccs={ccsSpeed}
										username={userName}
                                        setIsTimeTrial={setIsTimeTrial}
                                        selectedGrandPrix={selectedGrandPrix.name}
                                        isGrandPrix={isGrandPrix}
                                        setIsGrandPrix={setIsGrandPrix}
                                        setRaceResults={setRaceResults}
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