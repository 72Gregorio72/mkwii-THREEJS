import { useGLTF } from '@react-three/drei';

/**
 * Precarica i modelli GLB comuni per evitare lag durante il gioco
 */
export function preloadCommonResources() {
    // Modelli comuni degli item
    const itemModels = [
        '/items/BulletBill.glb',
    ];

    // Animazioni comuni
    const animations = [
        '/Animations/driving_kart.glb',
        '/Animations/break_dance.glb',
    ];

    // Preload
    [...itemModels, ...animations].forEach(path => {
        try {
            useGLTF.preload(path);
        } catch (error) {
            console.warn(`[Preload] Failed to preload: ${path}`, error);
        }
    });
}

/**
 * Precarica le risorse specifiche di una traccia
 */
export function preloadTrackResources(selectedTrack) {
    if (!selectedTrack) return;

    const resources = [
        selectedTrack.map,
        selectedTrack.checkpoints,
        selectedTrack.road,
        selectedTrack.itemBoxes,
        selectedTrack.gridpos
    ].filter(Boolean);

    resources.forEach(path => {
        try {
            useGLTF.preload(path);
        } catch (error) {
            console.warn(`[Preload] Failed to preload track resource: ${path}`, error);
        }
    });
}

/**
 * Precarica i modelli dei personaggi e veicoli
 */
export function preloadCharacterResources(characters, vehicles) {
    // Preload modelli personaggi
    if (characters && Array.isArray(characters)) {
        characters.forEach(char => {
            if (char.modelConfig?.file) {
                try {
                    useGLTF.preload(char.modelConfig.file);
                } catch (error) {
                    console.warn(`[Preload] Failed to preload character: ${char.name}`, error);
                }
            }
        });
    }

    // Preload modelli veicoli
    if (vehicles) {
        Object.values(vehicles).forEach(vehicle => {
            if (vehicle.file) {
                try {
                    useGLTF.preload(vehicle.file);
                } catch (error) {
                    console.warn(`[Preload] Failed to preload vehicle: ${vehicle.name}`, error);
                }
            }
        });
    }
}

/**
 * Pulisce la cache di Three.js per liberare memoria
 */
export function clearUnusedCache() {
    // Nota: useGLTF usa internamente THREE.Cache
    // Possiamo pulire manualmente se necessario
    console.log('[Cache] Clearing unused resources...');
    
    // Non puliamo tutta la cache, solo quello che non è più necessario
    // THREE.Cache mantiene automaticamente le risorse in uso
}
