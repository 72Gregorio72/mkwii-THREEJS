import React, { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function SmartMap({ modelPath, scale = 1 }) {
  const { scene } = useGLTF(modelPath)

  const visualScene = useMemo(() => {
    const clone = scene.clone()
    
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
		
        child.material.transparent = true

        child.material.alphaTest = 0.5
        
        child.material.depthWrite = true
        
        child.material.side = THREE.DoubleSide
        
        // Imposta renderOrder basso per renderizzare la pista sotto gli altri oggetti
        child.renderOrder = -1

        const name = child.name.toLowerCase()
      }
    })
    
    return clone
  }, [scene])

  // Cleanup: disposa risorse quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (visualScene) {
        visualScene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [visualScene]);

  return (
    <group scale={[scale, scale, scale]}>
      <primitive object={visualScene} />
    </group>
  )
}