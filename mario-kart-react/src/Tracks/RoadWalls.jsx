import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'
import { mergeVertices } from 'three-stdlib'

export function RoadWalls({ modelPath }) {
    const { nodes } = useGLTF(modelPath)

    // Trasformiamo i nodi del GLTF in un array di componenti fisici
    const { colliders, geometries } = useMemo(() => {
        const elements = [];
        const geomsToCleanup = [];
        
        Object.values(nodes).forEach((node) => {
            if (node.isMesh && node.geometry) {
                // Clona la geometria e applica le trasformazioni
                let geometry = node.geometry.clone();
                node.updateWorldMatrix(true, false);
                geometry.applyMatrix4(node.matrixWorld);
                
                geomsToCleanup.push(geometry);
                
                elements.push(
                    <RigidBody 
                        key={node.uuid} 
                        type="fixed" 
                        colliders={false}
                        name={node.name}
                    >
                        <MeshCollider type="trimesh">
                            <mesh geometry={geometry}>
                                <meshBasicMaterial visible={false} />
                            </mesh>
                        </MeshCollider>
                    </RigidBody>
                );
            }
        });
        
        return { colliders: elements, geometries: geomsToCleanup };
    }, [nodes]);

    // Cleanup geometrie quando il componente viene smontato
    useEffect(() => {
        return () => {
            geometries.forEach(geom => {
                if (geom) geom.dispose();
            });
        };
    }, [geometries]);

    return <group>{colliders}</group>;
}