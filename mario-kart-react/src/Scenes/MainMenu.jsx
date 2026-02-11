import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'; // Decommenta se usi l'audio

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const MainMenu = () => {
    const navigate = useNavigate();
    const { playSfx } = useAudio();

    const handleNavigate = (path) => {
        playSfx(AUDIO_SFX.DECIDE);
        navigate(path);
    };

    return (
        <>
            <style>{mkwiiFontStyle}</style>
            
            {/* Main Container con Scanlines */}
            <div className="w-screen h-screen absolute top-0 left-0 flex flex-col overflow-hidden font-sans select-none text-white bg-[repeating-linear-gradient(0deg,#050505,#050505_2px,#111_2px,#111_4px)]">
                
                {/* Header Inclinato (Stile MKWii) */}
                <div className="h-[15vh] bg-white flex items-center pl-[5vw] border-b-[0.8vh] border-[#aaddff] rounded-br-[60px] w-[65%] z-10 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform -translate-x-2">
                    <h1 className="text-[6vh] font-black text-[#666] italic uppercase tracking-tighter drop-shadow-sm">
                        Mario Kart <span className="text-[#00aeff]">Three.js</span>
                    </h1>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex w-full relative">
                    
                    {/* Left Side (Decorativo / Spazio per 3D Model futuro) */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Cerchio decorativo di sfondo */}
                        <div className="w-[50vmin] h-[50vmin] border-[0.3vmin] border-white/5 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] animate-pulse"></div>
                        
                        {/* Testo decorativo */}
                        <div className="absolute transform -rotate-12 opacity-20 text-[10vh] font-black italic text-white leading-none pointer-events-none">
                            START<br/>YOUR<br/>ENGINES
                        </div>
                    </div>

                    {/* Right Side (Menu Buttons) */}
                    <div className="flex-1 flex flex-col justify-center items-end pr-[5vw] gap-6 z-20">
                        
                        {/* Multiplayer Button */}
                        <button 
                            onClick={() => handleNavigate('/room')}
                            className="group relative w-[400px] h-[100px] bg-gradient-to-l from-[#0284c7] to-[#0284c7]/50 rounded-l-full border-r-[8px] border-white/20 hover:border-white transition-all duration-300 transform hover:scale-105 hover:translate-x-[-10px] shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-end pr-8 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[url('/path/to/noise.png')] opacity-10"></div>
                            <div className="absolute left-[-20px] top-0 h-full w-[100px] bg-white/20 skew-x-[-20deg] group-hover:translate-x-[400px] transition-transform duration-700"></div>
                            
                            <div className="flex flex-col items-end z-10">
                                <span className="text-4xl font-black italic uppercase text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] group-hover:text-[#ffe600] transition-colors">
                                    Multiplayer
                                </span>
                                <span className="text-sm font-bold uppercase text-blue-200 tracking-widest">
                                    Online Race 🌎
                                </span>
                            </div>
                        </button>

                        {/* Solo Play Button */}
                        <button 
                            onClick={() => handleNavigate('/character')}
                            className="group relative w-[380px] h-[90px] bg-gradient-to-l from-[#16a34a] to-[#16a34a]/50 rounded-l-full border-r-[8px] border-white/20 hover:border-white transition-all duration-300 transform hover:scale-105 hover:translate-x-[-10px] shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-end pr-8 overflow-hidden"
                        >
                            <div className="absolute left-[-20px] top-0 h-full w-[100px] bg-white/20 skew-x-[-20deg] group-hover:translate-x-[400px] transition-transform duration-700"></div>
                            
                            <div className="flex flex-col items-end z-10">
                                <span className="text-3xl font-black italic uppercase text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] group-hover:text-[#ffe600] transition-colors">
                                    Solo Play
                                </span>
                                <span className="text-xs font-bold uppercase text-green-200 tracking-widest">
                                    Time Trial / VS 🏁
                                </span>
                            </div>
                        </button>

                        {/* Direct to Game (Dev) */}
                        <button 
                            onClick={() => handleNavigate('/game')}
                            className="group relative w-[300px] h-[70px] bg-gradient-to-l from-[#4b5563] to-[#4b5563]/50 rounded-l-full border-r-[6px] border-white/20 hover:border-[#fbbf24] transition-all duration-300 transform hover:scale-105 hover:translate-x-[-10px] shadow-lg flex items-center justify-end pr-8"
                        >
                            <div className="flex flex-col items-end z-10">
                                <span className="text-xl font-bold italic uppercase text-gray-200 group-hover:text-white transition-colors">
                                    Debug Race
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                    Direct to Scene 🛠️
                                </span>
                            </div>
                        </button>

                    </div>
                </div>

                {/* Footer Bar */}
                <div className="h-[10vh] bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center px-8 z-30">
                    
                    {/* Privacy / TOS Button */}
                    <button 
                        onClick={() => handleNavigate('/info')}
                        className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/30 bg-white/5 hover:bg-white/20 hover:border-white transition-all text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-white"
                    >
                        <span>ℹ️</span>
                        Privacy & Rules
                    </button>

                    <div className="text-gray-500 text-xs font-mono">
                        v1.0.0 Alpha
                    </div>
                </div>

            </div>
        </>
    );
};

export default MainMenu;