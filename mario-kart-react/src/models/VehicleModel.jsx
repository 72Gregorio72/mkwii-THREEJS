import React, { useMemo, useEffect } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { MathUtils, DoubleSide } from 'three'

export function VehicleModel({ vehicleConfig, steer, speed = 10, drift, isBike, debug, ...props }) {
  const { scene } = useGLTF(vehicleConfig.file)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  // 1. Setup Materiali (Shadows & DoubleSide)
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

  // 2. LOGICA: Trova TUTTE le mesh da renderizzare
  const allVehicleMeshes = useMemo(() => {
    return Object.values(nodes).filter(node => node.isSkinnedMesh);
  }, [nodes]);

  // 3. LOGICA: Auto-Discovery delle Parti (Ruote e Corpo)
  const vehicleParts = useMemo(() => {
    const allNodes = Object.values(nodes);
    
    // a. Cerca il corpo principale (per inclinare le moto)
    // Spesso si chiama 'root', 'all_root' o finisce con 'body'
    const body = allNodes.find(n => n.type === 'Bone' && (n.name === 'root' || n.name === 'all_root' || n.name.includes('body')));

    // b. Cerca le ruote ANTERIORI (per sterzare)
    // Regex: cerca nomi che contengono "tire" o "wheel" E ANCHE "f" (front)
    const frontWheels = allNodes.filter(n => 
        n.type === 'Bone' && 
        (/tire.*f|wheel.*f|f_wheel/i.test(n.name))
    );

    // c. Cerca le ruote POSTERIORI (solo rotazione)
    // Regex: cerca nomi che contengono "tire" o "wheel" E ANCHE "r" (rear)
    const rearWheels = allNodes.filter(n => 
        n.type === 'Bone' && 
        (/tire.*r|wheel.*r|r_wheel/i.test(n.name))
    );

    return { body, frontWheels, rearWheels };
  }, [nodes]);

  // --- DEBUG LOGGER ---
  useEffect(() => {
    if (debug) {
       console.group(`🚗 ANALISI VEICOLO: ${vehicleConfig.file}`)
       console.log(`Ruote Anteriori trovate (${vehicleParts.frontWheels.length}):`, vehicleParts.frontWheels.map(n => n.name));
       console.log(`Ruote Posteriori trovate (${vehicleParts.rearWheels.length}):`, vehicleParts.rearWheels.map(n => n.name));
       console.log(`Main Body Node:`, vehicleParts.body ? vehicleParts.body.name : 'Non trovato');
       console.groupEnd()
    }
  }, [vehicleConfig.file, debug, vehicleParts])
  // --------------------

  // 4. Animazione Frame (Sterzata Ruote & Rotazione)
  useFrame((state, delta) => {
    // A. Sterzata Ruote Anteriori (Sull'asse Y)
    // Moltiplichiamo steer per 0.5 o 0.8 per limitare l'angolo
    const steerAngle = steer * 0.5;
    
    vehicleParts.frontWheels.forEach(wheel => {
        // MathUtils.damp per rendere la sterzata fluida
        wheel.rotation.y = MathUtils.damp(wheel.rotation.y, steerAngle, 4, delta);
    });

    // B. Rotazione Ruote (Effetto Velocità - Sull'asse X)
    // Se vuoi che girino davvero, incrementa rotation.x basandoti su speed
    const spinSpeed = speed * delta * 5; // Moltiplicatore arbitrario
    [...vehicleParts.frontWheels, ...vehicleParts.rearWheels].forEach(wheel => {
        wheel.rotation.x += spinSpeed; 
    });

    // C. Inclinazione Moto (Se è una moto)
    if (isBike && vehicleParts.body) {
        let targetLean = -steer * 0.5;
        if (drift !== 0) targetLean = drift === 1 ? -0.8 : 0.8;
        vehicleParts.body.rotation.z = MathUtils.damp(vehicleParts.body.rotation.z, -targetLean, 4, delta); 
        // Nota: Spesso nelle moto si usa la Z per il piegamento laterale rispetto al root, 
        // ma dipende dal modello. Se gira strano, prova rotation.y o x.
    }
  })

  // Fallback se non trova mesh
  if (allVehicleMeshes.length === 0) return null;

  // Troviamo il nodo radice per posizionare il tutto (spesso è il genitore del body o il body stesso)
  // Se non c'è un body specifico trovato, usiamo il primo osso disponibile come root visiva
  const rootNode = vehicleParts.body || Object.values(nodes).find(n => n.type === 'Bone');

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={vehicleConfig.scale || 0.01}>
        
        {/* Primitiva scheletro */}
        {rootNode && <primitive object={rootNode} />}

        {/* Mesh Loop */}
        {allVehicleMeshes.map((meshNode) => (
          <skinnedMesh 
              key={meshNode.name}
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