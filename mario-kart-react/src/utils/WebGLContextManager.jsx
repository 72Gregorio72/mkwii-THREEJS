import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Hook per gestire context loss/restore di WebGL
 * Previene crash e errori di rendering
 */
export function useWebGLContext() {
    const { gl } = useThree();

    useEffect(() => {
        const canvas = gl.domElement;

        const handleContextLost = (event) => {
            event.preventDefault();
            console.warn('[WebGL] Context lost - attempting recovery...');
            
            // Mostra un messaggio all'utente
            const overlay = document.createElement('div');
            overlay.id = 'webgl-error-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10000;
                text-align: center;
                font-family: Arial, sans-serif;
            `;
            overlay.innerHTML = `
                <h2>⚠️ WebGL Context Lost</h2>
                <p>Recovering graphics context...</p>
            `;
            document.body.appendChild(overlay);
        };

        const handleContextRestored = () => {
            console.log('[WebGL] Context restored successfully');
            
            // Rimuovi overlay
            const overlay = document.getElementById('webgl-error-overlay');
            if (overlay) {
                overlay.remove();
            }
        };

        const handleContextCreationError = (event) => {
            console.error('[WebGL] Failed to create context:', event);
            
            // Mostra errore permanente
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255,0,0,0.9);
                color: white;
                padding: 30px;
                border-radius: 10px;
                z-index: 10000;
                text-align: center;
                max-width: 500px;
            `;
            errorDiv.innerHTML = `
                <h2>❌ WebGL Error</h2>
                <p>Unable to initialize graphics.</p>
                <p>Please:</p>
                <ul style="text-align: left;">
                    <li>Update your graphics drivers</li>
                    <li>Enable hardware acceleration in browser settings</li>
                    <li>Try a different browser</li>
                </ul>
                <button onclick="window.location.reload()" 
                    style="margin-top: 15px; padding: 10px 20px; cursor: pointer;">
                    Retry
                </button>
            `;
            document.body.appendChild(errorDiv);
        };

        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        canvas.addEventListener('webglcontextcreationerror', handleContextCreationError, false);

        return () => {
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored);
            canvas.removeEventListener('webglcontextcreationerror', handleContextCreationError);
        };
    }, [gl]);

    return null;
}

/**
 * Hook per monitorare la memoria WebGL e prevenire leaks
 */
export function useWebGLMemoryMonitor() {
    const { gl } = useThree();

    useEffect(() => {
        let frameCount = 0;
        const CHECK_INTERVAL = 300; // Controlla ogni 5 secondi circa (a 60fps)

        const checkMemory = () => {
            frameCount++;
            if (frameCount < CHECK_INTERVAL) return;
            frameCount = 0;

            const info = gl.info;
            const memory = info.memory;
            const programs = info.programs?.length || 0;

            // Log delle statistiche (solo in dev)
            if (process.env.NODE_ENV === 'development') {
                console.log('[WebGL Memory]', {
                    geometries: memory.geometries,
                    textures: memory.textures,
                    programs: programs
                });
            }

            // Warning se troppi programmi shader (possibile leak)
            if (programs > 50) {
                console.warn('[WebGL] Too many shader programs:', programs);
            }

            // Warning se troppe geometrie
            if (memory.geometries > 200) {
                console.warn('[WebGL] High geometry count:', memory.geometries);
            }

            // Warning se troppe texture
            if (memory.textures > 100) {
                console.warn('[WebGL] High texture count:', memory.textures);
            }
        };

        const intervalId = setInterval(checkMemory, 1000);

        return () => clearInterval(intervalId);
    }, [gl]);

    return null;
}
