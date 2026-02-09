import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Frequenza di aggiornamento in secondi
// 1.0 = Una volta al secondo (Molto leggero, zero lag)
// Puoi abbassarlo a 0.5 se noti che la classifica nell'UI è troppo "scattosa"
const UPDATE_INTERVAL = 0.1; 

export function RaceManager({ 
    racersData, 
    finished, 
    setPositions, 
    positions,
    playerRef, 
    botRefs, 
    trackPath,
	opponentsDataRef,
	remoteRefMap,
}) {
    
    // --- 1. DATI TRACCIATO (Pre-calcolati una volta sola) ---
    const trackData = useMemo(() => {
        if (!trackPath || trackPath.length === 0) return null;

        const nodes = trackPath.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const segments = [];
        let totalLength = 0;

        for (let i = 0; i < nodes.length - 1; i++) {
            const A = nodes[i];
            const B = nodes[i + 1];
            const length = A.distanceTo(B);
            
            segments.push({
                index: i, A, B,
                direction: new THREE.Vector3().subVectors(B, A).normalize(),
                length, startDist: totalLength 
            });
            totalLength += length;
        }
        
        // Chiudi circuito (ultimo punto -> primo punto)
        const lastNode = nodes[nodes.length - 1];
        const firstNode = nodes[0];
        const closingLength = lastNode.distanceTo(firstNode);
        segments.push({
            index: nodes.length - 1, A: lastNode, B: firstNode, 
            direction: new THREE.Vector3().subVectors(firstNode, lastNode).normalize(),
            length: closingLength, startDist: totalLength
        });
        totalLength += closingLength;

        return { nodes, segments, totalLength };
    }, [trackPath]);

    // Memorizza l'ultimo segmento valido per ogni pilota per velocizzare la ricerca
    const lastKnownSegment = useRef({}); 

    // --- 2. FUNZIONE HELPER: Calcolo Progresso ---
    const getTrackProgress = (racerId, position) => {
        if (!trackData) return 0;
        const { segments } = trackData;
        
        // Inizializza cache se vuota
        if (lastKnownSegment.current[racerId] === undefined) {
            lastKnownSegment.current[racerId] = 0;
        }

        let startIndex = lastKnownSegment.current[racerId];
        let bestDistSq = Infinity;
        let bestProgress = 0;
        let foundSegmentIndex = startIndex;

        // Ottimizzazione: Cerca solo nei segmenti vicini all'ultimo noto
        const lookBack = 5;
        const lookAhead = 15;
        const numSegments = segments.length;

        for (let i = -lookBack; i <= lookAhead; i++) {
            let currentIndex = (startIndex + i);
            // Gestione indici circolari (fine array -> inizio array)
            if (currentIndex < 0) currentIndex += numSegments;
            currentIndex = currentIndex % numSegments;

            const seg = segments[currentIndex];
            
            // Proietta la posizione del kart sul segmento (Matematica vettoriale)
            const AP = new THREE.Vector3().subVectors(position, seg.A);
            let t = AP.dot(seg.direction);
            t = Math.max(0, Math.min(t, seg.length)); // Clampa t tra 0 e lunghezza segmento
            
            const closestPointOnSeg = new THREE.Vector3().copy(seg.A).add(seg.direction.clone().multiplyScalar(t));
            const distSq = position.distanceToSquared(closestPointOnSeg);

            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                foundSegmentIndex = currentIndex;
                bestProgress = seg.startDist + t;
            }
        }
        
        // Aggiorna cache e ritorna progresso in metri
        lastKnownSegment.current[racerId] = foundSegmentIndex;
        return bestProgress;
    };

    // --- 3. LOOP DI GIOCO (Con Throttle) ---
    const updateTimer = useRef(0);

    useFrame((state, delta) => {
		if (finished || !trackData || !racersData.current) return;

		updateTimer.current += delta;
		if (updateTimer.current < UPDATE_INTERVAL) return;
		updateTimer.current = 0;

		const allRacers = racersData.current;
		const trackLen = trackData.totalLength;

		Object.keys(allRacers).forEach((racerId) => {
			let currentPos = null;

			if (racerId === 'player') {
				if (playerRef.current?.translation) {
					const t = playerRef.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
				}
			} else if (racerId.startsWith('bot_')) {
				const botRefObj = botRefs.current[racerId];
				if (botRefObj?.current?.translation) {
					const t = botRefObj.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
				}
			} else {
				// --- LOGICA ONLINE ---
				// 1. Prova a leggere dal Ref fisico (RemoteOpponent con forwardRef)
				const remoteComponent = remoteRefMap.current[racerId];
				if (remoteComponent?.current?.translation) {
					const t = remoteComponent.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
				} 
				// 2. Fallback ai dati grezzi di rete (attenzione alle chiavi x,y,z o position)
				else {
					const remoteData = opponentsDataRef?.current?.[racerId];
					if (remoteData) {
						// Controlla se le chiavi sono .x o .position[0]
						if (remoteData.x !== undefined) {
							currentPos = new THREE.Vector3(remoteData.x, remoteData.y, remoteData.z);
						} else if (remoteData.position) {
							const p = remoteData.position;
							currentPos = Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : new THREE.Vector3(p.x, p.y, p.z);
						}
					}
				}

				// Sincronizza il Lap se presente
				if (opponentsDataRef.current[racerId]?.lap) {
					allRacers[racerId].lap = opponentsDataRef.current[racerId].lap;
				}
			}
			if (currentPos) {
				const currentProgress = getTrackProgress(racerId, currentPos);
				const currentLap = allRacers[racerId].lap || 1;
				const totalScore = ((currentLap - 1) * trackLen) + currentProgress;
				
				allRacers[racerId].score = totalScore;
			} else {
				allRacers[racerId].score = 0;
			}
		});

		// --- 5. ORDINAMENTO ---
		// Prima ordina per checkpoint superati (nextCP + lap), poi per score (progresso)
		const sorted = Object.values(allRacers).sort((a, b) => {
			// Calcola checkpoint totali: (lap - 1) * maxCheckpoints + nextCP
			// Assumiamo che ci siano circa 10-15 checkpoint per giro (usa un valore alto per sicurezza)
			const maxCheckpointsPerLap = 20;
			const checkpointsA = ((a.lap - 1) * maxCheckpointsPerLap) + (a.nextCP || 0);
			const checkpointsB = ((b.lap - 1) * maxCheckpointsPerLap) + (b.nextCP || 0);
			
			// Ordina per checkpoint (più checkpoint = più avanti)
			if (checkpointsB !== checkpointsA) {
				return checkpointsB - checkpointsA;
			}
			
			// In caso di parità di checkpoint, usa lo score (progresso sul tracciato)
			return b.score - a.score;
		});

		// Controllo se la classifica è cambiata (ottimizzazione React)
		const hasChanged = sorted.some((r, i) => positions[i]?.id !== r.id);

		if (hasChanged) {
			setPositions(sorted.map((r, index) => ({ id: r.id, position: index + 1 })));
		}
	});

    return null; // Componente logico, nessun render visivo
}