import { Physics, RigidBody } from '@react-three/rapier' // <--- Aggiungi RigidBody
import { Canvas } from '@react-three/fiber'
import { SimpleKart } from './components/SimpleKart'
import { Road } from './Tracks/Road' 
import { useGLTF, OrbitControls } from '@react-three/drei'
import { VisualMap } from './Tracks/VisualMap'

export default function App() {
  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 60 }}>
      <ambientLight intensity={2} />
      {/* <OrbitControls /> */}
      <Physics debug> 
        
        <SimpleKart />
		<Road />

      </Physics>
    </Canvas>
  )
}