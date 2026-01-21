import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils } from 'three'; 
import { RacerModel } from '../models/RacerModel.jsx' // Verify path
import { VehicleModel } from '../models/VehicleModel.jsx' // Verify path
import { RigidBody, BallCollider } from '@react-three/rapier'

const PHYSICS_RADIUS = 1; 

export const RemoteOpponent = ({ data, character, vehicle }) => {
    const rb = useRef();
    
    useFrame((state, delta) => {
        if (!rb.current) return;

        // 1. Target Data
        const targetPos = new Vector3(data.x, data.y, data.z);
        // Default to identity quaternion if server sends garbage
        const targetRot = new Quaternion(data.rotation?.x ?? 0, data.rotation?.y ?? 0, data.rotation?.z ?? 0, data.rotation?.w ?? 1);

        // 2. Physics Interpolation (Smoothing)
        const currentPos = rb.current.translation();
        const currentRot = rb.current.rotation();

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
            <BallCollider args={[PHYSICS_RADIUS]} position={[0, 0, 0]} />

            {/* VISUALS GROUP - Must match OutsideDriftKart hierarchy */}
            <group position={[0, -PHYSICS_RADIUS, 0]}>
                <group position={vehicle.vehicleOffset || [0,0,0]}>
                    
                    {/* ✅ FIX 1: Pass steer/drift to VehicleModel so wheels turn */}
                    <VehicleModel 
                        vehicleConfig={vehicle.modelConfig} 
                        scale={1.4} 
                        rotation={[0, Math.PI, 0]} 
                        isBike={vehicle.isBike}
                        speed={0} 
                        steer={data.steer || 0} // <--- Pass Network Data
                        drift={data.drift || 0} // <--- Pass Network Data
                    />

                    {/* ✅ FIX 2: Correct nesting and rotation for Racer */}
                    <group rotation={[0, Math.PI, 0]}>
                        <RacerModel
                            isInMenu={false}
                            isRemote={true} 
                            characterConfig={character.modelConfig} 
                            vehicleConfig={vehicle} 
                            isKart={true}
                            steer={data.steer || 0}   
                            drift={data.drift || 0}   
                            
                            scale={1.5}
                            speed={0} 
                            key={vehicle.name + "_racer"}
                        />
                    </group>
                </group>
            </group>
        </RigidBody>
    );
}