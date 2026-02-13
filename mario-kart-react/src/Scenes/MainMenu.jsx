import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

// Componente per il singolo Pulsante del Menu (Stile MKWii Options)
const MenuButton = ({ title, onClick, icon, color = "default" }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative w-full max-w-2xl h-20 md:h-24 bg-black/60 border-y-2 border-x-4 border-[#aa8800] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                       flex items-center justify-between px-8 overflow-hidden transition-all duration-200 
                       hover:scale-105 hover:border-[#ffeebb] hover:shadow-[0_0_15px_rgba(255,215,0,0.6)] hover:bg-black/70"
        >
            {/* Effetto bagliore interno dorato su hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            
            {/* Contenitore Icona (Sinistra) */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-[#886600] group-hover:border-[#ffcc00] shadow-inner">
                <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
            </div>

            {/* Testo Centrale */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold font-sans text-[#ddccaa] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase group-hover:text-white transition-colors">
                    {title}
                </span>
            </div>

            {/* Decorazione Destra (Freccia o simbolo) */}
            {/* <div className="w-8 flex justify-center">
                <div className="w-3 h-3 border-t-4 border-r-4 border-[#aa8800] rotate-45 group-hover:border-[#ffcc00] group-hover:translate-x-1 transition-all"></div>
            </div> */}
        </button>
    );
};

 ////  0,7 fadeout menu, 0.3 balck screen, start character select music
export const MainMenu = () => {
    const navigate = useNavigate();    
    // Stato per gestire il fade to black
    const [fadeToBlack, setFadeToBlack] = useState(false);
    const { playSfx, changeTrack, enableSmoothLoop, getCurrentTrack , fadeOutMusic } = useAudio();

    useEffect(() => {
        if (getCurrentTrack() !== 'MENU') {
            changeTrack('MENU', 100);
            enableSmoothLoop();
        }
        enableSmoothLoop();
    }, [changeTrack, enableSmoothLoop]);

    const handleNavigate = (path) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);

        // Se è Single Player (/character), fai il fade out nero
        if (path === '/character') {
            setFadeToBlack(true);
            fadeOutMusic(700);
            setTimeout(() => {
                navigate(path);
            }, 700); // 0.7 secondi
        } else {
            // Altrimenti naviga subito (Multiplayer, Debug, Back)
            navigate(path);
        }
    };

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none">
            
            {/* --- OVERLAY FADE TO BLACK*/}
            <div 
                className={`fixed inset-0 bg-black z-[9999] pointer-events-none transition-opacity duration-700 ease-in-out ${fadeToBlack ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* 1. SFONDO SFUOCATO DIETRO */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center scale-110"
                style={{ 
                    backgroundImage: "url('/sprites/TitleScreen.jpg')",
                    filter: "blur(6px)"
                }}
            />

            {/* 2. OVERLAY BIANCO "SCANLINES" (Stile Wii) */}
            <div 
                className="absolute inset-0 z-10 opacity-80"
                style={{
                    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)"
                }}
            />

            {/* 3. CONTENUTO UI */}
            <div className="relative z-20 w-full h-full flex flex-col">
                
                {/* Header Superiore Stile Mario Kart Wii */}
                <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                    
                    {/* SFONDO SVG PER LA FORMA ESATTA */}
                    <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                        <svg 
                            viewBox="0 0 100 100" 
                            preserveAspectRatio="none" 
                            className="w-full h-[85%]" 
                        >
                            <path 
                                d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" 
                                fill="white" 
                                stroke="#8899ff" 
                                strokeWidth="1.2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                        
                        {/* Titolo */}
                        <div className="absolute bottom-15 left-12 z-20">
                            <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                                Main Menu
                            </h1>
                        </div>
                    </div>

                    {/* BOTTONE SETTINGS (Posizionato nella curva) */}
                    <div 
                        onClick={() => handleNavigate('/info')}
                        className="absolute top-2 right-2 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                    >
                        <div className="relative w-16 h-16 md:w-20 md:h-20">
                            <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>

                            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-[3px] border-white ring-[3px] ring-[#8899ff] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                                <span className="text-4xl text-white drop-shadow-md transform -rotate-12 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                    🔧
                                </span>
                            </div>
                        </div>

                        <div className="absolute -bottom-1 -left-3 bg-[#0088dd] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                            Info
                        </div>
                    </div>
                </div>

                {/* LISTA PULSANTI CENTRALI (Verticale) */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 w-full">
                    
                    {/* Pulsante Single Player */}
                    <MenuButton 
                        title="Single Player" 
                        icon="👤" 
                        onClick={() => handleNavigate('/character')} 
                    />
                    
                    <MenuButton 
                        title="Multiplayer" 
                        icon="🌎" 
                        onClick={() => handleNavigate('/room')} 
                    />
                    
                    <MenuButton 
                        title="Debug Race" 
                        icon="🛠️" 
                        onClick={() => handleNavigate('/game')} 
                    />

                    <MenuButton 
                        title="Register" 
                        icon="🛠️" 
                        onClick={() => handleNavigate('/register')} 
                    />

                </div>

                {/* Footer / Tasto Back */}
                <div className="h-[12vh] w-full flex items-center px-12 relative">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    
                    <button 
                        onClick={() => handleNavigate('/')}
                        className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>
                </div>

            </div>
        </div>
    );
};