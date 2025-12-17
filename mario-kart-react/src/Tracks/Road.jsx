import { useGLTF } from '@react-three/drei';
import { RigidBody, MeshCollider } from '@react-three/rapier';

export function Road() {
  const { scene } = useGLTF('/LuigiRoad.glb') 
  
  return (
    // "type='fixed'" = non cade nel vuoto
    // "colliders='trimesh'" = crea una hitbox precisa sulla forma della mesh
    <RigidBody type="fixed" colliders="trimesh">
        <primitive object={scene} />
    </RigidBody>
  )
}