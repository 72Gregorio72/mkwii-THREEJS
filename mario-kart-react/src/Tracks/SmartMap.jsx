import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, MeshCollider } from '@react-three/rapier'

export function SmartMap({ modelPath, scale = 1 }) {
  const { scene } = useGLTF(modelPath)

  const { roads, walls, grass, defaults, visualScene } = useMemo(() => {
    // Cloniamo la scena per lavorarci
    const clone = scene.clone()
    
    // Secchi per la fisica
    const buckets = {
      roads: [],   // Grip alto (Strada invisibile)
      walls: [],   // Scivolosi (Muri invisibili)
      grass: [],   // Attrito (Erba invisibile)
      defaults: [] // Standard (Oggetti visibili come alberi, case, ecc.)
    }

    clone.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase()
        
        // --- 1. PROXY COLLIDERS (Invisibili + Tag Speciali) ---
        if (name.includes('polygon456')) {
          // child.visible = true // NON NECESSARIO QUI se usiamo il wireframe sotto
          buckets.roads.push(child.geometry)
        } 
        else if (name.includes('wall_collider')) {
          // child.visible = true
          buckets.walls.push(child.geometry)
        } 
        else if (name.includes('grass_collider')) {
          // child.visible = true
          buckets.grass.push(child.geometry)
        }
        // --- 2. ESCLUSIONI (Solo Grafica) ---
        // Usa questo tag per la mesh della strada bella, così non collide doppia
        else if (name.includes('_visual') || name.includes('_ghost')) {
           // Non facciamo nulla: resta visibile, niente fisica.
        }
        // --- 3. TUTTO IL RESTO (Visibile + Fisica Default) ---
        else {
          // Non nascondiamo la mesh (child.visible resta true)
          // Ma aggiungiamo la sua geometria al secchio "defaults" per renderla solida
          buckets.defaults.push(child.geometry)
        }
      }
    })

    return { 
      roads: buckets.roads, 
      walls: buckets.walls, 
      grass: buckets.grass, 
      defaults: buckets.defaults,
      visualScene: clone 
    }
  }, [scene])

  // Helper per creare i gruppi fisici
  const ColliderGroup = ({ geometries, label, friction, restitution, color, isVisible = false }) => {
    if (!geometries || geometries.length === 0) return null;

    return (
      <RigidBody 
        type="fixed" 
        colliders={false} 
        scale={[scale, scale, scale]} 
        position={[0, 0, 0]} 
        friction={friction}
        restitution={restitution}
        userData={{ type: label }}
      >
        {geometries.map((geo, index) => (
          <MeshCollider key={index} type="trimesh">
            {/* MODIFICA 1: Cambiato visible={false} in visible={true} 
                Questo rende visibili le mesh della fisica (in wireframe)
            */}
            <mesh geometry={geo}>
               <meshBasicMaterial visible={false} color={color} wireframe />
            </mesh>
          </MeshCollider>
        ))}
      </RigidBody>
    )
  }

  return (
    <group>
      {/* 1. TUTTA LA GRAFICA (VisualScene contiene tutto ciò che non è stato nascosto) */}
      <primitive object={visualScene} scale={[scale, scale, scale]} />

      {/* 2. LIVELLI FISICI */}
      
      {/* Proxy Strada */}
      {/* MODIFICA 2: Cambiato color="yellow" in color="purple" 
      */}
      <ColliderGroup geometries={roads} label="road" friction={1} restitution={0} color="purple" />

      {/* Proxy Muri (Si vedranno rossi wireframe) */}
      <ColliderGroup geometries={walls} label="wall" friction={0} restitution={0.5} color="red" />

      {/* Proxy Erba (Si vedranno verdi wireframe) */}
      <ColliderGroup geometries={grass} label="grass" friction={0.6} restitution={0} color="green" />

      {/* Oggetti Comuni (Si vedranno blu wireframe sopra la grafica reale) */}
      <ColliderGroup geometries={defaults} label="default" friction={0} restitution={0} color="blue" />

    </group>
  )
}