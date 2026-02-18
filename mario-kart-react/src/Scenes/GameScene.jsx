import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera, Stats, useGLTF } from '@react-three/drei'
import { useNavigate } from 'react-router-dom' // <--- 1. IMPORT ROUTING
import * as THREE from 'three'

// --- IMPORTS INTERNI ---
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
import { InsideDriftBike } from '../components/InsideDriftBike'
import { CheckpointSystem } from '../Race/CheckPointManager.jsx'
import { RaceManager } from '../Race/RaceManager.jsx'
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'
import { RoadWalls } from '../Tracks/RoadWalls.jsx'
import { GameHUD } from '../ui/GameHUD.jsx'
import { RaceResults } from '../ui/RaceResults.jsx'
import { LobbyScreen } from '../ui/LobbyScreen.jsx'
import { Minimap } from '../ui/Minimap.jsx'
import { ItemBoxesMap } from '../Items/ItemBoxes.jsx'
import { NetworkManager } from '../multiplayer/NetworkManager.jsx'
import { RemoteOpponent } from '../multiplayer/RemoteOpponent.jsx'
import { VEHICLE_DATABASE, Characters } from '../components/Data.jsx'
import { LightningAtmosphere } from '../components/effects/LightningAtmosphere.jsx'

// --- IMPORTS ITEMS ---
import { Banana } from '../Items/Banana';
import { GreenShell } from '../Items/GreenShell';
import { RedShell } from '../Items/RedShell';
import { BobOmb } from '../Items/BobOmb.jsx'
import { AudioListenerComponent } from '../audio/AudioListenerComponent.jsx';
import { useWebGLContext, useWebGLMemoryMonitor } from '../utils/WebGLContextManager.jsx';
import { gsap } from 'gsap'

const TOTAL_LAPS = 3;
const BOT_COUNT = 11; // 1 Player + 11 Bots = 12 Racers

// --- HELPERS ---

function WaypointsVisualizer({ waypoints, color = 'blue' }) {
	// Converti waypoints in Vector3 (gestisce sia formato [x,y,z] che {x,y,z})
	const points = waypoints.map(point => {
		if (Array.isArray(point)) {
			return new THREE.Vector3(point[0], point[1], point[2]);
		} else {
			return new THREE.Vector3(point.x, point.y, point.z);
		}
	});
	
	// Chiudi il loop: aggiungi il primo punto alla fine
	points.push(points[0].clone());
	
	const geometry = new THREE.BufferGeometry().setFromPoints(points);

	return (
		<group>
			{/* Linea continua tra i waypoints */}
			<line geometry={geometry}>
				<lineBasicMaterial color={color} linewidth={3} />
			</line>
			
			{/* Sfere sui punti waypoint (opzionale, più piccole) */}
			{waypoints.map((point, index) => {
				const pos = Array.isArray(point) 
					? [point[0], point[1], point[2]]
					: [point.x, point.y, point.z];
					
				return (
					<mesh key={index} position={pos}>
						<sphereGeometry args={[0.15, 6, 6]} />
						<meshBasicMaterial color={color} />
					</mesh>
				);
			})}
		</group>
	);
}

// Fallback matematico per la griglia se non esiste nel GLB
function getGridPosition(startPos, index) {
    const ROW_DIST = 3.5; 
    const COL_DIST = 2.5; 
    
    const row = Math.floor(index / 2);
    const isRight = index % 2 !== 0; 
    
    const xOffset = isRight ? COL_DIST : -COL_DIST;
    const zOffset = row * -ROW_DIST; 
    
    return [
        startPos[0] + xOffset,
        startPos[1], 
        startPos[2] + zOffset 
    ];
}

function CinematicCamera({ gameState, playerStartPos, playerStartRot }) {
    const { camera } = useThree();

    useFrame((_state, delta) => {
        if (gameState === 'INTRO') {
            camera.position.lerp(new THREE.Vector3(60, 100, 60), delta * 0.5);
            camera.lookAt(0, 0, 0);
        } else if (gameState === 'COUNTDOWN') {
            const offset = new THREE.Vector3(0, 3, -8); 
            const euler = new THREE.Euler(playerStartRot[0], playerStartRot[1] - Math.PI, playerStartRot[2]);
            offset.applyEuler(euler);

            const targetPos = new THREE.Vector3(
                playerStartPos[0] + offset.x,
                playerStartPos[1] + offset.y,
                playerStartPos[2] + offset.z
            );

            camera.position.lerp(targetPos, delta * 2.5); 
            
            const lookAtTarget = new THREE.Vector3(
                playerStartPos[0],
                playerStartPos[1] + 1.5,
                playerStartPos[2]
            );
            camera.lookAt(lookAtTarget);
        }
    });

    return null;
}

// Componente per gestire sicurezza WebGL
function WebGLSafetyManager() {
    useWebGLContext();
    useWebGLMemoryMonitor();
    return null;
}

// Componente per sincronizzare i bot solo dall'host
function BotSynchronizer({ socket, isHost, botRefs, remoteBots }) {
    const lastSendTime = useRef(0);

    useFrame(({ clock }) => {
        if (!socket || !isHost || remoteBots.length === 0) return;

        const now = clock.getElapsedTime();
        // Invio a 20Hz per i bot (più lento dei player per risparmiare banda)
        if (now - lastSendTime.current < 0.05) return;
        lastSendTime.current = now;

        // Invia posizioni di tutti i bot
        remoteBots.forEach(bot => {
            const botRef = botRefs.current[bot.id];
            if (!botRef || !botRef.current) return;

            try {
                const pos = botRef.current.translation();
                const rot = botRef.current.rotation();
                const vel = botRef.current.linvel();

                if (roomCode) {
                    socket.emit('bot_update', {
                        botId: bot.id,
                        position: { x: pos.x, y: pos.y, z: pos.z },
                        rotation: rot,
                        velocity: vel
                    });
                }
            } catch (error) {
                // Ignora errori (bot non ancora inizializzato)
            }
        });
    });

    return null;
}

// Hook per estrarre posizioni e rotazioni dai nodi "start_X" del GLB
function useGridPositions(url) {
    const { scene } = useGLTF(url || ""); // Gestione caso url nullo
    
    const gridData = useMemo(() => {
        if (!url) return { positions: {}, rotations: {} };

        const positions = {};
        const rotations = {};

        scene.traverse((obj) => {
            if (obj.name.startsWith('start_')) {
                const parts = obj.name.split('_');
                const index = parseInt(parts[1]);

                if (!isNaN(index)) {
                    positions[index] = [obj.position.x, obj.position.y, obj.position.z];
                    const euler = new THREE.Euler().setFromQuaternion(obj.quaternion);
                    rotations[index] = [euler.x, euler.y, euler.z];
                }
            }
        });
        return { positions, rotations };
    }, [scene, url]);

    return gridData;
}

// Funzione per generare configurazioni bot random e uniche
function generateBotConfigurations(botCount, playerCharacter, playerVehicle) {
    const usedCharacters = new Set([playerCharacter.id]);
    const usedVehicles = new Set([playerVehicle.name]);
    const botConfigs = [];

    // Crea copia shuffled di characters e vehicles
    const shuffledCharacters = [...Characters].sort(() => Math.random() - 0.5);
    const allVehicleNames = Object.keys(VEHICLE_DATABASE);
    const shuffledVehicles = [...allVehicleNames].sort(() => Math.random() - 0.5);

    for (let i = 0; i < botCount; i++) {
        // Trova un character non usato
        const availableChar = shuffledCharacters.find(c => !usedCharacters.has(c.id));
        if (!availableChar) break; // Non dovrebbe succedere con 24 characters e 11 bot

        usedCharacters.add(availableChar.id);

        // Trova un veicolo compatibile con il character e non usato
        let selectedVehicle = null;
        for (const vehicleName of shuffledVehicles) {
            if (!usedVehicles.has(vehicleName) && availableChar.veichles.includes(vehicleName)) {
                selectedVehicle = VEHICLE_DATABASE[vehicleName];
                usedVehicles.add(vehicleName);
                break;
            }
        }

        // Fallback: se non troviamo veicolo unico, prendi il primo compatibile
        if (!selectedVehicle) {
            const compatibleVehicle = availableChar.veichles[0];
            selectedVehicle = VEHICLE_DATABASE[compatibleVehicle];
        }

        botConfigs.push({
            character: availableChar,
            vehicle: selectedVehicle
        });
    }

    return botConfigs;
}

// --- MAIN COMPONENT ---

export function GameScene({ 
    socket, 
    character, 
    vehicle, 
    mapPath, 
    checkpointPath, 
    start_pos, 
    maxCheckpoints, 
    selectedTrack,
    roomCode = null,
    roomId = null,
    isHostProp = false
}) {
    // 3. HOOK DI NAVIGAZIONE
    const navigate = useNavigate();

    // 1. CARICAMENTO POSIZIONI DI PARTENZA (Grid)
    const { positions: gridPositions, rotations: gridRotations } = useGridPositions(selectedTrack?.gridpos);

    // Calculate player start position early (before useEffect hooks)
    const playerStartPos = gridPositions[12] || start_pos; 
    const playerStartRot = gridRotations[12] || [0, Math.PI / 2, 0];

    // Lobby state
    const [isInLobby, setIsInLobby] = useState(roomCode ? true : false);
    const [isHost, setIsHost] = useState(isHostProp);
    const [lobbyPlayers, setLobbyPlayers] = useState([]);

    // Genera configurazioni bot random e uniche (memoizzate per non ricambiarle ad ogni render)
    const botConfigurations = useMemo(() => {
        if (roomCode) return []; // Nessun bot in multiplayer
        return generateBotConfigurations(BOT_COUNT, character, vehicle);
    }, [roomCode, character, vehicle]);

    const [gameState, setGameState] = useState(roomCode ? 'LOBBY' : 'INTRO'); // Se no room, parte subito
    const [countdown, setCountdown] = useState(null);
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false);
    const [finishers, setFinishers] = useState([]); // Lista dei corridori che hanno finito in ordine

    const [networkItems, setNetworkItems] = useState([]);
    const itemIdCounter = useRef(0);

    const handleRequestSpawn = useCallback((type, position, velocity, extra = {}) => {
        const getCoords = (val) => {
            if (Array.isArray(val)) return val;
            if (val && typeof val === 'object') return [val.x || 0, val.y || 0, val.z || 0];
            return [0, 0, 0];
        };

        const posArray = getCoords(position);
        const velArray = getCoords(velocity);
        // ID univoco: timestamp + counter + random
        const localId = `local_${Date.now()}_${++itemIdCounter.current}_${Math.random().toString(36).substr(2, 5)}`;

        setNetworkItems(prev => [...prev, {
            id: localId,
            type,
            position: posArray,
            velocity: velArray,
            isLocal: true,
            ownerId: socket?.id || 'local',
            ...extra
        }]);

        // Invia al server solo se in multiplayer
        if (socket && roomCode) {
            socket.emit('spawn_item', { id: localId, type, position: posArray, velocity: velArray, ...extra });
        }
    }, [socket, roomCode]);

    const handleRequestRemove = useCallback((itemId) => {
        // Remove from local state immediately to prevent physics errors
        setNetworkItems(prev => prev.filter(item => item.id !== itemId));
        
        // Invia al server solo se in multiplayer
        if (socket && roomCode) socket.emit('remove_item', { itemId });
    }, [socket, roomCode]);

    const [onlinePlayers] = useState([]);

    // Calcola se la gara è effettivamente attiva per il movimento
    const isRaceActive = gameState === 'RACING' && !finished && !raceExited;

    // 2. SETUP STATI GARA
    const { initialRacersData, initialPositions } = useMemo(() => {
        const data = {};
        // Usa socket.id come chiave invece di 'player'
        data[socket.id] = { id: socket.id, lap: 1, nextCP: 1, score: 0, position: 1, name: character.name };
        const positions = [{ id: socket.id, position: 1 }]; // Player parte primo in multiplayer
        
        // In multiplayer (roomCode presente) non creiamo bot
        // In single player usiamo gli ID dei character dai botConfigurations
        if (!roomCode && botConfigurations.length > 0) {
            botConfigurations.forEach((botConfig, i) => {
                const botId = botConfig.character.id;
                data[botId] = { id: botId, lap: 1, nextCP: 1, score: 0, position: i + 2, name: botConfig.character.name };
                positions.push({ id: botId, position: i + 2 });
            });
        }

        return { initialRacersData: data, initialPositions: positions };
    }, [roomCode, botConfigurations, character]);

	const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));
	const startingGridPlayed = useRef(false);
	const introMusicPlayed = useRef(false);
	const isFinalLap = useRef(false);
    const introPlayed = useRef(false);

    const [positions, setPositions] = useState(initialPositions);
    const playerRank = positions.find(p => p.id === socket.id)?.position || 1;

    useEffect(() => {
        if (roomId) {
            window.history.replaceState(null, '', `/game?roomId=${roomId}`);
        }
    }, [roomId]);   

    useEffect(() => {
        const handleItemCollected = (e) => {
            const { racerId } = e.detail;
            
            if (racerId === socket.id) {
                playerRef.current?.triggerItemRoulette(playerRank);
            } else if (botRefs.current[racerId]) {
                // È un bot (usa character ID)
                const botRankInfo = positions.find(p => p.id === racerId);
                const botRank = botRankInfo ? botRankInfo.position : 6;
                botRefs.current[racerId].current?.triggerItemRoulette(botRank);
            }
        };

        window.addEventListener('item-collected', handleItemCollected);
        return () => window.removeEventListener('item-collected', handleItemCollected);
    }, [playerRank, positions]);

    useEffect(() => {
        if (!socket) return;

        const handleLeaderboard = (officialLeaderboard) => {
            // officialLeaderboard è l'array [{id, position}, ...] inviato dal server
            setPositions(officialLeaderboard);
        };

        socket.on('leaderboard_update', handleLeaderboard);
        return () => socket.off('leaderboard_update', handleLeaderboard);
    }, [socket]);

    // Lobby management
    useEffect(() => {
        if (!socket || !roomCode) return; // Solo se c'è una stanza

        // Check if this player is the host
        const handleRoomState = (data) => {
            // Solo aggiorna se è la stessa stanza
            if (data.roomCode === roomCode) {
                setLobbyPlayers(data.players || []);
                //console.log('Room state updated:', data);
            }
        };

        // When race starts
        const handleRaceStart = (data) => {
            // Solo se è la stessa stanza
            if (data.roomCode !== roomCode) return;
            
            console.log('Race starting');
            setIsInLobby(false);
            setGameState('INTRO');
            
            // Start intro animation
            if (!introPlayed.current) {
                introPlayed.current = true;
                gsap.fromTo(cameraTarget.current, 
                    { x: 0, y: 0, z: 0 }, 
                    { x: 0, y: 8, z: 0, duration: 5 }
                );

                const timeline = gsap.timeline({
                    onComplete: () => startCountdown()
                });

                timeline.to(cameraTarget.current, {
                    x: playerStartPos[0],
                    y: playerStartPos[1] + 2,
                    z: playerStartPos[2],
                    duration: 7,
                    ease: "power2.inOut",
                    delay: 5
                });
            }
        };

        // When game state changes
        const handleGameStateSync = (data) => {
            if (data.roomCode !== roomCode) return;
            
            setGameState(data.gameState);
            if (data.countdown !== undefined) {
                setCountdown(data.countdown);
            }
        };

        socket.on('room_state', handleRoomState);
        socket.on('race_start', handleRaceStart);
        socket.on('game_state_sync', handleGameStateSync);

        // Request initial room state
        socket.emit('request_room_state', { roomCode });

        return () => {
            socket.off('room_state', handleRoomState);
            socket.off('race_start', handleRaceStart);
            socket.off('game_state_sync', handleGameStateSync);
        };
    }, [socket, roomCode, playerStartPos]);

    // Handle start race button (host only)
    const handleStartRace = useCallback(() => {
        if (!socket || !isHost || !roomCode) return;

        // In multiplayer non creiamo bot, solo player reali
        //console.log('[Multiplayer] Starting race without bots');
        
        // Emit race start without bots
        socket.emit('start_race', { bots: [], roomCode });
    }, [socket, isHost, roomCode]);

    useEffect(() => {
        if (isInLobby || introPlayed.current) return;
            introPlayed.current = true;

            // Prima fase: camera iniziale panoramica (0-5 secondi)
            gsap.fromTo(cameraTarget.current, 
                { x: 0, y: 0, z: 0 }, 
                { x: 0, y: 8, z: 0, duration: 5 }
            );

            const timeline = gsap.timeline({
                onComplete: () => startCountdown()
            });

            // Seconda fase: avvicinamento al player (5-12 secondi = 7 secondi)
            timeline.to(cameraTarget.current, {
                x: playerStartPos[0],
                y: playerStartPos[1] + 2,
                z: playerStartPos[2],
                duration: 7,
                ease: "power2.inOut",
                delay: 5  // Inizia dopo la prima fase
            });
    }, []);

    const startCountdown = () => {
        setGameState('COUNTDOWN');
        const AUDIO_DURATION = 2000; 

        setTimeout(() => {
            let timer = 3;
            setCountdown(timer);
            playSfx(AUDIO_SFX.COUNTDOWN_RACE, 5);

            const interval = setInterval(() => {
                timer -= 1;
                if (timer > 0) {
                    setCountdown(timer);
                    playSfx(AUDIO_SFX.COUNTDOWN_RACE, 5);
                } else if (timer === 0) {
                    playSfx(AUDIO_SFX.FINISH_COUNTDOWN, 5);
                    setCountdown('START!');
                    setGameState('RACING');
                } else {
                    setCountdown(null);
                    clearInterval(interval);
                }
            }, 1000); // 1 secondo tra un numero e l'altro
            
        }, AUDIO_DURATION);
    };

    // 3. REFS & STATE
    // --- STATI UI E AUDIO ---
    const [uiLap, setUiLap] = useState(1);
    const [nextCheck, setNextCheck] = useState(1); 

    // --- REFS ---
    const racersData = useRef(initialRacersData);
    const trackRef = useRef();
    const checkpointPositionsRef = useRef({});
    const playerRef = useRef(); 
    const botRefs = useRef({});
    const onlinePlayersRef = useRef({});

    const opponentsDataRef = useRef({});

    // Inizializza refs per i bot dinamicamente
    useEffect(() => {
        // Solo in single player
        if (!roomCode && botConfigurations.length > 0) {
            botConfigurations.forEach((botConfig) => {
                const botId = botConfig.character.id;
                if (!botRefs.current[botId]) {
                    botRefs.current[botId] = React.createRef();
                }
            });
        }
    }, [roomCode, botConfigurations]);

    useEffect(() => {
        onlinePlayersRef.current = onlinePlayers.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
        }, {});
    }, [onlinePlayers]);

    // Stati Variabili
    const [opponents, setOpponents] = useState([]);

    // Arricchisci opponents con le icone dei character
    const opponentsWithIcons = useMemo(() => {
        return opponents.map(opp => {
            const char = Characters.find(c => c.id === opp.charId);
            return {
                ...opp,
                characterIcon: char?.icon || null
            };
        });
    }, [opponents]);

    const remoteRefMap = useRef({});

    useEffect(() => {
        // Inizializza refs per gli opponents remoti
        opponents.forEach(opp => {
            if (!remoteRefMap.current[opp.id]) {
                remoteRefMap.current[opp.id] = React.createRef();
            }
        });
    }, [opponents]);

    useEffect(() => {
        // Quando la lista degli avversari online cambia
        opponents.forEach(opp => {
            if (!racersData.current[opp.id]) {
                racersData.current[opp.id] = { 
                    id: opp.id, 
                    lap: 1, 
                    nextCP: 1, 
                    score: 0,
                    position: 99,
                    isRemote: true,
                    name: opp.character?.name || 'Unknown'
                };
            }
        });

        // Opzionale: pulizia se un giocatore esce
        const opponentIds = opponents.map(o => o.id);
        const botIds = botConfigurations.map(bc => bc.character.id);
        Object.keys(racersData.current).forEach(id => {
            if (id !== socket.id && !botIds.includes(id) && !opponentIds.includes(id)) {
                delete racersData.current[id];
            }
        });
    }, [opponents]);

    // 5. AUDIO & LOGICA DI GIOCO
    const { changeTrack, playSfx, stopMusic, setMusicPitch , playMusicOnce} = useAudio();
    const racingMusicStarted = useRef(false);
    
    useEffect(() => {
        if (gameState === 'INTRO' && !introMusicPlayed.current) {
            changeTrack('RACE_INTRO', 0, false);
            introMusicPlayed.current = true;
            return;
        }

        if (gameState === 'COUNTDOWN' && !startingGridPlayed.current) {
            playMusicOnce('STARTING_GRID', 0);
            startingGridPlayed.current = true;
            return;
        }
        if (gameState === 'INTRO' || gameState === 'COUNTDOWN') {
            return;
        }

        if (gameState !== 'RACING' || finished) {
            if (!finished) {
                setMusicPitch(1.0, 1.0, 300);
            }
            stopMusic();
            racingMusicStarted.current = false;
            return;
        }
        
        // Avvia la musica della gara solo una volta
        if (!racingMusicStarted.current && selectedTrack?.soundtrack) {
            stopMusic();
            changeTrack(selectedTrack.soundtrack, 0, true);
            racingMusicStarted.current = true;
        }
        
        // Non c'è più cleanup che chiama stopMusic durante RACING
    }, [selectedTrack, changeTrack, gameState, finished, stopMusic, setMusicPitch]);

    // Checkpoint Trigger
	const handleCheckpointTrigger = useCallback((hitIndex, racerId) => {
		if (!racerId || !racersData.current[racerId]) return;
		const racer = racersData.current[racerId];
		console.log(`[Checkpoint] Racer ${racerId} hit checkpoint ${hitIndex}, expected ${racer.nextCP}`);
		
		if (hitIndex === racer.nextCP && hitIndex !== 0) {
			racer.nextCP += 1;
			if (racerId === socket.id) setNextCheck(racer.nextCP);
		} 
		else if (hitIndex === 0 && racer.nextCP > maxCheckpoints) {
			racer.lap += 1;
			console.log(`[Checkpoint] Racer ${racerId} completed lap ${racer.lap - 1}, now on lap ${racer.lap}`);
			
			// Aggiorna UI se è il player
			if (racerId === socket.id) {
				setUiLap(racer.lap);
				
				// Invia lap aggiornato via socket
				if (roomCode) {
					socket.emit('update_lap', { lap: racer.lap });
				}
				
				if (racer.lap === 2) {
					playSfx(AUDIO_SFX.SECOND_LAP, 3);
				}
				else if (racer.lap === 3) {
					isFinalLap.current = true;
					playSfx(AUDIO_SFX.FINAL_LAP, 3);
					setMusicPitch(1.10, 1.10, 2000);
					setTimeout(() => {
						setMusicPitch(1.15, 1.15, 2000);
					}, 100);
				}
			}
			
			racer.nextCP = 1;
			
			// Check if racer finished the race
			if (racer.lap > TOTAL_LAPS) {
				// Add to finishers list
				setFinishers(prev => {
					// Check if already in the list
					if (prev.some(f => f.id === racerId)) return prev;
					
					const finishPosition = prev.length + 1;
					const finisherEntry = { 
						id: racerId, 
						position: finishPosition,
						finishTime: null,
						name: racer.name || 'Unknown'
					};
					
					return [...prev, finisherEntry];
				});
				
				if (racerId === socket.id) {
					setFinished(true);
					playSfx(AUDIO_SFX.FINISH_RACE, 3);
					stopMusic();
					if (racer.position === 1)
						changeTrack('FINISH_FIRST', 0, false);
					else if (racer.position >= 2 && racer.position <= 4)
						changeTrack('FINISH_SECOND_FOURTH', 0, false);
					else
						changeTrack('FINISH_FIFTH_TWELFTH', 0, false);
				}
				
				// Stop bot AI if it's a bot
				if (!roomCode && botRefs.current[racerId]?.current) {
					const botRef = botRefs.current[racerId].current;
					if (botRef.stopAI) {
						botRef.stopAI();
					}
				}
			} else if (racerId === socket.id) {
				setUiLap(racer.lap);
			}
		}
	}, [maxCheckpoints, playSfx, setMusicPitch, stopMusic, changeTrack, socket, roomCode, botRefs]);

    // Calcolo Targets per Gusci (Red/Blue)

    // 4. GESTIONE USCITA AGGIORNATA
    const handleExitRace = useCallback(() => {
        setRaceExited(true);
        // Ritardo minimo per animazioni opzionali, poi navigazione
        setTimeout(() => { 
            navigate('/track'); // Torna alla selezione pista
        }, 50);
    }, [navigate]);
    
    // Liste Bersagli (per Gusci Rossi/Blu)
    const targets = useMemo(() => {
        const list = [];
        if (playerRef.current) list.push({ id: socket.id, ref: playerRef });
        
        // Aggiungi bot locali (solo in single player)
        if (!roomCode && botConfigurations.length > 0) {
            botConfigurations.forEach(botConfig => {
                const id = botConfig.character.id;
                // Verifica che sia il ref che il ref.current esistano
                if (botRefs.current[id] && botRefs.current[id].current) {
                    list.push({ id: id, ref: botRefs.current[id] });
                }
            });
        }
        
        // Aggiungi opponents remoti (solo in multiplayer)
        if (roomCode && opponents.length > 0 && roomCode === opponents[0]?.roomCode) {
            opponents.forEach(opp => {
                // Verifica che sia il ref che il ref.current esistano
                if (remoteRefMap.current[opp.id] && remoteRefMap.current[opp.id].current) {
                    list.push({ id: opp.id, ref: remoteRefMap.current[opp.id] });
                }
            });
        }
        
        return list;
    }, [roomCode, opponents, gameState]); // Aggiungi gameState per ricalcolare quando la gara inizia

    const blueShellTargets = useMemo(() => {
        return targets.map(t => {
            const rankInfo = positions.find(p => p.id === t.id);
            return {
                id: t.id,
                ref: t.ref,
                rank: rankInfo ? rankInfo.position : 99 
            };
        });
    }, [targets, positions]);

    if (!vehicle || !character) return <div style={{color:'white'}}>Loading resources...</div>;

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

            {/* LOBBY SCREEN */}
            {isInLobby && (
                <LobbyScreen 
                    isHost={isHost}
                    players={lobbyPlayers}
                    onStartRace={handleStartRace}
                    roomId={roomCode || 'N/A'}
                />
            )}

            {/* HUD PRINCIPALE */}
            <GameHUD 
                lap={uiLap} 
                totalLaps={TOTAL_LAPS} 
                rank={playerRank} 
                gameState={gameState} 
                finished={finished} 
                onExit={handleExitRace}
            />

            {/* MINIMAP */}
            {gameState !== 'lobby' && (
                <Minimap 
                    trackPath={selectedTrack.Waypoints[0]}
                    playerRef={playerRef}
                    playerCharacter={character}
                    botRefs={botRefs}
                    remoteRefMap={remoteRefMap}
                    opponents={opponentsWithIcons}
                    playerRank={playerRank}
					socket={socket}
                />
            )}

            {/* RACE RESULTS - Mostra solo quando il player ha finito */}
            {finished && finishers.length > 0 && <RaceResults finishers={finishers} socket={socket} />}

            {countdown && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '120px',
                    fontWeight: '900',
                    color: countdown === 'START!' ? '#00ff00' : '#ffff00',
                    textShadow: '5px 5px 0px #000',
                    zIndex: 1000,
                    fontFamily: 'Arial Black, sans-serif'
                }}>
                    {countdown}
                </div>
            )}

            <Canvas
                gl={{
                    powerPreference: "high-performance",
                    antialias: true,
                    stencil: false,
                    depth: true,
                    alpha: false,
                    preserveDrawingBuffer: false,
                    failIfMajorPerformanceCaveat: false
                }}
                dpr={[1, 2]} // Limita pixel ratio per performance
                frameloop="always"
                performance={{ min: 0.5 }} // Degrada performance se necessario
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.0;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <AudioListenerComponent />
                <WebGLSafetyManager />
                
                <CinematicCamera 
                    gameState={gameState} 
                    playerStartPos={playerStartPos} 
                    playerStartRot={playerStartRot} 
                />
                <LightningAtmosphere />
                <Stats />
                <PerspectiveCamera makeDefault position={[0, 5, -10]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

				{/* <WaypointsVisualizer waypoints={selectedTrack.Waypoints[0]} color="red" />
				<WaypointsVisualizer waypoints={selectedTrack.Waypoints[1]} color="green" />
				<WaypointsVisualizer waypoints={selectedTrack.Waypoints[2]} color="yellow" /> */}
                
                {/* MODIFICA: preset city MA senza sfondo (background={false}) */}
                <Environment preset="city" background={false} />

                {/* NETWORK MANAGER - Solo in multiplayer */}
                {roomCode && (
                    <NetworkManager 
                        socket={socket} 
                        playerRef={playerRef} 
                        setOpponents={setOpponents} 
                        character={character} 
                        vehicle={vehicle} 
                        setItems={setNetworkItems}
                        opponentsDataRef={opponentsDataRef}
                        gameState={gameState}
                        isHost={isHost}
                    />
                )}

                <Physics debug={false} gravity={[0, -20, 0]}>

                    <Suspense fallback={null}>
                        {networkItems.map((item) => {
                            if (!item.position || !item.velocity) return null;

                            const pos = new THREE.Vector3().fromArray(item.position);
                            const vel = new THREE.Vector3().fromArray(item.velocity);

                            const commonProps = {
                                position: pos,
                                initVelocity: vel,
                                onDestroy: () => handleRequestRemove(item.id)
                            };

                            switch (item.type) {
                                case 'banana': 
                                    return <Banana key={item.id} {...commonProps} />;
                                case 'green_shell': 
                                    return <GreenShell key={item.id} {...commonProps} />;
                                case 'red_shell': 
                                    return <RedShell key={item.id} {...commonProps} targets={targets} waypoints={selectedTrack.Waypoints[0]} />;
                                case 'bomb': 
                                    return <BobOmb key={item.id} {...commonProps} />;
                                default: 
                                    return null;
                            }
                        })}
                    </Suspense>

					{/* <WaypointRecorder
						kartRef={playerRef}
						isRecording={true}
					/> */}
                    
                    {/* RACE LOGIC */}
                    <RaceManager 
                        racersData={racersData}
                        finished={finished}
                        setPositions={setPositions}
                        positions={positions}
                        playerRef={playerRef}
                        botRefs={botRefs}
                        trackPath={selectedTrack.Waypoints[0]}
                        socket={socket}
                        remoteRefMap={remoteRefMap}
                        opponentsDataRef={opponentsDataRef}
						selectedTrack={selectedTrack}
                    />
                    
                    {/* MAP & COLLIDERS */}
                    <group ref={trackRef}>
                        <SmartMap modelPath={mapPath} scale={1} />
                    </group>
                    
                    <RoadWalls modelPath={selectedTrack.road} wallHeight={10} thresholdAngle={20} debug={false} />
                    <ItemBoxesMap mapModelPath={selectedTrack.itemBoxes} triggerName="Cube" />
                    
                    {checkpointPath && (
                        <CheckpointSystem 
                            url={checkpointPath} 
                            onSystemReady={(posMap) => { checkpointPositionsRef.current = posMap; }}
                            onCheckpointTrigger={(index, racerId) => { handleCheckpointTrigger(index, racerId); }} 
                        />
                    )}

                    {/* OPPONENTI REMOTI - Solo in multiplayer */}
                    {roomCode && opponents.map((playerData) => {
                        // 1. Cerca i dati remoti
                        const remoteCharacter = Characters.find(c => c.id === playerData.charId);
                        const remoteVehicle = VEHICLE_DATABASE[playerData.vehicleId];
                        

                        const effects = {
                            isStar: playerData.isStar,
                            isBulletBill: playerData.isBulletBill,
                            isMega: playerData.isMega

                        }
                        const safeVehicle = remoteVehicle || vehicle || VEHICLE_DATABASE['StandardKartS'];
                        const safeCharacter = remoteCharacter || character || Characters[0];
                        return (
                            <RemoteOpponent 
                                key={playerData.id} 
                                playerId={playerData.id}
                                ref={remoteRefMap.current[playerData.id]}
                                opponentsDataRef={opponentsDataRef}
                                // Passa i dati SICURI
                                character={safeCharacter} 
                                vehicle={safeVehicle} 
                                userData={{ type: 'opponent', id: playerData.id }} 
                                data={playerData}
                                effects={effects}
                            />
                        );
                    })}

                    {/* PLAYER LOCALE */}
                    <group position={[0, 10, 0]} > 
                        {vehicle.isBike ? (
                            <InsideDriftBike 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: socket.id }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                vehicleConfig={vehicle} 
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef} 
                                isRaceActive={isRaceActive}
                                // Passa handlers anche alla moto se implementati
                            />
                        ) : (
                            <OutsideDriftKart 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: socket.id }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                botRefs={botRefs}
                                gameState={gameState}
                                vehicleConfig={vehicle} 
                                positions={positions}
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef}
                                trackConfig={selectedTrack}
                                isRaceActive={isRaceActive}
                                waypoints={selectedTrack.Waypoints[0]}
                                paths={selectedTrack.Waypoints}
                                finished={finished}
                                rank={playerRank}
                                onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
                                onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
                                onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
                                onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
                                onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
                                onHitOpponent={(victimId) => {
                                    // Invia al server solo se in multiplayer
                                    if (socket && roomCode) {
                                        socket.emit('player_hit', { victimId: victimId, type: 'bullet-bill' });
                                    }
                                }}
                                socket={socket}
								roomCode={roomCode}
                            />
                        )}
                    </group>

                    {/* BOTS (AI) - Renderizza solo se NON siamo in multiplayer */}
                    {!roomCode && botConfigurations.map((botConfig, i) => {
                        const botId = botConfig.character.id;
                        const gridIndex = i + 1; 
                        
                        const botPos = gridPositions[gridIndex] || getGridPosition(start_pos, i);
                        const botRot = gridRotations[gridIndex] || [0, Math.PI / 2, 0];

                        return (
                            <group key={botId} position={[0, 0, 0]}> 
                                <OutsideDriftKart 
                                    ref={botRefs.current[botId]}
                                    userData={{ type: 'racer', id: botId }}
                                    characterConfig={botConfig.character.modelConfig} 
                                    gameState={gameState}
                                    vehicleConfig={botConfig.vehicle} 
                                    START_POS={botPos}
                                    START_ROT={botRot}
                                    positions={positions}
                                    onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
                                    onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
                                    onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
                                    onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
                                    onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
                                    trackRef={trackRef} 
                                    trackConfig={selectedTrack} 
                                    isBot={true}
                                    paths={selectedTrack.Waypoints}
									roomCode={roomCode}
                                /> 
                            </group>
                        );
                    })}
                </Physics>
            </Canvas>
        </div>
    )
}