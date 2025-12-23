// components/RacerModel.jsx
import React, { useMemo, useEffect } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { MathUtils, DoubleSide } from 'three'

export function RacerModel({ characterConfig, steer, drift, debug, ...props }) {
  const { scene } = useGLTF(characterConfig.file)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  // --- DEBUG LOGGER AGGIORNATO ---
  useEffect(() => {
    if (debug) {
       console.group(`🔍 ANALISI MODELLO: ${characterConfig.file}`)
       const skinnedMeshesNames = Object.values(nodes).filter(n => n.isSkinnedMesh).map(n => n.name)
       console.log(`✅ Trovate ${skinnedMeshesNames.length} mesh da renderizzare:`, skinnedMeshesNames)
       
       if (characterConfig.bodyNode && nodes[characterConfig.bodyNode]) {
         console.log(`✅ Body Node confermato: ${characterConfig.bodyNode}`)
       } else {
         console.warn(`⚠️ Body Node '${characterConfig.bodyNode}' non trovato o non specificato. Verrà usato un fallback.`)
       }
       console.groupEnd()
    }
  }, [characterConfig.file, nodes, debug, characterConfig.bodyNode])
  // --------------------

  // 1. Setup Materiali Universale
  // Applica le impostazioni (ombre, doppio lato) a TUTTE le mesh del modello
  useEffect(() => {
    clone.traverse((object) => {
      if (object.isMesh) {
        object.material.side = DoubleSide
        object.castShadow = true
        object.receiveShadow = true
        object.material.transparent = false 
        object.material.depthWrite = true
      }
    })
  }, [clone])

  // 2. Logica per trovare il nodo "Body" (quello che ruota per sterzare)
  const bodyNode = useMemo(() => {
    // Priorità 1: Configurazione manuale
    if (characterConfig.bodyNode && nodes[characterConfig.bodyNode]) {
      return nodes[characterConfig.bodyNode];
    }
    // Priorità 2: Auto- discovery
    const autoBody = Object.values(nodes).find(n => n.name.endsWith('_body') || n.name.includes('spine'));
    if (autoBody) return autoBody;

    // Fallback: il primo osso disponibile
    return Object.values(nodes).find(n => n.type === 'Bone'); 
  }, [nodes, characterConfig.bodyNode]);


  // 3. NUOVA LOGICA: Trova TUTTE le mesh del personaggio
  // Invece di cercarne una sola, filtriamo tutte quelle che sono SkinnedMesh
  const allCharacterMeshes = useMemo(() => {
    return Object.values(nodes).filter(node => node.isSkinnedMesh);
  }, [nodes]);


  // 4. Animazione Sterzata
  useFrame((state, delta) => {
    let targetLean = -steer * 0.5
    if (drift !== 0) targetLean = drift === 1 ? -0.8 : 0.8
    
    // Ruotiamo solo il nodo principale dello scheletro (bodyNode)
    // Tutte le mesh collegate allo scheletro lo seguiranno automaticamente.
    if (bodyNode) {
       bodyNode.rotation.y = MathUtils.damp(bodyNode.rotation.y, targetLean, 4, delta)
    }
  })

  // Safety check
  if (allCharacterMeshes.length === 0 || !bodyNode) {
      if (debug) console.warn("❌ Impossibile renderizzare: nodi mancanti.");
      return null; 
  }

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={characterConfig.scale || 0.01}>
        
        {/* Inseriamo lo scheletro (l'armatura) */}
        <primitive object={bodyNode} />

        {/* LOOP DI RENDERIZZAZIONE
            Per ogni mesh trovata (polygon0, polygon1, etc.), creiamo una skinnedMesh.
            Nota: usiamo meshNode.material, così ogni pezzo usa il suo materiale originale.
        */}
        {allCharacterMeshes.map((meshNode) => (
          <skinnedMesh 
              key={meshNode.name} // Importante: chiave univoca per React
              geometry={meshNode.geometry} 
              material={meshNode.material} 
              skeleton={meshNode.skeleton} 
              castShadow
              receiveShadow
          />
        ))}
      </group>
    </group>
  )
}