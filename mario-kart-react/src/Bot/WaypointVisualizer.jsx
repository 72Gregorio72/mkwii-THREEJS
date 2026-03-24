import React, { useEffect, useState, useMemo } from 'react'
import { Html, Line, Sphere } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Register MeshBasicMaterial with React Three Fiber
extend({ MeshBasicMaterial: THREE.MeshBasicMaterial })

export function WaypointVisualizer({ waypointsFile }) {
    const [waypoints, setWaypoints] = useState([])
    const [isVisible, setIsVisible] = useState(true)

    // Carica waypoints dal file JSON o da un percorso
    useEffect(() => {
        if (waypointsFile) {
            if (waypointsFile instanceof Blob || waypointsFile instanceof File) {
                // Se è un File/Blob, usa FileReader
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result)
                        setWaypoints(data)
                    } catch (error) {
                        console.error("Errore nel parsing del JSON:", error)
                    }
                }
                reader.readAsText(waypointsFile)
            } else {
                // Se è una stringa (percorso), usa fetch
                fetch(waypointsFile)
                    .then(res => res.json())
                    .then(data => setWaypoints(data))
                    .catch(error => console.error("Errore nel caricamento waypoints:", error))
            }
        }
    }, [waypointsFile])

    // Converti waypoints a Vector3 per la linea
    const linePoints = useMemo(() => {
        return waypoints.map(p => new THREE.Vector3(p.x, p.y + 0.5, p.z))
    }, [waypoints])

    if (!isVisible || waypoints.length === 0) return null

    return (
        <group>
            {/* UI INFO */}
            <Html position={[0, 5, 0]} center>
                <div style={{
                    background: 'rgba(0,0,0,0.8)',
                    color: '#00ffff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                }} onClick={() => setIsVisible(!isVisible)}>
                    👁️ TRACK: {waypoints.length} waypoints<br/>
                    (Click to toggle)
                </div>
            </Html>

            {/* LINEA DEL PERCORSO */}
            {linePoints.length > 1 && (
                <Line
                    points={linePoints}
                    color="cyan"
                    lineWidth={2}
                    dashed={false}
                />
            )}

            {/* SFERE AI WAYPOINT */}
            {waypoints.map((wp, idx) => (
                <Sphere key={idx} position={[wp.x, wp.y + 0.3, wp.z]} args={[0.2, 8, 8]}>
                    <MeshBasicMaterial color={idx === 0 ? "lime" : idx === waypoints.length - 1 ? "red" : "cyan"} />
                </Sphere>
            ))}
        </group>
    )
}