import { useRef, useEffect, useCallback } from 'react';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager';

/**
 * Hook per gestire gli SFX del kart/bike
 * 
 * Stati audio:
 * - IDLE: quando il veicolo è fermo (velocità ~ 0) - con crossfade
 * - GAS: quando si inizia ad accelerare (riprodotto una volta)
 * - LOOP: subito dopo GAS, riprodotto in loop continuo con crossfade
 * 
 * @param {Object} options
 * @param {boolean} options.isBike - true se è una moto, false se è un kart
 * @param {boolean} options.isActive - true se la gara è attiva (false = stop tutti i suoni)
 */
export const useKartAudio = ({ isBike = false, isActive = true }) => {
  const { audioEnabled, isMuted, sfxVolume } = useAudio();
  
  // Riferimenti agli elementi audio
  const gasAudioRef = useRef(null);
  
  // Per IDLE usiamo due elementi audio per il crossfade
  const idleAudioARef = useRef(null);
  const idleAudioBRef = useRef(null);
  const activeIdleRef = useRef('A');
  const idleCrossfadeIntervalRef = useRef(null);
  
  // Per il LOOP usiamo due elementi audio per il crossfade
  const loopAudioARef = useRef(null);
  const loopAudioBRef = useRef(null);
  const activeLoopRef = useRef('A');
  const loopCrossfadeIntervalRef = useRef(null);
  
  // Stato corrente dell'audio
  const currentStateRef = useRef('idle'); // 'idle' | 'gas' | 'loop' | 'stopped'
  const isAcceleratingRef = useRef(false);
  
  // Seleziona i file audio corretti in base al tipo di veicolo
  const audioFiles = isBike ? {
    idle: AUDIO_SFX.BIKE_IDLE,
    gas: AUDIO_SFX.BIKE_GAS,
    loop: AUDIO_SFX.BIKE_LOOP,
  } : {
    idle: AUDIO_SFX.KART_IDLE,
    gas: AUDIO_SFX.KART_GAS,
    loop: AUDIO_SFX.KART_LOOP,
  };

  // Tempo di crossfade in secondi (quanto prima della fine iniziare il fade)
  const CROSSFADE_TIME = 0.3; // Aumentato per transizione più fluida
  // Intervallo di controllo in ms
  const CHECK_INTERVAL = 16; // ~60fps per transizioni più fluide

  // Funzione generica per gestire il crossfade
  const startCrossfadeLoop = useCallback((audioARef, audioBRef, activeRef, intervalRef, stateName) => {
    if (!audioARef.current || !audioBRef.current) return;
    
    const volume = isMuted ? 0 : sfxVolume;
    
    // Ferma qualsiasi crossfade precedente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Inizia con l'audio A
    activeRef.current = 'A';
    audioARef.current.volume = volume;
    audioARef.current.currentTime = 0;
    audioARef.current.play().catch(() => {});
    
    // Controlla periodicamente se è il momento di fare crossfade
    intervalRef.current = setInterval(() => {
      if (currentStateRef.current !== stateName) {
        clearInterval(intervalRef.current);
        return;
      }
      
      const currentVolume = isMuted ? 0 : sfxVolume;
      const activeAudio = activeRef.current === 'A' ? audioARef.current : audioBRef.current;
      const nextAudio = activeRef.current === 'A' ? audioBRef.current : audioARef.current;
      
      if (!activeAudio || !nextAudio) return;
      
      const timeRemaining = activeAudio.duration - activeAudio.currentTime;
      
      // Quando manca poco alla fine, inizia il crossfade
      if (timeRemaining <= CROSSFADE_TIME && timeRemaining > 0 && !nextAudio.playing) {
        // Prepara il prossimo audio
        nextAudio.currentTime = 0;
        nextAudio.volume = 0;
        nextAudio.play().catch(() => {});
      }
      
      // Durante il crossfade, aggiusta i volumi gradualmente
      if (timeRemaining <= CROSSFADE_TIME && timeRemaining > 0) {
        // Usa una curva sinusoidale per un fade più naturale
        const fadeProgress = 1 - (timeRemaining / CROSSFADE_TIME);
        const fadeIn = Math.sin(fadeProgress * Math.PI / 2); // 0 -> 1 curva smooth
        const fadeOut = Math.cos(fadeProgress * Math.PI / 2); // 1 -> 0 curva smooth
        
        activeAudio.volume = currentVolume * fadeOut;
        nextAudio.volume = currentVolume * fadeIn;
      }
      
      // Quando il loop attivo è praticamente finito, passa al successivo
      if (timeRemaining <= 0.01) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        nextAudio.volume = currentVolume;
        activeRef.current = activeRef.current === 'A' ? 'B' : 'A';
      }
    }, CHECK_INTERVAL);
  }, [isMuted, sfxVolume]);

  // Funzione per avviare IDLE con crossfade
  const startIdleWithCrossfade = useCallback(() => {
    startCrossfadeLoop(idleAudioARef, idleAudioBRef, activeIdleRef, idleCrossfadeIntervalRef, 'idle');
  }, [startCrossfadeLoop]);

  // Funzione per avviare LOOP con crossfade
  const startLoopWithCrossfade = useCallback(() => {
    startCrossfadeLoop(loopAudioARef, loopAudioBRef, activeLoopRef, loopCrossfadeIntervalRef, 'loop');
  }, [startCrossfadeLoop]);

  // Ferma IDLE crossfade
  const stopIdleCrossfade = useCallback(() => {
    if (idleCrossfadeIntervalRef.current) {
      clearInterval(idleCrossfadeIntervalRef.current);
      idleCrossfadeIntervalRef.current = null;
    }
    
    [idleAudioARef, idleAudioBRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  }, []);

  // Ferma LOOP crossfade
  const stopLoopCrossfade = useCallback(() => {
    if (loopCrossfadeIntervalRef.current) {
      clearInterval(loopCrossfadeIntervalRef.current);
      loopCrossfadeIntervalRef.current = null;
    }
    
    [loopAudioARef, loopAudioBRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  }, []);

  // Inizializza gli elementi audio
  useEffect(() => {
    // Crea gli elementi audio
    gasAudioRef.current = new Audio(audioFiles.gas);
    
    // IDLE A e B per crossfade
    idleAudioARef.current = new Audio(audioFiles.idle);
    idleAudioBRef.current = new Audio(audioFiles.idle);
    
    // LOOP A e B per crossfade
    loopAudioARef.current = new Audio(audioFiles.loop);
    loopAudioBRef.current = new Audio(audioFiles.loop);
    
    // GAS non è in loop (si riproduce una sola volta)
    gasAudioRef.current.loop = false;
    gasAudioRef.current.preload = 'auto';
    
    // IDLE A e B - NON in loop nativo, gestiamo noi il crossfade
    idleAudioARef.current.loop = false;
    idleAudioARef.current.preload = 'auto';
    idleAudioBRef.current.loop = false;
    idleAudioBRef.current.preload = 'auto';
    
    // LOOP A e B - NON in loop nativo, gestiamo noi il crossfade
    loopAudioARef.current.loop = false;
    loopAudioARef.current.preload = 'auto';
    loopAudioBRef.current.loop = false;
    loopAudioBRef.current.preload = 'auto';
    
    // Quando GAS finisce, passa automaticamente a LOOP
    const handleGasEnded = () => {
      if (currentStateRef.current === 'gas' && isAcceleratingRef.current) {
        currentStateRef.current = 'loop';
        startLoopWithCrossfade();
      }
    };
    
    gasAudioRef.current.addEventListener('ended', handleGasEnded);
    
    // Cleanup: ferma e rimuovi tutti gli audio quando il componente si smonta
    return () => {
      gasAudioRef.current?.removeEventListener('ended', handleGasEnded);
      
      if (idleCrossfadeIntervalRef.current) {
        clearInterval(idleCrossfadeIntervalRef.current);
      }
      if (loopCrossfadeIntervalRef.current) {
        clearInterval(loopCrossfadeIntervalRef.current);
      }
      
      [gasAudioRef, idleAudioARef, idleAudioBRef, loopAudioARef, loopAudioBRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, [audioFiles.idle, audioFiles.gas, audioFiles.loop, startLoopWithCrossfade]);

  // Aggiorna il volume quando cambia
  useEffect(() => {
    const volume = isMuted ? 0 : sfxVolume;
    
    if (gasAudioRef.current) {
      gasAudioRef.current.volume = volume;
    }
    
    // Per IDLE, aggiorna solo quello attivo
    if (currentStateRef.current === 'idle') {
      const activeIdle = activeIdleRef.current === 'A' ? idleAudioARef.current : idleAudioBRef.current;
      if (activeIdle) {
        activeIdle.volume = volume;
      }
    }
    
    // Per LOOP, aggiorna solo quello attivo
    if (currentStateRef.current === 'loop') {
      const activeLoop = activeLoopRef.current === 'A' ? loopAudioARef.current : loopAudioBRef.current;
      if (activeLoop) {
        activeLoop.volume = volume;
      }
    }
  }, [sfxVolume, isMuted]);

  // Ferma tutti gli audio istantaneamente
  const stopAllAudio = useCallback(() => {
    currentStateRef.current = 'stopped';
    
    stopIdleCrossfade();
    stopLoopCrossfade();
    
    if (gasAudioRef.current) {
      gasAudioRef.current.pause();
      gasAudioRef.current.currentTime = 0;
    }
  }, [stopIdleCrossfade, stopLoopCrossfade]);

  // Gestisce lo stop quando si esce dalla gara
  useEffect(() => {
    if (!isActive) {
      stopAllAudio();
    }
  }, [isActive, stopAllAudio]);

  /**
   * Aggiorna lo stato audio in base alla velocità e all'input di accelerazione
   * Chiamare questo in ogni frame (useFrame)
   * 
   * @param {number} speed - Velocità attuale del veicolo
   * @param {boolean} isAccelerating - true se il giocatore sta premendo accelera
   */
  const updateAudio = useCallback((speed, isAccelerating) => {
    if (!audioEnabled || !isActive || isMuted) {
      return;
    }

    const absSpeed = Math.abs(speed);
    const wasAccelerating = isAcceleratingRef.current;
    isAcceleratingRef.current = isAccelerating;
    
    // Soglia per considerare il veicolo "fermo"
    const IDLE_THRESHOLD = 0.5;
    
    // Determina lo stato target
    let targetState = 'idle';
    
    if (isAccelerating && absSpeed > IDLE_THRESHOLD) {
      // Se stiamo già in LOOP, rimani in LOOP
      if (currentStateRef.current === 'loop') {
        targetState = 'loop';
      } 
      // Se abbiamo appena iniziato ad accelerare, vai a GAS
      else if (!wasAccelerating || currentStateRef.current === 'idle') {
        targetState = 'gas';
      }
      // Se siamo in GAS, rimani in GAS (il listener 'ended' ci porterà a LOOP)
      else if (currentStateRef.current === 'gas') {
        targetState = 'gas';
      }
      else {
        targetState = 'loop';
      }
    } else if (isAccelerating && absSpeed <= IDLE_THRESHOLD) {
      // Stiamo accelerando ma siamo ancora lenti - rimani in IDLE o vai a GAS
      if (currentStateRef.current === 'idle') {
        targetState = 'gas';
      } else {
        targetState = currentStateRef.current;
      }
    } else {
      // Non stiamo accelerando - torna a IDLE
      targetState = 'idle';
    }

    // Se lo stato non è cambiato, non fare nulla
    if (targetState === currentStateRef.current) {
      return;
    }

    // Ferma l'audio corrente
    const stopCurrent = () => {
      switch (currentStateRef.current) {
        case 'idle':
          stopIdleCrossfade();
          break;
        case 'gas':
          if (gasAudioRef.current) {
            gasAudioRef.current.pause();
            gasAudioRef.current.currentTime = 0;
          }
          break;
        case 'loop':
          stopLoopCrossfade();
          break;
      }
    };

    // Avvia il nuovo audio
    const playTarget = () => {
      const volume = isMuted ? 0 : sfxVolume;
      
      switch (targetState) {
        case 'idle':
          startIdleWithCrossfade();
          break;
        case 'gas':
          if (gasAudioRef.current) {
            gasAudioRef.current.volume = volume;
            gasAudioRef.current.currentTime = 0;
            gasAudioRef.current.play().catch(() => {});
          }
          break;
        case 'loop':
          startLoopWithCrossfade();
          break;
      }
    };

    stopCurrent();
    currentStateRef.current = targetState;
    playTarget();
    
  }, [audioEnabled, isActive, isMuted, sfxVolume, stopIdleCrossfade, stopLoopCrossfade, startIdleWithCrossfade, startLoopWithCrossfade]);

  /**
   * Avvia l'audio IDLE iniziale
   * Chiamare quando il veicolo viene creato/la gara inizia
   */
  const startIdleAudio = useCallback(() => {
    if (!audioEnabled || !isActive || isMuted) {
      return;
    }
    
    stopAllAudio();
    currentStateRef.current = 'idle';
    startIdleWithCrossfade();
  }, [audioEnabled, isActive, isMuted, stopAllAudio, startIdleWithCrossfade]);

  return {
    updateAudio,
    stopAllAudio,
    startIdleAudio,
    currentState: currentStateRef,
  };
};

export default useKartAudio;
