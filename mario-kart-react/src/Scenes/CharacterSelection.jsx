import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { RacerModel } from '../models/RacerModel'
import { AUDIO_SFX , useAudio } from '../audio/AudioManager.jsx'
import { useGameDataStore, useGameStore, useRoomDataStore } from '../store.js'
import { socket } from '../multiplayer/socket.js'

export function CharacterSelection({ availableCharacters, resetRoomState }) {
    const navigate = useNavigate();
    const { changeTrack, enableSmoothLoop, playSfx, fadeOutMusic } = useAudio();
    const [fadeToBlack, setFadeToBlack] = useState(false);

    const gameDataStore = useGameDataStore();
    const gameStore = useGameStore();
    
    const { roomCode: roomCode } = useRoomDataStore();

    useEffect(() => {
        changeTrack('CHARACTER_KART_SELECT', 100);
        enableSmoothLoop();
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

    const [localSelection, setLocalSelection] = useState(availableCharacters[0])

    const totalSlots = 24
    const gridSlots = Array.from({ length: totalSlots }).map((_, index) => {
        return index < availableCharacters.length ? availableCharacters[index] : null
    })

    const handleConfirm = () => {
        gameDataStore.setSelectedCharacter(localSelection)
        playSfx(AUDIO_SFX[localSelection.select_sfx] || AUDIO_SFX.SELECT_IN_MENU, 0.5);
        
        // Delay navigation to let the animation/sound play
        setTimeout(() => {
            navigate('/vehicle'); 
        }, 2000); 
    }

    return (
        // Main Container with Scanline Background
        <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
            
            {/* --- OVERLAY FADE TO BLACK */}
            <div 
                className={`fixed inset-0 bg-black z-[9999] pointer-events-none transition-opacity duration-700 ease-in-out ${fadeToBlack ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Header - Slanted Style */}
            <div className="h-[8vh] bg-white flex items-center pl-[4vw] border-b-[0.6vh] border-[#aaddff] rounded-br-[50px] w-[55%] z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                <h1 className="text-[4vh] font-bold text-[#666] italic uppercase">
                    Select Character
                </h1>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden items-center relative">
                
                {/* Left Panel: 3D Model & Name */}
                <div className="flex-[0.8] flex flex-col items-center justify-center relative h-full">
                    
                    {/* Circle Background */}
                    <div className="absolute w-[45vmin] h-[45vmin] border-[0.3vmin] border-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
                    
                    {/* 3D Canvas */}
                    <div className="w-full h-[55%] z-10 relative">
                        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
                            <ambientLight intensity={1} />
                            <Environment preset="sunset" />
                            <RacerModel 
                                characterConfig={localSelection.modelConfig} 
                                steer={0}
                                drift={0}
                                position={[0, -0.5, 0]} // Adjusted slightly for view
                                debug={true}
                                key={localSelection.id}
                                isInMenu={true}
                            />
                        </Canvas>
                    </div>

                    {/* Character Name Box */}
                    <div className="w-[90%] text-center bg-gradient-to-b from-black/90 to-black/60 border-[0.3vh] border-[#666] text-white py-[1.5vh] mt-[2vh] transform -skew-x-[10deg] shadow-lg">
                        <span className="block transform skew-x-[10deg] text-[5vh] font-bold drop-shadow-[3px_3px_0_#000] tracking-[2px]">
                            {localSelection.name}
                        </span>
                    </div>
                </div>

                {/* Right Panel: Grid Selection */}
                <div className="flex-[1.2] flex items-center justify-center h-full w-full p-[2vmin]">
                    <div className="grid grid-cols-4 grid-rows-6 gap-x-[1.5vmin] gap-y-[1.2vmin] w-[85%] h-[85%] max-h-full">
                        {gridSlots.map((char, index) => {
                            const isEmpty = !char;
                            const isActive = char && localSelection.name === char.name;

                            return (
                                <div 
                                    key={index} 
                                    onClick={() => {
                                        if (!isEmpty) {
                                            setLocalSelection(char);
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
                                            src={char.sprite} 
                                            alt={char.name} 
                                            className={`
                                                w-auto h-[95%] max-w-[95%] object-contain transition-all
                                                ${isActive ? 'brightness-110 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'brightness-90 opacity-80'}
                                            `}
                                            onError={(e) => e.target.style.display='none'}
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
                    onClick={() => {
                        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
                        setFadeToBlack(true);
                        fadeOutMusic(700);
                        if (socket) {
                            socket.emit('leave_room', { roomCode });
                            resetRoomState();
                        }
                        setTimeout(() => navigate('/menu'), 700);
                    }}
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