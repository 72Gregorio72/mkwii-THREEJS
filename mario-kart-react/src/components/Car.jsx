import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRaycastVehicle, useBox } from '@react-three/cannon'
import { useControls } from '../hooks/useControls'
import { Wheel } from './Wheel'

export function Car({ position = [0, 5, 0] }) {
  // --- PARAMETRI FISICI ---
  const width = 1.2
  const height = -0.4
  const front = 1.3
  const back = -1.15
  const radius = 0.7
  
  const maxSteer = 0.6
  const enginePower = 300
  const brakePower = 5

  const chassisRef = useRef()
  const wheel1 = useRef()
  const wheel2 = useRef()
  const wheel3 = useRef()
  const wheel4 = useRef()

  // 1. CONFIGURAZIONE RUOTE (Congelata con useMemo)
  const wheelInfos = useMemo(() => {
    const wheelInfo = {
      radius,
      directionLocal: [0, -1, 0],
      suspensionStiffness: 30,
      suspensionRestLength: 0.3,
      maxSuspensionTravel: 1,
      customSlidingRotationalSpeed: -30,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      frictionSlip: 5,
      rollInfluence: 0.01,
      axis: [-1, 0, 0],
      chassisConnectionPointLocal: [1, 0, 1],
      isFrontWheel: false,
      useCustomSlidingRotationalSpeed: true,
    }

    return [
      // Ant Sx
      { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [-width, height, front] },
      // Ant Dx
      { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [width, height, front] },
      // Post Sx
      { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [-width, height, back] },
      // Post Dx
      { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [width, height, back] },
    ]
  }, []) 

  // 2. CORPO RIGIDO (CHASSIS)
  const [chassisBody, chassisApi] = useBox(() => ({
    mass: 150,
    position,
    args: [2, 1, 4],
    allowSleep: false,
    angularDamping: 0.5,
  }), chassisRef)

  // 3. VEICOLO RAYCAST
  const [vehicleRef, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody,
    wheelInfos, 
    wheels: [wheel1, wheel2, wheel3, wheel4],
  }), useRef(null))

  const controls = useControls()

  useFrame(() => {
    // Check di sicurezza per evitare crash all'avvio
    if (!vehicleApi || !vehicleApi.applyEngineForce) return

    const { forward, backward, left, right, brake, reset } = controls.current

    // Motore
    const force = (forward ? -enginePower : 0) + (backward ? enginePower : 0)
    vehicleApi.applyEngineForce(force, 2)
    vehicleApi.applyEngineForce(force, 3)

    // Sterzo
    const steering = (left ? maxSteer : 0) + (right ? -maxSteer : 0)
    vehicleApi.setSteeringValue(steering, 0)
    vehicleApi.setSteeringValue(steering, 1)

    // Freno
    const currentBrake = brake ? brakePower : 0
    for (let i = 0; i < 4; i++) vehicleApi.setBrake(currentBrake, i)

    // Reset
    if (reset) {
      chassisApi.position.set(0, 5, 0)
      chassisApi.velocity.set(0, 0, 0)
      chassisApi.angularVelocity.set(0, 0, 0)
      chassisApi.rotation.set(0, 0, 0)
    }
  })

  return (
    <group ref={vehicleRef}>
      <mesh ref={chassisRef} castShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="red" />
        <mesh position={[0, 0.5, -1.8]}>
            <boxGeometry args={[1, 0.5, 0.5]} />
            <meshStandardMaterial color="blue" />
        </mesh>
      </mesh>

      <Wheel ref={wheel1} radius={radius} leftSide />
      <Wheel ref={wheel2} radius={radius} />
      <Wheel ref={wheel3} radius={radius} leftSide />
      <Wheel ref={wheel4} radius={radius} />
    </group>
  )
}