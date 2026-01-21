import React, { useState, useEffect } from 'react'
import { Tracks } from '../components/Data'
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'

export function TrackSelection({ setMenuState, setSelectedTrack }) {
    const { changeTrack , playSfx} = useAudio();
    useEffect(() => {
      changeTrack('COURSE_SELECT', 5000);
    }, [changeTrack]);


    const tracksList = Object.entries(Tracks).map(([name, data]) => ({
        name,
        ...data
    }));

    const [localSelection, setLocalSelection] = useState(tracksList[0]);

    const handleConfirm = () => {
        if (localSelection) {
            const trackData = {
                ...localSelection,
                // Normalizza start_pos nel caso sia scritto come startPos nel file Data
                start_pos: localSelection.startPos || localSelection.start_pos || [0, 2, 0]
            };
            
            setSelectedTrack(trackData);
            setMenuState(3);
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
        // CORREZIONE QUI: card è una funzione
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
        // CORREZIONE QUI: label ora è una funzione che accetta isActive
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

            <div style={styles.content}>
                <div style={styles.grid}>
                    {tracksList.map((track, index) => {
                        const isActive = localSelection && localSelection.name === track.name;
                        return (
                            <div 
                                key={index} 
                                style={styles.card(isActive)} // Ora funziona perché card è una funzione
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
                                <div style={styles.label(isActive)}> {/* Ora funziona perché label è una funzione */}
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
                    onClick={() => setMenuState(1)}
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
        </div>
    )
}