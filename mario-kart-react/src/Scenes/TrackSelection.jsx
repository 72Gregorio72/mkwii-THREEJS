import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tracks } from '../components/Data'
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'
import { socket } from '../multiplayer/socket.js'
import { useGameDataStore, useGameStore, useRoomDataStore } from '../store.js'

export function TrackSelection() {

    const navigate = useNavigate();
    const { playSfx, changeTrack, enableSmoothLoop, getCurrentTrack } = useAudio();

    const { isHost: isHost } = useGameStore();
    const { roomCode: roomCode } = useRoomDataStore();
    const gameDataStore = useGameDataStore();

    useEffect(() => {
        if (getCurrentTrack() !== 'CHARACTER_KART_SELECT') {
            changeTrack('CHARACTER_KART_SELECT', 100);
            enableSmoothLoop();
        }
    }, [changeTrack, enableSmoothLoop]);

    const tracksList = Object.entries(Tracks).map(([name, data]) => ({
        name,
        ...data
    }));

    const [localSelection, setLocalSelection] = useState(tracksList[0]);
    const [waitingForHost, setWaitingForHost] = useState(false);

    // Check if track is already selected
    useEffect(() => {
        if (roomCode && socket && !isHost) {
            socket.emit('request_room_state', { roomCode });
            
            const handleRoomState = (data) => {
                if (data.roomCode === roomCode && data.isTrackSelected) {
                    const trackData = {
                        ...data.selectedTrack,
                        start_pos: data.selectedTrack.startPos || data.selectedTrack.start_pos || [0, 2, 0]
                    };
                    gameDataStore.setSelectedTrack(trackData);
                    navigate('/waiting');
                }
            };
            
            socket.on('room_state', handleRoomState);
            return () => socket.off('room_state', handleRoomState);
        }
    }, [roomCode, socket, isHost, navigate]);

    // Listen for host selection
    useEffect(() => {
        if (roomCode && socket) {
            const handleTrackSelected = (data) => {
                if (data.roomCode === roomCode) {
                    const trackData = {
                        ...data.track,
                        start_pos: data.track.startPos || data.track.start_pos || [0, 2, 0]
                    };
                    gameDataStore.setSelectedTrack(trackData);
                    navigate('/waiting');
                }
            };
            
            socket.on('track_selected', handleTrackSelected);
            return () => socket.off('track_selected', handleTrackSelected);
        }
    }, [roomCode, socket, navigate]);
    
    // Set waiting state for non-hosts
    useEffect(() => {
        if (roomCode && !isHost && socket) {
            setWaitingForHost(true);
            socket.emit('waiting_for_track', { roomCode });
        }
    }, [roomCode, isHost, socket]);

    const handleConfirm = () => {
        if (localSelection) {
            const trackData = {
                ...localSelection,
                start_pos: localSelection.startPos || localSelection.start_pos || [0, 2, 0]
            };
            
            if (roomCode && isHost && socket) {
                gameDataStore.setSelectedTrack(trackData);
                socket.emit('select_track', { roomCode, track: trackData });
            } else if (!roomCode) {
                gameDataStore.setSelectedTrack(trackData);
                navigate('/game');
            }
        }
    };

    return (
        // Container with Scanline Background
        <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
            
            {/* Header */}
            <div className="h-[8vh] bg-white flex items-center pl-[4vw] border-b-[0.6vh] border-[#aaddff] rounded-br-[50px] w-[55%] z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                <h1 className="text-[4vh] font-bold text-[#666] italic uppercase">
                    Select Track
                </h1>
            </div>
            
            {/* Waiting for Host State */}
            {waitingForHost ? (
                <div className="flex-1 flex flex-col justify-center items-center gap-5">
                    <h2 className="text-[4vh] text-[#ffe600] font-bold drop-shadow-md">
                        Waiting for host to select track...
                    </h2>
                    <div className="w-[60px] h-[60px] border-[5px] border-[#ffe600] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                {/* Content Area */}
                <div className="flex-1 flex justify-center items-start p-[2vh] md:p-[4vh] w-full overflow-hidden">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-y-[6vh] gap-x-[4vw] w-[95%] max-w-[1800px] h-full overflow-y-auto p-[2vh] custom-scrollbar content-start auto-rows-max">
                        {tracksList.map((track, index) => {
                            const isActive = localSelection && localSelection.name === track.name;
                            return (
                                <div 
                                    key={index} 
                                    onClick={() => {
                                        setLocalSelection(track);
                                        playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                                    }}
                                    onDoubleClick={handleConfirm}
                                    className={`
                                        aspect-video flex flex-col rounded-[1vh] cursor-pointer relative overflow-hidden transition-all duration-200 ease-out
                                        ${isActive 
                                            ? 'bg-gradient-to-br from-white/20 to-[#ffe600]/10 border-[0.4vh] border-[#ffe600] scale-105 shadow-[0_0_20px_rgba(255,230,0,0.5)] z-10' 
                                            : 'bg-white/5 border-[0.2vh] border-[#555] shadow-[0_5px_10px_rgba(0,0,0,0.5)] hover:border-gray-400'
                                        }
                                    `}
                                >
                                    {/* Image Box */}
                                    <div 
                                        className="flex-1 w-full bg-cover bg-center relative"
                                        style={{ backgroundImage: `url("${track.preview || '/placeholder_track.png'}")` }}
                                    >
                                        {!track.preview && (
                                            <div className="absolute top-[40%] w-full text-center opacity-50 font-bold">
                                                
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Label */}
                                    <div className={`
                                        h-[20%] min-h-[40px] bg-black/80 flex items-center justify-center text-[2.5vh] font-bold uppercase border-t border-[#444]
                                        ${isActive ? 'text-[#ffe600]' : 'text-white'}
                                    `}>
                                        {track.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="h-[12vh] flex justify-between px-12 items-center relative z-20">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    <button 
                        onClick={() => {navigate('/vehicle'); playSfx(AUDIO_SFX.BACK_IN_MENU, 10);}}
                        className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>
                    <button 
                        onClick={() => { handleConfirm(); playSfx(AUDIO_SFX.START_RACE, 10); }}
                        disabled={!localSelection}
                        className={`
                            py-[1vh] px-[3vw] text-[2.5vh] font-bold rounded-full border-[0.3vh] border-white cursor-pointer uppercase shadow-md transition-all active:scale-95
                            ${localSelection 
                                ? 'bg-[#00aeff] text-white hover:bg-[#33c2ff]' 
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }
                        `}
                    >
                        Start Race
                    </button>
                </div>
                </>
            )}

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.3);
                    border-radius: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ffe600;
                    border-radius: 5px;
                    border: 2px solid rgba(0,0,0,0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: white;
                }
            `}</style>
        </div>
    )
}