import { forwardRef } from 'react'

// È FONDAMENTALE che ci sia 'forwardRef' qui sotto
export const Wheel = forwardRef(({ radius = 0.7, leftSide, ...props }, ref) => {
  return (
    <group ref={ref} {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 1, 32]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[radius * 0.6, radius * 0.6, 1.1, 16]} />
         <meshStandardMaterial color={leftSide ? "yellow" : "white"} />
      </mesh>
    </group>
  )
})