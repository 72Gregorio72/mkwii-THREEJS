import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export const CustomWiiSky = ({ trackName }) => {
    // console.log(`CustomWiiSky: caricamento texture per track "${trackName}"`);

    // 1. Determina il percorso della texture usando una normale variabile stringa
    let texturePath = '/Skybox/Day.png'; // Default
    
    if (!trackName) {
        console.warn('CustomWiiSky: trackName non fornito, usando texture di default');
    } else if (trackName === 'Daisy Circuit') {
        texturePath = '/Skybox/Sunset.png'; 
    } else if (trackName === 'Bowser Castle') {
        texturePath = '/Skybox/Bowser.png';
    } else if (trackName === 'SNES Ghost Valley 2') {
        texturePath = '/Skybox/Dark.png';
    }
    // console.log(`CustomWiiSky: caricamento texture da "${texturePath}" per track "${trackName}"`);
    // 2. Chiama l'hook UNA SOLA VOLTA fuori da qualsiasi condizione
    const texture = useTexture(texturePath);

    // Opzionale: migliora la resa dei colori della texture
    texture.colorSpace = THREE.SRGBColorSpace;

    return (
        <mesh>
            {/* Una sfera gigantesca che avvolge tutto il circuito. */}
            <sphereGeometry args={[100000, 32, 32]} />
            
            {/* Usiamo meshBasicMaterial perché il cielo non deve ricevere ombre */}
            <meshBasicMaterial 
                map={texture} 
                side={THREE.BackSide} 
                fog={false} 
            />
        </mesh>
    );
};