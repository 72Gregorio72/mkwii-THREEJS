import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { RacerModel } from '../models/RacerModel';

export function RemoteOpponent({ id, data, vehicleConfig, characterConfig }) {
    const groupRef = useRef();

    // Load models
    const { scene: vehicleScene } = useGLTF(vehicleConfig.modelPath);
    const { scene: charScene } = useGLTF(characterConfig.modelPath);

    // Clone models so every player has their own
    const vehicleClone = useMemo(() => SkeletonUtils.clone(vehicleScene), [vehicleScene]);
    const charClone = useMemo(() => SkeletonUtils.clone(charScene), [charScene]);

    useFrame(() => {
        if (groupRef.current && data) {
            // Update Position
            groupRef.current.position.set(data.x, data.y, data.z);
            
            // Update Rotation
            if (data.qx !== undefined) {
                groupRef.current.quaternion.set(data.qx, data.qy, data.qz, data.qw);
            }
        }
    });

    return (
        <RacerModel

                isInMenu={false}
                scale={1.5}
                characterConfig={characterConfig}
                vehicleConfig={vehicleConfig}
                steer={0}
                drift={0}
                speed={0}
                isKart={true}
                key={vehicleConfig.name + "_racer"}
        />
    );
}