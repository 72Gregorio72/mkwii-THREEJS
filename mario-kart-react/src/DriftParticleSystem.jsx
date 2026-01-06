import React, { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'

// DEBUG MODE: MAX PARTICELLE
const MAX_PARTICLES = 100; 

export function DriftParticleSystem({ driftLevel, isDrifting }) {
  
  const [particles, setParticles] = useState([]);
  const frameCount = useRef(0);

  useFrame((state, delta) => {
    frameCount.current++;
    
    // --- MODIFICA DEBUG: EMISSIONE SEMPRE ATTIVA ---
    // Togliamo il controllo driftLevel > 0 per ora. 
    // Se premi spazio (drift) devono uscire, anche da fermo.
    const shouldEmit = isDrifting; 

    if (shouldEmit && frameCount.current % 2 === 0) { // Emetti ogni 2 frame
      setParticles(prev => {
        const currentParticles = prev.length > MAX_PARTICLES ? prev.slice(1) : prev;
        
        return [...currentParticles, {
          id: Math.random(),
          // ALZIAMO LA POSIZIONE DI PARTENZA (y: 0.5)
          pos: new THREE.Vector3(0, 0.5, 0), 
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 1,  // Più larghe
            (Math.random() * 1) + 0.5,  // Vanno molto in alto
            -(Math.random() * 2) - 1    
          ),
          rotation: Math.random() * Math.PI,
          scale: 1, // Grandi per vederle bene
          life: 1.0, 
          // Colore fisso per debug
          color: driftLevel === 2 ? 'red' : '#00ff00' 
        }];
      });
    }

    // Aggiornamento fisica
    setParticles(prev => prev.map(p => ({
        ...p,
        pos: p.pos.add(p.velocity.clone().multiplyScalar(delta * 5)), 
        rotation: p.rotation + (2 * delta),
        life: p.life - (delta * 2) // Durano mezza secondo
      }))
      .filter(p => p.life > 0)
    );
  });

  return (
    <group>
      {particles.map(p => (
        <Billboard
          key={p.id}
          position={p.pos}
          follow={true}
        >
          <mesh rotation={[0, 0, p.rotation]}>
            <planeGeometry args={[0.5, 0.5]} /> {/* Quadrati belli grossi */}
            {/* MATERIALE DEBUG: Semplice colore solido, niente texture */}
            <meshBasicMaterial 
              color={p.color}
              transparent={false} // Opachi
              side={THREE.DoubleSide}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  )
}