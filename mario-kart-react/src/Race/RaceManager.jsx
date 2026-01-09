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
    trackPath 
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

        // Aggiungi tempo trascorso
        updateTimer.current += delta;

        // Se non è passato 1 secondo, non fare nulla (RISPARMIO CPU)
        if (updateTimer.current < UPDATE_INTERVAL) return;

        // Resetta timer
        updateTimer.current = 0;

        // --- CALCOLO CLASSIFICA (Eseguito solo 1 volta al sec) ---
        const allRacers = racersData.current;
        const trackLen = trackData.totalLength;

        Object.keys(allRacers).forEach((racerId) => {
            let rigidBody = null;

            // Recupera il riferimento al corpo fisico corretto
            if (racerId === 'player') {
                rigidBody = playerRef.current;
            } else {
                const botRefObj = botRefs.current && botRefs.current[racerId];
                if (botRefObj) rigidBody = botRefObj.current;
            }

            // Leggi posizione da Rapier e calcola score
            if (rigidBody && rigidBody.translation) {
                const t = rigidBody.translation();
                const posVec = new THREE.Vector3(t.x, t.y, t.z);
                
                const currentProgress = getTrackProgress(racerId, posVec);
                const currentLap = allRacers[racerId].lap; 

                // Score = (Giri * Lunghezza) + Metri percorsi nel giro attuale
                const totalScore = ((currentLap - 1) * trackLen) + currentProgress;
                
                allRacers[racerId].score = totalScore;
            }
        });

        // --- 4. ORDINAMENTO E UPDATE UI ---
        const sorted = Object.values(allRacers).sort((a, b) => b.score - a.score);

        // Verifica se l'ordine è cambiato per evitare re-render inutili di React
        let rankingChanged = false;
        
        if (positions.length !== sorted.length) rankingChanged = true;
        else {
            for (let i = 0; i < sorted.length; i++) {
                if (positions[i]?.id !== sorted[i].id) {
                    rankingChanged = true;
                    break;
                }
            }
        }

        if (rankingChanged) {
            setPositions(sorted.map((r, index) => ({ id: r.id, position: index + 1 })));
        }
    });

    return null; // Componente logico, nessun render visivo
}