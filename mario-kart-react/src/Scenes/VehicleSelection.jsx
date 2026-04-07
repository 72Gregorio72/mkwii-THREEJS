import React, { useState, useRef, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom' 
import { RacerModel } from '../models/RacerModel'
import { VehicleModel } from '../models/VehicleModel'
import { VEHICLE_DATABASE } from '../components/Data'
import { AUDIO_SFX, useAudio } from '../audio/AudioManager.jsx'
import { useGameDataStore, useGameStore, useRoomDataStore } from '../store.js'
import { socket } from '../multiplayer/socket.js'

// --- STAT BAR COMPONENT ---
const StatBar = ({ label, value }) => (
    <div className="mb-[1vh] w-full">
        <div className="text-white text-[1.8vh] font-bold drop-shadow-[2px_2px_0_#000] mb-[0.2vh] text-left">
            {label}
        </div>
        <div className="w-full h-[1.5vh] bg-black/50 border-2 border-[#555] rounded relative overflow-hidden">
            {/* Fill Bar */}
            <div 
                className="h-full bg-gradient-to-r from-[#ffaa00] to-[#ffdd00] rounded-[2px] transition-all duration-300 ease-out"
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

// --- ROTATING SHOWCASE ---
function RotatingShowcase({ characterConfig, vehicleData }) {
    const groupRef = useRef()
    
    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.5
    })

    if (!vehicleData?.modelConfig?.file) return null;

    return (
        <group ref={groupRef}>
            <OrbitControls enableZoom={false} enablePan={false} />
            {/* VEHICLE */}
            <VehicleModel 
                vehicleConfig={vehicleData.modelConfig}
                steer={0} drift={0} speed={5}
                isBike={vehicleData.isBike}
            />

            {/* DRIVER */}
            <RacerModel 
                isInMenu={false}
                characterConfig={characterConfig}
                vehicleConfig={vehicleData}
                isKart={true}
                steer={0} 
                drift={0}
                key={vehicleData.name + "_racer"}
            />
        </group>
    )
}

export function VehicleSelection({ resetRoomState }) {
    const navigate = useNavigate();
    const { playSfx , changeTrack, enableSmoothLoop , getCurrentTrack } = useAudio();

    const {isGrandPrix: isGrandPrix} = useGameStore();
    const gameStore = useGameStore();

    const {SelectedCharacter: selectedCharacter} = useGameDataStore();
    const gameDataStore = useGameDataStore();

    const { roomCode: roomCode } = useRoomDataStore();

    useEffect(() => {
        if (getCurrentTrack() !== 'CHARACTER_KART_SELECT') {
            changeTrack('CHARACTER_KART_SELECT', 100);
            enableSmoothLoop();
        }
    }, [changeTrack, enableSmoothLoop]);

    // Socket listen
    useEffect(() => {
        if (!roomCode || !socket) return;

        socket.on('room_closed', () => {
            playSfx(AUDIO_SFX.BACK_IN_MENU);
            resetRoomState();
            gameStore.setHostLeft(true);
            navigate('/menu', { replace: true });
        });

        return () => {socket.off('room_closed')}; // Clean up on unmount
    }, [roomCode, socket]);

    const availableIDs = selectedCharacter.veichles || []; 

    const availableVehicles = availableIDs.map(id => ({
        id: id,
        ...((VEHICLE_DATABASE[id]) || VEHICLE_DATABASE['DEFAULT'])
    }));

    const [localSelection, setLocalSelection] = useState(availableVehicles[0] || VEHICLE_DATABASE['DEFAULT']);

    const handleConfirm = () => {
        gameDataStore.setSelectedVehicle(localSelection);
        if (!isGrandPrix)
            navigate('/track'); 
        else
            navigate('/game');
    };

    const totalSlots = 12;
    const gridSlots = Array.from({ length: totalSlots }).map((_, index) => {
        return index < availableVehicles.length ? availableVehicles[index] : null
    });

    return (
        // Main Container with Scanlines
        <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
            
            {/* Header */}
            <div className="h-[8vh] bg-white flex items-center pl-[4vw] border-b-[0.6vh] border-[#aaddff] rounded-br-[50px] w-[55%] z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                <h1 className="text-[4vh] font-bold text-[#666] italic uppercase">
                    Select Vehicle
                </h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden items-center relative">
                
                {/* LEFT PANEL: Stats & 3D Model */}
                <div className="flex-1 flex flex-row h-full items-center relative">
                    
                    {/* Stats Column */}
                    <div className="w-[35%] h-[80%] flex flex-col justify-center pl-[4vw] z-10 gap-2">
                        <StatBar label="Speed" value={localSelection.stats.speed} />
                        <StatBar label="Weight" value={localSelection.stats.weight} />
                        <StatBar label="Acceleration" value={localSelection.stats.accel} />
                        <StatBar label="Handling" value={localSelection.stats.handling} />
                        <StatBar label="Drift" value={localSelection.stats.drift} />
                        <StatBar label="Off-Road" value={localSelection.stats.offroad} />
                    </div>

                    {/* 3D Canvas Container */}
                    <div className="w-[65%] h-full relative flex items-center justify-center">
                        {/* Background Circle */}
                        <div className="absolute w-[50vmin] h-[50vmin] border-[0.3vmin] border-white/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

                        <Canvas camera={{ position: [3, 2, 5], fov: 45 }}>
                            <ambientLight intensity={1.5} />
                            <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} />
                            <Environment preset="city" />
                            <Suspense fallback={null}>
                                <RotatingShowcase 
                                    characterConfig={selectedCharacter.modelConfig} 
                                    vehicleData={localSelection}
                                />
                            </Suspense>
                        </Canvas>

                        {/* Vehicle Name Label */}
                        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] text-center bg-gradient-to-b from-black/90 to-black/60 border-[0.3vh] border-[#666] text-white py-[1.5vh] transform -skew-x-[10deg] shadow-lg pointer-events-none">
                            <span className="block transform skew-x-[10deg] text-[4vh] font-bold drop-shadow-[3px_3px_0_#000] tracking-wider">
                                {localSelection.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Grid Selection */}
                <div className="flex-[1.2] flex items-center justify-center h-full p-[2vmin]">
                    <div className="grid grid-cols-2 grid-rows-6 gap-x-[3vmin] gap-y-[1.2vmin] w-[75%] h-[85%] max-h-full">
                        {gridSlots.map((veh, index) => {
                            const isEmpty = !veh;
                            const isActive = veh && localSelection.name === veh.name;

                            // Handle Sprite Naming (Stripping 'S', 'M', 'L' suffix for standard karts)
                            let vehicleName = veh ? veh.name.replace(/\s+/g, '') : '';
                            if (['StandardBikeS', 'StandardKartS', 'StandardBikeM', 'StandardKartM', 'StandardBikeL', 'StandardKartL'].includes(vehicleName)) {
                                vehicleName = vehicleName.slice(0, -1);
                            }
                            const spritePath = veh ? `/vehicleSprites/${vehicleName}.png` : '';

                            return (
                                <div 
                                    key={index} 
                                    onClick={() => {
                                        if (!isEmpty) {
                                            setLocalSelection(veh);
                                            playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                                        }
                                    }}
                                    className={`
                                        w-full h-full rounded flex items-center justify-center relative transition-all duration-100 ease-in-out
                                        ${isEmpty 
                                            ? 'bg-transparent border-[0.3vh] border-[#444] cursor-default opacity-50' 
                                            : 'cursor-pointer'
                                        }
                                        ${isActive 
                                            ? 'border-[0.4vh] border-[#ffe600] bg-gradient-to-b from-black/80 via-[#3c3c3c]/80 to-black/80 shadow-[0_0_15px_#ffe600] scale-[1.02] z-10' 
                                            : !isEmpty && 'border-[0.3vh] border-[#444] bg-gradient-to-b from-black/80 via-[#3c3c3c]/80 to-black/80 hover:border-gray-400'
                                        }
                                    `}
                                >
                                    {!isEmpty && (
                                        <img 
                                            src={spritePath} 
                                            alt={veh.name}
                                            className={`
                                                w-auto h-[95%] max-w-[95%] object-contain pointer-events-none transition-all
                                                ${isActive ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] brightness-110' : 'brightness-90'}
                                            `}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                // Fallback text if image fails
                                                e.target.parentNode.innerText = veh.name;
                                                e.target.parentNode.style.color = 'white';
                                                e.target.parentNode.style.fontSize = '1.5vh';
                                                e.target.parentNode.style.fontWeight = 'bold';
                                            }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="h-[12vh] flex justify-between px-12 items-center relative z-20">
                <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                <button 
                    onClick={() => {navigate('/character'); playSfx(AUDIO_SFX.BACK_IN_MENU, 10);}}
                    className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                    <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                </button>
                <button 
                    onClick={() => { 
                        handleConfirm(); 
                        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10); 
                    }}
                    className="py-[1vh] px-[4vw] text-[2.5vh] font-bold rounded-full border-[0.3vh] border-white cursor-pointer uppercase shadow-md bg-[#00aeff] text-white hover:bg-[#33c2ff] transition-colors active:scale-95"
                >
                    OK
                </button>
            </div>
        </div>
    )
}