import React, { useState, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Center, Html } from '@react-three/drei'
import { RacerModel } from './models/RacerModel'
import { VehicleModel } from './models/VehicleModel'
import { VEHICLE_DATABASE } from './components/Data'

// --- COMPONENTE BARRA STATISTICHE ---
const StatBar = ({ label, value }) => (
    <div style={{ marginBottom: '1vh', width: '100%' }}>
        <div style={{ color: '#fff', fontSize: '1.8vh', fontWeight: 'bold', textShadow: '2px 2px 0 #000', marginBottom: '0.2vh', textAlign: 'left' }}>
            {label}
        </div>
        <div style={{ width: '100%', height: '1.5vh', background: 'rgba(0,0,0,0.5)', border: '2px solid #555', borderRadius: '4px', position: 'relative' }}>
            {/* Barra di riempimento */}
            <div style={{ 
                width: `${value}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #ffaa00, #ffdd00)',
                borderRadius: '2px',
                transition: 'width 0.3s ease-out'
            }}></div>
        </div>
    </div>
);

function RotatingShowcase({ characterConfig, vehicleData }) {
    const groupRef = useRef()
    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.5
    })

    if (!vehicleData?.modelConfig?.file) return null;

    return (
		<group ref={groupRef}>
			<VehicleModel 
				vehicleConfig={vehicleData.modelConfig}
				steer={0} drift={0} speed={5}
				isBike={vehicleData.isBike}
			/>
			<RacerModel 
				characterConfig={characterConfig}
				steer={0} drift={0}
				position={vehicleData.riderOffset || [0, 0, 0]}
			/>
		</group>
    )
}

export function VehicleSelection({ setMenuState, selectedCharacter, setSelectedVehicle }) {
    // Recuperiamo la lista veicoli dal personaggio selezionato
    const availableIDs = selectedCharacter.veichles || []; // Nota: hai scritto 'veichles' nel tuo JSON
    
    // Mappiamo le stringhe agli oggetti veri (fallback su DEFAULT se manca)
    const availableVehicles = availableIDs.map(id => ({
        id: id,
        ...((VEHICLE_DATABASE[id]) || VEHICLE_DATABASE['DEFAULT'])
    }));

    const [localSelection, setLocalSelection] = useState(availableVehicles[0] || VEHICLE_DATABASE['DEFAULT']);

    const handleConfirm = () => {
        setSelectedVehicle(localSelection);
        setMenuState(2); // Vai allo stato successivo (es. selezione mappa)
    };

    // Creiamo una griglia 2 colonne x 6 righe (12 slot)
    const totalSlots = 12;
    const gridSlots = Array.from({ length: totalSlots }).map((_, index) => {
        return index < availableVehicles.length ? availableVehicles[index] : null
    });

    const styles = {
        container: {
            width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0,
            background: `repeating-linear-gradient(0deg, #000, #000 4px, #111 4px, #111 8px)`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif'
        },
        header: {
            height: '8vh', background: 'white', display: 'flex', alignItems: 'center', paddingLeft: '4vw',
            borderBottom: '0.6vh solid #aaddff', borderBottomRightRadius: '50px', width: '55%',
            fontSize: '4vh', fontWeight: 'bold', color: '#666', fontStyle: 'italic', zIndex: 10,
            boxShadow: '0 5px 10px rgba(0,0,0,0.5)'
        },
        mainContent: { display: 'flex', flex: 1, padding: '0', overflow: 'hidden', alignItems: 'center' },
        
        // Pannello Sinistro: Statistiche + Preview 3D
        leftPanel: {
            flex: 1.2, display: 'flex', flexDirection: 'row', position: 'relative', height: '100%',
            alignItems: 'center'
        },
        statsContainer: {
            width: '30%', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            paddingLeft: '4vw', zIndex: 5
        },
        canvasContainer: {
            width: '70%', height: '100%', position: 'relative'
        },
        
        // Pannello Destro: Griglia Veicoli
        rightPanel: {
            flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2vmin'
        },
        gridContainer: {
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 Colonne come MKWii
            gridTemplateRows: 'repeat(6, 1fr)', 
            gap: '1.5vmin', aspectRatio: '2 / 6', height: '85%', maxHeight: '100%'
        },
        gridItem: (isActive, isEmpty) => ({
            width: '100%', height: '100%', 
            border: isActive ? '0.5vh solid #ffe600' : '0.2vh solid #444', 
            background: isEmpty ? '#ccc' : 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(50,50,50,0.8))',
            borderRadius: '1vh', cursor: isEmpty ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isActive ? '0 0 20px #ffe600' : 'inset 0 0 10px #000',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.1s',
        }),
        vehicleNameBox: {
            position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%) skewX(-10deg)',
            width: '60%', textAlign: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.6))',
            border: '0.3vh solid #666', color: '#fff', padding: '1.5vh 0',
            fontSize: '4vh', fontWeight: 'bold', textShadow: '3px 3px 0 #000',
            letterSpacing: '1px'
        },
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
            <div style={styles.header}>Select Vehicle</div>

            <div style={styles.mainContent}>
                
                {/* SINISTRA: Stats e 3D */}
                <div style={styles.leftPanel}>
                    {/* Colonne Statistiche */}
                    <div style={styles.statsContainer}>
                        <StatBar label="Speed" value={localSelection.stats.speed} />
                        <StatBar label="Weight" value={localSelection.stats.weight} />
                        <StatBar label="Acceleration" value={localSelection.stats.accel} />
                        <StatBar label="Handling" value={localSelection.stats.handling} />
                        <StatBar label="Drift" value={localSelection.stats.drift} />
                        <StatBar label="Off-Road" value={localSelection.stats.offroad} />
                    </div>

                    {/* Canvas 3D */}
                    <div style={styles.canvasContainer}>
                         {/* Sfondo circolare dietro l'auto */}
                        <div style={{
                            position: 'absolute', width: '50vmin', height: '50vmin',
                            border: '0.3vmin solid rgba(255,255,255,0.1)', borderRadius: '50%', 
                            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)'
                        }}></div>

                        <Canvas camera={{ position: [3, 2, 5], fov: 45 }}>
                            <ambientLight intensity={1.5} />
                            <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} />
                            <Environment preset="city" />

                            <Suspense fallback={null}>
                                <RotatingShowcase 
                                    characterConfig={selectedCharacter.modelConfig} 
                                    vehicleData={localSelection}
									selectedCharacter={selectedCharacter}
                                />
                            </Suspense>
                        </Canvas>

                        <div style={styles.vehicleNameBox}>
                            {localSelection.name}
                        </div>
                    </div>
                </div>

                {/* DESTRA: Griglia */}
                <div style={styles.rightPanel}>
                    <div style={styles.gridContainer}>
                        {gridSlots.map((veh, index) => {
                            const isEmpty = !veh;
                            const isActive = veh && localSelection.name === veh.name;

                            return (
                                <div 
                                    key={index} 
                                    style={styles.gridItem(isActive, isEmpty)}
                                    onClick={() => !isEmpty && setLocalSelection(veh)}
                                >
                                    {!isEmpty && (
                                        // Qui useresti le icone dei veicoli se le hai
                                        // Per ora metto il nome piccolo o un placeholder
                                        <div style={{color: 'white', textAlign:'center', fontWeight:'bold', fontSize:'1.5vh'}}>
                                            {veh.name}
                                        </div>
                                        /* <img src={`./sprites/${veh.id}.png`} ... /> 
                                        */
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
                    onClick={() => setMenuState(0)} // Torna ai personaggi
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