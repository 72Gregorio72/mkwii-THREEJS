import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function CameraLogger() {
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Quando premi SPAZIO
      if (event.code === 'Space') {
        const x = camera.position.x.toFixed(2)
        const y = camera.position.y.toFixed(2)
        const z = camera.position.z.toFixed(2)

        const rotationY = camera.rotation.y.toFixed(2)

        console.log(`📍 POSIZIONE CAMERA: [${x}, ${y}, ${z}]`)
        console.log(`🔄 ROTAZIONE CAMERA: ${rotationY}`)
        console.log('-----------------------------------')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [camera])

  return null
}