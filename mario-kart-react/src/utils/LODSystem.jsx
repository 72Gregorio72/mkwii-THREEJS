import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Hook per ottimizzare il rendering basato sulla distanza dalla camera
 * Riduce la complessità di rendering per oggetti lontani
 */
export function useLOD(ref, options = {}) {
    const { camera } = useThree();
    const {
        maxDistance = 100,
        updateInterval = 10, // Check ogni N frame
        onVisibilityChange = null
    } = options;

    const frameCount = useRef(0);
    const isVisible = useRef(true);
    const lastVisibility = useRef(true);

    useFrame(() => {
        if (!ref.current) return;

        frameCount.current++;
        if (frameCount.current % updateInterval !== 0) return;

        const position = ref.current.translation ? ref.current.translation() : ref.current.position;
        if (!position) return;

        const distance = camera.position.distanceTo(
            new THREE.Vector3(position.x, position.y, position.z)
        );

        isVisible.current = distance < maxDistance;

        // Callback solo quando cambia visibilità
        if (isVisible.current !== lastVisibility.current && onVisibilityChange) {
            onVisibilityChange(isVisible.current);
            lastVisibility.current = isVisible.current;
        }
    });

    return isVisible.current;
}

/**
 * Hook per disabilitare il rendering di oggetti fuori dal frustum della camera
 */
export function useFrustumCulling(ref, margin = 1.5) {
    const { camera } = useThree();
    const frustum = useRef(new THREE.Frustum());
    const projScreenMatrix = useRef(new THREE.Matrix4());
    const isInFrustum = useRef(true);
    const frameCount = useRef(0);

    useFrame(() => {
        if (!ref.current) return;

        frameCount.current++;
        // Check ogni 5 frame per performance
        if (frameCount.current % 5 !== 0) return;

        // Aggiorna frustum
        projScreenMatrix.current.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.current.setFromProjectionMatrix(projScreenMatrix.current);

        // Check se oggetto è nel frustum
        const position = ref.current.translation ? ref.current.translation() : ref.current.position;
        if (!position) return;

        const point = new THREE.Vector3(position.x, position.y, position.z);
        isInFrustum.current = frustum.current.containsPoint(point);
    });

    return isInFrustum.current;
}

/**
 * Componente wrapper per ottimizzare il rendering basato su distanza
 */
export function LODWrapper({ children, distance = 100, playerRef }) {
    const groupRef = useRef();
    const [visible, setVisible] = useState(true);
    const frameCount = useRef(0);

    useFrame(() => {
        if (!groupRef.current || !playerRef?.current) return;

        frameCount.current++;
        if (frameCount.current % 10 !== 0) return; // Check ogni 10 frame

        const playerPos = playerRef.current.translation();
        const groupPos = groupRef.current.position;

        const dist = Math.sqrt(
            Math.pow(playerPos.x - groupPos.x, 2) +
            Math.pow(playerPos.z - groupPos.z, 2)
        );

        setVisible(dist < distance);
    });

    return (
        <group ref={groupRef} visible={visible}>
            {children}
        </group>
    );
}
