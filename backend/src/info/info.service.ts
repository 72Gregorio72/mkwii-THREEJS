import { Injectable } from '@nestjs/common';

@Injectable()
export class InfoService {
  
  getTos() {
    return {
      title: 'Termini di Servizio (TOS)',
      lastUpdated: '06 Gennaio 2026',
      content: `
1. INTRODUZIONE
Benvenuto su "MKWii-ThreeJS" (il "Servizio"). Questo è un progetto didattico realizzato a scopo educativo e di portfolio. Accedendo al gioco, accetti questi termini.

2. DISCLAIMER SUL COPYRIGHT
Questo progetto è un tributo fan-made a scopo di studio. Tutti i diritti sui personaggi (Mario, Luigi, ecc.) e sui design originali appartengono a Nintendo Co., Ltd. Questo progetto non è affiliato, approvato o sponsorizzato da Nintendo. Nessun lucro è generato da questo servizio.

3. CODICE DI CONDOTTA
Per garantire il divertimento di tutti, accetti di:
- Non utilizzare cheat, hack, bot o software di terze parti per ottenere vantaggi sleali (es. Speed Hack).
- Non sfruttare bug del sistema per alterare le classifiche.
- Mantenere un linguaggio rispettoso se implementata una chat.
- Non tentare di sabotare il server (DDoS o injection).

4. ACCOUNT
Sei responsabile della sicurezza della tua password. Non condividere le tue credenziali. Ci riserviamo il diritto di bannare o cancellare account che violano le regole o che rimangono inattivi per lunghi periodi.

5. LIMITAZIONE DI RESPONSABILITÀ
Il servizio è fornito "così com'è". Non garantiamo che il server sarà sempre online o privo di bug. I tuoi progressi di gioco (statistiche, rank) potrebbero essere resettati durante aggiornamenti del server.
      `
    };
  }

  getPrivacy() {
    return {
      title: 'Informativa sulla Privacy',
      lastUpdated: '06 Gennaio 2026',
      content: `
1. DATI RACCOLTI
Per far funzionare il gioco, raccogliamo solo i dati essenziali:
- Nickname (pubblico, visibile in classifica).
- Indirizzo Email (privato, usato solo per il login/recupero).
- Password (criptata e illeggibile, non salviamo mai la password in chiaro).
- Dati di gioco (tempi sul giro, vittorie, sconfitte).

2. COME USIAMO I TUOI DATI
- Gestione dell'account e autenticazione.
- Generazione delle classifiche (Leaderboard).
- Miglioramento tecnico del gioco basato su log di errore.

3. COOKIE E STORAGE LOCALE
Utilizziamo "Local Storage" o "Session Storage" nel tuo browser unicamente per mantenere attiva la tua sessione di gioco (JWT Token). Non utilizziamo cookie di tracciamento pubblicitario.

4. TERZE PARTI
Questo è un progetto indipendente. I tuoi dati non vengono venduti, scambiati o ceduti a terze parti esterne.

5. I TUOI DIRITTI
In qualsiasi momento puoi richiedere la cancellazione completa del tuo account e di tutti i dati associati contattando l'amministratore del progetto o utilizzando l'apposita funzione nelle impostazioni.
      `
    };
  }
}