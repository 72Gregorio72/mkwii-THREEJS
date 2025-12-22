import React, { useState, useRef } from 'react'
import { Physics } from '@react-three/rapier'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'

// --- IMPORTS DEI COMPONENTI FISICI ---
import { SmartMap } from './Tracks/StartMap'
import { OutsideDriftKart } from './components/OutsideDriftKart'
import { InsideDriftBike } from './components/InsideDriftBike'

// --- IMPORTS DEI MODELLI 3D ---
import { Mario } from './models/Mario'
import { FunkyKong } from './models/Funky_kong'
import { StandardKartM } from './models/StandardKartM'
import { FlameRunner } from './models/FlameRunner'

// ==========================================
// 1. DATI DI GIOCO (DATABASE)
// ==========================================

const CHARACTERS = [
  { 
    id: 'mario', 
    name: 'Mario', 
    model: Mario, 
    img: './sprites/MarioMKW.png' 
  },
  { 
    id: 'funky', 
    name: 'Funky Kong', 
    model: FunkyKong, 
    img: './sprites/FunkyKongMKW.png' 
  },
]

const VEHICLES = [
  { 
    id: 'std_kart_m', 
    name: 'Standard Kart M', 
    type: 'KART', // Fisica Outside Drift
    model: StandardKartM, 
    img: './sprites/StandardKartM.png',
    // Statistiche (0-100) per le barre
    stats: { speed: 50, weight: 60, acceleration: 70, handling: 80, drift: 50, offroad: 60 }
  },
  { 
    id: 'flame_flyer', 
    name: 'Flame Flyer', 
    type: 'KART', 
    model: StandardKartM, // Placeholder: Cambia con FlameFlyer se hai il modello
    img: './sprites/FlameFlyer.png',
    stats: { speed: 90, weight: 80, acceleration: 30, handling: 40, drift: 70, offroad: 20 }
  },
  { 
    id: 'flame_runner', 
    name: 'Flame Runner', 
    type: 'BIKE', // Fisica Inside Drift
    model: FlameRunner, 
    img: './sprites/FlameRunner.png',
    stats: { speed: 85, weight: 70, acceleration: 40, handling: 30, drift: 90, offroad: 30 }
  },
]

const TRACKS = [
  { 
    id: 'luigi_circuit', 
    name: 'Luigi Circuit', 
    modelPath: "/LuigiCircuit_colliders.glb", 
    scale: 1,
    img: './sprites/LuigiCircuit.png'
  },
]

// ==========================================
// 2. COMPONENTI UI & 3D MENU
// ==========================================

// Modello rotante nel menu (Personaggio + Veicolo uniti)
function MenuRotatingModel({ charModel: Character, vehicleModel: Vehicle, vehicleType }) {
    const groupRef = useRef()
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 1.0 // Velocità rotazione
        }
    })

    // Offset per posizionare il personaggio correttamente sul sedile
    // Le moto (BIKE) di solito richiedono posizioni diverse dai KART
    const charYOffset = vehicleType === 'BIKE' ? 0.0 : 0.3 
    const charZOffset = vehicleType === 'BIKE' ? -0.2 : -0.1

    return (
        <group ref={groupRef} position={[0, -0.8, 0]}>
             {/* Veicolo */}
             <Vehicle scale={1.8} />
             
             {/* Personaggio (seduto sopra) */}
             <group position={[0, charYOffset, charZOffset]}>
                <Character 
                    scale={1.8} 
                    rotation={[0, 0, 0]} 
                    steer={0} // Braccia dritte
                    drift={0} 
                    speed={0} // Idle animation (respiro)
                />
             </group>
        </group>
    )
}

// Pannello Statistiche (Barre gialle stile MKW)
function StatsPanel({ stats }) {
    const statLabels = [
        { key: 'speed', label: 'Speed' },
        { key: 'weight', label: 'Weight' },
        { key: 'acceleration', label: 'Acceleration' },
        { key: 'handling', label: 'Handling' },
        { key: 'drift', label: 'Drift' },
        { key: 'offroad', label: 'Off-Road' },
    ]

    return (
        <div style={{
            position: 'absolute', top: '30px', left: '30px',
            color: 'white', fontFamily: 'sans-serif', fontStyle: 'italic',
            textShadow: '2px 2px 4px #000', width: '280px', pointerEvents: 'none'
        }}>
            <h2 style={{borderBottom: '2px solid white', marginBottom: '15px', textTransform:'uppercase'}}>Stats</h2>
            {statLabels.map(item => (
                <div key={item.key} style={{marginBottom: '10px'}}>
                    <div style={{fontSize: '14px', marginBottom: '2px', fontWeight:'bold', textAlign:'left'}}>{item.label}</div>
                    {/* Contenitore barra (scuro) */}
                    <div style={{width: '100%', height: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid #999', transform: 'skewX(-20deg)'}}>
                        {/* Barra piena (Giallo/Arancio MKW) */}
                        <div style={{
                            width: `${stats[item.key]}%`, 
                            height: '100%', 
                            background: 'linear-gradient(to bottom, #ffe600, #ffaa00)',
                            transition: 'width 0.3s ease-out',
                            boxShadow: '0 0 5px #ffaa00'
                        }}/>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Griglia destra (Lista veicoli)
function VehicleGrid({ vehicles, selectedId, onSelect, onConfirm }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%', 
            overflowY: 'auto', padding: '20px', alignItems: 'center'
        }}>
            {vehicles.map(v => {
                const isSelected = selectedId === v.id
                return (
                    <div 
                        key={v.id}
                        onClick={() => onSelect(v)}
                        style={{
                            width: '260px', height: '90px', margin: '8px',
                            background: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0,0,0,0.6)',
                            border: isSelected ? '4px solid #ffe600' : '2px solid #555',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer', padding: '0 15px',
                            transform: isSelected ? 'scale(1.05) translateX(-10px)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 15px #ffe600' : 'none'
                        }}
                    >
                        {/* Immagine Sprite */}
                        <img 
                            src={v.img} 
                            alt={v.name} 
                            style={{height: '80%', objectFit: 'contain'}} 
                            onError={(e) => { e.target.style.display='none' }}
                        />
                        {/* Nome */}
                        <span style={{
                            color: isSelected ? '#000' : '#fff', 
                            fontWeight: 'bold', fontSize: '16px', textAlign:'right',
                            textShadow: isSelected ? 'none' : '1px 1px 0 #000'
                        }}>
                            {v.name}
                        </span>
                    </div>
                )
            })}
            
            <button 
                onClick={onConfirm}
                style={{
                    marginTop: '20px', padding: '15px 60px', 
                    background: '#ffe600', color: 'black', fontWeight: 'bold', fontSize: '24px',
                    border: '4px solid white', borderRadius: '50px', cursor: 'pointer',
                    boxShadow: '0 5px 10px rgba(0,0,0,0.5)', textTransform: 'uppercase'
                }}
            >
                OK
            </button>
        </div>
    )
}

// ==========================================
// 3. LOGICA MENU COMPLETA
// ==========================================

function GameMenu({ onStart }) {
  const [step, setStep] = useState(0) // 0: Char, 1: Vehicle, 2: Track
  const [selection, setSelection] = useState({ character: CHARACTERS[0], vehicle: VEHICLES[0], track: null })

  // --- HANDLERS ---
  const handleCharSelect = (char) => {
    setSelection(prev => ({ ...prev, character: char }))
    setStep(1)
  }

  const handleVehiclePreview = (vehicle) => {
    setSelection(prev => ({ ...prev, vehicle: vehicle }))
  }

  const confirmVehicle = () => {
    setStep(2)
  }

  const handleTrackSelect = (track) => {
    onStart({ ...selection, track: track })
  }

  // --- STILI ---
  const bgStyle = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    // Texture a righe stile MKWii
    background: `repeating-linear-gradient(0deg, #181818, #181818 2px, #282828 2px, #282828 4px)`,
    color: 'white', zIndex: 10, fontFamily: 'sans-serif', userSelect: 'none'
  }

  // --------------------------------------------------------
  // STEP 1: SCHERMO DIVISO (VEICOLI + STATS + 3D)
  // --------------------------------------------------------
  if (step === 1) {
      return (
          <div style={bgStyle}>
              <div style={{display: 'flex', width: '100%', height: '100%'}}>
                  
                  {/* LATO SINISTRO: 3D + STATS */}
                  <div style={{flex: 1.5, position: 'relative', borderRight: '4px solid white', background: 'radial-gradient(circle at center, #333, #000)'}}>
                      
                      {/* Titolo Schermata */}
                      <div style={{position:'absolute', top:20, right: 30, fontSize:40, fontStyle:'italic', fontWeight:'bold', textShadow:'2px 2px 0 #000', color:'#ccc'}}>
                          SELECT VEHICLE
                      </div>

                      {/* Canvas 3D */}
                      <Canvas camera={{ position: [3, 2, 5], fov: 35 }}>
                          <ambientLight intensity={1} />
                          <spotLight position={[10, 10, 10]} intensity={2} angle={0.5} penumbra={1} castShadow />
                          <pointLight position={[-10, -5, -10]} intensity={1} color="blue" />
                          <Environment preset="city" />
                          
                          <MenuRotatingModel 
                              charModel={selection.character.model} 
                              vehicleModel={selection.vehicle.model}
                              vehicleType={selection.vehicle.type}
                          />
                      </Canvas>

                      {/* Stats Overlay */}
                      <StatsPanel stats={selection.vehicle.stats} />
                      
                      {/* Nome Veicolo in basso */}
                      <div style={{
                          position: 'absolute', bottom: '60px', left: '0', width: '100%', 
                          textAlign: 'center', fontSize: '50px', fontWeight: 'bold', 
                          textShadow: '4px 4px 0 #000', fontStyle: 'italic', color: '#fff'
                      }}>
                          {selection.vehicle.name}
                      </div>

                      {/* Tasto Back */}
                      <button 
                        onClick={() => setStep(0)} 
                        style={{position: 'absolute', bottom: '20px', left: '20px', padding: '10px 25px', background:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'20px', cursor:'pointer'}}
                      >
                          BACK
                      </button>
                  </div>

                  {/* LATO DESTRO: LISTA VEICOLI */}
                  <div style={{flex: 1, background: 'rgba(0,0,0,0.2)', boxShadow:'inset 10px 0 20px rgba(0,0,0,0.5)'}}>
                        <VehicleGrid 
                            vehicles={VEHICLES} 
                            selectedId={selection.vehicle.id} 
                            onSelect={handleVehiclePreview}
                            onConfirm={confirmVehicle}
                        />
                  </div>

              </div>
          </div>
      )
  }

  // --------------------------------------------------------
  // STEP 0 & 2: GRID STANDARD (PERSONAGGI / PISTE)
  // --------------------------------------------------------
  return (
    <div style={{...bgStyle, display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: 'linear-gradient(135deg, #005f9e 0%, #0099ff 100%)'}}>
      
      <h1 style={{fontSize: '60px', fontStyle:'italic', textShadow:'4px 4px 0 #000', marginBottom:'50px'}}>
          {step === 0 ? "SELECT CHARACTER" : "SELECT CUP"}
      </h1>
      
      <div style={{display:'flex', gap: '30px', flexWrap:'wrap', justifyContent:'center'}}>
        
        {step === 0 && CHARACTERS.map(c => (
             <div 
                key={c.id} 
                onClick={() => handleCharSelect(c)} 
                style={{
                    cursor:'pointer', textAlign:'center', width:'180px',
                    background: 'rgba(255,255,255,0.9)', borderRadius:'15px', padding:'15px',
                    border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
             >
                 <img src={c.img} style={{width:'100%', height:'150px', objectFit:'contain'}} onError={(e) => e.target.style.display='none'} />
                 <h3 style={{color:'#333', marginTop:'10px', textTransform:'uppercase'}}>{c.name}</h3>
             </div>
        ))}

        {step === 2 && TRACKS.map(t => (
             <div 
                key={t.id} 
                onClick={() => handleTrackSelect(t)} 
                style={{
                    cursor:'pointer', textAlign:'center', width:'250px',
                    background: 'rgba(255,255,255,0.9)', borderRadius:'15px', padding:'15px',
                    border: '4px solid #44aa44', boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
             >
                 <img src={t.img} style={{width:'100%', height:'150px', objectFit:'cover', borderRadius:'5px'}} onError={(e) => e.target.style.display='none'} />
                 <h3 style={{color:'#333', marginTop:'10px', textTransform:'uppercase'}}>{t.name}</h3>
             </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 4. MAIN APP (GESTORE STATO GIOCO)
// ==========================================

export default function App() {
  const [gameState, setGameState] = useState('MENU') // 'MENU' | 'PLAYING'
  const [gameConfig, setGameConfig] = useState(null)

  const startGame = (config) => {
    setGameConfig(config)
    setGameState('PLAYING')
  }

  return (
    <>
      {/* 1. MOSTRA IL MENU SE NON STIAMO GIOCANDO */}
      {gameState === 'MENU' && <GameMenu onStart={startGame} />}

      {/* 2. MOSTRA IL GIOCO SE CONFIGURATO */}
      {gameState === 'PLAYING' && gameConfig && (
        <Canvas camera={{ position: [0, 10, 20], fov: 60 }} dpr={[1, 1.5]}>
          <ambientLight intensity={1.5} />
          <Environment preset="city" /> 

          <Physics>
            
            {/* Spawn Condizionale in base al TIPO DI VEICOLO scelto */}
            {gameConfig.vehicle.type === 'KART' ? (
              <OutsideDriftKart 
                charModel={gameConfig.character.model} 
                kartModel={gameConfig.vehicle.model} 
              />
            ) : (
              <InsideDriftBike 
                charModel={gameConfig.character.model} 
                bikeModel={gameConfig.vehicle.model} 
              />
            )}

            {/* Spawn della Pista Scelta */}
            <SmartMap 
              modelPath={gameConfig.track.modelPath} 
              scale={gameConfig.track.scale} 
            />
            
          </Physics>
        </Canvas>
      )}
    </>
  )
}