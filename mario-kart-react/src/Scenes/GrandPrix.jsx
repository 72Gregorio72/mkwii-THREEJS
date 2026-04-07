import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grandPrixList } from '../components/Data.jsx';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { useGameDataStore } from '../store.js';

export const GrandPrix = () => {
    const navigate = useNavigate();
    const { playSfx, fadeOutMusic , changeTrack, enableSmoothLoop , getCurrentTrack } = useAudio();
    const [fadeToBlack, setFadeToBlack] = useState(false);

    const gameDataStore = useGameDataStore();

    useEffect(() => {
    if (getCurrentTrack() !== 'MENU') {
        changeTrack('MENU', 100);
        enableSmoothLoop();
    }
    }, [changeTrack, enableSmoothLoop]);


    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        navigate(-1);
    };

    const handleSelectCup = (cupId) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        gameDataStore.setSelectedGrandPrix(grandPrixList.find((gp) => gp.id == cupId));
        setFadeToBlack(true);
        fadeOutMusic(700);
        setTimeout(() => {
            navigate('/character');
        }, 700); 
    };

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white flex flex-col">
            
            {/* --- OVERLAY FADE TO BLACK */}
            <div 
                className={`fixed inset-0 bg-black z-[9999] pointer-events-none transition-opacity duration-700 ease-in-out ${fadeToBlack ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* 1. BACKGROUND LAYER */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center scale-110"
                style={{ 
                    backgroundImage: "url('/sprites/TitleScreen.jpg')",
                    filter: "blur(6px)"
                }}
            />

            {/* 2. SCANLINES OVERLAY */}
            <div 
                className="absolute inset-0 z-10 opacity-80"
                style={{
                    background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)"
                }}
            />

            {/* 3. UI CONTENT */}
            <div className="relative z-20 w-full h-full flex flex-col">
                
                {/* HEADER CURVO (Stile MKWii) */}
                <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                            <path 
                                d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" 
                                fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                        <div className="absolute bottom-15 left-12 z-20">
                            <h1 className="text-4xl md:text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                                Select Cup
                            </h1>
                        </div>
                    </div>
                </div>

                {/* TASTO PROFILE / LICENSE (Destra) */}
                <div 
                    onClick={() => {
                        playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                        navigate('/profile');
                    }}
                    className="absolute top-18 right-28 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16">
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#22cc22] to-[#008800] border-[3px] border-white ring-[3px] ring-[#00aa00] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">👤</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-1 bg-[#008800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        License
                    </div>
                </div>

                {/* TASTO SETTINGS / INFO (Destra Estrema) */}
                <div 
                    onClick={() => {
                        playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                        navigate('/info');
                    }}
                    className="absolute top-2 right-4 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-16 h-16 md:w-20 md:h-20">
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-[3px] border-white ring-[3px] ring-[#8899ff] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-4xl text-white drop-shadow-md transform -rotate-12 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">🔧</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -left-3 bg-[#0088dd] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        Info
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/friends')}
                    className="absolute top-26 right-52 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16">
                        {/* Halo */}
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        
                        {/* Cerchio Giallo Lucido */}
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#ffcc00] to-[#aa8800] border-[3px] border-white ring-[3px] ring-[#cc9900] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            {/* Riflesso */}
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                🌍
                            </span>
                        </div>
                    </div>

                    {/* Label 'Friends' */}
                    <div className="absolute -bottom-2 -right-1 bg-[#aa8800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        Friends
                    </div>
                </div>

                {/* AREA CENTRALE: SELEZIONE GRAN PREMI */}
                <div className="flex-1 min-h-0 flex items-center justify-center pt-[22vh] pb-2 px-8 w-full z-20">
                    
                    <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 justify-center items-stretch h-full max-h-[70vh]">
                        
                        {grandPrixList.map((cup) => (
                            <div 
                                key={cup.id}
                                onClick={() => handleSelectCup(cup.id)}
                                className="flex-1 bg-black/80 border-[5px] border-[#aa8800] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center p-4 relative group cursor-pointer hover:border-[#ffcc00] hover:bg-black/90 transition-all duration-300 transform hover:-translate-y-2"
                            >
                                <div className="absolute inset-0 opacity-10 pointer-events-none rounded-xl" 
                                     style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                                </div>

                                {/* ICONA DEL TROFEO */}
                                <div className="relative w-26 h-26 md:w-40 md:h-40 mb-3 mt-1 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-white/30 scale-125 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className={`w-full h-full rounded-full bg-gradient-to-b ${cup.bgColor} border-4 border-white ring-4 ${cup.ringColor} shadow-[0_10px_20px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                                        <div className="absolute top-0 left-0 w-full h-[45%] bg-white/40 rounded-b-[100px]"></div>
                                        {/* Icona leggermente più piccola per schermi base */}
                                        <span className="text-[50px] md:text-[60px] drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] z-10 transform group-hover:rotate-12 transition-transform duration-300">
                                            {cup.icon}
                                        </span>
                                    </div>
                                </div>

                                {/* NOME DEL TROFEO - Altezza minima ridotta a 4.5rem e testo un po' più piccolo */}
                                <h2 className="min-h-[4.5rem] flex items-center justify-center text-2xl md:text-3xl font-black text-[#ffcc00] uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)] mb-2 italic border-b-2 border-[#aa8800]/50 pb-2 w-full text-center leading-tight">
                                    {cup.name}
                                </h2>

                                {/* LISTA DELLE 4 PISTE */}
                                <div className="w-full flex-1 flex flex-col gap-1.5 justify-start z-10 mb-2 overflow-y-auto custom-scrollbar">
                                    {cup.tracks.map((track, index) => (
                                        <div 
                                            key={index}
                                            /* Altezza minima ridotta a 3.5rem e padding aggiustati */
                                            className="w-full min-h-[3.5rem] bg-gradient-to-r from-black/60 to-transparent border-l-4 border-gray-500 group-hover:border-[#ffcc00] px-2 py-1.5 rounded-r transition-colors duration-300 flex items-center"
                                        >
                                            <span className="text-[#88aaff] font-mono font-bold mr-2 opacity-70 shrink-0 text-sm md:text-base">
                                                {index + 1}.
                                            </span>
                                            {/* Testo delle piste un po' più compatto */}
                                            <span className="text-base md:text-lg font-bold tracking-wide text-white drop-shadow-md leading-tight">
                                                {track}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* "SELEZIONA" OVERLAY */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0088dd] border-2 border-white px-6 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg transform translate-y-4 group-hover:translate-y-0 z-20">
                                    <span className="font-bold uppercase tracking-widest text-sm drop-shadow-md">Press A</span>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* FOOTER / BACK BUTTON - Aggiunto shrink-0 per evitare schiacciamenti */}
                <div className="h-[12vh] w-full flex items-center px-12 relative z-30 shrink-0">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>
                </div>

            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #88aaff; }
            `}</style>
        </div>
    );
};