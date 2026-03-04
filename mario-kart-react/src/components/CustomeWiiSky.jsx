import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export const CustomWiiSky = ({ trackName }) => {
    // Carica la texture dalla cartella public
     console.log(`CustomWiiSky: caricamento texture per track "${trackName}"`);
    let texture = useTexture('/Skybox/Day.png'); // Default
    if (!trackName) {
        console.warn('CustomWiiSky: trackName non fornito, usando texture di default');
    }
    else if (trackName == 'Daisy Circuit') {
        texture = useTexture('/Skybox/Sunset.png'); 
    }
    else if (trackName == 'Bowser Castle') {
        texture = useTexture('/Skybox/Bowser.png');
    }
    // Opzionale: migliora la resa dei colori della texture
    texture.colorSpace = THREE.SRGBColorSpace;

    return (
        <mesh>
            {/* Una sfera gigantesca che avvolge tutto il circuito. 
                100000 è il raggio, 32 e 32 sono i segmenti (la rotondità) */}
            <sphereGeometry args={[100000, 32, 32]} />
            
            {/* Usiamo meshBasicMaterial perché il cielo non deve ricevere ombre, 
                deve essere luminoso di per sé. 
                THREE.BackSide è IL TRUCCO: applica l'immagine DENTRO la sfera! */}
            <meshBasicMaterial 
                map={texture} 
                side={THREE.BackSide} 
                fog={false} // Evita che la nebbia, se presente, nasconda il cielo
            />
        </mesh>
    );
};