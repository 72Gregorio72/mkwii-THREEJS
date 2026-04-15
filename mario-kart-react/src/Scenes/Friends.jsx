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
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [viewingFriendProfile, setViewingFriendProfile] = useState(null);
    const [friendProfileData, setFriendProfileData] = useState(null);
    const [loadingFriendProfile, setLoadingFriendProfile] = useState(false);
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
        navigate('/menu');
    };

    const handleAddFriendClick = () => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        setAddingFriend(true);
        setAddMessage('');
        setNewFriendName('');
        setSearchResults([]);
        setHasSearched(false);
    };

    const handleSearchUsers = async (searchTerm) => {
        setNewFriendName(searchTerm);
        
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setHasSearched(true);
        setLoadingSearch(true);
        try {
            const res = await fetch(`/api/searchUsers?query=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const users = await res.json();
                // Filtra l'utente corrente dai risultati
                const filtered = Array.isArray(users) 
                    ? users.filter(u => u.username !== userName) 
                    : [];
                setSearchResults(filtered);
            }
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSelectUser = async (selectedUser) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        setNewFriendName(selectedUser.username);
        setSearchResults([]);
        
        // Invia la richiesta di amicizia automaticamente
        try {
            const res = await fetch(`/api/sendFriendRequest?username=${userName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverName: selectedUser.username })
            });

            const text = await res.json();

            if (!res.ok || text?.success === false) {
                setAddMessage(text.message || `Request sent to ${selectedUser.username}!`);
            } else {
                setAddMessage(`Request sent to ${selectedUser.username}!`);
                setTimeout(() => {
                    setAddingFriend(false);
                    setSearchResults([]);
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setAddMessage('Network error!');
        }
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

                if (!res.ok || text?.success === false) {
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

    const handleViewFriendProfile = async (friend) => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        setViewingFriendProfile(friend);
        setLoadingFriendProfile(true);
        
        try {
            const res = await fetch(`/api/profile?userName=${friend.username}`);
            if (res.ok) {
                const data = await res.json();
                setFriendProfileData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFriendProfile(false);
        }
    };

    const handleCloseFriendProfile = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU);
        setViewingFriendProfile(null);
        setFriendProfileData(null);
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

                <div 
                    onClick={() => navigate('/profile')}
                    className="absolute top-18 right-28 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
                >
                    <div className="relative w-14 h-14 md:w-16 md:h-16">
                        {/* Halo */}
                        <div className="absolute inset-0 rounded-full bg-white/50 scale-110 blur-sm"></div>
                        
                        {/* Cerchio Verde Lucido */}
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#22cc22] to-[#008800] border-[3px] border-white ring-[3px] ring-[#00aa00] shadow-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                            {/* Riflesso */}
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/40 rounded-b-full"></div>
                            <span className="text-3xl text-white drop-shadow-md transform filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                                👤
                            </span>
                        </div>
                    </div>

                    {/* Label 'License' */}
                    <div className="absolute -bottom-2 -right-1 bg-[#008800] text-white text-xs md:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-white shadow-sm transform -rotate-6 group-hover:scale-110 transition-transform z-50">
                        License
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
                                    <div key={index} className="group relative w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full flex items-center p-2 px-4 shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-white cursor-pointer flex-shrink-0" onClick={() => handleViewFriendProfile(friend)}>
                                        <div className="absolute top-0 left-4 right-4 h-[35%] bg-white/10 rounded-b-full pointer-events-none"></div>
                                        
                                        {/* Icona */}
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#000044] border-2 border-white shadow-inner rounded-full overflow-hidden flex-shrink-0 relative">
                                            <img src={friend.icon ? `/sprites/${friend.icon}` : '/sprites/Mario.png'} alt={friend.username} className="w-full h-full object-cover filter drop-shadow-md" onError={(e) => { e.target.src = '/sprites/Mario.png'; }} />
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
                                            className="cursor-pointer w-10 h-10 bg-[#cc0000] border-2 border-white rounded-full shadow-md flex items-center justify-center z-20 mr-1"
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

                        <div className="z-10 flex flex-col gap-4 relative overflow-visible">
                            <input 
                                type="text" 
                                autoFocus
                                value={newFriendName}
                                onChange={(e) => handleSearchUsers(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newFriendName.trim() && searchResults.length === 0) {
                                        handleSendRequest(e);
                                    }
                                }}
                                placeholder="Type username..." 
                                className="w-full bg-gradient-to-b from-[#333] to-[#111] border-[3px] border-[#aaaaaa] rounded-full p-4 text-center text-2xl text-white outline-none focus:border-white focus:scale-[1.02] transition-all shadow-[0_5px_10px_rgba(0,0,0,0.5)] placeholder-gray-400 font-bold tracking-wide"
                            />
                            <div className="absolute top-[6px] left-8 right-8 h-[25%] bg-white/10 rounded-b-full pointer-events-none"></div>
                            
                            {/* Search Results Dropdown */}
                            {(hasSearched && newFriendName.trim()) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-[#222] to-[#000] border-[3px] border-[#aaaaaa] rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-[100] max-h-64 overflow-y-auto custom-scrollbar">
                                    {loadingSearch ? (
                                        <div className="w-full px-4 py-4 text-center font-bold text-lg drop-shadow-[2px_2px_0_#0000ff] text-yellow-300 animate-pulse">
                                            Searching...
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="w-full px-4 py-4 text-center font-bold text-lg drop-shadow-[2px_2px_0_#0000ff] text-red-300">
                                            No users found
                                        </div>
                                    ) : (
                                        searchResults.map((user, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full px-4 py-3 text-left hover:bg-[#444] transition-colors border-b border-[#555] last:border-b-0 flex items-center gap-3 hover:scale-[1.02]"
                                            >
                                                <img 
                                                    src={user.icon ? `/sprites/${user.icon}` : '/sprites/Mario.png'} 
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full object-cover border border-white"
                                                    onError={(e) => { e.target.src = '/sprites/Mario.png'; }}
                                                />
                                                <span className="text-lg font-bold text-white drop-shadow-[1px_1px_0_#0000ff]">
                                                    {user.username}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                            
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
                                            <button onClick={() => handleAcceptRequest(req.id)} className="w-10 h-10 md:w-12 md:h-12 bg-[#00cc00] border-2 border-white rounded-full shadow-md flex items-center justify-center" title="Accept">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-6 h-6 text-white drop-shadow-sm"><polyline points="20 6 9 17 4 12" /></svg>
                                            </button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 md:w-12 md:h-12 bg-[#cc0000] border-2 border-white rounded-full shadow-md flex items-center justify-center" title="Reject">
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

            {/* FRIEND PROFILE MODAL */}
            {viewingFriendProfile && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-b from-[#000050] to-[#000066] border-[6px] border-[#ffff] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3 w-full max-w-4xl flex gap-3 relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        
                        {loadingFriendProfile ? (
                            <div className="w-full flex items-center justify-center py-16">
                                <span className="text-3xl font-bold text-yellow-300 drop-shadow-[2px_2px_0_#0000ff] animate-pulse">Loading...</span>
                            </div>
                        ) : friendProfileData ? (
                            <>
                                {/* COLONNA SINISTRA - ICON */}
                                <div className="w-48 flex flex-col gap-3 flex-shrink-0">
                                    <div className="w-full aspect-square border-4 border-[#ffff] shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-0" 
                                             style={{
                                                backgroundImage: "conic-gradient(#000088 90deg, #000044 90deg 180deg, #000088 180deg 270deg, #000044 270deg)",
                                                backgroundSize: "24px 24px"
                                             }}>
                                        </div>
                                        <div className="absolute inset-0 flex items-end justify-center">
                                            {friendProfileData.icon ? (
                                                <img 
                                                    src={`/sprites/${friendProfileData.icon}`}
                                                    alt={friendProfileData.username} 
                                                    className="h-[115%] w-auto object-contain object-bottom filter drop-shadow-lg" 
                                                    onError={(e) => { e.target.src = '/sprites/Mario.png'; }}
                                                />
                                            ) : (
                                                <span className="text-8xl pb-2">👤</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex items-center justify-center gap-2 p-2 bg-[#333] border-2 border-white rounded-lg">
                                        <div className={`w-3 h-3 rounded-full ${viewingFriendProfile.isLoggedIn ? 'bg-green-500 shadow-[0_0_8px_#22cc22]' : 'bg-red-500 shadow-[0_0_8px_#cc0000]'} animate-pulse`}></div>
                                        <span className="text-white font-bold text-sm">
                                            {viewingFriendProfile.isLoggedIn ? 'Online' : 'Offline'}
                                        </span>
                                    </div>

                                    {/* Close Button */}
                                    <button onClick={handleCloseFriendProfile} className="w-full py-2 bg-[#ff4444] hover:bg-[#ff6666] border-2 border-white rounded font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95">
                                        Back
                                    </button>
                                </div>

                                {/* COLONNA DESTRA - USERNAME & STATS */}
                                <div className="flex-1 flex flex-col gap-3">

                                    {/* Username Box */}
                                    <div className="w-full h-20 border-4 border-[#ffff] shadow-md flex items-center justify-center px-6 relative overflow-hidden"
                                         style={{
                                            backgroundImage: "conic-gradient(#000088 90deg, #000044 90deg 180deg, #000088 180deg 270deg, #000044 270deg)",
                                            backgroundSize: "24px 24px"
                                         }}>
                                        <h2 className="text-4xl font-black text-white italic drop-shadow-[3px_3px_0_#0000ff] stroke-black tracking-wide z-10">
                                            {friendProfileData.username || viewingFriendProfile.username}
                                        </h2>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex-1 bg-[#222] border-4 border-[#ffff] shadow-inner p-4 grid grid-cols-2 gap-4 relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(0deg,white_0px,white_1px,transparent_1px,transparent_3px)]"></div>
                                        
                                        <div className="bg-[#333] border border-[#ffff] p-2 flex flex-col items-center justify-center">
                                            <span className="text-[#aaa] text-xs uppercase font-bold mb-1">Status</span>
                                            <span className="text-lg filter drop-shadow-md">{viewingFriendProfile.isLoggedIn ? '🟢' : '🔴'}</span>
                                        </div>

                                        <div className="bg-[#333] border border-[#ffff] p-2 flex flex-col items-center justify-center">
                                            <span className="text-[#aaa] text-xs uppercase font-bold mb-1">Total Wins</span>
                                            <span className="text-white font-mono text-lg font-bold">{(friendProfileData.onlineWins || 0) + (friendProfileData.offlineWins || 0)}</span>
                                        </div>

                                        {/* Online Wins Progress Bar */}
                                        <div className="col-span-2 bg-[#001133] border border-[#004488] p-2 flex flex-col justify-center px-4 relative">
                                            <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                                <span className="text-[#00aeff]">Online Wins</span>
                                                <span className="text-white">{friendProfileData.onlineWins || 0}</span>
                                            </div>
                                            {/*<div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#004488]">
                                                <div className="h-full bg-gradient-to-r from-[#004488] to-[#00aeff]" style={{width: `${Math.min(friendProfileData.onlineWins || 0, 100)}%`}}></div>
                                            </div>*/}
                                        </div>

                                        {/* Offline Wins Progress Bar */}
                                        <div className="col-span-2 bg-[#332200] border border-[#886600] p-2 flex flex-col justify-center px-4 relative">
                                            <div className="flex justify-between text-xs font-bold uppercase mb-1 z-10">
                                                <span className="text-[#ffcc00]">Offline Wins</span>
                                                <span className="text-white">{friendProfileData.offlineWins || 0}</span>
                                            </div>
                                            {/* <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#886600]">
                                                <div className="h-full bg-gradient-to-r from-[#886600] to-[#ffcc00]" style={{width: `${Math.min(friendProfileData.offlineWins || 0, 100)}%`}}></div>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center py-16">
                                <span className="text-2xl font-bold text-red-300 drop-shadow-[2px_2px_0_#0000ff]">Unable to load profile</span>
                            </div>
                        )}
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