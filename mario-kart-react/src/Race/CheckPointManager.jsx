import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

const DEBUG_CHECKPOINTS = false; // Disabilita visualizzazione per performance

export function CheckpointSystem({ url, onCheckpointTrigger, onSystemReady }) {
    const { scene } = useGLTF(url);
    const hitsQueue = useRef([]);
    const [lastHit, setLastHit] = useState(null);

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
                        position: child.position.clone(),
                        rotation: child.rotation.clone(),
                        scale: child.scale.clone(),
                        geometry: child.geometry
                    });
                }
            }
        });
        return boxes.sort((a, b) => a.id - b.id);
    }, [scene, url]);

    useEffect(() => {
        if (sensors.length > 0 && onSystemReady) {
            const posMap = {};
            sensors.forEach(s => posMap[s.id] = s.position);
            onSystemReady(posMap);
        }
    }, [sensors, onSystemReady]);

    useFrame(() => {
        if (hitsQueue.current.length > 0) {
            hitsQueue.current.forEach((hit) => {
                if (DEBUG_CHECKPOINTS) {
                    setLastHit({ cpId: hit.cpId, racerId: hit.racerId, time: Date.now() });
                }
                onCheckpointTrigger(hit.cpId, hit.racerId);
            });
            hitsQueue.current = [];
        }
    });

    return (
        <group>
            {sensors.map((box, index) => {
                const isRecentlyHit = DEBUG_CHECKPOINTS && lastHit?.cpId === box.id && (Date.now() - lastHit.time < 500);
                
                return (
                    <group key={`debug-group-${box.id}-${index}`}>
                        {/* Etichetta testuale solo in debug mode */}
                        {DEBUG_CHECKPOINTS && (
                            <Text
                                position={[box.position.x, box.position.y + 2, box.position.z]}
                                fontSize={0.5}
                                color="white"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {`CP ${box.id}`}
                            </Text>
                        )}

                        <RigidBody
                            type="fixed" 
                            colliders="trimesh" 
                            sensor={true} 
                            position={box.position}
                            rotation={box.rotation}
                            scale={box.scale}
                            name={`checkpoint-${box.id}`}
                            onIntersectionEnter={(payload) => {
                                const otherBody = payload.other.rigidBodyObject;
                                
                                if (!otherBody) return;
                                
                                if (!otherBody.userData || otherBody.userData.type !== 'racer') {
                                    return;
                                }

                                const racerId = otherBody.userData.id;
                                if (!racerId) {
                                    return;
                                }
                                
                                const cpId = box.id;

                                const alreadyInQueue = hitsQueue.current.some(
                                    hit => hit.cpId === cpId && hit.racerId === racerId
                                );

                                if (!alreadyInQueue) {
                                    hitsQueue.current.push({ cpId, racerId });
                                }
                            }}
                        >
                            <mesh geometry={box.geometry}>
                                <meshBasicMaterial 
                                    visible={DEBUG_CHECKPOINTS} 
                                    color={isRecentlyHit ? "yellow" : "red"} 
                                    wireframe 
                                    transparent
                                    opacity={0.5}
                                />
                            </mesh>
                        </RigidBody>
                    </group>
                );
            })}
        </group>
    );
}