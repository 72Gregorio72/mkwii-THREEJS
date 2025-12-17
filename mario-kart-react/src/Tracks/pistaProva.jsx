import React from 'react'
import { useGLTF } from '@react-three/drei'
import { useTrimesh } from '@react-three/cannon'
import { DoubleSide } from 'three'

export function PistaProva(props) {
  // Carica il modello
  const { nodes } = useGLTF('pistaProva.glb')

  // Recupera la geometria del collider
  const geometry = nodes.COLLIDER_ROAD.geometry

  // Crea la fisica (Static Trimesh)
  const [ref] = useTrimesh(() => ({
    args: [
      geometry.attributes.position.array, // Vertici
      geometry.index.array                // Indici
    ],
    mass: 0,          // Massa 0 = Oggetto immobile
    type: 'Static',
    friction: 0.0,    // Attrito (aumentalo se il kart scivola troppo)
    ...props
  }))

  return (
    <group dispose={null}>
      {/* Usiamo lo stesso "ref" sia per la fisica che per la grafica 
         perché hai un solo oggetto.
      */}
      <mesh ref={ref} geometry={geometry} castShadow receiveShadow>
        {/* Materiale visivo provvisorio (Grigio Asfalto) */}
        <meshStandardMaterial 
          color="#555555" 
          side={DoubleSide} // Renderizza anche se guardi da sotto
          roughness={0.6}
        />
      </mesh>
    </group>
  )
}

// Precaricamento
useGLTF.preload('pistaProva.glb')