import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

export const Profile = () => {
    const navigate = useNavigate();
    const { playSfx } = useAudio();

    // Dati simulati del profilo (in un'app reale verrebbero dal backend/context)
    const [userStats] = useState({
        username: "PLAYER 1",
        friendCode: "3738-4261-1894",
        rank: "⭐⭐⭐",
        onlineWins: 65,    // Percentuale
        offlineWins: 82,   // Percentuale
        totalRaces: 1420,
        vr: 9999           // Versus Rating
    });

    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK);
        navigate('/menu');
    };

    const handleEdit = () => {
        playSfx(AUDIO_SFX.DECIDE);
        // Logica per modificare il profilo
        alert("Edit Profile coming soon!");
    };

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white">
            
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
                
                {/* HEADER CURVO */}
                <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                            <path 
                                d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" 
                                fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                        <div className="absolute bottom-15 left-12 z-20">
                            <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                                My License
                            </h1>
                        </div>
                    </div>
                    {/* Tasto Info */}
                    <div 
                        onClick={() => navigate('/info')}
                        className="absolute top-2 right-2 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                    >
                        <div className="relative w-16 h-16 md:w-20 md:h-20">
                            <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-[3px] border-white ring-[3px] ring-[#8899ff] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                                <span className="text-4xl text-white drop-shadow-md transform -rotate-12">🔧</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -left-3 bg-[#0088dd] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                            Info
                        </div>
                    </div>
                </div>

                {/* AREA CENTRALE */}
                <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
                    
                    {/* CARD PROFILO (Stile Patente MKWii) */}
                    <div className="w-full max-w-4xl bg-[#dcdcdc] border-4 border-gray-400 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-2 relative animate-in zoom-in duration-300 flex flex-col md:flex-row gap-2">
                        
                        {/* 1. SEZIONE SINISTRA: MII / AVATAR */}
                        <div className="w-full md:w-1/3 flex flex-col gap-2">
                            {/* Box Avatar */}
                            <div className="w-full aspect-square bg-[#002288] border-2 border-white/50 shadow-inner rounded relative overflow-hidden group cursor-pointer" onClick={handleEdit}>
                                {/* Pattern Griglia Blu Sfondo */}
                                <div className="absolute inset-0 opacity-30" 
                                     style={{backgroundImage: "repeating-linear-gradient(45deg, #001144 25%, transparent 25%, transparent 75%, #001144 75%, #001144), repeating-linear-gradient(45deg, #001144 25%, #002288 25%, #002288 75%, #001144 75%, #001144)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 10px 10px"}}>
                                </div>
                                
                                {/* Avatar (Placeholder) */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[120px] filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-300">
                                        👤
                                    </span>
                                </div>

                                {/* Edit Overlay */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold uppercase tracking-wider border-2 border-white px-3 py-1 rounded-full">Edit Mii</span>
                                </div>
                            </div>

                            {/* VR Rating Badge */}
                            <div className="bg-black/80 border-2 border-[#aa8800] rounded p-2 flex justify-between items-center shadow-md">
                                <span className="text-[#aa8800] font-bold text-xs uppercase">VR Rating</span>
                                <span className="text-white font-mono font-bold text-xl tracking-widest">{userStats.vr}</span>
                            </div>
                        </div>

                        {/* 2. SEZIONE DESTRA: DATI E STATISTICHE */}
                        <div className="flex-1 flex flex-col gap-2">
                            
                            {/* Header Nome (Stile Blu MKWii) */}
                            <div className="h-24 w-full bg-[#00008b] border-2 border-white/30 rounded flex flex-col justify-center px-6 relative overflow-hidden shadow-md">
                                {/* Pattern Sfondo */}
                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_25%,rgba(255,255,255,0.5)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.5)_75%,rgba(255,255,255,0.5)_100%)] bg-[length:4px_4px]"></div>
                                
                                <div className="flex justify-between items-end z-10">
                                    <div>
                                        <h2 className="text-4xl font-bold italic text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] uppercase tracking-wide">
                                            {userStats.username}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[#88aaff] text-xs font-bold uppercase tracking-widest">Friend Code:</span>
                                            <span className="text-white font-mono text-sm tracking-wider">{userStats.friendCode}</span>
                                        </div>
                                    </div>
                                    <div className="text-3xl filter drop-shadow-md" title="Rank">
                                        {userStats.rank}
                                    </div>
                                </div>
                            </div>

                            {/* Pannello Statistiche */}
                            <div className="flex-1 bg-[#222] border-2 border-gray-500 rounded p-4 flex flex-col justify-evenly shadow-inner relative">
                                {/* Sfondo rigato sottile */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                                     style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)"}}>
                                </div>

                                {/* Stat: Online Wins */}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[#00aeff] font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                            🌎 Online Win Rate
                                        </span>
                                        <span className="text-white font-mono font-bold text-lg">{userStats.onlineWins}%</span>
                                    </div>
                                    <div className="w-full h-6 bg-black border border-[#555] rounded-sm overflow-hidden relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#0055aa] to-[#00aeff] border-r-2 border-white shadow-[0_0_10px_#00aeff]"
                                            style={{width: `${userStats.onlineWins}%`}}
                                        ></div>
                                        {/* Griglia sopra la barra */}
                                        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-20"></div>
                                    </div>
                                </div>

                                {/* Stat: Offline Wins */}
                                <div className="relative z-10 mt-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[#ffcc00] font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                            👤 Offline Win Rate
                                        </span>
                                        <span className="text-white font-mono font-bold text-lg">{userStats.offlineWins}%</span>
                                    </div>
                                    <div className="w-full h-6 bg-black border border-[#555] rounded-sm overflow-hidden relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#aa8800] to-[#ffcc00] border-r-2 border-white shadow-[0_0_10px_#ffcc00]"
                                            style={{width: `${userStats.offlineWins}%`}}
                                        ></div>
                                    </div>
                                </div>

                                {/* Total Races (Footer Stats) */}
                                <div className="mt-6 pt-4 border-t border-gray-600 flex justify-between items-center z-10">
                                    <span className="text-gray-400 text-xs uppercase font-bold">Total Races Completed</span>
                                    <span className="text-white font-mono text-xl font-bold">{userStats.totalRaces}</span>
                                </div>

                            </div>
                        </div>

                        {/* Etichetta "New" o Stato (Decorativo) */}
                        <div className="absolute -top-3 -right-3 bg-[#0033cc] border-2 border-white text-white font-black text-xs px-3 py-1 transform rotate-12 shadow-lg z-20">
                            VERIFIED
                        </div>

                    </div>

                </div>

                {/* FOOTER / BACK BUTTON */}
                <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
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
        </div>
    );
};