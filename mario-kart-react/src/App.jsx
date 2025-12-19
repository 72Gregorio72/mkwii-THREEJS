import { Physics, RigidBody } from '@react-three/rapier' // <--- Aggiungi RigidBody
import { Canvas } from '@react-three/fiber'
import { SimpleKart } from './components/SimpleKart'
import { Road } from './Tracks/Road' 
import { useGLTF, OrbitControls } from '@react-three/drei'
import { VisualMap } from './Tracks/VisualMap'
import { SmartMap } from './Tracks/StartMap'
import { CameraLogger } from './CameraLogger'
import { OutsideDriftKart } from './components/OutsideDriftKart'

export default function App() {
  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 60 }} dpr={[1, 1.5]}>
      <ambientLight intensity={3} />
      {/* <OrbitControls />
	  <CameraLogger /> */}
      <Physics> 
        	<SimpleKart START_POS = {[-200, 100, 270]} />
			{/* <OutsideDriftKart START_POS = {[-200, 100, 270]} /> */}
      <SmartMap 
			modelPath="/LuigiCircuit_colliders.glb" 
			scale={1} 
		/>

      </Physics>
    </Canvas>
  )
}