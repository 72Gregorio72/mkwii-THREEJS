import React, { useMemo, useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF, Clone, PositionalAudio } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { AUDIO_SFX } from '../components/Data';


function giveItemToPlayer(other) {
    const rigidBody = other.rigidBodyObject;
    if (!rigidBody) return;
    
    const userData = rigidBody.userData;
    if (!userData) return;

    if (userData.type === 'racer' || userData.type === 'opponent') {
        const racerId = userData.id;
        // console.log(`📦 BOX PRESO DA: ${racerId}`);

        window.dispatchEvent(new CustomEvent('item-collected', {
            detail: { racerId: racerId }
        }));
    }
}

function playAudioSafely(audio, volume) {
    if (!audio) return;
    if (typeof volume === 'number') audio.setVolume(volume);
    if (audio.isPlaying) {
        audio.stop();
    }
    audio.play();
}

function SingleItemBox({ position, rotation }) {
    const { scene } = useGLTF('/items/ItemBox.glb')
    
    // Stato per sapere se è attivo (visibile) o preso
    const [isActive, setIsActive] = useState(true)
    const [scale, setScale] = useState(new THREE.Vector3(1, 1, 1))
    
    const audioRef = useRef();

    // Riferimento per l'animazione
    const meshRef = useRef()

    // Imposta renderOrder per renderizzare sopra la pista
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.traverse((child) => {
                if (child.isMesh) {
                    child.renderOrder = 1;
                }
            });
        }
    }, []);

    // Logica di collisione
    const handleIntersection = ({ other }) => {
        if (!isActive) return;
		// Qui potremmo aggiungere logica per dare un oggetto al giocatore
		playAudioSafely(audioRef.current, 1.3);
		giveItemToPlayer(other);
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
                 <PositionalAudio
                    ref={audioRef}
                    url={AUDIO_SFX.ITEM_BOX_BREAK} // Suono della scatola che si rompe
                    distance={8}  // Distanza a cui si sente al 100%
                    loop={false}
                 />
            </group>
        </RigidBody>
    )
}

export function ItemBoxesMap({ mapModelPath, triggerName = "Cube" }) {
    const { scene } = useGLTF(mapModelPath)

    const itemSpawns = useMemo(() => {
        const spawns = []
        
        // console.group("--- DEBUG ITEM BOXES ---");
        // console.log(`Cercando oggetti che contengono: "${triggerName}"`);
        scene.updateMatrixWorld(true);

        let objectsFound = 0;

        scene.traverse((child) => {

            if (child.isMesh) {
                if (child.name.toLowerCase().includes(triggerName.toLowerCase())) {
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const rotation = new THREE.Euler();

                    // Ottieni posizione/rotazione assolute nel mondo
                    child.getWorldPosition(position);
                    child.getWorldQuaternion(quaternion);
                    rotation.setFromQuaternion(quaternion);
                    spawns.push({
                        position: [position.x, position.y, position.z],
                        rotation: [rotation.x, rotation.y, rotation.z]
                    });
                    
                    objectsFound++;
                }
            }
        });

        // console.log(`Totale Item trovati: ${objectsFound}`);
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
        </>
    )
}