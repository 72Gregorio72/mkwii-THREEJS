/**
 * Utility per cleanup di risorse Three.js correttamente
 * Previene memory leak e WebGL Context Lost
 */

export function disposeObject3D(object) {
    if (!object) return;
    
    object.traverse((child) => {
        // Dispose geometrie
        if (child.geometry) {
            child.geometry.dispose();
        }
        
        // Dispose materiali
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    if (mat.map) mat.map.dispose();
                    if (mat.normalMap) mat.normalMap.dispose();
                    if (mat.roughnessMap) mat.roughnessMap.dispose();
                    if (mat.metalnessMap) mat.metalnessMap.dispose();
                    mat.dispose();
                });
            } else {
                if (child.material.map) child.material.map.dispose();
                if (child.material.normalMap) child.material.normalMap.dispose();
                if (child.material.roughnessMap) child.material.roughnessMap.dispose();
                if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                child.material.dispose();
            }
        }
    });
}

export function disposeAnimationResources(actions) {
    if (!actions) return;
    
    Object.values(actions).forEach(action => {
        if (!action) return;
        
        try {
            action.stop();
            const mixer = action.getMixer?.();
            if (mixer) {
                const clip = action.getClip?.();
                if (clip) {
                    mixer.uncacheClip(clip);
                }
                // Non disporne il mixer qui se potrebbe essere usato da altre azioni
            }
        } catch (e) {
            console.error('Error disposing animation action:', e);
        }
    });
}

export function disposeAudioResources(audioRef) {
    if (!audioRef) return;
    
    try {
        if (audioRef.source) {
            audioRef.source.stop();
            audioRef.source.disconnect();
        }
        if (audioRef.buffer) {
            audioRef.buffer = null;
        }
        audioRef = null;
    } catch (e) {
        console.error('Error disposing audio:', e);
    }
}

export function createCleanupEffect(objectToClean, dependencies = []) {
    return () => {
        return () => {
            disposeObject3D(objectToClean);
        };
    };
}

/**
 * Cache globale per risorse Three.js
 * Evita di ricaricare lo stesso modello multiple volte
 */
class ResourceCache {
    constructor(maxSize = 20) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = [];
    }
    
    get(key) {
        if (this.cache.has(key)) {
            // Sposta in fondo all'ordine di accesso (LRU)
            this.accessOrder = this.accessOrder.filter(k => k !== key);
            this.accessOrder.push(key);
            return this.cache.get(key);
        }
        return null;
    }
    
    set(key, value) {
        // Se la chiave esiste già, rimuovila dall'ordine
        if (this.cache.has(key)) {
            this.accessOrder = this.accessOrder.filter(k => k !== key);
        }
        
        // Se siamo al limite, rimuovi l'elemento meno usato
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const lruKey = this.accessOrder.shift();
            const lruValue = this.cache.get(lruKey);
            disposeObject3D(lruValue);
            this.cache.delete(lruKey);
        }
        
        this.cache.set(key, value);
        this.accessOrder.push(key);
    }
    
    clear() {
        this.cache.forEach(value => disposeObject3D(value));
        this.cache.clear();
        this.accessOrder = [];
    }
    
    size() {
        return this.cache.size;
    }
}

export const globalResourceCache = new ResourceCache(30);

/**
 * Wrapper per SkeletonUtils.clone con memoizzazione automatica
 */
export function cachedClone(scene, cacheKey) {
    if (!cacheKey) {
        // Se no cache key, usa il uuid della scene
        cacheKey = scene.uuid;
    }
    
    let cached = globalResourceCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    
    // Crea clone senza caching se SkeletonUtils non è disponibile
    try {
        const { SkeletonUtils } = require('three-stdlib');
        cached = SkeletonUtils.clone(scene);
    } catch {
        cached = scene.clone();
    }
    
    globalResourceCache.set(cacheKey, cached);
    return cached;
}
