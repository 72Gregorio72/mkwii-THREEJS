import { useGLTF } from '@react-three/drei';
import { RigidBody, MeshCollider } from '@react-three/rapier'; // <--- Importiamo MeshCollider
import { useMemo } from 'react';

export function Map() {
  const { scene } = useGLTF('/pistaProva.glb'); 

  const colliderData = useMemo(() => {
    const data = [];
    scene.traverse((child) => {
      if (child.isMesh && child.name.includes('_collider')) {
        child.visible = true;
		if (!child.geometry.index) {
			// Se la geometria non ha un indice, lo calcoliamo noi
			child.geometry.computeVertexNormals(); 
		}
        data.push({
          geometry: child.geometry,
          position: child.position.clone(),
          rotation: child.rotation.clone(),
          scale: child.scale.clone(),
        });
      }
    });
    return data;
  }, [scene]);

  return (
    <group>
      {/* Modello visivo */}
      <primitive object={scene} />

      {/* Fisica */}
      {colliderData.map((data, index) => (
        <RigidBody 
            key={index} 
            type="fixed" 
            colliders={false} // <--- DISATTIVA L'AUTOMATISMO! Importante.
            position={data.position}
            rotation={data.rotation}
            scale={data.scale}
        >
            {/* Usiamo MeshCollider esplicito.
               Questo componente forza Rapier a calcolare la fisica sulla mesh figlia.
            */}
            <MeshCollider type="trimesh">
                <mesh geometry={data.geometry} visible={false}>
                    {/* Materiale di debug per vedere se la mesh esiste davvero */}
                    <meshBasicMaterial color="red" wireframe /> 
                </mesh>
            </MeshCollider>
        </RigidBody>
      ))}
    </group>
  );
}