import { useEffect, useRef } from 'react'

export const useControls = () => {
  // 1. Creiamo un oggetto che persiste tra i render senza scatenarne di nuovi
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
	drift: false,
    reset: false,
  })

  useEffect(() => {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      Space: 'drift',
      KeyR: 'reset',
    }

    const handleKeyDown = (e) => {
      // Se il tasto è nella mappa, impostiamo il valore nel REF a true
      if (keyMap[e.code]) {
        controls.current[keyMap[e.code]] = true
      }
    }

    const handleKeyUp = (e) => {
      if (keyMap[e.code]) {
        controls.current[keyMap[e.code]] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Restituiamo tutto l'oggetto ref (non il suo contenuto corrente!)
  return controls
}