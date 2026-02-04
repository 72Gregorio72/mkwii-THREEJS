import React, { useMemo } from 'react'
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

        const name = child.name.toLowerCase()
        if (name.includes('collider') || name.includes('polygon456')) {
          child.visible = false
        }
      }
    })
    
    return clone
  }, [scene])

  return (
    <group scale={[scale, scale, scale]}>
      <primitive object={visualScene} />
    </group>
  )
}