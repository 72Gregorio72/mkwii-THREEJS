import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const UPDATE_INTERVAL = 0.15; // Aumentato da 0.1 a 0.15 per ridurre frequenza update
const LAP_BONUS = 100000;

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
	socket,
}) {
	
	// --- 1. DATI TRACCIATO (Pre-calcolati una volta sola) ---
	const trackData = useMemo(() => {
		if (!trackPath || trackPath.length === 0) return null;
		
		const nodes = trackPath.map(p => new THREE.Vector3(p.x, p.y, p.z));
		
		return { nodes, totalWaypoints: nodes.length };
	}, [trackPath]);

	// Cache per ottimizzare la ricerca del waypoint più vicino
	const lastKnownWaypoint = useRef({});

	// --- 2. FUNZIONE: Trova waypoint più vicino e calcola score ---
	const calculateScore = (racerId, position, currentLap) => {
		if (!trackData) return 0;
		
		const { nodes, totalWaypoints } = trackData;
		
		// Inizializza cache
		if (lastKnownWaypoint.current[racerId] === undefined) {
			lastKnownWaypoint.current[racerId] = 0;
		}

		let startIndex = lastKnownWaypoint.current[racerId];
		let closestIndex = startIndex;
		let minDistSq = Infinity;

		// Cerca nei waypoint vicini (ottimizzazione)
		const searchRange = Math.min(15, totalWaypoints); // Ridotto da 20 a 15
		
		for (let i = 0; i < searchRange; i++) {
			const currentIndex = (startIndex + i) % totalWaypoints;
			const waypoint = nodes[currentIndex];
			const distSq = position.distanceToSquared(waypoint);
			
			if (distSq < minDistSq) {
				minDistSq = distSq;
				closestIndex = currentIndex;
			}
		}

		// Aggiorna cache
		lastKnownWaypoint.current[racerId] = closestIndex;

		// Calcola score: (giri completati * LAP_BONUS) + progresso waypoint
		const lapScore = (currentLap - 1) * LAP_BONUS;
		const waypointProgress = closestIndex; // Waypoint index come progresso
		const finalScore = lapScore + waypointProgress;
		
		// Debug log (ogni 5 secondi circa)
		if (Math.random() < 0.02) {
			// console.log(`[calculateScore] Racer ${racerId.substring(0, 8)}: pos(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}) -> waypoint ${closestIndex}/${totalWaypoints}, lap ${currentLap}, score ${finalScore}`);
		}
		
		return finalScore;
	};

	// --- 3. LOOP DI GIOCO ---
	const updateTimer = useRef(0);

	// Ref per evitare di invocare setPositions ripetutamente con lo stesso valore
	const lastSentPositionsRef = useRef([]);

	useFrame((_, delta) => {
		if (!trackData || !racersData.current) return;

		updateTimer.current += delta;
		if (updateTimer.current < UPDATE_INTERVAL) return;
		updateTimer.current = 0;

		const allRacers = racersData.current;

		// Debug: Log racersData structure ogni 5 secondi
		if (Math.random() < 0.02) { // ~2% chance = circa ogni 5 secondi
			console.log('[RaceManager] racersData:', Object.keys(allRacers).map(id => ({
				id,
				lap: allRacers[id].lap,
				score: allRacers[id].score,
				lapBonus: ((allRacers[id].lap || 1) - 1) * LAP_BONUS
			})));
		}

		// --- 4. AGGIORNA SCORE PER OGNI PILOTA ---
		Object.keys(allRacers).forEach((racerId) => {
			let currentPos = null;

			if (racerId === socket.id) {
				if (playerRef.current?.translation) {
					const t = playerRef.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
					// Debug log del player locale
					if (Math.random() < 0.02) {
						// console.log(`[RaceManager] PLAYER (${racerId.substring(0, 8)}): pos(${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}, ${currentPos.z.toFixed(1)})`);
					}
				}
			} else if (botRefs.current[racerId]) {
				// È un bot (usa character.id come ID)
				const botRefObj = botRefs.current[racerId];
				if (botRefObj?.current?.translation) {
					const t = botRefObj.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
					// Debug log del bot
					if (Math.random() < 0.02) {
						// console.log(`[RaceManager] BOT (${racerId.substring(0, 8)}): pos(${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}, ${currentPos.z.toFixed(1)})`);
					}
				}
			} else {
				// Giocatori online
				const remoteComponent = remoteRefMap.current[racerId];
				if (remoteComponent?.current?.translation) {
					const t = remoteComponent.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
				} else {
					const remoteData = opponentsDataRef?.current?.[racerId];
					if (remoteData) {
						if (remoteData.x !== undefined) {
							currentPos = new THREE.Vector3(remoteData.x, remoteData.y, remoteData.z);
						} else if (remoteData.position) {
							const p = remoteData.position;
							currentPos = Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : new THREE.Vector3(p.x, p.y, p.z);
						}
					}
				}
				
				// Debug log del player online
				if (currentPos && Math.random() < 0.02) {
					// console.log(`[RaceManager] REMOTE (${racerId.substring(0, 8)}): pos(${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}, ${currentPos.z.toFixed(1)})`);
				}
				
				// Sincronizza lap da remoto per giocatori online
				if (opponentsDataRef.current[racerId]?.lap !== undefined) {
					allRacers[racerId].lap = opponentsDataRef.current[racerId].lap;
				}
			}

			if (currentPos) {
				const currentLap = allRacers[racerId].lap || 1;
				allRacers[racerId].score = calculateScore(racerId, currentPos, currentLap);
			} else {
				allRacers[racerId].score = 0;
			}
		});

		// --- 5. ORDINAMENTO PER SCORE (più alto = primo posto) ---
		const sorted = Object.values(allRacers).sort((a, b) => b.score - a.score);

		// Debug log: mostri tutti i racer ordinati
		if (Math.random() < 0.02) {
			// console.log('[RaceManager] CLASSIFICA ATTUALE:');
			sorted.forEach((racer, index) => {
				console.log(`  ${index + 1}. ${racer.id.substring(0, 8)} - Score: ${racer.score} (Lap: ${racer.lap})`);
			});
		}

		// Aggiorna posizione in ogni racer
		sorted.forEach((racer, index) => {
			allRacers[racer.id].position = index + 1;
		});

		// Costruisci array minimale di IDs per confronto
		const newPositionsIds = sorted.map((r, index) => ({ id: r.id, position: index + 1 }));

		// Confronta con l'ultimo stato inviato per evitare setPositions ripetuti
		const last = lastSentPositionsRef.current;
		let changed = false;
		if (last.length !== newPositionsIds.length) changed = true;
		else {
			for (let i = 0; i < last.length; i++) {
				if (last[i].id !== newPositionsIds[i].id) { changed = true; break; }
			}
		}

		if (changed) {
			lastSentPositionsRef.current = newPositionsIds;
			// console.log('[RaceManager] POSIZIONI AGGIORNATE:', newPositionsIds.map(p => `${p.id.substring(0, 8)}(#${p.position})`).join(' -> '));
			setPositions(newPositionsIds);
		}
	});

	return null;
}
