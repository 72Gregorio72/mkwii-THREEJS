import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioLoader } from 'three';
import { AUDIO_SFX } from '../audio/AudioManager';
import { getGlobalAudioListener } from '../audio/AudioListenerComponent';

/**
 * Hook per gestire l'audio 3D spaziale del kart usando PositionalAudio di Three.js
 * 
 * L'audio viene automaticamente attenuato in base alla distanza dalla camera/listener.
 * 
 * @param {Object} options
 * @param {boolean} options.isBike - true se è una moto, false se è un kart
 * @param {boolean} options.isActive - true se la gara è attiva
 * @param {Object3D} options.kartObject - Il gruppo/mesh del kart a cui attaccare l'audio
 * @param {Object} options.spatialConfig - Configurazione spaziale opzionale
 */
export const usePositionalKartAudio = ({ 
  isBike = false, 
  isActive = true, 
  kartObject = null,
  spatialConfig = {}
}) => {
  // Configurazione spaziale di default
  const {
    refDistance = 5,      // Distanza a cui il volume è al 100%
    maxDistance = 80,     // Distanza massima oltre cui non si sente
    rolloffFactor = 1.5,  // Velocità di attenuazione
    volume = 0.8          // Volume base
  } = spatialConfig;

  // Seleziona i file audio corretti in base al tipo di veicolo
  const audioFiles = useMemo(() => isBike ? {
    idle: AUDIO_SFX.BIKE_IDLE,
    gas: AUDIO_SFX.BIKE_GAS,
    loop: AUDIO_SFX.BIKE_LOOP,
  } : {
    idle: AUDIO_SFX.KART_IDLE,
    gas: AUDIO_SFX.KART_GAS,
    loop: AUDIO_SFX.KART_LOOP,
  }, [isBike]);

  // Refs per i PositionalAudio
  const idleAudioRef = useRef(null);
  const gasAudioRef = useRef(null);
  const loopAudioRef = useRef(null);
  const driftLoopAudioRef = useRef(null);
  
  // Refs per i suoni drift "bling" (blu/rosso) - usano Audio HTML standard
  const driftBlingAudioRef = useRef(null);
  const prevDriftLevelRef = useRef(0);

  // Buffer audio caricati
  const buffersRef = useRef({
    idle: null,
    gas: null,
    loop: null,
    drift: null
  });

  // Stato
  const currentStateRef = useRef('stopped'); // 'stopped' | 'idle' | 'gas' | 'loop'
  const isAcceleratingRef = useRef(false);
  const isDriftingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Carica i buffer audio
  useEffect(() => {
    const listener = getGlobalAudioListener();
    if (!listener || !kartObject) {
      return;
    }

    const audioLoader = new AudioLoader();
    let mounted = true;

    const loadAudio = async () => {
      try {
        // Carica tutti i buffer in parallelo
        const [idleBuffer, gasBuffer, loopBuffer, driftBuffer] = await Promise.all([
          new Promise((resolve, reject) => audioLoader.load(audioFiles.idle, resolve, undefined, reject)),
          new Promise((resolve, reject) => audioLoader.load(audioFiles.gas, resolve, undefined, reject)),
          new Promise((resolve, reject) => audioLoader.load(audioFiles.loop, resolve, undefined, reject)),
          new Promise((resolve, reject) => audioLoader.load(AUDIO_SFX.NORMAL_DRIFT, resolve, undefined, reject)),
        ]);

        if (!mounted) return;

        buffersRef.current = {
          idle: idleBuffer,
          gas: gasBuffer,
          loop: loopBuffer,
          drift: driftBuffer
        };

        // Crea i PositionalAudio
        const createPositionalAudio = (buffer, loop = false) => {
          const audio = new THREE.PositionalAudio(listener);
          audio.setBuffer(buffer);
          audio.setRefDistance(refDistance);
          audio.setMaxDistance(maxDistance);
          audio.setRolloffFactor(rolloffFactor);
          audio.setDistanceModel('exponential');
          audio.setLoop(loop);
          audio.setVolume(volume);
          return audio;
        };

        // IDLE - in loop
        idleAudioRef.current = createPositionalAudio(idleBuffer, true);
        kartObject.add(idleAudioRef.current);

        // GAS - one shot
        gasAudioRef.current = createPositionalAudio(gasBuffer, false);
        kartObject.add(gasAudioRef.current);

        // LOOP - in loop
        loopAudioRef.current = createPositionalAudio(loopBuffer, true);
        kartObject.add(loopAudioRef.current);

        // DRIFT LOOP
        driftLoopAudioRef.current = createPositionalAudio(driftBuffer, true);
        driftLoopAudioRef.current.setVolume(volume * 0.7);
        kartObject.add(driftLoopAudioRef.current);

        // Gestione fine del GAS -> passa a LOOP
        gasAudioRef.current.onEnded = () => {
          if (currentStateRef.current === 'gas' && isAcceleratingRef.current) {
            currentStateRef.current = 'loop';
            if (loopAudioRef.current && !loopAudioRef.current.isPlaying) {
              loopAudioRef.current.play();
            }
          }
        };

        isInitializedRef.current = true;
        // console.log('[PositionalAudio] Audio 3D inizializzato per kart');

      } catch (error) {
        // console.error('[PositionalAudio] Errore caricamento audio:', error);
      }
    };

    loadAudio();

    return () => {
      mounted = false;
      
      // Cleanup: ferma e rimuovi tutti gli audio
      [idleAudioRef, gasAudioRef, loopAudioRef, driftLoopAudioRef].forEach(ref => {
        if (ref.current) {
          if (ref.current.isPlaying) ref.current.stop();
          if (kartObject && ref.current.parent === kartObject) {
            kartObject.remove(ref.current);
          }
          ref.current = null;
        }
      });
      
      isInitializedRef.current = false;
    };
  }, [kartObject, audioFiles, refDistance, maxDistance, rolloffFactor, volume]);

  // Ferma tutto quando la gara non è attiva
  useEffect(() => {
    if (!isActive && isInitializedRef.current) {
      stopAllAudio();
    }
  }, [isActive]);

  /**
   * Ferma tutti i suoni
   */
  const stopAllAudio = useCallback(() => {
    currentStateRef.current = 'stopped';
    
    [idleAudioRef, gasAudioRef, loopAudioRef, driftLoopAudioRef].forEach(ref => {
      if (ref.current && ref.current.isPlaying) {
        ref.current.stop();
      }
    });
    
    // Ferma anche il suono drift bling
    if (driftBlingAudioRef.current) {
      driftBlingAudioRef.current.pause();
      driftBlingAudioRef.current.src = '';
      driftBlingAudioRef.current = null;
    }
    
    isDriftingRef.current = false;
    prevDriftLevelRef.current = 0;
  }, []);

  /**
   * Avvia l'audio IDLE
   */
  const startIdleAudio = useCallback(() => {
    if (!isInitializedRef.current || !isActive) return;
    
    // Se già in stato attivo, non resettare
    if (currentStateRef.current === 'gas' || currentStateRef.current === 'loop') {
      return;
    }

    stopAllAudio();
    currentStateRef.current = 'idle';
    
    if (idleAudioRef.current && !idleAudioRef.current.isPlaying) {
      idleAudioRef.current.play();
    }
  }, [isActive, stopAllAudio]);

  /**
   * Aggiorna lo stato audio - chiamare in useFrame
   * 
   * @param {number} speed - Velocità attuale
   * @param {boolean} isAccelerating - Se sta accelerando
   * @param {number} driftLevel - Livello drift (0, 1=blu, 2=rosso)
   * @param {boolean} isDrifting - Se sta driftando
   */
  const updateAudio = useCallback((speed, isAccelerating, driftLevel = 0, isDrifting = false) => {
    if (!isInitializedRef.current || !isActive) return;

    const absSpeed = Math.abs(speed);
    const wasAccelerating = isAcceleratingRef.current;
    isAcceleratingRef.current = isAccelerating;

    const IDLE_THRESHOLD = 0.5;

    // Determina lo stato target
    let targetState = currentStateRef.current;

    if (isAccelerating && absSpeed > IDLE_THRESHOLD) {
      if (currentStateRef.current === 'loop') {
        targetState = 'loop';
      } else if (!wasAccelerating || currentStateRef.current === 'idle' || currentStateRef.current === 'stopped') {
        targetState = 'gas';
      } else if (currentStateRef.current === 'gas') {
        targetState = 'gas'; // Aspetta che finisca
      } else {
        targetState = 'loop';
      }
    } else if (!isAccelerating || absSpeed <= IDLE_THRESHOLD) {
      targetState = 'idle';
    }

    // Cambia stato se necessario
    if (targetState !== currentStateRef.current) {
      // Ferma audio corrente
      switch (currentStateRef.current) {
        case 'idle':
          if (idleAudioRef.current?.isPlaying) idleAudioRef.current.stop();
          break;
        case 'gas':
          if (gasAudioRef.current?.isPlaying) gasAudioRef.current.stop();
          break;
        case 'loop':
          if (loopAudioRef.current?.isPlaying) loopAudioRef.current.stop();
          break;
      }

      // Avvia nuovo audio
      currentStateRef.current = targetState;
      
      switch (targetState) {
        case 'idle':
          if (idleAudioRef.current && !idleAudioRef.current.isPlaying) {
            idleAudioRef.current.play();
          }
          break;
        case 'gas':
          if (gasAudioRef.current && !gasAudioRef.current.isPlaying) {
            gasAudioRef.current.play();
          }
          break;
        case 'loop':
          if (loopAudioRef.current && !loopAudioRef.current.isPlaying) {
            loopAudioRef.current.play();
          }
          break;
      }
    }

    // Gestione drift loop
    if (isDrifting !== isDriftingRef.current) {
      if (isDrifting) {
        if (driftLoopAudioRef.current && !driftLoopAudioRef.current.isPlaying) {
          driftLoopAudioRef.current.play();
        }
      } else {
        if (driftLoopAudioRef.current?.isPlaying) {
          driftLoopAudioRef.current.stop();
        }
      }
      isDriftingRef.current = isDrifting;
    }
    
    // Gestione suoni drift "bling" blu/rosso
    if (driftLevel !== prevDriftLevelRef.current) {
      // Ferma il suono drift precedente se esiste
      if (driftBlingAudioRef.current) {
        driftBlingAudioRef.current.pause();
        driftBlingAudioRef.current.src = '';
        driftBlingAudioRef.current = null;
      }
      
      // Riproduci nuovo suono se drift level > 0
      if (driftLevel > 0) {
        const soundFile = driftLevel === 1 ? AUDIO_SFX.BLUE_DRIFT : AUDIO_SFX.RED_DRIFT;
        const audio = new Audio(soundFile);
        audio.volume = volume;
        audio.play().catch(() => {});
        driftBlingAudioRef.current = audio;
      }
      
      prevDriftLevelRef.current = driftLevel;
    }
  }, [isActive, volume]);

  /**
   * Imposta il volume (per tutti gli audio)
   */
  const setVolume = useCallback((newVolume) => {
    const vol = Math.max(0, Math.min(1, newVolume));
    
    [idleAudioRef, gasAudioRef, loopAudioRef].forEach(ref => {
      if (ref.current) ref.current.setVolume(vol);
    });
    
    if (driftLoopAudioRef.current) {
      driftLoopAudioRef.current.setVolume(vol * 0.7);
    }
  }, []);

  return {
    updateAudio,
    startIdleAudio,
    stopAllAudio,
    setVolume,
    isInitialized: isInitializedRef.current
  };
};

export default usePositionalKartAudio;
