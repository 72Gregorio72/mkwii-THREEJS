import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom' // <--- 1. Import Hook
import { Tracks } from '../components/Data'
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'

export function TrackSelection({ setSelectedTrack, roomCode, isHost, socket }) {
    // setMenuState rimosso dalle props
    const navigate = useNavigate(); // <--- 2. Inizializza Hook
    const { playSfx } = useAudio();

    const tracksList = Object.entries(Tracks).map(([name, data]) => ({
        name,
        ...data
    }));

    const [localSelection, setLocalSelection] = useState(tracksList[0]);
    const [waitingForHost, setWaitingForHost] = useState(false);

    // Se sei in multiplayer ma non sei l'host, aspetta la scelta
    React.useEffect(() => {
        if (roomCode && !isHost && socket) {
            setWaitingForHost(true);
            
            // Ascolta la scelta della pista dall'host
            const handleTrackSelected = (data) => {
                if (data.roomCode === roomCode) {
                    const trackData = {
                        ...data.track,
                        start_pos: data.track.startPos || data.track.start_pos || [0, 2, 0]
                    };
                    setSelectedTrack(trackData);
                    navigate('/game');
                }
            };
            
            socket.on('track_selected', handleTrackSelected);
            return () => socket.off('track_selected', handleTrackSelected);
        }
    }, [roomCode, isHost, socket, navigate, setSelectedTrack]);

    const handleConfirm = () => {
        if (localSelection) {
            const trackData = {
                ...localSelection,
                // Normalizza start_pos nel caso sia scritto come startPos nel file Data
                start_pos: localSelection.startPos || localSelection.start_pos || [0, 2, 0]
            };
            
            setSelectedTrack(trackData);
            
            // Se sei l'host in multiplayer, invia la scelta al server
            if (roomCode && isHost && socket) {
                socket.emit('select_track', { roomCode, track: trackData });
            }
            
            navigate('/game');
        }
    };

    const styles = {
        container: {
            width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0,
            background: `repeating-linear-gradient(0deg, #050505, #050505 2px, #111 2px, #111 4px)`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif',
            color: 'white'
        },
        header: {
            height: '8vh', background: 'white', display: 'flex', alignItems: 'center', paddingLeft: '4vw',
            borderBottom: '0.6vh solid #aaddff', borderBottomRightRadius: '50px', width: '55%',
            fontSize: '4vh', fontWeight: 'bold', color: '#666', fontStyle: 'italic', zIndex: 10,
            boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
        },
        content: {
            flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4vh'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3vh',
            width: '80%',
            height: '80%',
            overflowY: 'auto',
            padding: '2vh'
        },
        card: (isActive) => ({
            background: isActive 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255, 230, 0, 0.1) 100%)' 
                : 'rgba(255,255,255,0.05)',
            border: isActive ? '0.4vh solid #ffe600' : '0.2vh solid #555',
            borderRadius: '1vh',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isActive ? '0 0 20px rgba(255, 230, 0, 0.5)' : '0 5px 10px rgba(0,0,0,0.5)',
            aspectRatio: '16/9',
            display: 'flex', flexDirection: 'column'
        }),
        imageBox: {
            flex: 1,
            width: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
        },
        label: (isActive) => ({
            height: '20%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5vh', fontWeight: 'bold', textTransform: 'uppercase',
            borderTop: '1px solid #444',
            color: isActive ? '#ffe600' : 'white'
        }),
        footer: {
            height: '10vh', display: 'flex', justifyContent: 'space-between', padding: '0 4vw', alignItems: 'center',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
        },
        button: {
            padding: '1vh 3vw', fontSize: '2.5vh', fontWeight: 'bold', borderRadius: '50px',
            border: '0.3vh solid white', cursor: 'pointer', margin: '0 10px', textTransform: 'uppercase',
            boxShadow: '0 4px 5px rgba(0,0,0,0.5)'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>Select Track</div>
            
            {/* Se sei in multiplayer e non sei l'host, mostra waiting */}
            {waitingForHost ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <h2 style={{ fontSize: '4vh', color: '#ffe600' }}>Waiting for host to select track...</h2>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '5px solid #ffe600',
                        borderTop: '5px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : (
            <>
            <div style={styles.content}>
                <div style={styles.grid}>
                    {tracksList.map((track, index) => {
                        const isActive = localSelection && localSelection.name === track.name;
                        return (
                            <div 
                                key={index} 
                                style={styles.card(isActive)}
                                onClick={() => {
                                    setLocalSelection(track);
                                    playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                                }}
                                onDoubleClick={handleConfirm}
                            >
                                <div style={{
                                    ...styles.imageBox,
                                    backgroundImage: `url(${track.preview || '/placeholder_track.png'})`
                                }}>
                                    {!track.preview && <div style={{position:'absolute', top:'40%', width:'100%', textAlign:'center', opacity:0.5}}>NO PREVIEW</div>}
                                </div>
                                <div style={styles.label(isActive)}>
                                    {track.name}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={styles.footer}>
                <button 
                    style={{...styles.button, background: '#ccc', color: '#333'}}
                    onClick={() => navigate('/vehicle')} // <--- 4. Torna alla selezione veicolo
                >
                    Back
                </button>
                <button 
                    style={{...styles.button, background: '#00aeff', color: 'white'}}
                    onClick={() => { handleConfirm(); playSfx(AUDIO_SFX.START_RACE, 10); }}
                    disabled={!localSelection}
                >
                    Start Race
                </button>
            </div>
            </>
            )}
        </div>
    )
}