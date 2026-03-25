import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx';
import { useUserStore } from '../store.js';
import { socket } from '../multiplayer/socket.js';

export const Login = () => {
    const navigate = useNavigate();
    const { playSfx } = useAudio();

    // Stati del form
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Stato per gestire l'errore visuale
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { handleLogin: onLoginSuccess} = useUserStore();

    const sendDataToBackend = async (data) => {
        setIsLoading(true);
        setError(null);

        try {
            const checkResponse = await fetch(`/api/checklogin?username=${data.username}`);
            const checkData = await checkResponse.text();
            const parsedCheckData = checkData ? JSON.parse(checkData) : null;

            if (parsedCheckData && parsedCheckData.isLoggedIn) {
                setError("User already logged in");
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            sessionStorage.setItem('accessToken', result.token);
            // Forza Socket.io a riconnettersi con il nuovo token (che include l'username)
            socket.disconnect();
            socket.connect();

            console.log("Success:", result);
            const finalUsername = result.username;

            // setUsername?.(finalUsername);
            onLoginSuccess?.(finalUsername);
            
            setTimeout(() => navigate('/menu'), 500);

        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        
        // Validazione base lato client
        if (!formData.username || !formData.password) {
            setError("All fields are required");
            return;
        }

        sendDataToBackend({ 
            username: formData.username,
            password: formData.password,
			socketId: socket ? socket.id : null
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Pulisce l'errore quando l'utente inizia a scrivere di nuovo
        if (error) setError(null);
    };

    const handleBack = () => {
        playSfx(AUDIO_SFX.BACK_IN_MENU);
        navigate('/menu');
    };

    const handleInfo = () => {
        playSfx(AUDIO_SFX.SELECT_IN_MENU);
        navigate('/info');
    };

    // Stile condiviso per gli input
    const inputStyle = "w-full bg-white text-black text-xl font-bold px-4 py-3 rounded border-4 border-[#888] focus:border-[#0088dd] focus:outline-none focus:shadow-[0_0_15px_#0088dd] placeholder-gray-400 transition-all shadow-inner font-mono tracking-wider";

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
                
                {/* HEADER (Stile Wii con SVG e Tasto Info) */}
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
                                Login page
                            </h1>
                        </div>
                    </div>

                    {/* TASTO INFO */}
                    <div 
                        onClick={handleInfo}
                        className="absolute top-2 right-2 pointer-events-auto cursor-pointer group flex flex-col items-center z-50"
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
                </div>

                {/* AREA CENTRALE (Form Panel) */}
                <div className="flex-1 flex items-center justify-center pt-[15vh] pb-4 px-4 w-full">
                    
                    {/* PANNELLO DARK/GOLD */}
                    <div className="w-full max-w-lg bg-black/80 border-4 border-[#aa8800] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 backdrop-blur-md relative animate-in zoom-in duration-300">
                        
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                             style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.2) 2px, rgba(255,215,0,0.2) 4px)"}}>
                        </div>

                        {/* Titolo Form */}
                        <div className="text-center mb-6 border-b-2 border-[#aa8800] pb-4 relative z-10">
                            <h2 className="text-3xl font-black text-[#ffcc00] uppercase tracking-wide drop-shadow-md">
                                Login
                            </h2>
                            <p className="text-[#ddccaa] text-sm mt-1 uppercase tracking-widest">Enter your details</p>
                        </div>

                        {/* === BOX ERRORE === */}
                        {error && (
                            <div className="mb-6 relative z-10 animate-pulse">
                                <div className="bg-gradient-to-b from-[#ff6666] to-[#cc0000] border-2 border-white rounded-lg shadow-[0_0_15px_#ff0000] px-4 py-3 flex items-center gap-3">
                                    <div className="bg-white text-[#cc0000] rounded-full w-8 h-8 flex items-center justify-center font-black text-xl shadow-inner border border-gray-300">!</div>
                                    <span className="text-white font-bold uppercase tracking-wide drop-shadow-md text-sm md:text-base">
                                        {error}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
{/*  
                            <div className="group">
                                <label className="block text-[#ffcc00] text-sm font-bold uppercase mb-1 ml-1 group-focus-within:text-white transition-colors">
                                    Email Address
                                </label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="MARIO@KART.COM"
                                    required
                                />
                            </div> */}

                            <div className="group">
                                <label className="block text-[#ffcc00] text-sm font-bold uppercase mb-1 ml-1 group-focus-within:text-white transition-colors">
                                    Username
                                </label>
                                <input 
                                    type="text" 
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="PLAYER 1"
                                    maxLength={12}
                                    autoComplete='off'
                                    required
                                />
                            </div>

                            <div className="group">
                                <label className="block text-[#ffcc00] text-sm font-bold uppercase mb-1 ml-1 group-focus-within:text-white transition-colors">
                                    Password
                                </label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full mt-6 py-4 bg-[#0088dd] border-y-2 border-x-4 border-[#8899ff] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)] 
                                            flex items-center justify-center overflow-hidden transition-all duration-200 
                                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95 cursor-pointer'}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></div>
                                <span className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-md flex items-center gap-2">
                                    {isLoading ? 'Wait...' : 'Login'}
                                </span>
                            </button>

                        </form>
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