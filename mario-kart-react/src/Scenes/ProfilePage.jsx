import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';

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

export const Profile = ({ setLoggedIn, userName, isLoggedIn }) => {
    const navigate = useNavigate();
    const { playSfx } = useAudio();
    const [data, setData] = useState(null);
    const [edit, setEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Dati simulati statistiche
    const [userStats] = useState({
        rank: "⭐⭐⭐",
        onlineWins: 65,
        offlineWins: 82,
        totalRaces: 1420
    });

    const [formData, setFormData] = useState({
        icon: AVAILABLE_ICONS[0]
    });

    useEffect(() => {
        if (!isLoggedIn) return;
        fetch(`/api/profile?userName=${userName}`)
        .then((res) => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then((json) => {
            const updatedData = {
                ...json,
                fullIconPath: `./sprites/${json.icon}` 
            };
            setData(updatedData);
            setFormData({ icon: json.icon || AVAILABLE_ICONS[0] });
        })
        .catch((err) => console.error("Fetch error:", err));
    }, [userName, isLoggedIn]);

    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        if (edit) {
            setEdit(false);
        } else {
            navigate(-1);
        }
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
            const response = await fetch(`/api/profile?userName=${userName}`, {
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
                fullIconPath: `./sprites/${formData.icon}`
            }));

            setEdit(false);

        } catch (error) {
            console.error("Errore update:", error);
            alert("Impossibile aggiornare l'icona. Riprova.");
        } finally {
            setIsLoading(false);
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

                {/* VISTA PROFILO (READ ONLY) */}
                {!edit && (
                    <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
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
                            </div>

                            {/* COLONNA DESTRA */}
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="w-full h-24 border-4 border-[#ffff] shadow-md flex items-center justify-center px-6 relative overflow-hidden"
                                     style={{
                                        backgroundImage: "conic-gradient(#000088 90deg, #000044 90deg 180deg, #000088 180deg 270deg, #000044 270deg)",
                                        backgroundSize: "24px 24px"
                                     }}>
                                    <h2 className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] stroke-black tracking-wide z-10">
                                        {data?.username || "Player"}
                                    </h2>
                                </div>

                                <div className="flex-1 bg-[#222] border-4 border-[#ffff] shadow-inner p-4 grid grid-cols-2 gap-4 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(0deg,white_0px,white_1px,transparent_1px,transparent_3px)]"></div>
                                    <div className="bg-[#333] border border-[#ffff] p-2 flex flex-col items-center justify-center">
                                        <span className="text-[#aaa] text-xs uppercase font-bold mb-1">Rank</span>
                                        <span className="text-2xl filter drop-shadow-md">{userStats.rank}</span>
                                    </div>
                                    <div className="bg-[#333] border border-[#ffff] p-2 flex flex-col items-center justify-center">
                                        <span className="text-[#aaa] text-xs uppercase font-bold mb-1">Races</span>
                                        <span className="text-white font-mono text-xl font-bold">{userStats.totalRaces}</span>
                                    </div>
                                    <div className="col-span-2 bg-[#001133] border border-[#004488] p-2 flex flex-col justify-center px-4 relative">
                                        <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                            <span className="text-[#00aeff]">Online Wins</span>
                                            <span className="text-white">{userStats.onlineWins}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#004488] z-10">
                                            <div className="h-full bg-gradient-to-r from-[#004488] to-[#00aeff]" style={{width: `${userStats.onlineWins}%`}}></div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-[#332200] border border-[#886600] p-2 flex flex-col justify-center px-4 relative">
                                        <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                            <span className="text-[#ffcc00]">Offline Wins</span>
                                            <span className="text-white">{userStats.offlineWins}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#886600] z-10">
                                            <div className="h-full bg-gradient-to-r from-[#886600] to-[#ffcc00]" style={{width: `${userStats.offlineWins}%`}}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA EDIT (GRID SELECTION) */}
                {edit && (
                    <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
                         {/* Contenitore allargato a max-w-5xl per ospitare la griglia */}
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

                {/* FOOTER */}
                <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    <button onClick={handleBack} className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>
                </div>

            </div>
        </div>
    );
};