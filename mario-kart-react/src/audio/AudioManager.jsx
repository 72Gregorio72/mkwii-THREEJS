import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

// ============================================
// COSTANTI: Tracce audio disponibili
// ============================================
export const AUDIO_TRACKS = {
  MENU: '/sounds/MENU_MUSIC.mp3',
  RACE_DAISY_CIRCUIT: '/sounds/DAISY_CIRCUIT_ST.mp3',
};

export const AUDIO_SFX = {
  KART_IDLE: '/sounds/KART_IDLE.wav',
  KART_GAS: '/sounds/KART_GAS.wav',
  KART_LOOP: '/sounds/KART_LOOP.wav',
};

export const AudioProvider = ({ children }) => {

const [isMuted, setIsMuted] = useState(false);
const [musicVolume, setMusicVolume] = useState(0.3);
const [sfxVolume, setSfxVolume] = useState(0.5);
const [audioEnabled, setAudioEnabled] = useState(false);
const [currentContext, setCurrentContext] = useState('menu');

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
  //
  // Utilizzo:
  //   playSfx('/sounds/beep.wav');           // Volume normale
  //   playSfx('/sounds/beep.wav', 0.5);      // Volume ridotto
  const playSfx = (url, volumeMultiplier = 1.0) => {
    // Se l'audio è mutato O non ancora abilitato, non fare nulla
    if (isMuted || !audioEnabled) return;
    
    // Crea un nuovo elemento audio HTML
    const audio = new Audio(url);
    
    // Calcola il volume finale (SFX volume × moltiplicatore)
    // Math.min() assicura che non superi 1.0 (100%)
    audio.volume = Math.min(sfxVolume * volumeMultiplier, 1.0);
    
    // Riproduci il suono (catch() ignora errori)
    audio.play().catch(e => {
      console.warn("Errore nella riproduzione audio:", e);
    });
  };

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
  const setMusic = (url, fadeOut = false) => {
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

    // STEP 2: Crea un nuovo elemento audio
    const audio = new Audio(url);
    
    // STEP 3: Configura la musica
    audio.loop = true;  // Ripeti in loop quando finisce
    
    // STEP 4: Imposta il volume
    // Se mutato: volume 0, altrimenti: usa musicVolume
    audio.volume = isMuted ? 0 : musicVolume;
    
    // STEP 5: Salva i riferimenti
    bgmRef.current = audio;
    currentTrackRef.current = url;

    // STEP 6: Se l'audio è abilitato, avvia la riproduzione
    if (audioEnabled) {
      audio.play().catch(e => {
        console.warn("Errore nella riproduzione della musica:", e);
      });
    }
  };

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
  //   switchContext('menu', AUDIO_TRACKS.MENU);
  //   switchContext('race', AUDIO_TRACKS.RACE_DAISY_CIRCUIT);
  const switchContext = (context, trackUrl = null) => {
    setCurrentContext(context);
    
    if (trackUrl) {
      setMusic(trackUrl, true);  // Con fade out
    } else {
      // Selezione automatica in base al contesto
      if (context === 'menu') {
        setMusic(AUDIO_TRACKS.MENU, true);
      }
      // Per 'race' devi passare esplicitamente la traccia del circuito
    }
  };

  // ============================================
  // FUNZIONE: stopMusic()
  // ============================================
  // Ferma completamente la musica corrente
  //
  // Utilizzo:
  //   stopMusic();
  const stopMusic = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  };

  // ============================================
  // EFFETTO: Sincronizza volume con stato
  // ============================================
  // useEffect esegue codice quando dipendenze cambiano
  // 
  // Dipendenze: [musicVolume, isMuted]
  // = Esegui quando musicVolume o isMuted cambiano
  // 
  // Cosa fa: aggiorna il volume dell'audio in tempo reale
  // (es: quando muovi lo slider del volume)
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
    
    // Aggiungi listener: click ({ once: true } = esegui solo una volta)
    window.addEventListener('click', handleInteraction, { once: true });
    
    // Aggiungi listener: keydown ({ once: true } = esegui solo una volta)
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    // CLEANUP: Rimuovi listener quando il componente si smonta
    // (evita memory leak)
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // ============================================
  // OGGETTO VALUE: Cosa esportare nel Context
  // ============================================
  // Questo oggetto contiene TUTTI i dati e funzioni che i componenti
  // possono usare tramite useAudio()
  const value = {
    // DATI (Stati)
    isMuted,              // Booleano: audio mutato?
    musicVolume,          // Numero: volume musica (0.0 - 1.0)
    sfxVolume,            // Numero: volume effetti (0.0 - 1.0)
    audioEnabled,         // Booleano: audio abilitato?
    currentContext,       // Stringa: 'menu' o 'race'
    
    // FUNZIONI (Setters e azioni)
    toggleMute: () => setIsMuted(prev => !prev),  // Attiva/disattiva mute
    setMusicVolume,       // Funzione: cambia volume musica
    setSfxVolume,         // Funzione: cambia volume effetti
    playSfx,              // Funzione: riproduci effetto sonoro
    setMusic,             // Funzione: cambia musica di sottofondo
    switchContext,        // Funzione: cambia contesto (menu/race)
    stopMusic,            // Funzione: ferma la musica
  };

  // ============================================
  // PROVIDER: Fornisce il value a tutti i figli
  // ============================================
  // Ritorna il Provider con il value
  // I componenti figli possono accedere a "value" tramite useAudio()
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
