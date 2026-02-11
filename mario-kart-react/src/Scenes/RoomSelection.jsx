import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'; // Uncomment if using audio

// Optional: Keep font face if needed, or rely on tailwind font-sans
const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const RoomSelection = ({ onCreateRoom, onJoinRoom, socket, setSelectedTrack }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();
  // const { playSfx } = useAudio();

  // Listen for room_state
  useEffect(() => {
    if (socket) {
      const handleRoomState = (data) => {
          navigate('/character');
      };
      
      socket.on('room_state', handleRoomState);
      return () => socket.off('room_state', handleRoomState);
    }
  }, [socket, navigate, setSelectedTrack]);

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(code);
    // playSfx(AUDIO_SFX.DECIDE);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
      // playSfx(AUDIO_SFX.DECIDE);
    }
  };

  const handleBack = () => {
      // playSfx(AUDIO_SFX.BACK);
      if (showJoinInput) {
          setShowJoinInput(false);
          setRoomCode('');
      } else {
          navigate('/');
      }
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      
      {/* Main Container with Scanlines */}
      <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
        
        {/* Slanted Header */}
        <div className="h-[8vh] bg-white flex items-center pl-[4vw] border-b-[0.6vh] border-[#aaddff] rounded-br-[50px] w-[55%] z-10 shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
            <h1 className="text-[4vh] font-bold text-[#666] italic uppercase">
                Multiplayer Mode
            </h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            
            {/* Background Circle Decoration */}
            <div className="absolute w-[60vmin] h-[60vmin] border-[0.3vmin] border-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

            {/* Main Interaction Card */}
            <div className="relative z-10 w-full max-w-lg flex flex-col gap-6">
                
                {/* Mode Selection */}
                {!showJoinInput ? (
                    <>
                        <button
                            onClick={handleCreateRoom}
                            className="group w-full py-6 rounded-2xl border-b-[6px] border-[#15803d] bg-[#22c55e] text-white active:border-b-0 active:translate-y-[6px] transition-all relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:brightness-110"
                        >
                            <span className="text-3xl font-black italic uppercase tracking-wider drop-shadow-md flex items-center justify-center gap-3">
                                🏁 Create Room
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                        </button>

                        <button
                            onClick={() => setShowJoinInput(true)}
                            className="group w-full py-6 rounded-2xl border-b-[6px] border-[#075985] bg-[#0284c7] text-white active:border-b-0 active:translate-y-[6px] transition-all relative overflow-hidden shadow-[0_0_20px_rgba(2,132,199,0.4)] hover:brightness-110"
                        >
                            <span className="text-3xl font-black italic uppercase tracking-wider drop-shadow-md flex items-center justify-center gap-3">
                                🚪 Join Room
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                        </button>
                    </>
                ) : (
                    /* Join Input Mode */
                    <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
                        <div className="bg-black/40 p-6 rounded-2xl border-2 border-white/10 backdrop-blur-sm">
                            <label className="block text-center text-[#fbbf24] text-xl font-bold uppercase tracking-widest mb-4 drop-shadow-md">
                                Enter Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={6}
                                autoFocus
                                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 rounded-xl border-4 border-[#fbbf24] bg-white text-black focus:outline-none focus:shadow-[0_0_30px_#fbbf24] transition-shadow placeholder-gray-300 uppercase"
                            />
                        </div>

                        <button
                            onClick={handleJoinRoom}
                            disabled={!roomCode.trim()}
                            className={`
                                w-full py-5 rounded-2xl border-b-[6px] text-2xl font-black uppercase tracking-wider transition-all
                                ${roomCode.trim() 
                                    ? 'bg-[#0284c7] border-[#075985] text-white shadow-[0_0_20px_rgba(2,132,199,0.4)] hover:brightness-110 active:border-b-0 active:translate-y-[6px] cursor-pointer' 
                                    : 'bg-gray-600 border-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                                }
                            `}
                        >
                            Connect
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Footer with Back Button */}
        <div className="h-[10vh] flex justify-center items-center bg-gradient-to-t from-black/90 to-transparent z-20">
            <button
                onClick={handleBack}
                className="py-[1vh] px-[6vw] text-[2.5vh] font-bold rounded-full border-[0.3vh] border-white cursor-pointer uppercase shadow-md bg-[#ccc] text-[#333] hover:bg-white transition-all active:scale-95"
            >
                Back
            </button>
        </div>

      </div>
    </>
  );
};