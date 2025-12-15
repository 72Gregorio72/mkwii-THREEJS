import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { OrbitControls, Environment, Stats } from '@react-three/drei' // <--- AGGIUNGI Stats QUI
import { SimpleKart } from './components/SimpleKart'
import { Track } from './Track'

export default function App() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 20], fov: 50, near: 0.1 }}>
      
      {/* 1. IL CONTATORE FPS (Apparirà in alto a sinistra) */}
      <Stats />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} dynamicShadows />
      <Environment preset="sunset" />

      <Physics>
        <SimpleKart />
        <Track />
        
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[500, 500]} />
            <meshStandardMaterial color="green" />
        </mesh>
      </Physics>
    </Canvas>
  )
}