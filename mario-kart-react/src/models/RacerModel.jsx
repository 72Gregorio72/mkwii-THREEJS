import React, { useEffect, useRef, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { DoubleSide, LoopRepeat } from 'three'
import { useFrame } from '@react-three/fiber'

export function RacerModel({ characterConfig, steer, drift, debug, ...props }) {
  // --- CONFIGURAZIONE ---
  const ENABLE_ANIMATIONS = true; // <--- Setta a TRUE per riattivare il ballo
  // ----------------------

  const group = useRef()

  // 1. CARICHIAMO IL PERSONAGGIO
  const { scene: charScene } = useGLTF(characterConfig.file)
  const clone = useMemo(() => SkeletonUtils.clone(charScene), [charScene])
  
  // 2. CARICHIAMO L'ANIMAZIONE GREZZA
  const { animations: rawAnimations } = useGLTF('/Animations/break_dance.glb')

  // 3. FIX CRUCIALE: CLEANUP E RETARGETING
  const sharedAnimations = useMemo(() => {
    // Se le animazioni sono disattivate, evitiamo calcoli inutili (opzionale, ma ottimizza)
    if (!ENABLE_ANIMATIONS) return [];

    const cleanClips = rawAnimations.map(clip => clip.clone());

    cleanClips.forEach((clip) => {
      // Filtro posizioni
      clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));

      // Pulizia nomi
      clip.tracks.forEach((track) => {
        const trackName = track.name;
        const parts = trackName.split('.');
        const property = parts.pop(); 
        const boneName = parts.pop();
        track.name = `${boneName}.${property}`;
      });
    });

    return cleanClips;
  }, [rawAnimations, ENABLE_ANIMATIONS]);

  // 4. COLLEGAMENTO ANIMAZIONI
  const { actions, names } = useAnimations(sharedAnimations, group)

  // --- PLAY ANIMAZIONE (LOGICA CONDIZIONALE) ---
  useEffect(() => {
    // 1. Ferma sempre qualsiasi animazione precedente (pulizia)
    Object.values(actions).forEach(action => action?.stop());

    // 2. CONTROLLO INTERRUTTORE: Se è false, non fa partire nulla ed esce
    if (!ENABLE_ANIMATIONS) return;

    if (debug) console.log(`🎬 Animazioni pronte (Solo rotazioni):`, names)

    if (names.length > 0) {
      const action = actions[names[0]]
      if (action) {
          action.reset().fadeIn(0.2).play();
          action.setLoop(LoopRepeat);
          action.timeScale = 0.8; 
      }
    }
    
    return () => { Object.values(actions).forEach(action => action?.stop()); }
  }, [actions, names, characterConfig.id, debug, ENABLE_ANIMATIONS]) // Aggiunto ENABLE_ANIMATIONS alle dipendenze

  // --- MATERIALI ---
  useEffect(() => {
    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true; object.receiveShadow = true;
        object.material.side = DoubleSide;
        object.material.transparent = false; 
        object.material.alphaTest = 0.5;
        object.material.depthWrite = true;
        if(object.material.map) {
             object.material.roughness = 1; object.material.metalness = 0;
             object.material.color.setHex(0xffffff);
        }
        object.material.needsUpdate = true;
      }
    })
  }, [clone])

  // --- STERZATA ---
  useFrame(() => {
      if(group.current && steer) {
          group.current.rotation.y = steer * 0.5;
      }
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={clone} scale={characterConfig.scale || 1} />
    </group>
  )
}