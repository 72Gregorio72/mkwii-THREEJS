import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AUDIO_TRACKS , AUDIO_SFX } from '../components/Data.jsx';

export { AUDIO_TRACKS, AUDIO_SFX };

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {

  const [isMuted, setIsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
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

  // REF: Per gestire il "ducking" del volume durante power items (Star, Bullet Bill, Mega Mushroom)
  const duckingCountRef = useRef(0); // Contatore per gestire più effetti attivi contemporaneamente
  const originalVolumeRef = useRef(null); // Volume originale prima del ducking
  const duckFadeIntervalRef = useRef(null);

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
  // FUNZIONE: setMusic() - FIX BUG PRIMO AVVIO
  // ============================================
  const setMusic = useCallback((url, fadeDuration = 1000) => {
    // 1. Controllo se la stessa traccia è già in esecuzione
    if (currentTrackRef.current === url && bgmRef.current && !bgmRef.current.paused) {
      return;
    }

    const targetVolume = isMuted ? 0 : musicVolume;

    // 2. Pulizia timer precedenti
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);

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
    newAudio.loop = true;
    newAudio.playbackRate = musicPlaybackRate;
    
    bgmRef.current = newAudio;
    currentTrackRef.current = url;

    // 5. GESTIONE VOLUME E PLAY
    if (audioEnabled) {
      // CASO A: Audio già attivo -> Fai il Fade In elegante
      newAudio.volume = 0; 
      newAudio.play().catch(e => console.warn("Errore Play Music:", e));

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
    } else {
      // CASO B: Audio non ancora attivo (Primo caricamento) -> Niente Fade In
      // Impostiamo SUBITO il volume target. 
      // Non chiamiamo play() qui (fallirebbe), ma appena l'utente clicca, 
      // enableAudio() chiamerà play() e il volume sarà già corretto.
      newAudio.volume = targetVolume;
    }
  }, [audioEnabled, isMuted, musicVolume, musicPlaybackRate]);

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

  const changeTrack = useCallback((trackKey, fadeDuration = 1000) => {
    const trackUrl = AUDIO_TRACKS[trackKey];
    if (!trackUrl) {
      console.warn(`Traccia non trovata: ${trackKey}`);
      return;
    }
    setMusic(trackUrl, fadeDuration);
  }, [setMusic]);

  const stopMusic = () => {
    // Pulisci i timer di fade se fermiamo tutto bruscamente
    if (fadeOutIntervalRef.current) clearInterval(fadeOutIntervalRef.current);
    if (fadeInIntervalRef.current) clearInterval(fadeInIntervalRef.current);

    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  const setMusicSpeed = (speed = 1.0) => {
    if (bgmRef.current) {
      bgmRef.current.playbackRate = Math.max(0.5, Math.min(speed, 2.0));
    }
    setMusicPlaybackRate(speed);
  };

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
    changeTrack,
    duckMusicVolume,
    restoreMusicVolume,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};