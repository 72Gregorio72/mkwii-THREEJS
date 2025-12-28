import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, useRapier, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import * as rapier from "@dimforge/rapier3d-compat";

// --- CONFIGURAZIONE TUNING ---
const TUNING = {
  mass: 150,
  springStrength: 140, // Aumentato leggermente per sostenere meglio il peso
  dampingStrength: 10,
  rayLength: 0.8,      // Raggi un po' più lunghi per trovare il terreno prima
  restLength: 0.6,
  acceleration: 80,
  maxSpeed: 30,
  turnSpeed: 4.0,
  jumpForce: 15,
  driftTurnMultiplier: 1.8,
  gripFriction: 8.0,
  driftFriction: 0.8,
  driftBoost: 1.05,
};

// Vettori riutilizzabili
const _down = new THREE.Vector3(0, -1, 0);
const _rayOrigin = new THREE.Vector3();
const _impulse = new THREE.Vector3();
const _worldVel = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export const KartController = ({ startPosition = [0, 100, 0] }) => {
  const rigidBody = useRef(null);
  const chassisMesh = useRef(null);
  const { world } = useRapier();
  
  // Input Map: Funziona perché GameScene ha <KeyboardControls>
  const [subscribeKeys, getKeys] = useKeyboardControls();

  const [isDrifting, setIsDrifting] = useState(false);
  const isJumping = useRef(false);
  
  // Raycast agli 4 angoli
  const rayOffsets = useMemo(() => [
    new THREE.Vector3(0.8, -0.2, 0.8),
    new THREE.Vector3(-0.8, -0.2, 0.8),
    new THREE.Vector3(0.8, -0.2, -0.8),
    new THREE.Vector3(-0.8, -0.2, -0.8)
  ], []);

  useFrame((state, delta) => {
    if (!rigidBody.current) return;

    const { forward, backward, left, right, drift } = getKeys();
    const rb = rigidBody.current;
    const vel = rb.linvel();
    const rot = rb.rotation();
    const quaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const pos = rb.translation();

    _worldVel.set(vel.x, vel.y, vel.z);
    _forward.set(0, 0, 1).applyQuaternion(quaternion);
    _right.set(1, 0, 0).applyQuaternion(quaternion);

    // --- 1. SOSPENSIONI ---
    let wheelsTouchingGround = 0;
    rayOffsets.forEach((offset) => {
      _rayOrigin.copy(offset).applyQuaternion(quaternion).add(pos);
      const ray = new rapier.Ray(_rayOrigin, _down);
      const hit = world.castRay(ray, TUNING.rayLength, true);

      if (hit) {
        wheelsTouchingGround++;
        const tireVelocity = _worldVel.dot(_down);
        const distance = hit.toi;
        const compression = TUNING.restLength - distance;
        // Hooke's Law + Damping
        const force = (TUNING.springStrength * compression) - (TUNING.dampingStrength * tireVelocity);
        
        if (force > 0) {
            _impulse.copy(_down).multiplyScalar(-force * delta);
            rb.applyImpulseAtPoint(_impulse, _rayOrigin, true);
        }
      }
    });
    const isGrounded = wheelsTouchingGround > 0;

    // --- 2. LOGICA SALTO & DRIFT ---
    if (drift && isGrounded && !isJumping.current) {
        // Hop iniziale
        rb.applyImpulse({ x: 0, y: TUNING.jumpForce, z: 0 }, true);
        isJumping.current = true;
    }
    
    // Reset stato salto
    if (!drift && isGrounded) {
        isJumping.current = false;
        if (isDrifting) setIsDrifting(false);
    }
    
    // Entrata in Drift
    if (drift && isGrounded && isJumping.current && !isDrifting) {
        setIsDrifting(true);
    }

    // --- 3. MOVIMENTO ---
    let steerInput = 0;
    if (left) steerInput += 1;
    if (right) steerInput -= 1;
    
    const currentTurnSpeed = isDrifting ? TUNING.turnSpeed * TUNING.driftTurnMultiplier : TUNING.turnSpeed;
    
    // Sterzata (Torque)
    if (isGrounded && steerInput !== 0) {
        rb.applyTorqueImpulse({ x: 0, y: steerInput * currentTurnSpeed * delta * TUNING.mass, z: 0 }, true);
    }

    // Motore (Impulse Forward)
    let driveForce = 0;
    if (forward) driveForce += TUNING.acceleration;
    if (backward) driveForce -= TUNING.acceleration;

    if (isGrounded && driveForce !== 0 && _worldVel.length() < TUNING.maxSpeed) {
        const forceVec = _forward.clone().multiplyScalar(driveForce * delta * TUNING.mass);
        rb.applyImpulse(forceVec, true);
    }

    // --- 4. FISICA LATERALE (Drift vs Grip) ---
    const localVelX = _worldVel.dot(_right);
    const currentFriction = isDrifting ? TUNING.driftFriction : TUNING.gripFriction;
    
    // Applica forza opposta allo scivolamento
    const lateralForce = -localVelX * currentFriction * TUNING.mass * delta;
    rb.applyImpulse(_right.clone().multiplyScalar(lateralForce), true);

    // Spinta extra in drift (Speed boost leggero)
    if (isDrifting && isGrounded) {
        rb.applyImpulse(_forward.clone().multiplyScalar(TUNING.driftBoost * delta * TUNING.mass), true);
    }

    // Visual Tilt (Rollio in curva)
    if (chassisMesh.current) {
        const leanAmount = localVelX * 0.05;
        chassisMesh.current.rotation.z = THREE.MathUtils.lerp(chassisMesh.current.rotation.z, leanAmount, 0.1);
    }

    // --- 5. CAMERA FOLLOW (Terza Persona) ---
    // Posizione target relativa al kart: 0m lati, 5m alto, 10m dietro
    _camOffset.set(0, 5, 10);
    _camOffset.applyQuaternion(quaternion); // Ruota l'offset con il kart
    _camOffset.add(pos); // Porta in coordinate globali

    // Muovi dolcemente la camera verso il target
    state.camera.position.lerp(_camOffset, delta * 4);
    
    // La camera guarda il kart (leggermente sopra il centro)
    _camTarget.set(pos.x, pos.y + 1.5, pos.z);
    state.camera.lookAt(_camTarget);
  });

  return (
    <RigidBody 
      ref={rigidBody} 
      position={startPosition}
      colliders={false} 
      mass={TUNING.mass}
      type="dynamic"
      enabledRotations={[true, true, true]} 
      angularDamping={1.5}
      linearDamping={0.1}
    >
        {/* Collider sollevato per lasciare spazio alle sospensioni raycast */}
        <CuboidCollider args={[0.8, 0.4, 1.2]} position={[0, 0.5, 0]} />
        
        {/* Visual Mesh Temporanea (Cubo Rosso) */}
        <group ref={chassisMesh}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.5, 2.4]} />
                <meshStandardMaterial color={isDrifting ? "#ff9900" : "#d00000"} />
            </mesh>
            {/* Ruote finte per riferimento visivo */}
            <mesh position={[0.8, -0.2, 0.8]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.8, -0.2, 0.8]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.8, -0.2, -0.8]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.8, -0.2, -0.8]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    </RigidBody>
  );
};