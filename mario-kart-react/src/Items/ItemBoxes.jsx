import React, { useMemo, useState, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, Clone } from '@react-three/drei' // Clone è utile per istanze multiple
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'

// --- COMPONENTE SINGOLO ITEM BOX ---
function SingleItemBox({ position, rotation }) {
    // Carichiamo il modello dell'Item Box
    const { scene } = useGLTF('/items/ItemBox.glb')
    
    // Stato per sapere se è attivo (visibile) o preso
    const [isActive, setIsActive] = useState(true)
    const [scale, setScale] = useState(new THREE.Vector3(1, 1, 1))
    
    // Riferimento per l'animazione
    const meshRef = useRef()

    // Logica di collisione
    const handleIntersection = ({ other }) => {
        if (!isActive) return;

        console.log("ItemBox preso!")
        setIsActive(false) 

        setTimeout(() => {
            setIsActive(true)
        }, 2000)
    }

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // 1. Animazione Rotazione costante (stile Mario Kart)
        meshRef.current.rotation.y += delta * 2;

        // 2. Animazione Rimpicciolimento / Ingrandimento
        const targetScale = isActive ? 1 : 0;
        
        // Usiamo lerp per un'animazione fluida verso il target (0 o 1)
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10)
    })

    return (
        <RigidBody 
            type="fixed" 
            colliders="hull" // Usa la forma del modello come collider
            sensor // Importante: non sbatte, ma rileva il passaggio
            onIntersectionEnter={handleIntersection}
            position={position}
            rotation={rotation}
        >
            <group ref={meshRef}>
                 <Clone object={scene} />
            </group>
        </RigidBody>
    )
}

export function ItemBoxesMap({ mapModelPath, triggerName = "Cube" }) {
    const { scene } = useGLTF(mapModelPath)

    const itemSpawns = useMemo(() => {
        const spawns = []
        
        console.group("--- DEBUG ITEM BOXES ---");
        console.log(`Cercando oggetti che contengono: "${triggerName}"`);
        
        // Aggiorna le matrici per essere sicuri che le posizioni globali siano corrette
        scene.updateMatrixWorld(true);

        let objectsFound = 0;

        scene.traverse((child) => {
            // Stampa ogni singolo oggetto trovato nella scena per controllare i nomi
            // Togli il commento qui sotto se la console è troppo piena, ma è utile per la prima volta
            // console.log("Oggetto scansionato:", child.name, "| Tipo:", child.type);

            if (child.isMesh) {
                // Controllo se il nome include la stringa (ignorando maiuscole/minuscole per sicurezza)
                if (child.name.toLowerCase().includes(triggerName.toLowerCase())) {
                    
                    console.log(`✅ TROVATO SPAWN: ${child.name}`);
                    
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const rotation = new THREE.Euler();

                    // Ottieni posizione/rotazione assolute nel mondo
                    child.getWorldPosition(position);
                    child.getWorldQuaternion(quaternion);
                    rotation.setFromQuaternion(quaternion);

                    console.log(`   -> Posizione: x:${position.x.toFixed(2)}, y:${position.y.toFixed(2)}, z:${position.z.toFixed(2)}`);

                    spawns.push({
                        position: [position.x, position.y, position.z],
                        rotation: [rotation.x, rotation.y, rotation.z]
                    });
                    
                    objectsFound++;
                }
            }
        });

        console.log(`Totale Item trovati: ${objectsFound}`);
        if (objectsFound === 0) {
            console.warn("⚠️ NESSUN OGGETTO TROVATO! Controlla i nomi in Blender.");
            console.warn("Suggerimento: Controlla che gli oggetti non siano dentro una Collection esclusa o nascosta.");
        }
        console.groupEnd();

        return spawns
    }, [scene, triggerName])

    return (
        <>
            {itemSpawns.map((data, index) => (
                <SingleItemBox 
                    key={index} 
                    position={data.position} 
                    rotation={data.rotation} 
                />
            ))}
            
            {/* DEBUG VISIVO: Se non vedi le scatole, decommenta questo per vedere se almeno le sfere rosse appaiono */}
            {/* {itemSpawns.map((data, index) => (
                <mesh key={`debug-${index}`} position={data.position}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial color="red" wireframe />
                </mesh>
            ))} 
            */}
        </>
    )
}