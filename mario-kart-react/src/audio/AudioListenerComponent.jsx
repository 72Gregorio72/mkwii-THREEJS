import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Componente che crea e gestisce l'AudioListener globale.
 * Va inserito UNA SOLA VOLTA dentro il Canvas, prima di qualsiasi kart.
 * 
 * L'AudioListener viene attaccato alla camera e permette l'audio 3D spaziale.
 */

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

    console.log('[AudioListenerComponent] AudioListener 3D creato e attaccato alla camera');

    return () => {
      // Non rimuoviamo il listener al cleanup per evitare problemi
      // con componenti che lo stanno ancora usando
    };
  }, [camera]);

  return null; // Non renderizza nulla
}

/**
 * Funzione per ottenere l'AudioListener globale
 * Usata dagli hook usePositionalKartAudio
 */
export function getGlobalAudioListener() {
  return globalAudioListener;
}

/**
 * Funzione per resettare l'AudioListener (utile quando si esce dalla scena)
 */
export function resetGlobalAudioListener() {
  if (globalAudioListener && globalAudioListener.parent) {
    globalAudioListener.parent.remove(globalAudioListener);
  }
  globalAudioListener = null;
}

export default AudioListenerComponent;
