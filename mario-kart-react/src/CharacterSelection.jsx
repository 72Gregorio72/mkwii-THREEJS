import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'

// --- NUOVO IMPORT ---
import { RacerModel } from './models/RacerModel'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
// Componente wrapper per la preview
function PreviewScene({ config }) {
    return (
        <Center top>
            {/* Moltiplichiamo la scala: 
               Il modello è 0.008. Qui lo ingrandiamo x150 per vederlo bene nel menu.
            */}
            <group scale={150} position={[0, -1, 0]}> 
                 <RacerModel 
                    characterConfig={config} 
                    steer={0} 
                    drift={0} 
					debug={true}
                 />
            </group>
        </Center>
    )
}

export function CharacterSelection({ 
    setMenuState, 
    availableCharacters, 
    setSelectedCharacter 
}) {
  const [localSelection, setLocalSelection] = useState(availableCharacters[0])

  const totalSlots = 24
  const gridSlots = Array.from({ length: totalSlots }).map((_, index) => {
    return index < availableCharacters.length ? availableCharacters[index] : null
  })

  const handleConfirm = () => {
    setSelectedCharacter(localSelection)
    setMenuState(1)
  }

  const styles = {
    container: {
      width: '100vw', 
      height: '100vh', 
      position: 'absolute', top: 0, left: 0,
      background: `repeating-linear-gradient(0deg, #000, #000 4px, #111 4px, #111 8px)`,
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
      gap: '1vmin', 
      aspectRatio: '4 / 6', 
      height: '85%',
      maxHeight: '100%', 
      maxWidth: '100%'
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
      border: isActive ? '0.5vh solid #ffe600' : '0.2vh solid #444', 
      background: isEmpty ? '#ccc' : 'rgba(0,0,0,0.6)',
      borderRadius: '1vh',
      cursor: isEmpty ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: isActive ? '0 0 20px #ffe600' : 'inset 0 0 10px #000',
      position: 'relative',
      transition: 'transform 0.1s, border-color 0.1s',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
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
                            onClick={() => !isEmpty && setLocalSelection(char)}
                        >
                            {!isEmpty && (
                            <img 
                                    src={char.sprite} 
                                    alt={char.name} 
                                    style={{width: '90%', height: '90%', objectFit: 'contain', filter: isActive ? 'brightness(1.2)' : 'brightness(0.9)'}}
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
                onClick={handleConfirm}
            >
                OK
            </button>
      </div>
    </div>
  )
}