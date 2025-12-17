import { useGLTF } from '@react-three/drei';
import { RigidBody, MeshCollider } from '@react-three/rapier';
import { useMemo } from 'react';

export function VisualMap({ mapScale = 1 }) {
  const { scene } = useGLTF('/LuigiRoad.glb');

  // 1. Prepariamo la scena per la GRAFICA (Cloniamo per sicurezza)
  const visualScene = useMemo(() => scene.clone(), [scene]);

  // 2. Estraiamo le mesh per la FISICA
  const physicsMeshes = useMemo(() => {
    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
    return meshes;
  }, [scene]);

  return (
    <group>
      
      {/* --- 1. PARTE VISIVA (Il modello vero e proprio) --- 
          Scaliamo questo oggetto direttamente con Three.js. 
          Non ha nulla a che fare con la fisica, è solo quello che vedi.
      */}
      <primitive 
        object={visualScene} 
        scale={[mapScale, mapScale, mapScale]} 
        position={[0, 0, 0]}
      />

      {/* --- 2. PARTE FISICA (Invisibile) --- 
          Creiamo un corpo fisico separato, ma con la STESSA scala e posizione.
          I collider interni saranno invisibili (visible={false}) per non sovrapporsi.
      */}
      <RigidBody 
        type="fixed" 
        colliders={false} 
        scale={[mapScale, mapScale, mapScale]} 
        position={[0, 0, 0]}
        friction={1}
      >
        {physicsMeshes.map((mesh, index) => (
          <MeshCollider key={index} type="trimesh">
            {/* Qui usiamo la geometria per la collisione, 
               ma la rendiamo INVISIBILE perché la grafica è gestita sopra.
            */}
            <mesh geometry={mesh.geometry} visible={false} />
          </MeshCollider>
        ))}
      </RigidBody>

    </group>
  );
}

useGLTF.preload('/LuigiRoad.glb');