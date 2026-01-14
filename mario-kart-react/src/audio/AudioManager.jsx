import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

// ============================================
// COSTANTI: Tracce audio disponibili
// ============================================
export const AUDIO_TRACKS = {
  MENU: '/soundTracks/TITLE_SCREEN.mp3', // title screen music
  LOBBY_MUSIC: '/soundTracks/SET_UP.mp3', // lobby music
  CHARACTER_SELECT: '/soundTracks/CHARACTER_SELECT_SCREEN.mp3', // character select music
  KART_SELECT: '/soundTracks/KART_SELECT_SCREEN.mp3', // kart select music
  COURSE_SELECT: '/soundTracks/COURSE_SELECTION.mp3', // course select music
  RACE_DAISY_CIRCUIT: '/soundTracks/DAISY_CIRCUIT_ST.mp3',
  RACE_LUIGI_CIRCUIT: '/soundTracks/LUIGI_CIRCUIT_ST.mp3',
  RACE_COCONUT_MALL: '/soundTracks/COCONUT_MALL_ST.mp3',
};

export const AUDIO_SFX = {
  KART_IDLE: '/SFX/KART_IDLE.wav', // idle sound
  KART_GAS: '/SFX/KART_GAS.wav', // gas sound
  KART_DOWNSHIFT: '/SFX/KART_DOWN.wav', // downshift sound
  KART_LOOP: '/SFX/KART_LOOP.wav', // loop sound
  BIKE_IDLE: '/SFX/BIKE_IDLE.wav',
  BIKE_GAS: '/SFX/BIKE_GAS.wav',
  BIKE_DOWNSHIFT: '/SFX/BIKE_DOWN.wav',
  BIKE_LOOP: '/SFX/BIKE_LOOP.wav',
  BLUE_DRIFT: '/SFX/SE_VCL_DRIFT_HIBANA_BLUE.wav',
  RED_DRIFT: '/SFX/SE_VCL_DRIFT_HIBANA_RED.wav',
  NORMAL_DRIFT: '/SFX/SE_VCL_SLIP_ASPHALT.wav',
};

export const AudioProvider = ({ children }) => {

  const [isMuted, setIsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentContext, setCurrentContext] = useState('menu');
  const [musicPlaybackRate, setMusicPlaybackRate] = useState(1.0);
  // Ref: contiene l'elemento audio della musica di sottofondo (BGM = Background Music)
  // Serve per controllare la musica: play(), pause(), volume, etc.

  const bgmRef = useRef(null);

  // Ref: tiene traccia del percorso della traccia corrente
const currentTrackRef = useRef(null);

  // ============================================
  // FUNZIONE: enableAudio()
  // ============================================
  // Abilita l'audio al primo click/keypress dell'utente
  // (Limitazione dei browser moderni per evitare auto-play indesiderato)
  const enableAudio = () => {
    // Se l'audio non è ancora abilitato...
    if (!audioEnabled) {
      // Abilita l'audio
      setAudioEnabled(true);
      
      // Se c'è musica che era in pausa, riproducila
      if (bgmRef.current) {
        bgmRef.current.play().catch(() => {
          // Se fallisce, ignora l'errore silenziosamente
        });
      }
    }
  };

  // ============================================
  // FUNZIONE: playSfx()
  // ============================================
  // Riproduce un effetto sonoro (SFX = Sound Effects)
  // Esempi: click UI, passaggio checkpoint, suono accelerazione
  //
  // Parametri:
  //   url: percorso del file audio (es: '/sounds/click.wav')
  //   volumeMultiplier: moltiplicatore volume (optional, default=1.0)
  //                     0.5 = metà volume, 2.0 = doppio volume
  //   maxInstances: numero massimo di istanze dello stesso suono (optional, default=3)
  //
  // Utilizzo:
  //   playSfx('/sounds/beep.wav');           // Volume normale
  //   playSfx('/sounds/beep.wav', 0.5, 2);   // Volume ridotto, max 2 istanze
  const sfxPoolRef = useRef({});

  const playSfx = useCallback((url, volumeMultiplier = 1.0, maxInstances = 3) => {
    if (isMuted || !audioEnabled) return;
    
    // Crea il pool per questo suono se non esiste
    if (!sfxPoolRef.current[url]) {
      sfxPoolRef.current[url] = [];
    }

    const pool = sfxPoolRef.current[url];
    let audioElement = null;

    // Cerca un elemento audio disponibile (non in riproduzione)
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].paused) {
        audioElement = pool[i];
        break;
      }
    }

    // Se non ce n'è uno disponibile e non abbiamo raggiunto il limite, creane uno nuovo
    if (!audioElement && pool.length < maxInstances) {
      audioElement = new Audio(url);
      audioElement.preload = 'auto';
      pool.push(audioElement);
    }

    // Se non abbiamo un elemento disponibile, esci (raggiunto limite di istanze)
    if (!audioElement) return;

    try {
      audioElement.volume = Math.min(sfxVolume * volumeMultiplier, 1.0);
      audioElement.currentTime = 0; // Riavvia dall'inizio
      audioElement.play().catch(e => {
        console.warn("Errore nella riproduzione audio:", e);
      });
    } catch (e) {
      console.warn("Errore nell'impostazione dell'audio:", e);
    }
  }, [audioEnabled, isMuted, sfxVolume]);

  // ============================================
  // FUNZIONE: setMusic()
  // ============================================
  // Cambia la musica di sottofondo (BGM)
  // Ferma la traccia corrente e ne avvia una nuova
  //
  // Parametri:
  //   url: percorso del file audio (es: '/sounds/daisy-circuit.mp3')
  //   fadeOut: se true, fai un fade out fluido (optional, default=false)
  //
  // Utilizzo:
  //   setMusic('/sounds/race-music.mp3');
  //   setMusic('/sounds/race-music.mp3', true);  // Con fade out
  const setMusic = useCallback((url, fadeOut = false) => {
    // Evita di ricaricare la stessa traccia
    if (currentTrackRef.current === url && bgmRef.current && !bgmRef.current.paused) {
      return;
    }

    // STEP 1: Se c'è una musica già in riproduzione, fermala
    if (bgmRef.current) {
      if (fadeOut) {
        // Fade out fluido (diminuisci il volume gradualmente)
        const oldAudio = bgmRef.current;
        const fadeInterval = setInterval(() => {
          if (oldAudio.volume > 0.05) {
            oldAudio.volume = Math.max(0, oldAudio.volume - 0.05);
          } else {
            clearInterval(fadeInterval);
            oldAudio.pause();
            oldAudio.src = "";
          }
        }, 50);
      } else {
        // Stop immediato
        bgmRef.current.pause();
        bgmRef.current.src = "";
      }
    }

    // Se url è vuoto/null, ferma solo la musica e ritorna
    if (!url) {
      currentTrackRef.current = null;
      return;
    }

    const audio = new Audio(url);
    audio.loop = true;  // Ripeti in loop quando finisce
    audio.volume = isMuted ? 0 : musicVolume;
    bgmRef.current = audio;
    currentTrackRef.current = url;

    // STEP 6: Se l'audio è abilitato, avvia la riproduzione
    if (audioEnabled) {
      audio.play().catch(e => {
        console.warn("Errore nella riproduzione della musica:", e);
      });
    }
  }, [audioEnabled, isMuted, musicVolume]);

  // ============================================
  // FUNZIONE: switchContext()
  // ============================================
  // Cambia il contesto audio (menu/race) e la musica associata
  //
  // Parametri:
  //   context: 'menu' oppure 'race'
  //   trackUrl: URL della traccia (opzionale)
  //
  // Utilizzo:
  //   switchContext('menu', AUDIO_TRACKS.TITLE_SCREEN);
  //   switchContext('race', AUDIO_TRACKS.RACE_DAISY_CIRCUIT);
  const switchContext = (context, trackUrl = null) => {
    setCurrentContext(context);
    
    if (trackUrl) {
      setMusic(trackUrl, true);  // Con fade out
    } else {
      // Selezione automatica in base al contesto
      if (context === 'menu') {
        setMusic(AUDIO_TRACKS.TITLE_SCREEN, true);
      }
      // Per 'race' devi passare esplicitamente la traccia del circuito
    }
  };

  const changeTrack = useCallback((trackKey, fadeOut = true) => {
    const trackUrl = AUDIO_TRACKS[trackKey];
    if (!trackUrl) {
      console.warn(`Traccia audio non trovata: ${trackKey}`);
      return;
    }
    setMusic(trackUrl, fadeOut);
  }, [setMusic]);



  // stops music playback
  const stopMusic = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  // mute / unmute effect
  useEffect(() => {
    if (bgmRef.current) {
      // Se mutato: 0, altrimenti: usa musicVolume
      bgmRef.current.volume = isMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMuted]);

  // ============================================
  // EFFETTO: Ascolta il primo click/keypress
  // ============================================
  // Dipendenze: [] (array vuoto)
  // = Esegui SOLO una volta al mount del componente
  // 
  // Cosa fa: abilita l'audio quando l'utente clicca o preme un tasto
  // (Necessario per i browser moderni)
  useEffect(() => {
    // Funzione da eseguire quando l'utente interagisce
    const handleInteraction = () => enableAudio();
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    // CLEANUP: Rimuovi listener quando il componente si smonta
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);


  const setMusicSpeed = (speed = 1.0) => {
    if (bgmRef.current) {
      bgmRef.current.playbackRate = Math.max(0.5, Math.min(speed, 2.0));
      setMusicPlaybackRate(speed);
    }
  };


  const value = {
    isMuted,              // Booleano: audio mutato?
    musicVolume,          // Numero: volume musica (0.0 - 1.0)
    sfxVolume,            // Numero: volume effetti (0.0 - 1.0)
    audioEnabled,         // Booleano: audio abilitato?
    currentContext,       // Stringa: 'menu' o 'race'
    musicPlaybackRate,    // Numero: velocità di riproduzione della musica
    
    toggleMute: () => setIsMuted(prev => !prev),  // Attiva/disattiva mute
    setMusicVolume,       // Funzione: cambia volume musica
    setSfxVolume,         // Funzione: cambia volume effetti
    playSfx,              // Funzione: riproduci effetto sonoro
    setMusic,             // Funzione: cambia musica di sottofondo
    switchContext,        // Funzione: cambia contesto (menu/race)
    stopMusic,            // Funzione: ferma la musica
    setMusicSpeed,        // Funzione: cambia la velocità della musica
    changeTrack,          // Funzione: cambia traccia musicale
  };


  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
