import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'
// Importiamo l'utility per unire i vertici
import { mergeVertices } from 'three-stdlib'

export function RoadWalls({ modelPath, wallHeight = 3, thresholdAngle = 20, debug = false }) {
  const { scene } = useGLTF(modelPath)

  const wallGeometry = useMemo(() => {
    const allVertices = [];
    const allIndices = [];
    let indexOffset = 0;

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (child.isMesh) {
        // --- PASSAGGIO CHIAVE: SALDATURA VERTICI ---
        // 1. Cloniamo la geometria per non rompere il modello visivo originale
        let tempGeo = child.geometry.clone();

        // 2. Opzionale: Rimuoviamo attributi che potrebbero impedire l'unione 
        // (se due vertici hanno UV diverse, non vengono uniti, quindi li togliamo per il calcolo fisico)
        tempGeo.deleteAttribute('uv'); 
        tempGeo.deleteAttribute('normal'); 

        // 3. Uniamo i vertici vicini (Saldatura)
        // Questo trasforma i segmenti separati in un unico nastro continuo
        tempGeo = mergeVertices(tempGeo, 0.01); // 0.01 è la tolleranza di distanza
        
        // Ricalcoliamo le normali per sicurezza (serve a EdgesGeometry)
        tempGeo.computeVertexNormals();

        // --- FINE SALDATURA ---

        // 4. Ora EdgesGeometry vedrà solo il bordo ESTERNO, ignorando le linee interne
        const edges = new THREE.EdgesGeometry(tempGeo, thresholdAngle);
        const linePos = edges.attributes.position.array;

        if (linePos.length === 0) return;

        const v1 = new THREE.Vector3();
        const v2 = new THREE.Vector3();

        for (let i = 0; i < linePos.length; i += 6) {
          v1.set(linePos[i], linePos[i+1], linePos[i+2]);
          v2.set(linePos[i+3], linePos[i+4], linePos[i+5]);

          // Convertiamo in World Space
          v1.applyMatrix4(child.matrixWorld);
          v2.applyMatrix4(child.matrixWorld);

          // Costruzione Muro (Verticale su Y assoluta)
          allVertices.push(v1.x, v1.y, v1.z); 
          allVertices.push(v2.x, v2.y, v2.z); 
          
          allVertices.push(v1.x, v1.y + wallHeight, v1.z); 
          allVertices.push(v2.x, v2.y + wallHeight, v2.z); 

          allIndices.push(
            indexOffset, indexOffset + 1, indexOffset + 2, 
            indexOffset + 1, indexOffset + 3, indexOffset + 2
          );
          
          indexOffset += 4;
        }
      }
    });

    if (allVertices.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    geometry.setIndex(allIndices);
    geometry.computeVertexNormals();

    return geometry;

  }, [scene, wallHeight, thresholdAngle]);

  if (!wallGeometry) return null;

  return (
    <RigidBody 
      key={wallGeometry.uuid} 
      type="fixed" 
      colliders={false} 
      position={[0,0,0]} 
      rotation={[0,0,0]}
    >
      <MeshCollider type="trimesh">
        <mesh geometry={wallGeometry}>
          <meshBasicMaterial 
            color="red" 
            opacity={0.5} 
            transparent={true} 
            visible={false} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </MeshCollider>
    </RigidBody>
  )
}