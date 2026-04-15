import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { Tracks } from '../components/Data.jsx';
import { formatTime } from '../ui/GameHUD.jsx';
import { useUserStore, useGameDataStore } from '../store.js'; 
import { socket } from '../multiplayer/socket.js';
import { grandPrixList } from '../components/Data.jsx';

const AVAILABLE_ICONS = [
    "BabyDaisy.png",
    "BabyLuigi.png",
    "BabyMario.png",
    "BabyPeach.png",
    "Birdo.png",
    "Bowser.png",
    "BowserJr.png",
    "Daisy.png",
    "DiddyKong.png",
    "DonkeyKong.png",
    "DryBones.png",
    "DryBowser.png",
    "FunkyKong.png",
    "KingBoo.png",
    "KoopaTroopa.png",
    "Luigi.png",
    "Mario.png",
    "Peach.png",
    "Rosalina.png",
    "Toad.png",
    "Toadette.png",
    "Waluigi.png",
    "Wario.png",
    "Yoshi.png"
].sort();

export const Stats = ({ userName }) => {
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [bestTime, setBestTime] = useState(null);
    const [showBestTime, setShowBestTime] = useState(false);
	const { playSfx } = useAudio();

    const handleSelectTrack = (trackName) => {
		playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        setSelectedTrack(trackName);
        fetch(`/api/getRecordTime?userName=${userName}&trackName=${trackName}`)
        .then(response => {
            return response.text().then(text => {
                return text ? JSON.parse(text) : null; 
            });
        })
        .then(data => {
            if (data) {
                setBestTime(data.time);
            } else {
                setBestTime(null);
            }
            setShowBestTime(true); 
        })
        .catch(error => {
            console.error('Errore durante il recupero del tempo:', error);
            setBestTime(null);
            setShowBestTime(true); 
        });
    };

    return (
        <div className="flex-1 min-h-0 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full relative z-20">
            
            <div className="bg-gradient-to-b from-[#000050] to-[#000060] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 w-full max-w-6xl flex flex-col gap-4 relative animate-in zoom-in duration-300 max-h-full">
            
                <h2 className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] stroke-black tracking-wide z-10 uppercase text-center mb-2">
                    {showBestTime ? "Track Record" : "Select Track Record"}
                </h2>

                <div className="flex flex-col gap-4 relative z-10 h-full">
                    
                    {/* VISTA DETTAGLIO RECORD */}
                    {showBestTime && selectedTrack ? (
                        <div className="flex flex-col items-center gap-6 p-4 bg-[#222]/50 rounded-lg inner-shadow">
                            
                            {/* Nome Pista */}
                            <h3 className="text-4xl font-bold text-[#ffff00] drop-shadow-md uppercase tracking-wider text-center border-b-2 border-white/20 pb-2 w-full">
                                {selectedTrack}
                            </h3>

                            <div className="flex flex-col md:flex-row gap-8 items-center w-full max-w-4xl">
                                {/* Preview Immagine Grande */}
                                <div className="flex-1 w-full aspect-video border-4 border-[#8899ff] rounded-lg shadow-lg overflow-hidden relative">
                                    <img 
                                        src={Tracks[selectedTrack].preview} 
                                        alt={selectedTrack} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                </div>

                                {/* Box Statistiche */}
                                <div className="flex-1 w-full flex flex-col gap-6">
                                    <div className="bg-gradient-to-b from-[#0000aa] to-[#000066] border-4 border-white rounded-xl p-6 shadow-inner text-center">
                                        <span className="block text-[#88aaff] text-sm uppercase font-bold tracking-widest mb-2">
                                            Current Record
                                        </span>
                                        <span className="text-5xl font-mono font-black text-[#ffff00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                            {bestTime ? `${formatTime(bestTime).minutes}:${formatTime(bestTime).seconds}:${formatTime(bestTime).milliseconds}` : "--:--:---"}
                                        </span>
                                    </div>

                                    {/* Bottone per tornare alla griglia all'interno del componente */}
                                    <button 
                                        onClick={() => {
                                            setShowBestTime(false);
                                            playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
                                        }}
                                        className="w-full py-4 bg-[#444] border-2 border-[#888] rounded-full text-white font-bold text-xl uppercase tracking-wider hover:bg-[#555] active:scale-95 transition-all shadow-md"
                                    >
                                        Back to Tracks
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* GRIGLIA DI SELEZIONE PISTE */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-[#222]/50 rounded-lg inner-shadow overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {Object.keys(Tracks).map((trackName) => {
                                const trackData = Tracks[trackName];

                                return (
                                    <div 
                                        key={trackName}
                                        onClick={() => handleSelectTrack(trackName)}
                                        className="group relative aspect-video rounded-lg cursor-pointer overflow-hidden border-[3px] border-transparent hover:border-white hover:scale-105 bg-gradient-to-b from-black/80 to-black/40 transition-all duration-100"
                                    >
                                        <img 
                                            src={trackData.preview} 
                                            alt={trackName} 
                                            className="w-full h-full object-cover filter brightness-75 group-hover:brightness-100 transition-all duration-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-800');
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 pointer-events-none transition-opacity group-hover:opacity-100"></div>
                                        <div className="absolute bottom-1 left-0 w-full text-center pointer-events-none p-1">
                                            <span className="text-white font-bold text-sm tracking-wider uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                                                {trackName}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #0088dd; border: 1px solid #fff; border-radius: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #44ccff; }
            `}</style>
        </div>
    );
};


export const Profile = ({ setLoggedIn, setUsername }) => {
    const navigate = useNavigate();
    const { playSfx } = useAudio();
    
    // Stores
    const {isLoggedIn: isLoggedIn, userName: userName} = useUserStore();

    const [data, setData] = useState(null);
    const [edit, setEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [updateError, setUpdateError] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Stato per i ranking dei Grand Prix divisi per CC
    const [gpRankings, setGpRankings] = useState({ 50: {}, 100: {}, 150: {} });

    // Dati simulati statistiche base
    const [userStats] = useState({
        onlineWins: 65,
        offlineWins: 82
    });

    const [formData, setFormData] = useState({
        icon: AVAILABLE_ICONS[0],
        onlineWins: 0,
        offlineWins: 0
    });

    // 1. Fetch Profile Data
    useEffect(() => {
        if (!isLoggedIn || !userName) return;
        fetch(`/api/profile?userName=${userName}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then((json) => {
            const updatedData = {
                ...json,
                fullIconPath: `./sprites/${json.icon}`,
                onlineWins: json.onlineWins || 0,
                offlineWins: json.offlineWins || 0 
            };
            setData(updatedData);
            setFormData({ 
                icon: json.icon || AVAILABLE_ICONS[0],
                onlineWins: json.onlineWins || 0,
                offlineWins: json.offlineWins || 0
            });
        })
        .catch((err) => console.error("Fetch error profile:", err));
    }, [userName, isLoggedIn]);

    // 2. Fetch Grand Prix Rankings diviso in 50cc, 100cc, 150cc
    useEffect(() => {
        if (!isLoggedIn || !userName || grandPrixList.length === 0) return;
        
        const fetchRankings = async () => {
            try {
                const res = await fetch(`/api/getGrandPrixRanking?userName=${userName}`);
                if (res.ok) {
                    const data = await res.json();
                    const bestRankings = { 50: {}, 100: {}, 150: {} };
                    
                    data.forEach(gpRecord => {
                        const gpName = gpRecord.name || gpRecord.grandPrixName || gpRecord.cupName;
                        const gpRank = gpRecord.rank || gpRecord.ranking || gpRecord.position;
                        const ccsValue = gpRecord.ccs;

                        
                        let ccCategory = null;
                        if (ccsValue == 30) ccCategory = 50;
                        else if (ccsValue == 35) ccCategory = 100;
                        else if (ccsValue == 40) ccCategory = 150;
                        
                        if (gpName && gpRank && ccCategory) {
                            const currentRank = parseInt(gpRank, 10);
                            
                            if (!bestRankings[ccCategory][gpName] || currentRank < bestRankings[ccCategory][gpName]) {
                                bestRankings[ccCategory][gpName] = currentRank;
                            }
                        }
                    });
                    
                    setGpRankings(bestRankings);
                }
            } catch(e) {
                console.error("Error fetching Grand Prix Rankings:", e);
            }
        };
        
        fetchRankings();
    }, [userName, isLoggedIn, grandPrixList]);

    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        if (edit) {
            setEdit(false);
        } else if (showStats) {
            setShowStats(false);
        } else {
            navigate('/menu');
        }
    };

    const handleStats = () => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        setShowStats(true);
    };

    const handleLogout = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10); 
        if (setLoggedIn) setLoggedIn(false);
        navigate('/');
    };

    const handleChangeIcon = () => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        setEdit(true); 
    };

    const handleSelectIcon = (iconName) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        setFormData({ ...formData, icon: iconName });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/updateIcon?userName=${userName}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    icon: formData.icon
                }),
            });

            if (!response.ok) {
                throw new Error('Errore durante l\'aggiornamento');
            }

            const updatedUser = await response.json();

            setData(prev => ({
                ...prev,
                icon: formData.icon,
                fullIconPath: `./sprites/${formData.icon}`,
                onlineWins: updatedUser.onlineWins || prev.onlineWins,
                offlineWins: updatedUser.offlineWins || prev.offlineWins
            }));

            setEdit(false);

        } catch (error) {
            console.error("Errore update:", error);
            alert("Impossibile aggiornare l'icona. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUsername = async (e) => {
        if (e.key === 'Enter') {
            const trimmedName = newUsername.trim();
            if (!trimmedName || trimmedName === data?.username) {
                setIsEditingUsername(false);
                return; 
            }

            try {
                const response = await fetch(`/api/updateusername?userName=${userName}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ newUsername: trimmedName }),
                });

                if (!response.ok) {
                    if (response.status === 409) {
                        throw new Error("Username already taken!");
                    }
                    throw new Error("Failed to update username.");
                }

                const resData = await response.json(); 

                if (resData.token) {
                    sessionStorage.setItem('accessToken', resData.token);
                    
                    if (socket) {
                        socket.disconnect();
                        socket.connect();
                    }
                }

                setData(prev => ({
                    ...prev,
                    username: trimmedName
                }));
                setUsername(trimmedName);
                setIsEditingUsername(false);

            } catch (error) {
                console.error("Errore update username:", error);
                setUpdateError(error.message || "Impossibile aggiornare lo username.");
                setTimeout(() => setUpdateError(null), 3000);
            }
        } else if (e.key === 'Escape') {
            setIsEditingUsername(false);
            setUpdateError(null);
        }
    };

    const confirmDeleteAccount = async () => {
            playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
            setIsDeleting(true);

            try {
                const response = await fetch(`/api/deleteUser?userName=${userName}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error("Errore durante l'eliminazione dell'account");
                }

                if (setLoggedIn) {
                    setLoggedIn(); 
                }
                
                navigate('/');

            } catch (error) {
                console.error("Errore eliminazione account:", error);
                alert("Impossibile eliminare l'account. Riprova più tardi.");
                setIsDeleting(false);
                setShowDeleteConfirm(false);
            }
        };

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white">
            
            {/* BACKGROUND LAYERS */}
            <div className="absolute inset-0 z-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/sprites/TitleScreen.jpg')", filter: "blur(6px)" }} />
            <div className="absolute inset-0 z-10 opacity-80" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)" }} />

            {/* UI CONTENT */}
            <div className="relative z-20 w-full h-full flex flex-col">
                
                {/* HEADER */}
                <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                            <path d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div className="absolute bottom-15 left-12 z-20">
                            <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">My License</h1>
                        </div>
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/info')}
                    className="absolute top-2 right-4 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
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

                {/* --- Messaggio di Errore Update Username --- */}
                {updateError && (
                    <div className="absolute top-[20vh] left-0 w-full flex justify-center z-[100] animate-pulse px-4 pointer-events-none">
                        <div className="bg-gradient-to-b from-[#ff6666] to-[#cc0000] border-2 border-white rounded-lg shadow-[0_0_15px_#ff0000] px-6 py-3 flex items-center gap-3 pointer-events-auto">
                            <div className="bg-white text-[#cc0000] rounded-full w-8 h-8 min-w-[32px] flex items-center justify-center font-black text-xl shadow-inner border border-gray-300">!</div>
                            <span className="text-white font-bold uppercase tracking-wide drop-shadow-md text-sm md:text-lg">
                                {updateError}
                            </span>
                        </div>
                    </div>
                )}

                {/* VISTA PROFILO (READ ONLY) */}
                {!edit && !showStats &&(
                    <div className="flex-1 min-h-0 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
                        <div className="bg-gradient-to-b from-[#000050] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3 w-full max-w-3xl flex gap-3 relative animate-in zoom-in duration-300">
                            
                            {/* COLONNA SINISTRA */}
                            <div className="w-48 flex flex-col gap-3">
                                <div className="w-full aspect-square border-4 border-[#ffff] shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0" 
                                         style={{
                                            backgroundImage: "conic-gradient(#000088 90deg, #000044 90deg 180deg, #000088 180deg 270deg, #000044 270deg)",
                                            backgroundSize: "24px 24px"
                                         }}>
                                    </div>
                                    <div className="absolute inset-0 flex items-end justify-center">
                                         {data?.fullIconPath ? (
                                            <img 
                                                src={data.fullIconPath} 
                                                alt="Mii" 
                                                className="h-[115%] w-auto object-contain object-bottom filter drop-shadow-lg" 
                                            />
                                        ) : (
                                            <span className="text-8xl pb-2">👤</span>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleLogout} 
                                    className="group relative w-full py-2 bg-gradient-to-b from-[#ff4444] to-[#aa0000] border-2 border-white/50 rounded shadow flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                    <span className="w-5 h-5 bg-white text-[#aa0000] rounded-full flex items-center justify-center font-bold text-xs group-hover:rotate-180 transition-transform relative z-10">➜</span>
                                    <span className="font-bold text-sm uppercase tracking-wider text-white relative z-10">Logout</span>
                                </button>

                                <button 
                                    onClick={handleChangeIcon} 
                                    className="group relative w-full py-2 bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-2 border-white/50 rounded shadow flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                    <span className="font-bold text-sm uppercase tracking-wider text-white relative z-10">Edit Icon</span>
                                </button>

                                <button 
                                    onClick={handleStats} 
                                    className="group relative w-full py-2 bg-gradient-to-b from-[#44ccff] to-[#0088dd] border-2 border-white/50 rounded shadow flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                    <span className="font-bold text-sm uppercase tracking-wider text-white relative z-10">Stats</span>
                                </button>

                            </div>

                            {/* COLONNA DESTRA */}
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="w-full h-24 border-4 border-[#ffff] shadow-md flex items-center justify-center px-6 relative overflow-hidden"
                                     style={{
                                        backgroundImage: "conic-gradient(#000088 90deg, #000044 90deg 180deg, #000088 180deg 270deg, #000044 270deg)",
                                        backgroundSize: "24px 24px"
                                     }}>
                                    
                                    {isEditingUsername ? (
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            onKeyDown={handleUpdateUsername}
                                            onBlur={() => setIsEditingUsername(false)}
                                            autoFocus
                                            maxLength={15}
                                            className="text-4xl font-black text-[#ffff00] italic drop-shadow-[3px_3px_0_#000000] stroke-black tracking-wide z-10 bg-black/40 border-b-4 border-white text-center w-full outline-none px-2 py-1 rounded-md"
                                        />
                                    ) : (
                                        <h2 
                                            onDoubleClick={() => {
                                                setNewUsername(data?.username || "Player");
                                                setIsEditingUsername(true);
                                            }}
                                            title="Double click to edit"
                                            className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] stroke-black tracking-wide z-10 cursor-text hover:text-[#ffff00] transition-colors duration-200"
                                        >
                                            {data?.username || "Player"}
                                        </h2>
                                    )}

                                </div>

                                <div className="flex-1 bg-[#222] border-4 border-[#ffff] shadow-inner p-4 grid grid-cols-2 gap-4 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(0deg,white_0px,white_1px,transparent_1px,transparent_3px)]"></div>
                                    
                                    {/* GRAND PRIX RANKINGS (MARIO KART WII STYLE GRID) */}
                                    <div className="col-span-2 border-[4px] border-[#c0c0c0] bg-[#e0e0e0] rounded-sm p-[2px] shadow-[2px_2px_5px_rgba(0,0,0,0.5)] z-10 relative">
                                        <div className="w-full border-[2px] border-[#555] flex flex-col font-sans"
                                             style={{
                                                 backgroundImage: "linear-gradient(45deg, #0000d0 25%, transparent 25%, transparent 75%, #0000d0 75%, #0000d0), linear-gradient(45deg, #0000d0 25%, transparent 25%, transparent 75%, #0000d0 75%, #0000d0)",
                                                 backgroundSize: "8px 8px",
                                                 backgroundPosition: "0 0, 4px 4px",
                                                 backgroundColor: "#0000aa"
                                             }}>

                                            {/* Intestazione Coppe (Icone) */}
                                            <div className="flex w-full border-b-[3px] border-[#d3d3d3] bg-black/20">
                                                <div className="w-[60px] md:w-[80px] shrink-0 border-r-[3px] border-[#d3d3d3]"></div>
                                                <div className="flex-1 flex">
                                                    {grandPrixList.map((gp, idx) => (
                                                        <div key={idx} className="flex-1 flex justify-center items-center py-1 border-r-[3px] border-[#c0c0c0] last:border-r-0" title={gp.name}>
                                                            <span className="text-xs md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{gp.icon}</span>
                                                        </div>
                                                    ))}
                                                    {grandPrixList.length === 0 && (
                                                        <div className="flex-1 p-2 text-center text-white/50 text-xs italic">No Data</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Righe Cilindrate */}
                                            {grandPrixList.length > 0 && [50, 100, 150].map((cc) => (
                                                <div key={cc} className="flex w-full border-b-[3px] border-[#d3d3d3] last:border-b-0">
                                                    <div className="w-[60px] md:w-[80px] shrink-0 border-r-[3px] border-[#d3d3d3] flex items-center justify-center bg-black/20">
                                                        <span className="text-white font-bold text-xs md:text-sm drop-shadow-[1px_1px_0_#000]">{cc}cc</span>
                                                    </div>
                                                    <div className="flex-1 flex">
                                                        {grandPrixList.map((gp, idx) => {
                                                            const rank = gpRankings[cc]?.[gp.name];
                                                            let isRanked = rank >= 1 && rank <= 3;
                                                            let squareClass = "bg-[#444] border-t-[#222] border-l-[#222] border-b-[#666] border-r-[#666]";

                                                            if (rank === 1) {
                                                                squareClass = "bg-gradient-to-br from-[#FFF59D] via-[#FBC02D] to-[#F57F17] border-t-[#FFFDE7] border-l-[#FFFDE7] border-b-[#E65100] border-r-[#E65100]";
                                                            } else if (rank === 2) {
                                                                squareClass = "bg-gradient-to-br from-[#E0E0E0] via-[#9E9E9E] to-[#616161] border-t-[#FAFAFA] border-l-[#FAFAFA] border-b-[#424242] border-r-[#424242]";
                                                            } else if (rank === 3) {
                                                                squareClass = "bg-gradient-to-br from-[#FFCC80] via-[#F57C00] to-[#E65100] border-t-[#FFE0B2] border-l-[#FFE0B2] border-b-[#BF360C] border-r-[#BF360C]";
                                                            }

                                                            return (
                                                                <div key={idx} className="flex-1 flex justify-center items-center p-1 border-r-[3px] border-[#c0c0c0] last:border-r-0 bg-black/30 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]">
                                                                    <div className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-sm border-[1.5px] ${squareClass} ${isRanked ? 'shadow-[0_0_3px_rgba(0,0,0,0.8)]' : 'opacity-40'}`}></div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* BARS ONLINE/OFFLINE */}
                                    <div className="col-span-2 bg-[#001133] border border-[#004488] p-2 flex flex-col justify-center px-4 relative mt-2">
                                        <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                            <span className="text-[#00aeff]">Online Wins</span>
                                            <span className="text-white">{data?.onlineWins ?? userStats.onlineWins}</span>
                                        </div>
                                        {/* <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#004488] z-10">
                                            <div className="h-full bg-gradient-to-r from-[#004488] to-[#00aeff]" style={{width: `${data?.onlineWins ?? userStats.onlineWins}%`}}></div>
                                        </div> */}
                                    </div>
                                    
                                    <div className="col-span-2 bg-[#332200] border border-[#886600] p-2 flex flex-col justify-center px-4 relative">
                                        <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                            <span className="text-[#ffcc00]">Offline Wins</span>
                                            <span className="text-white">{data?.offlineWins ?? userStats.offlineWins}</span>
                                        </div>
                                        {/* <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#886600] z-10">
                                            <div className="h-full bg-gradient-to-r from-[#886600] to-[#ffcc00]" style={{width: `${data?.offlineWins ?? userStats.offlineWins}%`}}></div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA EDIT (GRID SELECTION) */}
                {edit && (
                    <div className="flex-1 min-h-0 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
                         <div className="bg-gradient-to-b from-[#000050] to-[#000060] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 w-full max-w-5xl flex flex-col gap-4 relative animate-in zoom-in duration-300">
                            
                            <h2 className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] stroke-black tracking-wide z-10 uppercase text-center">Select Character</h2>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10 h-full">
                                
                                {/* GRIGLIA DI SELEZIONE ICONE */}
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3 p-2 bg-[#222]/50 rounded-lg inner-shadow overflow-y-auto max-h-[50vh]">
                                    {AVAILABLE_ICONS.map((iconName) => {
                                        const isSelected = formData.icon === iconName;
                                        return (
                                            <div 
                                                key={iconName}
                                                onClick={() => handleSelectIcon(iconName)}
                                                className={`
                                                    group relative aspect-square rounded-lg cursor-pointer overflow-hidden border-[3px] transition-all duration-100
                                                    ${isSelected 
                                                        ? 'border-[#ffff00] shadow-[0_0_15px_#ffff00] scale-105 z-10 bg-gradient-to-b from-[#444] to-[#222]' 
                                                        : 'border-transparent hover:border-white hover:scale-105 bg-gradient-to-b from-black/80 to-black/40'}
                                                `}
                                            >
                                                <img 
                                                    src={`./sprites/${iconName}`} 
                                                    alt={iconName} 
                                                    className={`
                                                        w-full h-full object-contain filter 
                                                        ${isSelected ? 'brightness-110 drop-shadow-lg' : 'brightness-75 group-hover:brightness-100'}
                                                    `}
                                                    onError={(e) => {e.target.style.display='none'}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* SUBMIT BUTTON */}
                                <div className="flex justify-center mt-2">
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className={`group relative w-full max-w-md py-3 bg-[#0088dd] border-y-2 border-x-4 border-[#8899ff] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.4)] 
                                                    flex items-center justify-center overflow-hidden transition-all duration-200 
                                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                        <span className="text-xl font-black text-white uppercase tracking-widest drop-shadow-md flex items-center gap-2 relative z-10">
                                            {isLoading ? 'Saving...' : 'Confirm Selection'}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showStats && <Stats userName={userName}/>}

                {/* MODALE DI CONFERMA DELETE (OVERLAY) */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-gradient-to-b from-[#500000] to-[#200000] border-[4px] border-[#ff4444] rounded-xl shadow-[0_10px_40px_rgba(255,0,0,0.5)] p-8 max-w-md w-full flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                            <h2 className="text-3xl font-black text-white italic drop-shadow-[2px_2px_0_#000000] tracking-wide text-center uppercase">
                                Delete Account?
                            </h2>
                            <p className="text-center text-gray-200 text-lg">
                                Are you sure you want to permanently delete your account? This action cannot be undone.
                            </p>
                            <div className="flex gap-4 w-full mt-4">
                                <button 
                                    onClick={() => {
                                        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="flex-1 py-3 bg-[#444] border-2 border-[#888] rounded-full text-white font-bold text-xl uppercase tracking-wider hover:bg-[#555] active:scale-95 transition-all shadow-md"
                                >
                                    No
                                </button>
                                <button 
                                    onClick={confirmDeleteAccount}
                                    disabled={isDeleting}
                                    className={`flex-1 py-3 bg-[#ff4444] border-2 border-[#ffaaaa] rounded-full text-white font-bold text-xl uppercase tracking-wider hover:bg-[#ff6666] active:scale-95 transition-all shadow-[0_0_15px_rgba(255,68,68,0.6)] ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <div className="h-[12vh] shrink-0 w-full flex items-center justify-between px-12 relative z-30">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    
                    {/* Pulsante Back (Sinistra) */}
                    <button onClick={handleBack} className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer z-10">
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>

                    {/* Pulsante Delete Account (Destra) - Visibile solo se non sto editando l'icona e non sto guardando le Stats */}
                    {!edit && !showStats && (
                        <button 
                            onClick={() => {
                                playSfx(AUDIO_SFX.SELECT_IN_MENU, 10);
                                setShowDeleteConfirm(true);
                            }}
                            className="flex items-center gap-3 bg-[#222] px-6 py-2 rounded-full border-[3px] border-[#ff4444] shadow-[0_4px_0_#aa0000] active:shadow-none active:translate-y-[4px] hover:bg-[#333] transition-all cursor-pointer z-10"
                        >
                            <span className="text-[#ff4444] font-bold text-xl tracking-wide uppercase">Delete Account</span>
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
};