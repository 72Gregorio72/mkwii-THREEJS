import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

let globalAudioListener = null;

export function AudioListenerComponent() {
  const { camera } = useThree();

  useEffect(() => {
    if (globalAudioListener) {
      if (!camera.children.includes(globalAudioListener)) {
        camera.add(globalAudioListener);
      }
      return;
    }

    const listener = new THREE.AudioListener();
    camera.add(listener);
    globalAudioListener = listener;

    return () => {

    };
  }, [camera]);

  return null;
}


export function getGlobalAudioListener() {
  return globalAudioListener;
}

export function resetGlobalAudioListener() {
  if (globalAudioListener && globalAudioListener.parent) {
    globalAudioListener.parent.remove(globalAudioListener);
  }
  globalAudioListener = null;
}

export default AudioListenerComponent;
