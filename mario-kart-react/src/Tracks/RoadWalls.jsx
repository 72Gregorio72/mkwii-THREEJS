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
                // Invece di nascondere l'oggetto, nascondiamo il materiale
                // Cloniamo il materiale per evitare di nascondere altri oggetti che lo condividono
                if (node.material) {
                    node.material = node.material.clone();
                    node.material.visible = false; // <--- IL TRUCCO È QUI
                    // Opzionale: se vuoi essere sicuro che non influenzi il depth buffer
                    node.material.depthWrite = false; 
                }

                elements.push(
                    <RigidBody 
                        key={node.uuid} 
                        type="fixed" 
                        colliders="trimesh" // Rapier ora vede la mesh perché l'oggetto è "visible"
                        name={node.name}
                    >
                        {/* Rimuovi visible={false} da qui */}
                        <primitive object={node} /> 
                    </RigidBody>
                );
            }
        });
        
        return elements;
    }, [nodes]);

    return <group>{colliders}</group>;
}