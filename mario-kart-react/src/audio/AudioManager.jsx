import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AUDIO_TRACKS , AUDIO_SFX } from '../components/Data.jsx';

export { AUDIO_TRACKS, AUDIO_SFX };

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {

  const [isMuted, setIsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentContext, setCurrentContext] = useState('menu');
  const [musicPlaybackRate, setMusicPlaybackRate] = useState(1.0);

  // Ref: contiene l'elemento audio della musica di sottofondo
  const bgmRef = useRef(null);
  
  // Ref: tiene traccia del percorso della traccia corrente
  const currentTrackRef = useRef(null);

  // Ref: Pool per gli effetti sonori
  const sfxPoolRef = useRef({});

  // NUOVI REF: Per gestire i timer delle sfumature e poterli cancellare
  const fadeOutIntervalRef = useRef(null);
  const fadeInIntervalRef = useRef(null);
  const pitchIntervalRef = useRef(null);

  // REF: Per gestire il "ducking" del volume durante power items (Star, Bullet Bill, Mega Mushroom)
  const duckingCountRef = useRef(0); // Contatore per gestire più effetti attivi contemporaneamente
  const originalVolumeRef = useRef(null); // Volume originale prima del ducking
  const duckFadeIntervalRef = useRef(null);

  // REF: Per gestire il loop smooth della musica
  const loopMonitorRef = useRef(null); // Monitor per il loop smooth
  const audioContextRef = useRef(null); // Web Audio API context

  // REF: Per prevenire race condition play/pause
  const pendingPlayAbortRef = useRef(null); // AbortController per la promise di play()

  // ============================================
  // FUNZIONE: enableAudio()
  // ============================================
  const enableAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      if (bgmRef.current) {
        bgmRef.current.play().catch(() => {});
      }
    }
  };

  // ============================================
  // FUNZIONE: playSfx()
  // ============================================
  const playSfx = useCallback((url, volumeMultiplier = 1.0, maxInstances = 3) => {
    if (isMuted || !audioEnabled) return;
    
    if (!sfxPoolRef.current[url]) {
      sfxPoolRef.current[url] = [];
    }

    const pool = sfxPoolRef.current[url];
    let audioElement = null;

    for (let i = 0; i < pool.length; i++) {
      if (pool[i].paused) {
        audioElement = pool[i];
        break;
      }
    }

    if (!audioElement && pool.length < maxInstances) {
      audioElement = new Audio(url);
      audioElement.preload = 'auto';
      pool.push(audioElement);
    }

    if (!audioElement) return;

    try {
      // Se l'audio è ancora in riproduzione, fermarlo prima di riavviare
      if (!audioElement.paused) {
        audioElement.pause();
      }
      audioElement.volume = Math.min(sfxVolume * volumeMultiplier, 1.0);
      audioElement.currentTime = 0;
      audioElement.play().catch(e => {
        console.warn("Errore SFX:", e);
      });
    } catch (e) {
      console.warn("Errore setup SFX:", e);
    }
  }, [audioEnabled, isMuted, sfxVolume]);

  // ============================================
  // FUNZIONE: enableSmoothLoop()
  // Gestisce il loop fluido della musica
  // ============================================
  const enableSmoothLoop = useCallback(() => {
    if (!bgmRef.current) return;

    // Pulizia monitor precedente
    if (loopMonitorRef.current) clearInterval(loopMonitorRef.current);

    const audio = bgmRef.current;

    // Monitora il progresso della riproduzione per gestire il loop in modo fluido
    loopMonitorRef.current = setInterval(() => {
      if (!bgmRef.current || bgmRef.current.paused) return;

      const currentAudio = bgmRef.current;
      const duration = currentAudio.duration;
      
      if (isNaN(duration) || duration === 0) return;

      // Calcola il threshold in base al playbackRate corrente
      const threshold = 0.2 / (currentAudio.playbackRate || 1.0);
      
      // Se siamo molto vicini alla fine, prepara il loop
      if (currentAudio.currentTime > duration - threshold && currentAudio.currentTime < duration) {
        // Reset fluido senza stacco
        currentAudio.currentTime = 0;
      }
    }, 100);
  }, []);

  // ============================================
  // FUNZIONE: disableSmoothLoop()
  // Disabilita il monitor del loop
  // ============================================
  const disableSmoothLoop = useCallback(() => {
    if (loopMonitorRef.current) {
      clearInterval(loopMonitorRef.current);
      loopMonitorRef.current = null;
    }
  }, []);

  // ============================================
  // FUNZIONE: setMusic()
  // ============================================
  const setMusic = useCallback((url, fadeDuration = 1000, enableLoop = true, playbackRateOverride = null) => {
    // 1. Controllo se la stessa traccia è già caricata/in riproduzione
    // Ma riavvia se l'audio è stato messo in pausa
    if (currentTrackRef.current === url && bgmRef.current && !bgmRef.current.paused) {
      return;
    }
    
    // Se è la stessa traccia ma è in pausa, riavviala
    if (currentTrackRef.current === url && bgmRef.current && bgmRef.current.paused) {
      // console.log('[AudioManager] Stessa traccia in pausa, riprendo riproduzione');
      bgmRef.current.play().catch(e => console.warn("Errore riavvio musica:", e));
      return;
    }

    const targetVolume = isMuted ? 0 : musicVolume;

    // 2. Pulizia timer precedenti
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);
    if (pitchIntervalRef.current) {
      clearInterval(pitchIntervalRef.current);
      pitchIntervalRef.current = null;
    }

    // Cancella il precedente tentativo di play se ancora in sospeso
    if (pendingPlayAbortRef.current) {
      pendingPlayAbortRef.current.abort();
      pendingPlayAbortRef.current = null;
    }

    // 3. FADE OUT (Vecchia Musica)
    if (bgmRef.current) {
      const oldAudio = bgmRef.current;
      const step = oldAudio.volume / (fadeDuration / 50);

      fadeOutIntervalRef.current = setInterval(() => {
        if (oldAudio.volume > step) {
          oldAudio.volume -= step;
        } else {
          oldAudio.volume = 0;
          oldAudio.pause();
          oldAudio.src = ""; 
          clearInterval(fadeOutIntervalRef.current);
        }
      }, 50);
    }

    if (!url) {
      currentTrackRef.current = null;
      bgmRef.current = null;
      return;
    }

    // 4. SETUP NUOVA MUSICA
    const newAudio = new Audio(url);
    newAudio.loop = enableLoop;
    newAudio.playbackRate = playbackRateOverride ?? musicPlaybackRate;
    
    // Listener per quando la traccia finisce (solo se non è in loop)
    if (!enableLoop) {
      newAudio.addEventListener('ended', () => {
        if (currentTrackRef.current === url) {
          currentTrackRef.current = null;
        }
      });
    }
    
    bgmRef.current = newAudio;
    currentTrackRef.current = url;

    // 5. GESTIONE VOLUME E PLAY
    if (audioEnabled) {
      // CASO A: Audio già attivo -> Fai il Fade In elegante
      newAudio.volume = 0;
      
      // Crea un AbortController per questo tentativo di play
      const abortController = new AbortController();
      pendingPlayAbortRef.current = abortController;
      
      newAudio.play()
        .then(() => {
          // Play è riuscito, cancella il reference
          if (pendingPlayAbortRef.current === abortController) {
            pendingPlayAbortRef.current = null;
          }
          
          // Abilita il loop smooth SOLO se la traccia è in loop
          if (enableLoop) {
            enableSmoothLoop();
          }

          if (targetVolume > 0) {
            const step = targetVolume / (fadeDuration / 50);
            fadeInIntervalRef.current = setInterval(() => {
              if (newAudio.volume < targetVolume - step) {
                newAudio.volume += step;
              } else {
                newAudio.volume = targetVolume;
                clearInterval(fadeInIntervalRef.current);
              }
            }, 50);
          }
        })
        .catch(e => {
          // Se il play fallisce (es: AbortError), non loggare
          if (e.name !== 'AbortError') {
            console.warn("Errore Play Music:", e);
          }
        });
    } else {
      // CASO B: Audio non ancora attivo (Primo caricamento) -> Niente Fade In
      // Impostiamo SUBITO il volume target. 
      // Non chiamiamo play() qui (fallirebbe), ma appena l'utente clicca, 
      // enableAudio() chiamerà play() e il volume sarà già corretto.
      newAudio.volume = targetVolume;
    }
  }, [audioEnabled, isMuted, musicVolume, musicPlaybackRate, enableSmoothLoop]);

  // ============================================
  // ALTRE FUNZIONI
  // ============================================

  const switchContext = (context, trackUrl = null) => {
    setCurrentContext(context);
    
    // Usa fadeDuration di 1000ms (1 secondo)
    if (trackUrl) {
      setMusic(trackUrl, 1000); 
    } else {
      if (context === 'menu') {
        setMusic(AUDIO_TRACKS.TITLE_SCREEN, 1000);
      }
    }
  };

  const changeTrack = useCallback((trackKey, fadeDuration = 1000, enableLoop = true, playbackRateOverride = null) => {
    const trackUrl = AUDIO_TRACKS[trackKey];
    if (!trackUrl) {
      console.warn(`Traccia non trovata: ${trackKey}`);
      return;
    }
    setMusic(trackUrl, fadeDuration, enableLoop, playbackRateOverride);
  }, [setMusic]);

  // ============================================
  // FUNZIONE: playMusicOnce()
  // Riproduce una traccia musicale una sola volta senza loop
  // Accetta sia una chiave di AUDIO_TRACKS che un URL diretto
  // ============================================
  const playMusicOnce = useCallback((trackKeyOrUrl, fadeDuration = 1000, playbackRateOverride = null) => {
    if (!trackKeyOrUrl) {
      console.warn('[AudioManager] playMusicOnce: trackKeyOrUrl non specificato');
      return;
    }
    
    // Se è una chiave di AUDIO_TRACKS, ottieni l'URL
    const url = AUDIO_TRACKS[trackKeyOrUrl] || trackKeyOrUrl;
    
    if (!url) {
      console.warn(`[AudioManager] playMusicOnce: Traccia non trovata: ${trackKeyOrUrl}`);
      return;
    }

    const targetVolume = isMuted ? 0 : musicVolume;

    // Pulisci timer e tentativi play precedenti
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);
    if (pendingPlayAbortRef.current) {
      pendingPlayAbortRef.current.abort();
      pendingPlayAbortRef.current = null;
    }

    // Ferma eventuale musica in riproduzione
    if (bgmRef.current) {
      const oldAudio = bgmRef.current;
      oldAudio.pause();
      oldAudio.src = '';
    }

    // Crea nuova traccia SENZA loop
    const newAudio = new Audio(url);
    newAudio.loop = false;
    newAudio.playbackRate = playbackRateOverride ?? musicPlaybackRate;

    newAudio.addEventListener('ended', () => {
      if (currentTrackRef.current === url) {
        currentTrackRef.current = null;
      }
    });

    bgmRef.current = newAudio;
    currentTrackRef.current = url;

    if (audioEnabled) {
      newAudio.volume = fadeDuration > 0 ? 0 : targetVolume;

      const abortController = new AbortController();
      pendingPlayAbortRef.current = abortController;

      newAudio.play()
        .then(() => {
          if (pendingPlayAbortRef.current === abortController) {
            pendingPlayAbortRef.current = null;
          }

          if (fadeDuration > 0 && targetVolume > 0) {
            const step = targetVolume / (fadeDuration / 50);
            fadeInIntervalRef.current = setInterval(() => {
              if (newAudio.volume < targetVolume - step) {
                newAudio.volume += step;
              } else {
                newAudio.volume = targetVolume;
                clearInterval(fadeInIntervalRef.current);
              }
            }, 50);
          }
        })
        .catch(e => {
          if (e.name !== 'AbortError') {
            console.warn('[AudioManager] Errore Play Music Once:', e);
          }
        });
    } else {
      newAudio.volume = targetVolume;
    }
  }, [audioEnabled, isMuted, musicPlaybackRate, musicVolume]);

  // ============================================
  // FUNZIONE: getCurrentTrack()
  // Ritorna l'URL della traccia attualmente in riproduzione (o null)
  // ============================================
  const getCurrentTrack = useCallback(() => currentTrackRef.current, []);

  const stopMusic = () => {
    // Pulisci i timer di fade se fermiamo tutto bruscamente
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);
    if (pitchIntervalRef.current) {
      clearInterval(pitchIntervalRef.current);
      pitchIntervalRef.current = null;
    }
    
    // Disabilita il monitor del loop
    disableSmoothLoop();

    if (bgmRef.current) {
      bgmRef.current.playbackRate = 1.0;
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }

    setMusicPlaybackRate(1.0);
  };

  const setMusicSpeed = (speed = 1.0) => {
    if (bgmRef.current) {
      bgmRef.current.playbackRate = Math.max(0.5, Math.min(speed, 2.0));
    }
    setMusicPlaybackRate(speed);
  };

  // ============================================
  // FUNZIONE: setMusicPitch()
  // Aumenta il pitch della musica (usando playbackRate per simulare il pitch shift)
  // ============================================
  const setMusicPitch = useCallback((pitch = 1.0, speed = 1.0, fadeDuration = 500) => {
    if (!bgmRef.current) {
      console.warn('[AudioManager] setMusicPitch: nessuna musica in riproduzione');
      return;
    }

    const audio = bgmRef.current;
    const wasPaused = audio.paused;

    // Clamp i valori tra 0.5 e 2.0
    const targetPlaybackRate = Math.max(0.5, Math.min(pitch * speed, 2.0));
    // console.log(`[AudioManager] setMusicPitch: ${targetPlaybackRate} (pitch: ${pitch}, speed: ${speed}), audio paused: ${wasPaused}`);
    
    // Applica il cambio di pitch/velocità con fade se fadeDuration è specificato
    if (fadeDuration > 0) {
      const startRate = audio.playbackRate;
      const step = (targetPlaybackRate - startRate) / (fadeDuration / 30);

      if (pitchIntervalRef.current) {
        clearInterval(pitchIntervalRef.current);
      }

      pitchIntervalRef.current = setInterval(() => {
        if (bgmRef.current) {
          const newRate = bgmRef.current.playbackRate + step;
          if ((step > 0 && newRate < targetPlaybackRate) || (step < 0 && newRate > targetPlaybackRate)) {
            bgmRef.current.playbackRate = newRate;
          } else {
            bgmRef.current.playbackRate = targetPlaybackRate;
            clearInterval(pitchIntervalRef.current);
            pitchIntervalRef.current = null;
          }
        } else {
          clearInterval(pitchIntervalRef.current);
          pitchIntervalRef.current = null;
        }
      }, 30);
    } else {
      audio.playbackRate = targetPlaybackRate;
    }
    
    // Assicurati che l'audio non sia in pausa dopo il cambio
    if (!wasPaused && audio.paused) {
      console.warn('[AudioManager] Audio in pausa dopo setMusicPitch, ripristino play');
      audio.play().catch(e => console.error('Errore play dopo pitch change:', e));
    }
    
    setMusicPlaybackRate(targetPlaybackRate);
  }, []);

  // ============================================
  // FUNZIONE: duckMusicVolume()
  // Abbassa il volume della musica durante effetti speciali (Star, Bullet Bill, Mega Mushroom)
  // ============================================
  const duckMusicVolume = useCallback((targetVolume = 0.05, fadeDuration = 300) => {
    duckingCountRef.current += 1;
    
    // Se è il primo ducking, salva il volume originale
    if (duckingCountRef.current === 1 && bgmRef.current) {
      originalVolumeRef.current = bgmRef.current.volume;
      
      // Pulisci eventuali fade in corso
      if (duckFadeIntervalRef.current) clearInterval(duckFadeIntervalRef.current);
      
      // Fade rapido verso il volume basso
      const startVolume = bgmRef.current.volume;
      const step = (startVolume - targetVolume) / (fadeDuration / 30);
      
      duckFadeIntervalRef.current = setInterval(() => {
        if (bgmRef.current && bgmRef.current.volume > targetVolume + step) {
          bgmRef.current.volume -= step;
        } else {
          if (bgmRef.current) bgmRef.current.volume = targetVolume;
          clearInterval(duckFadeIntervalRef.current);
        }
      }, 30);
    }
  }, []);

  // ============================================
  // FUNZIONE: restoreMusicVolume()
  // Ripristina il volume della musica dopo la fine degli effetti speciali
  // ============================================
  const restoreMusicVolume = useCallback((fadeDuration = 500) => {
    duckingCountRef.current = Math.max(0, duckingCountRef.current - 1);
    
    // Ripristina solo quando tutti gli effetti sono terminati
    if (duckingCountRef.current === 0 && bgmRef.current && originalVolumeRef.current !== null) {
      // Pulisci eventuali fade in corso
      if (duckFadeIntervalRef.current) clearInterval(duckFadeIntervalRef.current);
      
      const targetVolume = isMuted ? 0 : originalVolumeRef.current;
      const startVolume = bgmRef.current.volume;
      const step = (targetVolume - startVolume) / (fadeDuration / 30);
      
      duckFadeIntervalRef.current = setInterval(() => {
        if (bgmRef.current && bgmRef.current.volume < targetVolume - Math.abs(step)) {
          bgmRef.current.volume += step;
        } else {
          if (bgmRef.current) bgmRef.current.volume = targetVolume;
          clearInterval(duckFadeIntervalRef.current);
          originalVolumeRef.current = null;
        }
      }, 30);
    }
  }, [isMuted]);

  // ============================================
  // FUNZIONE: fadeOutMusic()
  // Esegue un fade out della musica corrente
  // Default: 700ms (0.7 secondi)
  // ============================================
  const fadeOutMusic = useCallback((fadeDuration = 700) => {
    if (!bgmRef.current || bgmRef.current.paused) return;

    // Pulisci eventuali fade in corso
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);

    const audio = bgmRef.current;
    const startVolume = audio.volume;
    const intervalMs = 30;
    const step = startVolume / (fadeDuration / intervalMs);

    fadeOutIntervalRef.current = setInterval(() => {
      if (audio.volume > step) {
        audio.volume -= step;
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
    }, intervalMs);
  }, []);

  // ============================================
  // EFFETTI (useEffect)
  // ============================================

  // Gestione Mute / Cambio Volume
  useEffect(() => {
    if (bgmRef.current) {
      // Se l'utente cambia il volume manualmente slider o mute,
      // interrompiamo eventuali fade in corso e applichiamo subito il volume.
      if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);
      if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);

      bgmRef.current.volume = isMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMuted]);

  // Listener primo click
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const value = {
    isMuted,
    musicVolume,
    sfxVolume,
    audioEnabled,
    currentContext,
    musicPlaybackRate,
    enableAudio,
    toggleMute: () => setIsMuted(prev => !prev),
    setMusicVolume,
    setSfxVolume,
    playSfx,
    setMusic,
    switchContext,
    stopMusic,
    setMusicSpeed,
    setMusicPitch,
    enableSmoothLoop,
    disableSmoothLoop,
    changeTrack,
    playMusicOnce,
    getCurrentTrack,
    duckMusicVolume,
    restoreMusicVolume,
    fadeOutMusic,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};