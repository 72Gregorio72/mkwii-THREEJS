import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'
import { mergeVertices } from 'three-stdlib'

export function RoadWalls({ modelPath }) {
    const { nodes } = useGLTF(modelPath)

    // Trasformiamo i nodi del GLTF in un array di componenti fisici
    const colliders = useMemo(() => {
        const elements = [];
        
        Object.values(nodes).forEach((node) => {
            if (node.isMesh) {
                elements.push(
                    <RigidBody 
                        key={node.uuid} 
                        type="fixed" 
                        colliders="trimesh"
                        name={node.name}
                    >
                        <primitive object={node} visible={false} />
                    </RigidBody>
                );
            }
        });
        
        return elements;
    }, [nodes]);

    return <group>{colliders}</group>;
}