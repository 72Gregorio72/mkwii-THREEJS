import React, { useEffect, useState, useMemo } from 'react'
import { Html, Line, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function normalizeWaypoints(input) {
    if (!input) return []
    if (Array.isArray(input)) return input

    if (typeof input === 'object') {
        if (Array.isArray(input.waypoints)) return input.waypoints
        if (Array.isArray(input.points)) return input.points
        if (Array.isArray(input.data)) return input.data
    }

    return []
}

export function WaypointVisualizer({ waypointsFile, lineColor = 'cyan' }) {
    const [waypoints, setWaypoints] = useState([])
    const [isVisible, setIsVisible] = useState(true)

    // Carica waypoints dal file JSON o da un percorso
    useEffect(() => {
        let isCancelled = false

        if (!waypointsFile) {
            setWaypoints([])
            return () => {
                isCancelled = true
            }
        }

        const inlineWaypoints = normalizeWaypoints(waypointsFile)
        if (inlineWaypoints.length > 0) {
            setWaypoints(inlineWaypoints)
            return () => {
                isCancelled = true
            }
        }

        if (waypointsFile instanceof Blob || waypointsFile instanceof File) {
            // Se è un File/Blob, usa FileReader
            const reader = new FileReader()
            reader.onload = (e) => {
                if (isCancelled) return

                try {
                    const data = JSON.parse(e.target.result)
                    setWaypoints(normalizeWaypoints(data))
                } catch (error) {
                    console.error('Errore nel parsing del JSON:', error)
                    setWaypoints([])
                }
            }
            reader.readAsText(waypointsFile)
            return () => {
                isCancelled = true
            }
        }

        if (typeof waypointsFile === 'string') {
            fetch(waypointsFile)
                .then(res => res.json())
                .then(data => {
                    if (isCancelled) return

                    try {
                        setWaypoints(normalizeWaypoints(data))
                    } catch (error) {
                        console.error('Errore nel caricamento waypoints:', error)
                        setWaypoints([])
                    }
                })
                .catch(error => {
                    if (isCancelled) return
                    console.error('Errore nel caricamento waypoints:', error)
                    setWaypoints([])
                })

            return () => {
                isCancelled = true
            }
        }

        setWaypoints([])
        return () => {
            isCancelled = true
        }
    }, [waypointsFile])

    // Converti waypoints a Vector3 per la linea
    const linePoints = useMemo(() => {
        return waypoints.map(p => new THREE.Vector3(p.x, p.y + 0.5, p.z))
    }, [waypoints])

    const waypointColors = useMemo(() => {
        if (waypoints.length === 0) return []
        if (waypoints.length === 1) return ['#00ffff']

        return waypoints.map((_, idx) => {
            if (idx === 0) return '#00ff66'
            if (idx === waypoints.length - 1) return '#ff3355'

            const t = idx / (waypoints.length - 1)
            const color = new THREE.Color()
            color.setHSL(t, 0.95, 0.55)
            return `#${color.getHexString()}`
        })
    }, [waypoints])

    if (waypoints.length === 0) return null

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
                }} onClick={() => setIsVisible(prev => !prev)}>
                    TRACK: {waypoints.length} waypoints<br/>
                    (Click to {isVisible ? 'hide' : 'show'})
                </div>
            </Html>

            {/* LINEA DEL PERCORSO */}
            {isVisible && linePoints.length > 1 && (
                <Line
                    points={linePoints}
                    color={lineColor}
                    lineWidth={10}
                    dashed={false}
                />
            )}

            {/* SFERE AI WAYPOINT */}
            {isVisible && waypoints.map((wp, idx) => (
                <Sphere key={idx} position={[wp.x, wp.y + 0.3, wp.z]} args={[0.2, 8, 8]}>
                    <meshBasicMaterial color={waypointColors[idx]} />
                </Sphere>
            ))}
        </group>
    )
}