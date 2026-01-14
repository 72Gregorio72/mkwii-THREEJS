import { useEffect, useRef } from 'react'

export const useControls = () => {
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    drift: false,
    reset: false,
    wheelie: false,
	item: false,
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
      ShiftLeft: 'wheelie',
	  KeyE: 'item',
    }

    const handleKeyDown = (e) => {
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

  return controls
}