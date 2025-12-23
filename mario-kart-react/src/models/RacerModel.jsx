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

  // --- DEBUG LOGGER SCHELETRO ---
  useEffect(() => {
    if (debug) {
       console.group(`💀 ANALISI SCHELETRO: ${characterConfig.file}`)
       
       // 1. Trova tutte le ossa
       const allBones = Object.values(nodes).filter(n => n.type === 'Bone')
       const boneNames = allBones.map(b => b.name)
       
       console.log(`Numero ossa trovate: ${allBones.length}`)
       console.log("Lista Nomi Ossa:", boneNames)

       // 2. Controllo rapido per Mixamo
       const hasMixamo = boneNames.some(name => name.includes('Mixamo') || name === 'Hips');
       console.log("È compatibile Mixamo diretto?", hasMixamo ? "✅ SI" : "❌ NO (Serve Retargeting)");

       console.groupEnd()
    }
  }, [characterConfig.file, nodes, debug])
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