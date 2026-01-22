import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

export const LightningAtmosphere = () => {
    const { scene } = useThree();
    const darknessMeshRef = useRef();
    
    // Valori di riferimento per l'animazione (non causano re-render)
    const atmosValues = useRef({
        fogDensity: 0.002, // Valore base di nebbia (poca o nulla)
        darknessOpacity: 0 // Inizia trasparente (nessun oscuramento)
    });

    useEffect(() => {
        // 1. Setup iniziale della nebbia nella scena
        // Usiamo FogExp2 per una nebbia più realistica che cresce esponenzialmente
        scene.fog = new THREE.FogExp2('black', atmosValues.current.fogDensity);

        const handleStrike = () => {
            if (!darknessMeshRef.current) return;

            // --- SEQUENZA DI ANIMAZIONE GSAP ---
            const tl = gsap.timeline();

            tl
            // FASE 1: ATTACCO IMPROVVISO (0.1s)
            // La nebbia diventa densa e il cielo si scurisce di colpo
            .to(atmosValues.current, {
                fogDensity: 0.05,      // Molto densa
                darknessOpacity: 0.85, // Molto scuro (85% nero)
                duration: 0.1,
                ease: "power4.in", // Molto aggressivo
                onUpdate: applyValues // Applica i valori ad ogni frame dell'animazione
            })
            // FASE 2: SOSTEGNO (1.0s)
            // Rimane buio mentre i kart vanno in testacoda
            .to({}, { duration: 1.0 }) 
            // FASE 3: DISSOLVENZA LENTA (2.5s)
            // Torna normale lentamente
            .to(atmosValues.current, {
                fogDensity: 0.002,     // Torna al valore base
                darknessOpacity: 0,    // Torna trasparente
                duration: 1,
                ease: "power2.out", // Dissolvenza morbida
                onUpdate: applyValues
            });
        };

        window.addEventListener('lightning-strike', handleStrike);
        
        // Cleanup
        return () => {
            window.removeEventListener('lightning-strike', handleStrike);
            scene.fog = null; // Rimuovi la nebbia quando smonti il componente
        };
    }, [scene]);

    // Funzione helper per applicare i valori correnti dai ref agli oggetti Three.js
    const applyValues = () => {
        if (scene.fog) {
            scene.fog.density = atmosValues.current.fogDensity;
        }
        if (darknessMeshRef.current) {
            darknessMeshRef.current.material.opacity = atmosValues.current.darknessOpacity;
        }
    };

    return (
        // Una sfera GIGANTE nera che avvolge tutta la scena.
        // Renderizziamo il lato interno (BackSide) e usiamo materiale trasparente.
        <mesh ref={darknessMeshRef} scale={[500, 500, 500]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
                color="black" 
                side={THREE.BackSide} // Importante: vediamo l'interno della sfera
                transparent={true} 
                opacity={0} // Inizia invisibile
                depthWrite={false} // Non deve nascondere gli oggetti dietro di sé nel depth buffer
            />
        </mesh>
    );
};