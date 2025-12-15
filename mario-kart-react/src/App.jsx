import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, usePlane, Debug } from '@react-three/cannon' // <--- IMPORTA DEBUG
import { OrbitControls, Sky, Environment } from '@react-three/drei'
import { Car } from './components/Car' 
import { SimpleKart } from './components/SimpleKart'
import { Track } from './Track'

// https://models.spriters-resource.com/wii/mkwii/asset/302593/

export default function App() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="city" />

      {/* Broadphase SAP è meglio per evitare compenetrazioni */}
      <Physics gravity={[0, -15, 0]} broadphase="SAP">
        {/* DEBUG mostra i collider wireframe. Rimuovilo quando il gioco funziona */}
        <Debug>
		  <SimpleKart position={[0, 0.5, 0]} />
		  <Track />
        </Debug>
      </Physics>
      
      <OrbitControls />
    </Canvas>
  )
}