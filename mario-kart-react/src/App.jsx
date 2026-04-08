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

import { useUserStore, useGameStore, useGameDataStore, useRoomDataStore, useNotificationsStore } from './store.js'


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
    
    // States for Game from stores
    const userStore = useUserStore();
    const gameStore = useGameStore();
    const gameDataStore = useGameDataStore();
    const roomDataStore = useRoomDataStore();
    
    const {userName: userName, isLoggedIn: isLoggedIn} = useUserStore();
    const { setPendingRoomInvites } = useNotificationsStore();
    const {SelectedCharacter: SelectedCharacter, SelectedTrack: SelectedTrack, selectedGrandPrix: selectedGrandPrix} = useGameDataStore();

    // State for results
    const [ raceResults, setRaceResults ] = useState([SelectedCharacter, Characters[9], Characters[16], Characters[3], Characters[4], Characters[5], Characters[6], Characters[7], Characters[8], Characters[1], Characters[10], Characters[11]]);

    // Data source
    const [availableCharacters] = useState(Characters)

    useEffect(() => {
        const fetchLoginStatus = async () => {
            if (!socket || !socket.id) return;
            
            try {
                const response = await fetch(`/api/getIsLoggedIn?socketId=${socket.id}`);
                const text = await response.text();

                const user = text ? JSON.parse(text) : null;

                // console.log({user});
                if (user && user.isLoggedIn) {
                    userStore.handleLogin(user.username);
                } else {
                    userStore.handleLogout();
                }
            } catch (error) {
                console.error('Errore nel recupero dello stato di login:', error);
            }
        };

        if (socket) {
            socket.disconnect();
            socket.connect();
        }

        socket.on('connect', () => {fetchLoginStatus()});

        return () => {
            socket.off('connect', fetchLoginStatus);
        };
    }, []);

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
        
        userStore.handleLogout();
    };

    // Socket Room Listener
    useEffect(() => {
        if (!socket) return;
        const handleRoomState = (data) => {
            if (data.roomId) {
                roomDataStore.setRoomId(data.roomId);
            }
        };
        socket.on('room_state', handleRoomState);
        return () => socket.off('room_state', handleRoomState);
    }, []);

    useEffect(() => {
        if (!isLoggedIn || !userName) {
            setPendingRoomInvites(0);
            return;
        }

        let isMounted = true;
        const refreshPendingInvites = async () => {
            try {
                const response = await fetch(`/api/notifications?username=${userName}`);
                if (response.status === 404) {
                    if (isMounted) setPendingRoomInvites(0);
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch notifications');
                }
                const data = await response.json();
                if (isMounted) {
                    setPendingRoomInvites(Array.isArray(data) ? data.length : 0);
                }
            } catch (error) {
                console.error('Error refreshing pending invites:', error);
            }
        };
        refreshPendingInvites();
        const intervalId = setInterval(refreshPendingInvites, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isLoggedIn, userName, setPendingRoomInvites]);

    const handleCreateRoom = (code, username) => {
        roomDataStore.setRoomCode(code);
        gameStore.setIsHost(true);
        socket.emit('create_room', { roomCode: code, username: username });
    };

    const handleJoinRoom = (code, username) => {
        roomDataStore.setRoomCode(code);
        gameStore.setIsHost(false);
        roomDataStore.setRoomCreated(true);
        socket.emit('join_room', { roomCode: code, username: username });
    };

    const resetRoomState = () => {
        roomDataStore.setRoomCode('');
        roomDataStore.setRoomId('');
        gameDataStore.setSelectedTrack(Tracks['Daisy Circuit']);
        gameDataStore.setSelectedCharacter(Characters[0]);
        gameDataStore.setSelectedVehicle(VEHICLE_DATABASE.StandardKartS);
        gameStore.setIsGrandPrix(false);
        gameStore.setIsTimeTrial(false);
        gameStore.setIsHost(false);
    };

    return (
        <AudioProvider>
            <BrowserRouter>
                {/* Il container principale */}
                <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
                    
                    <Routes>
                        <Route path="/" element={<TitleScreen />} />

                        <Route path="/menu" element={<MainMenu />} />

                        <Route path="/room" element={
                            <RoomSelection 
                                onCreateRoom={handleCreateRoom}
                                onJoinRoom={handleJoinRoom}
                            />
                        } />
                        
                        <Route path="/info" element={
                            <InfoAndTos />
                        } />

                        <Route path="/register" element={
                            <Register logIn={(username) => {userStore.handleLogin(username)}}/>
                        } />

                        <Route path="/login" element={
                            <Login onLoginSuccess={(username) => {userStore.handleLogin(username)}} />
                        } />

                        <Route path="/profile" element={
                            <Profile 
                                setLoggedIn={handleLogout}
                                setUsername={(username) => {userStore.handleLogin(username)}}/>
                        } />

                        <Route path="/friends" element={
                            <Friends/>
                        }/>

                        <Route path="/character" element={
                            <CharacterSelection 
                                onNext={() => {}} 
                                availableCharacters={availableCharacters}
                                resetRoomState={resetRoomState}
                            />
                        } />

                        <Route path="/single_player" element={
                            <SinglePlayer />
                        } />

						<Route path="/grandprix" element={
							<GrandPrix />
						} />

                        <Route path="/vehicle" element={
                            <VehicleSelection resetRoomState={resetRoomState}/>
                        } />

                        <Route path="/track" element={
                            <TrackSelection />
                        } />

                        <Route path="/waiting" element={
                            <WaitingRoom
                                resetRoomState={resetRoomState}
                            />
                        } />

                        <Route path="/endGrandPrix" element={
                            <WinScene 
                                selectedCup={selectedGrandPrix}
                                raceResults={raceResults}
                                setRaceResults={setRaceResults}
                            />
                        } />

                        {['/game', '/debug'].map((path) => (
                            <Route 
                                key={path}
                                path={path} 
                                element={
                                    <GameScene
                                        mapPath={SelectedTrack.file} 
                                        checkpointPath={SelectedTrack.checkpoints}
                                        maxCheckpoints={SelectedTrack.maxCheckpoints || 1}
                                        start_pos={SelectedTrack.startPos}
                                        selectedTrack={SelectedTrack}
                                        selectedGrandPrix={selectedGrandPrix.name}
                                        setRaceResults={setRaceResults}
                                        resetRoomState={resetRoomState}
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