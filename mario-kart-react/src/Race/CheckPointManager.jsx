import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

export function CheckpointSystem({ url, onCheckpointTrigger, onSystemReady }) {
    const { scene } = useGLTF(url);
    const hitsQueue = useRef([]);

    const sensors = useMemo(() => {
        const boxes = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                const rawName = child.name;
                const numberOnly = rawName.replace(/[^0-9]/g, ''); 
                const id = parseInt(numberOnly);
                
                if (!isNaN(id)) {
                    boxes.push({
                        id: id,
                        position: child.position.clone(), // Clona per sicurezza
                        rotation: child.rotation,
                        scale: child.scale,
                        geometry: child.geometry
                    });
                }
            }
        });
		return boxes.sort((a, b) => a.id - b.id);
    }, [scene, url]);

	useEffect(() => {
        if (sensors.length > 0 && onSystemReady) {
            // Creiamo un oggetto { 1: Vector3, 2: Vector3, ... }
            const posMap = {};
            sensors.forEach(s => {
                posMap[s.id] = s.position;
            });
            onSystemReady(posMap);
        }
    }, [sensors, onSystemReady]);

    // Processiamo la coda degli urti al frame successivo
    useFrame(() => {
        if (hitsQueue.current.length > 0) {
            hitsQueue.current.forEach((hit) => {
                // Passiamo entrambi i dati al genitore: ID Checkpoint e ID Racer
                onCheckpointTrigger(hit.cpId, hit.racerId);
            });
            // Svuota la coda
            hitsQueue.current = [];
        }
    });

    return (
        <group>
            {sensors.map((box, index) => (
                <RigidBody
                    key={index} 
                    type="fixed" 
                    colliders="trimesh" 
                    sensor={true} 
                    position={box.position}
                    rotation={box.rotation}
                    scale={box.scale}
                    // Aggiungiamo un nome al sensore per debug
                    name={`checkpoint-${box.id}`}
                    onIntersectionEnter={(payload) => {
                        // 1. Recuperiamo l'oggetto fisico che ha colpito
                        const otherBody = payload.other.rigidBodyObject;
                        
                        // 2. Controlliamo se ha i userData che abbiamo settato nei veicoli
                        // (Assicurati che Kart e Bot abbiano userData={{ type: 'racer', id: 'player'/'bot' }})
                        if (otherBody && otherBody.userData && otherBody.userData.type === 'racer') {
                            
                            const racerId = otherBody.userData.id;
                            const cpId = box.id;

                            // 3. Evitiamo duplicati NELLO STESSO FRAME
                            // Controlliamo se nella coda c'è già questo specifico racer su questo specifico checkpoint
                            const alreadyInQueue = hitsQueue.current.some(
                                hit => hit.cpId === cpId && hit.racerId === racerId
                            );

                            if (!alreadyInQueue) {
                                hitsQueue.current.push({ cpId, racerId });
                            }
                        }
                    }}
                >
                    <mesh geometry={box.geometry}>
                        {/* Rendi visibile true temporaneamente se vuoi vedere dove sono i box */}
                        <meshBasicMaterial visible={false} color="red" wireframe />
                    </mesh>
                </RigidBody>
            ))}
        </group>
    );
}