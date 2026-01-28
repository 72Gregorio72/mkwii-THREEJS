import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'
import { RacerModel } from '../models/RacerModel'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import { AUDIO_SFX , useAudio } from '../audio/AudioManager.jsx'

export function CharacterSelection({ 
    setMenuState, 
    availableCharacters, 
    setSelectedCharacter 
}) {

  // const { changeTrack } = useAudio();
  // useEffect(() => {
  //   changeTrack('CHARACTER_KART_SELECT', 100);
  // }, [changeTrack]);

  const { playSfx } = useAudio();
  const [localSelection, setLocalSelection] = useState(availableCharacters[0])

  const totalSlots = 24
  const gridSlots = Array.from({ length: totalSlots }).map((_, index) => {
    return index < availableCharacters.length ? availableCharacters[index] : null
  })

  const handleConfirm = () => {
    setSelectedCharacter(localSelection)
    playSfx(AUDIO_SFX[localSelection.select_sfx], 0.5);
    setTimeout(() => {
      setMenuState(1)
    }, 2000); // 2 seconds delay
  }

  const styles = {
    container: {
      width: '100vw', 
      height: '100vh', 
      position: 'absolute', top: 0, left: 0,
      // MODIFICA: Sfondo stile "Scanlines" scure come VehicleSelection
      background: `repeating-linear-gradient(0deg, #050505, #050505 2px, #111 2px, #111 4px)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif'
    },
    header: {
      height: '8vh', 
      background: 'white', display: 'flex', alignItems: 'center', paddingLeft: '4vw',
      borderBottom: '0.6vh solid #aaddff', borderBottomRightRadius: '50px', width: '55%',
      fontSize: '4vh', fontWeight: 'bold', color: '#666', fontStyle: 'italic', zIndex: 10,
      boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
    },
    mainContent: {
      display: 'flex', flex: 1, padding: '0', overflow: 'hidden',
      alignItems: 'center' 
    },
    leftPanel: {
      flex: 0.8, 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      position: 'relative', height: '100%'
    },
    rightPanel: {
      flex: 1.2, 
      display: 'flex',          
      alignItems: 'center',      
      justifyContent: 'center',  
      height: '100%', 
      width: '100%',
      padding: '2vmin'            
    },
    gridContainer: {
      display: 'grid', 
      gridTemplateColumns: 'repeat(4, 1fr)', 
      gridTemplateRows: 'repeat(6, 1fr)', 
      // MODIFICA: Gap adattato (verticale stretto, orizzontale bilanciato)
      gap: '1.2vmin 1.5vmin', 
      // MODIFICA: Width ridotta per rendere i bottoni visivamente più simili a rettangoli 4:3
      width: '85%',
      height: '85%',
      maxHeight: '100%', 
    },
    charNameBox: {
        width: '90%',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))',
        border: '0.3vh solid #666', color: '#fff', padding: '1.5vh 0',
        fontSize: '5vh', fontWeight: 'bold', textShadow: '3px 3px 0 #000',
        transform: 'skewX(-10deg)',
        marginTop: '2vh',
        letterSpacing: '2px'
    },
    circleBg: {
        position: 'absolute', width: '45vmin', height: '45vmin',
        border: '0.3vmin solid rgba(255,255,255,0.05)', borderRadius: '50%', 
        top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 0,
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)'
    },
    gridItem: (isActive, isEmpty) => ({
      width: '100%',  
      height: '100%', 
      // MODIFICA: Stile bordo giallo acceso vs grigio scuro
      border: isActive ? '0.4vh solid #ffe600' : '0.3vh solid #444', 
      // MODIFICA: Gradiente scuro metallico
      background: isEmpty 
        ? 'transparent' 
        : 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(60,60,60,0.8) 50%, rgba(0,0,0,0.8) 100%)',
      borderRadius: '4px', // Meno arrotondato
      cursor: isEmpty ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      // MODIFICA: Glow giallo intenso
      boxShadow: isActive ? '0 0 15px #ffe600, inset 0 0 10px rgba(255, 230, 0, 0.4)' : 'none',
      position: 'relative',
      transition: 'all 0.1s ease-in-out',
      transform: isActive ? 'scale(1.02)' : 'scale(1)',
    }),
    footer: {
        height: '10vh', display: 'flex', justifyContent: 'space-between', 
        padding: '0 4vw', alignItems: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
    },
    button: {
        padding: '1vh 3vw', fontSize: '2.5vh', fontWeight: 'bold', borderRadius: '50px',
        border: '0.3vh solid white', cursor: 'pointer', margin: '0 10px',
        textTransform: 'uppercase',
        boxShadow: '0 4px 5px rgba(0,0,0,0.5)'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Select Character</div>

      <div style={styles.mainContent}>
        
        <div style={styles.leftPanel}>
            <div style={styles.circleBg}></div>
            <div style={{width: '100%', height: '55%', zIndex: 1}}>
                <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
                    <ambientLight intensity={1} />
                    <Environment preset="sunset" />
                    {/* <OrbitControls /> */}
					
					<RacerModel 
						characterConfig={localSelection.modelConfig} 
						steer={0}
						drift={0}
						position={[0, -0.5, 0]}
						debug={true}
						key={localSelection.id}
						isInMenu={true}
					/>
                </Canvas>
            </div>
            <div style={styles.charNameBox}>
                {localSelection.name}
            </div>
        </div>

        <div style={styles.rightPanel}>
            <div style={styles.gridContainer}>
                {gridSlots.map((char, index) => {
                    const isEmpty = !char;
                    const isActive = char && localSelection.name === char.name;

                    return (
                        <div 
                            key={index} 
                            style={styles.gridItem(isActive, isEmpty)}
                            onClick={() => {
                                if (!isEmpty) {
                                    setLocalSelection(char);
                                    playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                                }
                            }}
                        >
                            {!isEmpty && (
                            <img 
                                    src={char.sprite} 
                                    alt={char.name} 
                                    style={{
                                        // MODIFICA: Logica per evitare stretching e centrare lo sprite
                                        width: 'auto', 
                                        height: '95%', 
                                        maxWidth: '95%',
                                        objectFit: 'contain', 
                                        // MODIFICA: Drop shadow e luminosità su attivo
                                        filter: isActive ? 'brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.5))' : 'brightness(0.9)'
                                    }}
                                    onError={(e) => e.target.style.display='none'}
                            /> 
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      <div style={styles.footer}>
            <button 
                style={{...styles.button, background: '#ccc', color: '#333'}}
                onClick={() => setMenuState(0)}
            >
                Back
            </button>
            <button 
                style={{...styles.button, background: '#00aeff', color: 'white'}}
                onClick={() => {handleConfirm(); playSfx(AUDIO_SFX.SELECT_IN_MENU, 10); }}
            >
                OK
            </button>
      </div>
    </div>
  )
}