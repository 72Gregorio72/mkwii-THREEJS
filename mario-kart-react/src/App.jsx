// App.jsx
import { Canvas } from '@react-three/fiber'
import { Physics, Debug } from '@react-three/cannon'
import { Stats, Environment, OrbitControls } from '@react-three/drei' // <--- 1. IMPORTALO
import { SimpleKart } from './components/SimpleKart'
import { LuigiCircuit } from './Tracks/LuigiCircuit'

export default function App() {
  return (
    // Metti una posizione iniziale alta per vedere tutta la pista
    <Canvas shadows camera={{ position: [0, 50, 50], fov: 60 }}>
      <Stats />
      
      {/* <OrbitControls /> */}

      <ambientLight intensity={0.5} />
      <Environment preset="sunset" />

      <Physics gravity={[0, -20, 0]}>
        <Debug color="black" scale={1.1}>
           <SimpleKart />
           <LuigiCircuit position={[0, -5, 0]} />
           
           <mesh position={[0, 5, 0]}>
               <boxGeometry args={[0, 0, 0]} />
               <meshBasicMaterial color="red" wireframe />
           </mesh>
        </Debug>
      </Physics>
    </Canvas>
  )
}