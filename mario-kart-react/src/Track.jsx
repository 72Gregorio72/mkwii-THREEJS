import React from 'react'
import { useBox } from '@react-three/cannon'

// Componente base per un Muro (Statico)
const Wall = ({ args, position, rotation, color = "#cc0000" }) => {
  const [ref] = useBox(() => ({
    type: 'Static', // Importante: non si muove
    mass: 0,
    args: args, // Dimensioni per la fisica (Half-extents non servono qui se passiamo args diretti a Three)
    position,
    rotation,
    material: { friction: 0.3, restitution: 0.2 } // Un po' di rimbalzo sui muri
  }))

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Componente base per il Pavimento (Statico)
const Road = ({ args, position, rotation, color = "#333" }) => {
  const [ref] = useBox(() => ({
    type: 'Static',
    mass: 0,
    args: args,
    position,
    rotation,
    material: { friction: 0.05, restitution: 0 } // Attrito basso per scivolare/driftare meglio
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Componente Rampa
const Ramp = ({ position, rotation }) => {
    // Una rampa è solo un box ruotato
    const [ref] = useBox(() => ({
      type: 'Static',
      args: [10, 1, 10],
      position,
      rotation, 
      material: { friction: 0.1 }
    }))
  
    return (
      <mesh ref={ref} receiveShadow>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#f0d000" />
      </mesh>
    )
  }

export function Track() {
  return (
    <group>
      {/* --- RETTILINEO PRINCIPALE (Lunghezza 60, Larghezza 20) --- */}
      <Road args={[20, 1, 60]} position={[0, -1.5, -20]} />
      {/* Muri Laterali Rettilineo */}
      <Wall args={[1, 3, 60]} position={[-10, 0, -20]} />
      <Wall args={[1, 3, 40]} position={[10, 0, -30]} /> {/* Muro destro bucato per uscita */}

      {/* --- CURVA 1 (Fondo) --- */}
      <Road args={[40, 1, 20]} position={[-10, -1.5, -60]} />
      <Wall args={[42, 3, 1]} position={[-10, 0, -70]} /> {/* Muro di fondo */}
      
      {/* --- RETTILINEO DI RITORNO --- */}
      <Road args={[20, 1, 60]} position={[-20, -1.5, -20]} />
      <Wall args={[1, 3, 60]} position={[-30, 0, -20]} /> {/* Muro esterno sinistro */}

      {/* --- START AREA --- */}
      <Road args={[40, 1, 20]} position={[-10, -1.5, 20]} />
      <Wall args={[42, 3, 1]} position={[-10, 0, 30]} /> {/* Muro posteriore */}
      <Wall args={[1, 3, 20]} position={[10, 0, 20]} /> 

      {/* --- LA RAMPA (Per testare la gravità) --- */}
      {/* Mettiamola in mezzo al rettilineo principale */}
      <Ramp position={[0, -0.5, -10]} rotation={[-0.3, 0, 0]} />
      
      {/* --- OSTACOLI --- */}
      <Wall args={[2, 2, 2]} position={[-20, 0, 0]} color="blue" />
      <Wall args={[2, 2, 2]} position={[-24, 0, -10]} color="blue" />

    </group>
  )
}