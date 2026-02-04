import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

export function WaypointRecorder({ kartRef, isRecording }) {
    const pointsRef = useRef([]) // Memorizza i punti grezzi
    const [linePoints, setLinePoints] = useState([]) // Stato per disegnare la linea (array di Vector3)
    
    // Serve per calcolare la distanza dall'ultimo punto
    const lastPos = useRef(new THREE.Vector3(0, -100, 0)) 
    
    // Settings
    const MIN_DISTANCE = 2.0 // Registra un punto ogni 2 metri (aumenta a 3 o 4 per curve più morbide)

    useFrame(() => {
        if (!isRecording) return;

        // 1. Controllo di sicurezza: Il Kart esiste?
        if (!kartRef || !kartRef.current) {
             console.warn("WaypointRecorder: kartRef non trovato o non ancora pronto.");
            return;
        }

        // 2. Ottieni posizione reale dalla fisica Rapier
        const t = kartRef.current.translation();
        const currentVec = new THREE.Vector3(t.x, t.y, t.z);

        // 3. Calcola distanza dall'ultimo punto registrato
        const dist = currentVec.distanceTo(lastPos.current);

        // 4. REGISTRA SOLO SE CI SIAMO SPOSTATI ABBASTANZA
        if (dist > MIN_DISTANCE) {
            // Arrotondiamo per risparmiare spazio nel JSON
            const newPoint = { 
                x: Number(t.x.toFixed(2)), 
                y: Number(t.y.toFixed(2)), 
                z: Number(t.z.toFixed(2)) 
            };

            pointsRef.current.push(newPoint);
            lastPos.current.copy(currentVec);

            // Aggiorna la linea visiva (convertiamo in formato per <Line>)
            setLinePoints(prev => [...prev, currentVec.clone().add(new THREE.Vector3(0, 0.5, 0))]);
            
            // console.log(`📍 Punto aggiunto: ${pointsRef.current.length} (Dist: ${dist.toFixed(2)})`);
        }
    });

    // Gestione tasto "P" per scaricare
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'p') {
                if (pointsRef.current.length === 0) {
                    alert("Nessun punto registrato! Muoviti col kart prima di salvare.");
                    return;
                }
                downloadWaypoints();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const downloadWaypoints = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pointsRef.current));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "track_waypoints.json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        // console.log("💾 JSON Scaricato con successo!");
    }

    if (!isRecording) return null;

    return (
        <group>
            {/* UI INFO */}
            <Html position={[0, 5, 0]} center>
                <div style={{ 
                    background: 'rgba(0,0,0,0.8)', 
                    color: '#00ff00', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                }}>
                    🔴 REC: {pointsRef.current.length} pts<br/>
                    (Min Dist: {MIN_DISTANCE}m)<br/>
                    Premi 'P' per salvare
                </div>
            </Html>

            {/* VISUALIZZAZIONE PERCORSO IN TEMPO REALE */}
            {linePoints.length > 1 && (
                <Line 
                    points={linePoints}       // Array di Vector3
                    color="red"               // Colore linea
                    lineWidth={3}             // Spessore
                    dashed={false}
                />
            )}
            
            {/* Visualizza l'ultimo punto inserito come una sfera */}
            <mesh position={lastPos.current}>
                <sphereGeometry args={[0.3]} />
                <meshBasicMaterial color="yellow" />
            </mesh>
        </group>
    )
}