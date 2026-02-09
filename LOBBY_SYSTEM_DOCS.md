# Sistema Lobby Multiplayer - Documentazione

## Panoramica
Implementato un sistema di lobby multiplayer dove:
- Il primo player che si connette diventa **HOST**
- L'host può far partire la gara con un bottone "START RACE"
- Tutti i player condividono lo stesso `gameState` e gli stessi bot
- I bot sono creati dall'host e sincronizzati con tutti i client

## Modifiche Frontend

### Nuovi File

#### `/src/ui/LobbyScreen.jsx`
- Componente UI per la schermata di lobby
- Mostra lista dei player connessi
- Bottone "START RACE" per l'host
- Indicatore "Waiting for host..." per i client

### File Modificati

#### `/src/Scenes/GameScene.jsx`
**Nuovi Stati:**
- `isInLobby`: Booleano che indica se si è nella lobby
- `isHost`: Booleano che indica se il player è l'host
- `lobbyPlayers`: Array dei player nella lobby
- `remoteBots`: Array dei bot sincronizzati dall'host
- `gameState`: Ora include 'LOBBY' come stato iniziale

**Nuova Logica:**
1. **Lobby Management** (useEffect):
   - Ascolta evento `room_state` per sapere se si è host
   - Ascolta evento `race_start` per iniziare la gara
   - Ascolta evento `game_state_sync` per sincronizzare lo stato

2. **handleStartRace():**
   - Genera i dati dei bot (charId, vehicleId)
   - Emette evento `start_race` con i dati dei bot
   - Solo l'host può chiamare questa funzione

3. **Rendering Bot:**
   - Se HOST: renderizza i bot locali (OutsideDriftKart con isBot=true)
   - Se CLIENT: renderizza RemoteOpponent per ogni bot
   - I bot sono condivisi tra tutti i player

**Rendering:**
- `LobbyScreen` viene mostrata quando `isInLobby === true`
- La lobby blocca l'inizio della gara finché l'host non preme "START RACE"

## Modifiche Backend

### File Modificati

#### `/backend/src/game/game.gateway.ts`

**Nuovi Dati:**
```typescript
private roomData = new Map<string, { 
  hostId: string, 
  players: any[], 
  bots: any[], 
  gameState: string 
}>();
```

**Logica Connessione (handleConnection):**
- Crea una stanza "global_room" se non esiste
- Il primo player diventa host
- Emette `room_state` a tutti i player con info su chi è l'host

**Logica Disconnessione (handleDisconnect):**
- Rimuove il player dalla stanza
- Se l'host esce, assegna un nuovo host
- Se la stanza è vuota, la elimina

**Nuovi Eventi Socket:**

1. **`request_room_state`**
   - Il client richiede lo stato corrente della stanza
   - Server risponde con `room_state`

2. **`start_race`** (solo host)
   - Payload: `{ bots: Bot[] }`
   - Salva i bot nella stanza
   - Emette `race_start` a tutti i client
   - Sincronizza le posizioni dei bot nel gameService

3. **`sync_game_state`** (solo host)
   - Payload: `{ gameState: string, countdown?: any }`
   - Sincronizza lo stato di gioco tra tutti i player
   - Emette `game_state_sync` a tutti i client

## Flusso di Gioco

### 1. Connessione
```
Client 1 -> Server: WebSocket Connect
Server -> Client 1: room_state { isHost: true, players: [...] }

Client 2 -> Server: WebSocket Connect
Server -> All: room_state { players: [Client1, Client2], hostId: Client1.id }
```

### 2. Lobby
```
Client 1 (Host): Vede "You are the HOST" + bottone "START RACE"
Client 2: Vede "Waiting for host to start the race..."
```

### 3. Start Race
```
Client 1 (Host) -> Server: start_race { bots: [bot_0, bot_1, ...] }
Server -> All Clients: race_start { bots: [...] }

All Clients: 
  - isInLobby = false
  - remoteBots = bots ricevuti
  - gameState = 'INTRO'
  - Inizia animazione intro
```

### 4. Gameplay
```
Host Client:
  - Renderizza bot locali (OutsideDriftKart)
  - I bot si muovono con AI locale
  - Le posizioni dei bot vengono trasmesse via world_update

Non-Host Clients:
  - Renderizzano RemoteOpponent per ogni bot
  - Ricevono le posizioni dei bot via world_update
  - I bot si muovono in sync con l'host
```

## Vantaggi

1. **Sincronizzazione:** Tutti vedono la stessa gara
2. **Host Authority:** Un solo player gestisce l'AI dei bot
3. **Scalabilità:** I client non devono calcolare l'AI dei bot
4. **Consistenza:** Stessa configurazione di bot per tutti
5. **Controllo:** L'host decide quando far partire la gara

## Note Tecniche

- La stanza è attualmente "global_room" (semplificazione)
- Per più stanze simultanee, implementare sistema di room IDs
- I bot vengono trattati come "player speciali" nel sistema di rete
- L'host trasmette le posizioni dei bot ogni frame (~60Hz)
- Se l'host esce, viene assegnato un nuovo host automaticamente
