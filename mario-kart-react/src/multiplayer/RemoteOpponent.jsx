import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// ✅ FIX: Added MathUtils to this import
import { Vector3, Quaternion, MathUtils } from 'three'; 
import { RacerModel } from '../models/RacerModel.jsx'
import { VehicleModel } from '../models/VehicleModel.jsx'  
import { RigidBody, BallCollider } from '@react-three/rapier'

// Ensure this matches OutsideDriftKart (which is 1)
const PHYSICS_RADIUS = 1; 

export const RemoteOpponent = ({ data, character, vehicle }) => {
    const rb = useRef();
    
    useFrame((state, delta) => {
        if (!rb.current) return;

        // 1. Target Data
        const targetPos = new Vector3(data.x, data.y, data.z);
        const targetRot = new Quaternion(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w ?? 1);

        // 2. Physics Interpolation
        const currentPos = rb.current.translation();
        const currentRot = rb.current.rotation();

        // ✅ MathUtils will now work correctly
        const lerpedX = MathUtils.lerp(currentPos.x, targetPos.x, delta * 15);
        const lerpedY = MathUtils.lerp(currentPos.y, targetPos.y, delta * 15);
        const lerpedZ = MathUtils.lerp(currentPos.z, targetPos.z, delta * 15);

        const curQ = new Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
        curQ.slerp(targetRot, delta * 15);

        // 3. Apply to Physics Engine
        rb.current.setNextKinematicTranslation({ x: lerpedX, y: lerpedY, z: lerpedZ });
        rb.current.setNextKinematicRotation(curQ);
    });

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            position={[data.x, data.y, data.z]} 
            colliders={false} 
            name="opponent"
            userData={{ type: 'opponent', id: data.id }}
        >
            {/* MATCHES PLAYER HITBOX */}
            <BallCollider args={[PHYSICS_RADIUS]} position={[0, 0, 0]} />

            {/* MATCHES PLAYER VISUAL OFFSET */}
            <group position={[0, -PHYSICS_RADIUS, 0]}>
                <group position={vehicle.vehicleOffset || [0,0,0]}>
                    <VehicleModel 
                        vehicleConfig={vehicle.modelConfig} 
                        scale={1.4} 
                        rotation={[0, Math.PI, 0]} 
                        isBike={vehicle.isBike}
                        speed={0} 
                        steer={0} 
                        drift={0}
                        isRemote={true} // Disable Wheels
                    />
                    <group rotation={[0, Math.PI, 0]}>
                    <RacerModel 
                        scale={1.5} 
                        characterConfig={character.modelConfig} 
                        vehicleConfig={vehicle} 
                        isKart={true}
                        speed={0}
                        isRemote={true} // Disable Animations
                    />
                    </group>
                </group>
            </group>
        </RigidBody>
    );
}