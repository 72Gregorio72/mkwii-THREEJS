import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { useUserStore } from '../store.js';

export const Friends = () => {
    const navigate = useNavigate();
    
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    
    const [isLoading, setIsLoading] = useState(true);
    
    const [showingRequests, setShowingRequests] = useState(false);
    
    // Stati per Add Friend
    const [addingFriend, setAddingFriend] = useState(false);
    const [newFriendName, setNewFriendName] = useState('');
    const [addMessage, setAddMessage] = useState(''); 
    const { playSfx, changeTrack, enableSmoothLoop, getCurrentTrack } = useAudio();

    const { userName: userName } = useUserStore();

    useEffect(() => {
        if (getCurrentTrack() !== 'MENU') {
            changeTrack('MENU', 100);
            enableSmoothLoop();
        }
        enableSmoothLoop();
    }, [changeTrack, enableSmoothLoop]);
    const fetchFriendsData = () => {
        if (!userName) return;
        
        Promise.all([
            fetch(`/api/getFriendList?username=${userName}`).then(res => res.ok ? res.json() : []),
            fetch(`/api/getPendingRequests?username=${userName}`).then(res => res.ok ? res.json() : [])
        ])
        .then(([friendsData, pendingData]) => {
            setFriends(Array.isArray(friendsData) ? friendsData : []);
            const requestsArray = Array.isArray(pendingData) ? pendingData : [];
            setPendingRequests(requestsArray);
            setPendingCount(requestsArray.length);
        })
        .catch(err => console.error("Fetch error:", err))
        .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchFriendsData();
    }, [userName]);

    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU, 10);
        navigate(-1);
    };

    const handleAddFriendClick = () => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        setAddingFriend(true);
        setAddMessage('');
        setNewFriendName('');
    };

    const handleNotifications = () => {
        if (pendingCount > 0 || showingRequests === false) {
            playSfx(AUDIO_SFX.SELECT_IN_MENU);
            setShowingRequests(true);
        }
    };

    // --- CHIAMATE API ---

    const handleSendRequest = async (e) => {
        if (e.key === 'Enter') {
            if (!newFriendName.trim()) return;
            playSfx(AUDIO_SFX.SELECT_IN_MENU);
            
            try {
                const res = await fetch(`/api/sendFriendRequest?username=${userName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiverName: newFriendName.trim() })
                });

                const text = await res.json();

                if (!res.ok) {
                    setAddMessage(text.message ?? 'Error sending request');
                } else {
                    setAddMessage('Request Sent!');
                    setTimeout(() => {
                        setAddingFriend(false);
                    }, 1500);
                }
            } catch (err) {
                console.error(err);
                setAddMessage('Network error!');
            }
        }
    };

    const handleAcceptRequest = async (requestId) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        try {
            const res = await fetch(`/api/acceptRequest?requestId=${requestId}`, {
                method: 'PATCH'
            });
            
            if (res.ok) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
                setPendingCount(prev => prev - 1);
                fetchFriendsData();
                setShowingRequests(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectRequest = async (requestId) => {
        playSfx(AUDIO_SFX.BACK_IN_MENU);
        try {
            const res = await fetch(`/api/rejectRequest?requestId=${requestId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
                setPendingCount(prev => prev - 1);
                setShowingRequests(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteFriend = async (friendToDelete) => {
        playSfx(AUDIO_SFX.BACK_IN_MENU);
        try {
            // Passiamo sia il nostro username che quello dell'amico da rimuovere
            const res = await fetch(`/api/deleteFriend?username=${userName}&friendToDelete=${friendToDelete}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Rimuoviamo l'amico dallo stato locale senza dover ricaricare tutto
                setFriends(prev => prev.filter(f => f.username !== friendToDelete));
            } else {
                console.error("Failed to delete friend");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-screen h-screen relative overflow-hidden font-sans select-none text-white flex flex-col">
            
            {/* 1. BACKGROUND LAYERS */}
            <div className="absolute inset-0 z-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/sprites/TitleScreen.jpg')", filter: "blur(6px)" }} />
            <div className="absolute inset-0 z-10 opacity-80" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 4px, rgba(230,230,230,0.8) 4px, rgba(230,230,230,0.8) 8px)" }} />

            {/* 2. UI CONTENT */}
            <div className="relative z-20 w-full h-full flex flex-col">
                
                {/* HEADER */}
                <div className="w-full h-[18vh] absolute top-0 left-0 z-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full z-10 filter drop-shadow-md">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[85%]">
                            <path d="M 0,0 L 100,0 L 100,35 C 96,35 94,88 82,98 L 0,98 Z" fill="white" stroke="#8899ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div className="absolute bottom-15 left-12 z-20">
                            <h1 className="text-5xl text-[#444] font-sans font-bold tracking-tight drop-shadow-sm transform scale-y-110">
                                Friend List
                            </h1>
                        </div>
                    </div>
                </div>

                {/* TASTO INFO */}
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

                {/* AREA CENTRALE (LISTA AMICI) */}
                <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full relative z-20">
                    <div className="bg-gradient-to-b from-[#0000cc] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 w-full max-w-4xl flex flex-col gap-4 relative animate-in zoom-in duration-300 h-[65vh]">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)"}}></div>

                        <div className="flex justify-between items-center border-b-4 border-white/30 pb-3 z-10">
                            <h2 className="text-5xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] tracking-wide uppercase">
                                Friend List
                            </h2>
                            <div className="flex items-center gap-4">
                                <button onClick={handleAddFriendClick} className="relative w-12 h-12 bg-[#0000aa] hover:bg-[#0033cc] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95" title="Add Friend">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white drop-shadow-[1px_1px_0_#0000ff]">
                                        <path d="M15 14c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z M6 14V7H4v3H1v2h3v3h2v-3h3v-2H6z M15 16c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </button>

                                <button onClick={handleNotifications} className="relative w-12 h-12 bg-[#00aaff] hover:bg-[#33bbff] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95" title="Pending Requests">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white drop-shadow-[1px_1px_0_#0055aa]">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                    </svg>
                                    {pendingCount > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-[#ff0000] border-2 border-white rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-black shadow-md z-10 animate-in zoom-in">
                                            {pendingCount}
                                        </div>
                                    )}
                                </button>

                                <span className="bg-[#000088] border-2 border-[#88aaff] px-4 py-1 rounded-full font-bold text-xl font-mono shadow-inner text-white drop-shadow-[2px_2px_0_#0000ff] ml-2">
                                    {friends.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto z-10 flex flex-col gap-3 custom-scrollbar pr-2 mt-2 min-h-0">
                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white drop-shadow-[2px_2px_0_#0000ff] animate-pulse">Loading...</span>
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <span className="text-4xl font-black text-white drop-shadow-[3px_3px_0_#0000ff] uppercase italic tracking-widest">
                                        No Friends Found
                                    </span>
                                </div>
                            ) : (
                                friends.map((friend, index) => (
                                    <div key={index} className="group relative w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full flex items-center p-2 px-4 shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-white cursor-pointer flex-shrink-0">
                                        <div className="absolute top-0 left-4 right-4 h-[35%] bg-white/10 rounded-b-full pointer-events-none"></div>
                                        
                                        {/* Icona */}
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#000044] border-2 border-white shadow-inner rounded-full overflow-hidden flex-shrink-0 relative">
                                            <img src={friend.icon ? `/sprites/${friend.icon}` : '/sprites/Mario.png'} alt={friend.username} className="w-full h-full object-cover filter drop-shadow-md group-hover:scale-110 transition-transform" onError={(e) => { e.target.src = '/sprites/Mario.png'; }} />
                                        </div>
                                        
                                        {/* Username */}
                                        <div className="flex-1 ml-6 flex flex-col justify-center">
                                            <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider drop-shadow-[2px_2px_0_#0000ff] transition-colors">
                                                {friend.username || "Unknown"}
                                            </span>
                                        </div>
                                        
                                        {/* Pallino verde status */}
                                        {friend.isLoggedIn ? (<div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-[0_0_8px_#22cc22] mr-4 animate-pulse"></div>)

                                        : (

                                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_8px_#cc0000] mr-4 animate-pulse"></div>

                                        )}

    
                                        {/* Tasto Rimuovi Amico */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita che il click si propaghi se l'ovale ha altre azioni in futuro
                                                handleDeleteFriend(friend.username);
                                            }}
                                            className="w-10 h-10 bg-[#cc0000] hover:bg-[#ff3333] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 mr-1"
                                            title="Remove Friend"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-5 h-5 text-white drop-shadow-sm">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER */}
                <div className="h-[12vh] w-full flex items-center px-12 relative z-30">
                    <div className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gray-400 via-gray-200 to-transparent"></div>
                    <button onClick={handleBack} className="flex items-center gap-3 bg-white px-8 py-2 rounded-full border-[3px] border-[#cccccc] shadow-[0_4px_0_#999999] active:shadow-none active:translate-y-[4px] hover:bg-[#f0f0f0] transition-all cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-[#ff4444] text-white flex items-center justify-center font-bold text-lg shadow-inner border border-white/50">B</div>
                        <span className="text-gray-600 font-bold text-2xl tracking-wide uppercase">Back</span>
                    </button>
                </div>
            </div>

            {/* OVERLAY ADD FRIEND */}
            {addingFriend && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-b from-[#0000cc] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 w-full max-w-xl flex flex-col gap-6 relative animate-in zoom-in duration-300">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)"}}></div>
                        
                        <div className="flex justify-between items-center border-b-4 border-white/30 pb-3 z-10">
                            <h2 className="text-3xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] tracking-wide uppercase">
                                Send Request
                            </h2>
                            <button onClick={() => { playSfx(AUDIO_SFX.BACK_IN_MENU); setAddingFriend(false); }} className="w-10 h-10 bg-[#ff4444] border-2 border-white rounded-full font-bold text-xl flex items-center justify-center hover:bg-[#ff6666] transition-transform hover:scale-110 shadow-md text-white pb-1">
                                x
                            </button>
                        </div>

                        <div className="z-10 flex flex-col gap-4 relative">
                            <input 
                                type="text" 
                                autoFocus
                                value={newFriendName}
                                onChange={(e) => setNewFriendName(e.target.value)}
                                onKeyDown={handleSendRequest}
                                placeholder="Enter username + Enter" 
                                className="w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full p-4 text-center text-2xl text-white outline-none focus:border-white focus:scale-[1.02] transition-all shadow-[0_5px_10px_rgba(0,0,0,0.5)] placeholder-gray-400 font-bold tracking-wide"
                            />
                            <div className="absolute top-[6px] left-8 right-8 h-[25%] bg-white/10 rounded-b-full pointer-events-none"></div>
                            
                            {addMessage && (
                                <div className="text-center font-bold text-xl drop-shadow-[2px_2px_0_#0000ff] animate-pulse text-yellow-300">
                                    {addMessage}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* OVERLAY PENDING REQUESTS */}
            {showingRequests && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-b from-[#0000cc] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 w-full max-w-2xl flex flex-col gap-4 relative animate-in zoom-in duration-300 max-h-[80vh]">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)"}}></div>

                        <div className="flex justify-between items-center border-b-4 border-white/30 pb-3 z-10">
                            <h2 className="text-3xl md:text-4xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] tracking-wide uppercase">
                                Friend Requests
                            </h2>
                            <button onClick={() => { playSfx(AUDIO_SFX.BACK_IN_MENU); setShowingRequests(false); }} className="w-10 h-10 bg-[#ff4444] border-2 border-white rounded-full font-bold text-xl flex items-center justify-center hover:bg-[#ff6666] transition-transform hover:scale-110 shadow-md text-white pb-1">
                                x
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto z-10 flex flex-col gap-3 custom-scrollbar pr-2 mt-2">
                            {pendingRequests.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-8">
                                    <span className="text-3xl font-black text-white drop-shadow-[2px_2px_0_#0000ff] uppercase italic tracking-widest text-center">
                                        No Pending Requests
                                    </span>
                                </div>
                            ) : (
                                pendingRequests.map((req) => (
                                    <div key={req.id} className="group relative w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full flex items-center p-2 px-4 shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-white">
                                        <div className="absolute top-0 left-4 right-4 h-[35%] bg-white/10 rounded-b-full pointer-events-none"></div>

                                        <div className="flex-1 flex justify-center items-center py-2">
                                            <span className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider drop-shadow-[2px_2px_0_#0000ff]">
                                                {req.senderName}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 z-10 mr-1">
                                            <button onClick={() => handleAcceptRequest(req.id)} className="w-10 h-10 md:w-12 md:h-12 bg-[#00cc00] hover:bg-[#33ff33] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95" title="Accept">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-6 h-6 text-white drop-shadow-sm"><polyline points="20 6 9 17 4 12" /></svg>
                                            </button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 md:w-12 md:h-12 bg-[#cc0000] hover:bg-[#ff3333] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95" title="Reject">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-6 h-6 text-white drop-shadow-sm"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #88aaff; border: 1px solid #fff; border-radius: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
            `}</style>
        </div>
    );
};