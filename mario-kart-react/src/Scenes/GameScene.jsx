import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useThree, useFrame, extend } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, PerspectiveCamera, Stats, useGLTF } from '@react-three/drei'
import { useNavigate } from 'react-router-dom' // <--- 1. IMPORT ROUTING
import * as THREE from 'three'

// Register Three.js objects with React Three Fiber
extend({ SphereGeometry: THREE.SphereGeometry, MeshBasicMaterial: THREE.MeshBasicMaterial, LineBasicMaterial: THREE.LineBasicMaterial })

// --- IMPORTS INTERNI ---
import { SmartMap } from '../Tracks/SmartMap'
import { OutsideDriftKart } from '../components/OutsideDriftKart'
// import { InsideDriftBike } from '../components/InsideDriftBike'
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
import { VEHICLE_DATABASE, Characters, grandPrixList, Tracks } from '../components/Data.jsx'
import { LightningAtmosphere } from '../components/effects/LightningAtmosphere.jsx'

// --- IMPORTS ITEMS ---
import { Banana } from '../Items/Banana';
import { GreenShell } from '../Items/GreenShell';
import { RedShell } from '../Items/RedShell';
import { BobOmb } from '../Items/BobOmb.jsx'
import { BlueShell } from '../Items/BlueShell.jsx'
import { AudioListenerComponent } from '../audio/AudioListenerComponent.jsx';
import { useWebGLContext, useWebGLMemoryMonitor } from '../utils/WebGLContextManager.jsx';
import { gsap } from 'gsap'
import { CustomWiiSky } from '../components/CustomeWiiSky.jsx'
import { OutsideDriftBike } from '../components/OutsideDriftBike.jsx'
import { WaypointRecorder } from '../Bot/WaypointRecorder.jsx'
import { WaypointVisualizer} from '../Bot/WaypointVisualizer.jsx'

import { useGameDataStore, useGameStore, useRoomDataStore, useUserStore } from '../store.js';
import { socket } from '../multiplayer/socket.js'

 
const TOTAL_LAPS = 3;
const BOT_COUNT = 11; // 1 Player + 11 Bots = 12 Racers

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
    const introTimeRef = useRef(0);

    useFrame((_state, delta) => {
        if (gameState === 'INTRO') {
            // Accumula il tempo durante l'INTRO (massimo 10 secondi)
            introTimeRef.current = Math.min(introTimeRef.current + delta, 10);
            
            // Calcola la distanza progressiva: da -8 (davanti) a 24 (indietro) in 10 secondi
            // e l'altezza: da 4 a 8 unità
            const progress = introTimeRef.current / 10;
            const backstepDistance = -8 + (24 - (-8)) * progress; // -8 (front) -> 24 (back)
            const heightOffset = 4 + (8 - 4) * progress; // 4 -> 8
            
            const yawAngle = playerStartRot[1] || 0;
            const offset = new THREE.Vector3(
                -Math.sin(yawAngle) * backstepDistance,
                heightOffset,
                -Math.cos(yawAngle) * backstepDistance
            );

            const targetPos = new THREE.Vector3(
                playerStartPos[0] + offset.x,
                playerStartPos[1] + offset.y,
                playerStartPos[2] + offset.z
            );

            camera.position.lerp(targetPos, delta * 1.5); // Lerp lento (era 2.5)
            
            const lookAtTarget = new THREE.Vector3(
                playerStartPos[0],
                playerStartPos[1] + 1.5,
                playerStartPos[2]
            );
            camera.lookAt(lookAtTarget);
        } else if (gameState === 'COUNTDOWN') {
            // Reset timer al passaggio a COUNTDOWN
            introTimeRef.current = 0;
            
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

function useGridPositions(url) {
    const { scene } = useGLTF(url || ""); 
    
    const gridData = useMemo(() => {
        if (!url || !scene) return { positions: {}, rotations: {}, url: null }; 

        const positions = {};
        const rotations = {};
        let foundCount = 0;
        const nodeNames = []; // Array per il debug

        scene.updateMatrixWorld(true);

        scene.traverse((obj) => {
            nodeNames.push(obj.name);
            const nameLower = obj.name.toLowerCase();
            
            const match = nameLower.match(/(?:start|spawn|pos|grid).*?(\d+)/);

            if (match && !nameLower.includes("scene")) {
                const index = parseInt(match[1], 10);

                const worldPos = new THREE.Vector3();
                const worldQuat = new THREE.Quaternion();
                
                obj.getWorldPosition(worldPos);
                obj.getWorldQuaternion(worldQuat);

                // Evitiamo di sovrascrivere se il nodo padre e il figlio (mesh) hanno lo stesso numero
                if (!positions[index]) {
                    positions[index] = [worldPos.x, worldPos.y, worldPos.z];
                    
                    const euler = new THREE.Euler().setFromQuaternion(worldQuat);
                    rotations[index] = [euler.x, euler.y, euler.z];
                    foundCount++;
                }
            }
        });
        
        if (foundCount === 0) {
            // console.error(`❌ [Griglia] NESSUNA POSIZIONE TROVATA in ${url}!`);
            console.warn(`Nomi dei nodi presenti nel file (controllali in Blender):`, nodeNames.filter(n => n.length > 0));
        } else {
            // console.log(`✅ [Griglia] Trovate ${foundCount} posizioni in ${url}`);
        }

        return { positions, rotations, url }; 
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
    mapPath, 
    checkpointPath, 
    start_pos, 
    maxCheckpoints, 
    selectedTrack,
    selectedGrandPrix,
    setRaceResults,
    resetRoomState
}) {

    // vars from stores
    const {isHost: isHost, ccsSpeed: ccs, isGrandPrix: isGrandPrix, isTimeTrial: isTimeTrial} = useGameStore();
    const {SelectedCharacter: character, SelectedVehicle: vehicle} = useGameDataStore();
    const {userName: username} = useUserStore();
    const {roomCode: roomCode, roomId: roomId} = useRoomDataStore();
    
    const gameStore = useGameStore();
    
    // 3. HOOK DI NAVIGAZIONE
    const navigate = useNavigate();

    // --- GESTIONE GRAND PRIX DINAMICA ---
    const [gpTrackIndex, setGpTrackIndex] = useState(0);

    // 1. Trova l'oggetto completo del Grand Prix usando la stringa passata (id o nome)
    const currentGrandPrixObj = useMemo(() => {
        if (!isGrandPrix || !selectedGrandPrix) return null;
        // Cerca per id (es. 'mushroom') o per nome come fallback
        return grandPrixList.find(gp => gp.id === selectedGrandPrix || gp.name === selectedGrandPrix);
    }, [isGrandPrix, selectedGrandPrix]);

    // 2. Ora usa currentGrandPrixObj invece della stringa selectedGrandPrix
    const activeTrackConfig = useMemo(() => {
        if (isGrandPrix && currentGrandPrixObj?.tracks) {
            const trackName = currentGrandPrixObj.tracks[gpTrackIndex];
            return { name: trackName, ...Tracks[trackName] };
        }
        return { name: selectedTrack?.name || 'SingleRace', ...selectedTrack };
    }, [isGrandPrix, currentGrandPrixObj, gpTrackIndex, selectedTrack]);

    const activeMapPath = activeTrackConfig?.file || mapPath;
    const activeCheckpointPath = activeTrackConfig?.checkpoints || checkpointPath;
    const activeStartPos = activeTrackConfig?.startPos || start_pos;
    const activeMaxCheckpoints = activeTrackConfig?.maxCheckpoints || maxCheckpoints;

    const raceStartTime = useRef(null);

    // Aggiungi questo stato sotto a quello di "gameState"
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [raceAttempt, setRaceAttempt] = useState(0);

    const [isInLobby, setIsInLobby] = useState(roomCode ? true : false);
    const [lobbyPlayers, setLobbyPlayers] = useState([]);

    // 1. CARICAMENTO POSIZIONI DI PARTENZA (Grid)
    const { positions: gridPositions, rotations: gridRotations, url: loadedGridUrl } = useGridPositions(activeTrackConfig?.gridpos);

    // Calculate player start position early (before useEffect hooks)
    const fallbackStartPos = activeStartPos || [0, 0, 0];

    const multiplayerGridIndex = useMemo(() => {
        if (!roomCode || !socket?.id || lobbyPlayers.length === 0) return null;
        
        const sortedPlayers = [...lobbyPlayers].sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const myGridIndex = sortedPlayers.findIndex(player => player.id === socket.id);
        if (myGridIndex < 0) return null;
        return myGridIndex + 1;
    }, [roomCode, socket?.id, lobbyPlayers]);

    const playerGridIndex = isTimeTrial ? 1 : (multiplayerGridIndex || 12);
    const playerStartPos = gridPositions[playerGridIndex] || getGridPosition(fallbackStartPos, Math.max(0, playerGridIndex - 1));
    const playerStartRot = gridRotations[playerGridIndex] || [0, Math.PI / 2, 0];

    // Genera configurazioni bot random e uniche (memoizzate per non ricambiarle ad ogni render)
    const botConfigurations = useMemo(() => {
        if (roomCode) return []; // Nessun bot in multiplayer
        return generateBotConfigurations(BOT_COUNT, character, vehicle);
    }, [roomCode, character, vehicle]);

    const [gameState, setGameState] = useState(roomCode ? 'LOBBY' : isTimeTrial ? 'COUNTDOWN' : 'INTRO'); // Se no room, parte subito
    const [countdown, setCountdown] = useState(null);
    const [finished, setFinished] = useState(false);
    const [raceExited, setRaceExited] = useState(false);
    const [finishers, setFinishers] = useState([]); // Lista dei corridori che hanno finito in ordine
    const [isPaused, setIsPaused] = useState(false);

    const [networkItems, setNetworkItems] = useState([]);
    const itemIdCounter = useRef(0);

    const [restartTrigger, setRestartTrigger] = useState(0);

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
        data[socket.id] = { id: socket.id, lap: 1, nextCP: 1, score: 0, position: 1, name: character.name, points: 0 };
        const positions = [{ id: socket.id, position: 1 }]; // Player parte primo in multiplayer
        
        // In multiplayer (roomCode presente) non creiamo bot
        // In single player usiamo gli ID dei character dai botConfigurations
        if (!roomCode && botConfigurations.length > 0) {
            botConfigurations.forEach((botConfig, i) => {
                const botId = botConfig.character.id;
                data[botId] = { id: botId, lap: 1, nextCP: 1, score: 0, position: i + 2, name: botConfig.character.name, points: 0 };
                positions.push({ id: botId, position: i + 2 });
            });
        }

        return { initialRacersData: data, initialPositions: positions };
    }, [roomCode, botConfigurations, character, socket.id]);

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

    // Handle window blur/focus for pause
    useEffect(() => {
        const handleWindowBlur = () => {
            if (gameState === 'RACING' && !finished) {
                setIsPaused(true);
            }
        };

        const handleWindowFocus = () => {
            // Non auto-unpause, l'utente deve cliccare il bottone
        };

        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [gameState, finished]);   

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
    }, [playerRank, positions, socket.id]);

    useEffect(() => {
        if (!socket) return;

        const handleLeaderboard = (officialLeaderboard) => {
            // officialLeaderboard è l'array [{id, position}, ...] inviato dal server
            setPositions(officialLeaderboard);
        };

        socket.on('leaderboard_update', handleLeaderboard);
        return () => socket.off('leaderboard_update', handleLeaderboard);
    }, [socket]);

    // Handle remote player lap updates
    useEffect(() => {
        if (!socket) return;

        const handlePlayerLapUpdated = (data) => {
            const { playerId, lap } = data;
            if (racersData.current[playerId]) {
                racersData.current[playerId].lap = lap;
                
                // Check if this remote player finished the race
                if (lap > TOTAL_LAPS) {
                    if (racersData.current[playerId].hasFinished) return;
                    racersData.current[playerId].hasFinished = true;
                    setFinishers(prev => {
                        // Check if already in the list 
                        if (prev.some(f => f.id === playerId)) return prev;
                        
                        const finishPosition = prev.length + 1;
                        const finisherEntry = { 
                            id: playerId, 
                            position: finishPosition,
                            finishTime: Date.now() - raceStartTime.current,
                        };
                        
                        return [...prev, finisherEntry];
                    });
                }
            }
        };

        socket.on('player_lap_updated', handlePlayerLapUpdated);
        return () => socket.off('player_lap_updated', handlePlayerLapUpdated);
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
            
            if (isTimeTrial) {
                startCountdown();
                return;
            }
            console.log('Race starting');
            setIsInLobby(false);
            if (!isTimeTrial)
                setGameState('INTRO');
            else
                setGameState('COUNTDOWN')
            
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
        socket.on('return_to_waiting', (data) => {
            if (data?.roomCode !== roomCode) return;
            navigate('/waiting', { replace: true });
        });
        socket.on('room_closed', () => {
              resetRoomState();
              gameStore.setHostLeft(true);
              navigate('/menu', { replace: true });
        });
        socket.emit('request_room_state', { roomCode });

        return () => {
            socket.off('room_state', handleRoomState);
            socket.off('race_start', handleRaceStart);
            socket.off('game_state_sync', handleGameStateSync);
            socket.off('return_to_waiting');
            socket.off('room_closed');
        };
    }, [socket, roomCode, playerStartPos, isTimeTrial]);

    // Handle start race button (host only)
    const handleStartRace = useCallback(() => {
        if (!socket || !isHost || !roomCode) return;

        // In multiplayer non creiamo bot, solo player reali
        //console.log('[Multiplayer] Starting race without bots');
        
        // Emit race start without bots
        socket.emit('start_race', { bots: [], roomCode });
    }, [socket, isHost, roomCode]);

    
    useEffect(() => {
        // RIMOSSO isTimeTrial da questa condizione per non bloccare il flusso
        if (isInLobby || introPlayed.current || gameState === 'RACING' || gameState === 'LOADING') return;
        
        introPlayed.current = true;

        if (isTimeTrial) {
            startCountdown();
            return;
        }

        // ALTRIMENTI: esegui la normale animazione intro di GSAP
        // Assicurati di uccidere vecchie animazioni pendenti in caso di riavvio rapido
        gsap.killTweensOf(cameraTarget.current);

        // Calcola la posizione iniziale: davanti al player
        const yawAngle = playerStartRot[1] || 0;
        const initialBackstepDistance = -8;
        const heightOffset = 4;
        
        const initialX = playerStartPos[0] - Math.sin(yawAngle) * initialBackstepDistance;
        const initialY = playerStartPos[1] + heightOffset;
        const initialZ = playerStartPos[2] - Math.cos(yawAngle) * initialBackstepDistance;

        gsap.fromTo(cameraTarget.current, 
            { x: initialX, y: initialY, z: initialZ }, 
            { x: initialX, y: initialY, z: initialZ, duration: 0 }
        );

        const timeline = gsap.timeline({
            onComplete: () => startCountdown()
        });

        // Vai molto più indietro (24 unità) e più alto, allontanandosi
        const finalBackstepDistance = 24;
        const finalHeightOffset = 8;
        
        const finalX = playerStartPos[0] - Math.sin(yawAngle) * finalBackstepDistance;
        const finalY = playerStartPos[1] + finalHeightOffset;
        const finalZ = playerStartPos[2] - Math.cos(yawAngle) * finalBackstepDistance;

        timeline.to(cameraTarget.current, {
            x: finalX,
            y: finalY,
            z: finalZ,
            duration: 10,
            ease: "power2.inOut"
        });
        
    // AGGIUNGI restartTrigger QUI
    }, [isInLobby, playerStartPos, playerStartRot, restartTrigger, gameState, isTimeTrial]);

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
                    raceStartTime.current = Date.now();
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
    }, [opponents, botConfigurations, socket.id]);

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

        // Quando la gara è finita, non interrompere la musica di arrivo appena avviata.
        if (finished) {
            racingMusicStarted.current = false;
            return;
        }

        if (gameState !== 'RACING') {
            setMusicPitch(1.0, 1.0, 300);
            stopMusic();
            racingMusicStarted.current = false;
            return;
        }
        
        // Avvia la musica della gara solo una volta (Usa activeTrackConfig!)
        if (!racingMusicStarted.current && activeTrackConfig?.soundtrack) {
            stopMusic();
            changeTrack(activeTrackConfig.soundtrack, 0, true);
            racingMusicStarted.current = true;
        }
        
    }, [activeTrackConfig, changeTrack, gameState, finished, stopMusic, setMusicPitch, playMusicOnce]);

    // Update wins
    const sendWinToServer = useCallback((isOffline) => {
        if (!username) return;
        fetch(`/api/updateWins?userName=${username}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onlyOffline: isOffline })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Wins updated:', data);
        })
        .catch(error => {
            console.error('Error updating wins:', error);
        });
    }, [username]);

    // Handle ESC key for pause toggle
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && gameState === 'RACING' && !finished) {
                setIsPaused(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, finished]);


    // Checkpoint Trigger
    const handleCheckpointTrigger = useCallback((hitIndex, racerId) => {
        if (!racerId || !racersData.current[racerId]) return;
        const racer = racersData.current[racerId];
        if (racer.hasFinished) return;
        // console.log(`[Checkpoint] Racer ${racerId} hit checkpoint ${hitIndex}, expected ${racer.nextCP}`);
        
        if (hitIndex === racer.nextCP && hitIndex !== 0) {
            racer.nextCP += 1;
            if (racerId === socket.id) setNextCheck(racer.nextCP);
        } 
        else if (hitIndex === 0 && racer.nextCP > activeMaxCheckpoints) {
            racer.lap += 1;
            // console.log(`[Checkpoint] Racer ${racerId} completed lap ${racer.lap - 1}, now on lap ${racer.lap}`);
            
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
                racer.hasFinished = true;
                // Add to finishers list
                setFinishers(prev => {
                    // Check if already in the list 
                    if (prev.some(f => f.id === racerId)) return prev;
                    
                    const finishPosition = prev.length + 1;
                    const finisherEntry = { 
                        id: racerId, 
                        position: finishPosition,
                        finishTime: Date.now() - raceStartTime.current,
                        name: racer.name || 'Unknown'
                    };
                    
                    return [...prev, finisherEntry];
                });
                
                if (racerId === socket.id) {
                    setFinished(true);
                    playSfx(AUDIO_SFX.FINISH_RACE, 3);
                    stopMusic();
                    if (racer.position === 1) {
                        changeTrack('FINISH_FIRST', 0, false, 1.0);
                        if (!isTimeTrial && !roomCode && isGrandPrix) {
                            sendWinToServer(true);
                        } else if (!isTimeTrial && roomCode && !isGrandPrix) {
                            sendWinToServer(false);
                        }
                    }
                    else if (racer.position >= 2 && racer.position <= 4) {
                        changeTrack('FINISH_SECOND_FOURTH', 0, false, 1.0);
                    }
                    else {
                        changeTrack('FINISH_FIFTH_TWELFTH', 0, false, 1.0);
                    }

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
    }, [activeMaxCheckpoints, playSfx, setMusicPitch, stopMusic, changeTrack, socket, roomCode, botRefs, sendWinToServer, isTimeTrial]);

    // 4. GESTIONE USCITA AGGIORNATA
    const handleExitRace = useCallback((destination = '/menu') => {
        setRaceExited(true);
        setGameState('LOADING');
        setIsTransitioning(true);
        if (isGrandPrix) {
            gameStore.setIsGrandPrix(false);
        }
        if (isTimeTrial) {
            gameStore.setIsTimeTrial(false);
        }
        if (roomCode && socket) {
            socket.emit('leave_room', { roomCode });
            resetRoomState();
            socket.once('room_closed', () => {
                if (!isHost) {
                    gameStore.setHostLeft(true);
                }
                setTimeout(() => { 
                    setIsTransitioning(false);
                    navigate('/menu', { replace: true });
                }, 1000);
            });
        }
        setTimeout(() => { 
            setIsTransitioning(false);
            navigate(destination);
        }, 1000);
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
    }, [roomCode, opponents, botConfigurations, socket.id]);

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

    const handleRestartRace = useCallback(() => {
        // 1. Ferma tutto e metti la schermata di caricamento/transizione
        setIsPaused(false);
        setIsTransitioning(true);
        setGameState('LOADING');
        stopMusic();

        setRaceAttempt(prev => prev + 1);

        // 2. Cancella tutti i dati della gara corrente
        setFinished(false);
        setFinishers([]);
        setRaceExited(false);
        setUiLap(1);
        setNextCheck(1);
        setPositions(initialPositions);
        setNetworkItems([]); // Elimina i vecchi gusci/banane
        setCountdown(null);

        // Reset dei dati interni dei corridori (Giri, Checkpoint, Punteggio)
        Object.keys(racersData.current).forEach(id => {
            racersData.current[id].lap = 1;
            racersData.current[id].nextCP = 1;
            racersData.current[id].score = 0;
            racersData.current[id].hasFinished = false;
            // Reset AI dei bot se hanno uno stato interno
            if (botRefs.current[id]?.current?.startAI) {
                botRefs.current[id].current.startAI();
            }
        });

        // 3. Pausa di 3 secondi per "distruggere" il mondo 3D e ricaricarlo pulito
        setTimeout(() => {
            introPlayed.current = false;
            introMusicPlayed.current = false;
            startingGridPlayed.current = false;
            racingMusicStarted.current = false;
            isFinalLap.current = false;
            itemIdCounter.current = 0;

            // Innesca di nuovo l'animazione della telecamera
            setRestartTrigger(prev => prev + 1);
            
            // Fai ripartire lo stato di gioco appropriato
            setGameState(isTimeTrial ? 'COUNTDOWN' : 'INTRO');
            
            // Rimuovi schermata nera di transizione
            setIsTransitioning(false);

            // Notifica al resto dell'app che la gara è ricominciata
            window.dispatchEvent(new CustomEvent('race-restarted'));
        }, 3000);
        
    }, [isTimeTrial, initialPositions, stopMusic, setIsTransitioning]);

    // --- GESTIONE EVENTI GRAND PRIX (HARD RESET) ---
    useEffect(() => {
        const handleNextRace = () => {
            if (isGrandPrix && currentGrandPrixObj?.tracks) {
                if (gpTrackIndex < currentGrandPrixObj.tracks.length - 1) {
                    
                    // 1. Ferma tutto e metti la schermata nera
                    setIsTransitioning(true);
                    setGameState('LOADING');
                    stopMusic();
                    
                    // 2. CANCELLA TUTTI I DATI DELLA GARA PRECEDENTE
                    setFinished(false);
                    setFinishers([]);
                    setRaceExited(false);
                    setUiLap(1);
                    setNextCheck(1);
                    setPositions(initialPositions);
                    setNetworkItems([]); // Elimina i vecchi gusci/banane
                    setCountdown(null);

                    // Reset dati interni dei corridori
                    Object.keys(racersData.current).forEach(id => {
                        racersData.current[id].lap = 1;
                        racersData.current[id].nextCP = 1;
                        racersData.current[id].score = 0;
                        racersData.current[id].hasFinished = false;
                    });

                    // 3. Cambia l'indice della pista (inizia a caricare la nuova in background)
                    setGpTrackIndex(prev => prev + 1);

                    // 4. Pausa di 3 secondi per distruggere il mondo 3D e ricaricarlo pulito
                    setTimeout(() => {
                        introPlayed.current = false;
                        introMusicPlayed.current = false;
                        startingGridPlayed.current = false;
                        racingMusicStarted.current = false;
                        isFinalLap.current = false;
                        itemIdCounter.current = 0;
                        
                        setRestartTrigger(prev => prev + 1); // Fa ripartire la telecamera
                        setGameState('INTRO');
                        setIsTransitioning(false); // Rimuovi schermata nera
                    }, 3000);

                } else {
                    const finalStandings = Object.values(racersData.current)
                        .map(racer => ({
                            id: racer.id,
                            name: racer.name,
                            points: racer.points || 0
                        }))
                        .sort((a, b) => b.points - a.points);
                    
                    // console.log('Grand Prix finished! Final standings:', finalStandings);
                    if (setRaceResults) {
                        setRaceResults(finalStandings);
                    }

                    gameStore.setIsGrandPrix(false);
                    handleExitRace('/endGrandPrix');
                }
            }
        };

        window.addEventListener('nextGrandPrixRace', handleNextRace);
        return () => window.removeEventListener('nextGrandPrixRace', handleNextRace);
    }, [isGrandPrix, currentGrandPrixObj, gpTrackIndex, handleExitRace, stopMusic, initialPositions]);


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

            {/* SCHERMATA DI CARICAMENTO TRANSIZIONE GARE */}
            {isTransitioning && (
                <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center text-white">
                    <h1 className="text-5xl font-black italic tracking-widest text-[#ffcc00] drop-shadow-md mb-8">
                        LOADING...
                    </h1>
                    <div className="w-16 h-16 border-8 border-gray-600 border-t-[#ffcc00] rounded-full animate-spin"></div>
                </div>
            )}

            {/* HUD PRINCIPALE */}
            <GameHUD 
                lap={uiLap} 
                totalLaps={TOTAL_LAPS} 
                rank={playerRank} 
                gameState={gameState} 
                finished={finished}
            />

            {/* PAUSE MENU */}
            {isPaused && gameState === 'RACING' && (
                <div className="fixed inset-0 -top-20 z-[2000] bg-black/70 flex flex-col items-center justify-center">
                    <img
                        src="/Buttons_pause_menu.png"
                        alt="Pause menu"
                        className="w-[660px] md:w-[760px] h-auto mb-4 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
                    />
                    <div className="flex flex-col gap-4 w-full max-w-xl px-6">
                        <button
                            onClick={() => setIsPaused(false)}
                            className="group relative w-full h-14 md:h-16 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center px-6 overflow-hidden transition-all duration-200 hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:bg-black/70 active:scale-95"
                        >
                            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                            <span className="relative z-[2] text-lg md:text-xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                                Resume (ESC)
                            </span>
                        </button>
                        {isTimeTrial && (
                            <button
                                onClick={handleRestartRace}
                                className="group relative w-full h-14 md:h-16 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center px-6 overflow-hidden transition-all duration-200 hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:bg-black/70 active:scale-95"
                            >
                                <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                <span className="relative z-[2] text-lg md:text-xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                                    Retry
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => handleExitRace('/menu')}
                            className="group relative w-full h-14 md:h-16 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center px-6 overflow-hidden transition-all duration-200 hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:bg-black/70 active:scale-95"
                        >
                            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                            <span className="relative z-[2] text-lg md:text-xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                                Exit Race
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* MINIMAP */}
            {gameState !== 'lobby' && (
                <Minimap 
                    trackPath={activeTrackConfig.Waypoints[0]}
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
            {finished && finishers.length > 0 && 
                <RaceResults 
                    finishers={finishers}
                    socket={socket}
                    isTimeTrial={isTimeTrial}
                    onPlayAgain={handleRestartRace}
                    racersData={racersData.current}
                    userName={username}
                    trackName={activeTrackConfig?.name}
                    lobbyPlayers={lobbyPlayers}
                    isHost={isHost}
                />}

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
                    failIfMajorPerformanceCaveat: false,
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

                {/*{activeTrackConfig?.Waypoints?.[0] && (
                    <WaypointVisualizer waypointsFile={activeTrackConfig.Waypoints[0]} lineColor="#00e5ff" />
                )}
                {activeTrackConfig?.Waypoints?.[1] && (
                    <WaypointVisualizer waypointsFile={activeTrackConfig.Waypoints[1]} lineColor="#ffd400" />
                )}
                {activeTrackConfig?.Waypoints?.[2] && (
                    <WaypointVisualizer waypointsFile={activeTrackConfig.Waypoints[2]} lineColor="#ff5a7a" />
                )}


                {/* <WaypointRecorder
                    kartRef={playerRef}
                    isRecording={true}
                >

                </WaypointRecorder>*/}


                <AudioListenerComponent />
                <WebGLSafetyManager />
                
                <CinematicCamera 
                    gameState={gameState} 
                    playerStartPos={playerStartPos} 
                    playerStartRot={playerStartRot} 
                />
                <LightningAtmosphere />
                <Stats />
                <PerspectiveCamera makeDefault position={[0, 5, -10]} far={500000}/>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                
                {/* MODIFICA: preset city MA senza sfondo (background={false}) */}
                <Environment preset="city" background={false} blur={0.1}/>

                <CustomWiiSky trackName={activeTrackConfig?.name}/>

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


                <Physics key={`${activeTrackConfig.name}-${raceAttempt}`} debug={false} gravity={[0, -20, 0]}>

                    <Suspense fallback={null}>
                        {networkItems.map((item) => {
                            if (!item.position || !item.velocity) return null;

                            const pos = new THREE.Vector3().fromArray(item.position);
                            const vel = new THREE.Vector3().fromArray(item.velocity);

                            const commonProps = {
                                id: item.id,
                                position: pos,
                                initVelocity: vel,
                                ownerId: item.ownerId,
                                onDestroy: () => handleRequestRemove(item.id),
                                socket: socket,
                                playerRef: playerRef,
                                botRefs: botRefs,
                                remoteRefMap: remoteRefMap,
                                roomCode: roomCode
                            };

                            switch (item.type) {
                                case 'banana': 
                                    return <Banana key={item.id} {...commonProps} />;
                                case 'green_shell': 
                                    return <GreenShell key={item.id} {...commonProps} />;
                                case 'red_shell': 
                                    return <RedShell key={item.id} {...commonProps} targets={targets} />;
                                case 'blue_shell': 
                                    return <BlueShell key={item.id} position={pos} waypoints={activeTrackConfig.Waypoints[0]} targets={blueShellTargets} onDestroy={commonProps.onDestroy} />;
                                case 'bomb': 
                                    return <BobOmb key={item.id} {...commonProps} />;
                                default: 
                                    return null;
                            }
                        })}
                    </Suspense>
                    
                    {/* RACE LOGIC */}
                    <RaceManager 
                        racersData={racersData}
                        finished={finished}
                        setPositions={setPositions}
                        positions={positions}
                        playerRef={playerRef}
                        botRefs={botRefs}
                        trackPath={activeTrackConfig.Waypoints[0]}
                        socket={socket}
                        remoteRefMap={remoteRefMap}
                        opponentsDataRef={opponentsDataRef}
                        selectedTrack={activeTrackConfig}
                    />
                    
                    {/* MAP & COLLIDERS */}
                    <group ref={trackRef}>
                        <SmartMap modelPath={activeMapPath} scale={1} />
                    </group>
                    
                    <RoadWalls modelPath={activeTrackConfig.road} wallHeight={10} thresholdAngle={20} debug={false} />
                    {!isTimeTrial &&
                        <ItemBoxesMap mapModelPath={activeTrackConfig.itemBoxes} triggerName="Cube" />
                    }
                    
                    {activeCheckpointPath && (
                        <CheckpointSystem 
                            url={activeCheckpointPath} 
                            onSystemReady={(posMap) => { checkpointPositionsRef.current = posMap; }}
                            onCheckpointTrigger={(index, racerId) => { handleCheckpointTrigger(index, racerId); }} 
                        />
                    )}

                    {/* OPPONENTI REMOTI - Solo in multiplayer */}
                    {roomCode && opponents.map((playerData) => {
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
                            <OutsideDriftBike 
                                ref={playerRef}
                                userData={{ type: 'racer', id: socket.id }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                botRefs={botRefs}
                                gameState={gameState}
                                isPaused={isPaused}
                                vehicleConfig={vehicle}
                                positions={positions}
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef}
                                trackConfig={activeTrackConfig}
                                isRaceActive={isRaceActive}
                                waypoints={activeTrackConfig.Waypoints[0]}
                                paths={activeTrackConfig.Waypoints}
                                finished={finished}
                                rank={playerRank}
                                onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
                                onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
                                onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
                                onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
                                onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
                                onHitOpponent={(victimId) => {
                                    if (socket && roomCode) {
                                        socket.emit('player_hit', { victimId: victimId, type: 'bullet-bill' });
                                    }
                                }}
                                socket={socket}
                                roomCode={roomCode}
                                maxSpeed={ccs - 10}
                                isTimeTrial={isTimeTrial}
                            />
                        ) : (
                            <OutsideDriftKart 
                                ref={playerRef} 
                                userData={{ type: 'racer', id: socket.id }}
                                characterConfig={character.modelConfig}
                                selectedCharacter={character}
                                botRefs={botRefs}
                                gameState={gameState}
                                isPaused={isPaused}
                                vehicleConfig={vehicle} 
                                positions={positions}
                                START_POS={playerStartPos}
                                START_ROT={playerStartRot}
                                trackRef={trackRef}
                                trackConfig={activeTrackConfig}
                                isRaceActive={isRaceActive}
                                waypoints={activeTrackConfig.Waypoints[0]}
                                paths={activeTrackConfig.Waypoints}
                                finished={finished}
                                rank={playerRank}
                                onSpawnBanana={(p, v) => handleRequestSpawn('banana', p, v)}
                                onSpawnGreenShell={(p, v) => handleRequestSpawn('green_shell', p, v)}
                                onSpawnRedShell={(p, v) => handleRequestSpawn('red_shell', p, v)}
                                onSpawnBlueShell={(p, v) => handleRequestSpawn('blue_shell', p, v)}
                                onSpawnBomb={(p, v) => handleRequestSpawn('bomb', p, v)}
                                onHitOpponent={(victimId) => {
                                    if (socket && roomCode) {
                                        socket.emit('player_hit', { victimId: victimId, type: 'bullet-bill' });
                                    }
                                }}
                                socket={socket}
                                roomCode={roomCode}
                                maxSpeed={ccs}
                                isTimeTrial={isTimeTrial}
                            />
                        )}
                    </group>

                    {/* BOTS (AI) - Renderizza solo se NON siamo in multiplayer */}
                    {!roomCode && !isTimeTrial && botConfigurations.map((botConfig, i) => {
                        const botId = botConfig.character.id;
                        const gridIndex = i + 1; 
                        
                        const botPos = gridPositions[gridIndex] || getGridPosition(activeStartPos, i);
                        const botRot = gridRotations[gridIndex] || [0, Math.PI / 2, 0];

						return (
							<group key={botId} position={[0, 0, 0]}> 
								{botConfig.vehicle.isBike ? (
									<OutsideDriftBike
										ref={botRefs.current[botId]}
										userData={{ type: 'racer', id: botId }}
										characterConfig={botConfig.character.modelConfig} 
										gameState={gameState}
										isPaused={isPaused}
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
										trackConfig={activeTrackConfig} 
										isBot={true}
										paths={activeTrackConfig.Waypoints}
										roomCode={roomCode}
										maxSpeed={ccs - 10}
										isTimeTrial={false}
									/>
								) : (
									<OutsideDriftKart 
										ref={botRefs.current[botId]}
										userData={{ type: 'racer', id: botId }}
										characterConfig={botConfig.character.modelConfig} 
										gameState={gameState}
										isPaused={isPaused}
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
										trackConfig={activeTrackConfig} 
										isBot={true}
										paths={activeTrackConfig.Waypoints}
										roomCode={roomCode}
										maxSpeed={ccs}
										isTimeTrial={false}
									/> 
								)}
							</group>
						);
                    })}
                </Physics>
            </Canvas>
        </div>
    )
}