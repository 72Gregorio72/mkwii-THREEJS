import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const UPDATE_INTERVAL = 0.1;
const LAP_BONUS = 100000; // Punti per ogni giro completato

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
		const searchRange = Math.min(20, totalWaypoints);
		
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
		
		return lapScore + waypointProgress;
	};

	// --- 3. LOOP DI GIOCO ---
	const updateTimer = useRef(0);

	useFrame((_, delta) => {
		if (finished || !trackData || !racersData.current) return;

		updateTimer.current += delta;
		if (updateTimer.current < UPDATE_INTERVAL) return;
		updateTimer.current = 0;

		const allRacers = racersData.current;

		// --- 4. AGGIORNA SCORE PER OGNI PILOTA ---
		Object.keys(allRacers).forEach((racerId) => {
			let currentPos = null;

			if (racerId === socket.id) {
				if (playerRef.current?.translation) {
					const t = playerRef.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
				}
			} else if (botRefs.current[racerId]) {
				// È un bot (usa character.id come ID)
				const botRefObj = botRefs.current[racerId];
				if (botRefObj?.current?.translation) {
					const t = botRefObj.current.translation();
					currentPos = new THREE.Vector3(t.x, t.y, t.z);
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

				// Sincronizza lap da remoto
				if (opponentsDataRef.current[racerId]?.lap) {
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

		// Aggiorna solo se cambiato
		const hasChanged = sorted.some((r, i) => positions[i]?.id !== r.id);

		if (hasChanged) {
			setPositions(sorted.map((r, index) => ({ id: r.id, position: index + 1 })));
		}
	});

	return null;
}
