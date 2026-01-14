import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BILL_SPEED = 85; // Molto veloce
const MIN_DURATION = 7.5;
const MAX_DURATION = 12.0;
const OVERTAKE_LIMIT = 5; // Termina dopo aver superato 5 avversari

export function useBulletBill({ rb, waypoints, currentRank, onEnd }) {
    const [isActive, setIsActive] = useState(false);
    
    // Refs per la logica
    const timer = useRef(0);
    const startRank = useRef(null); // Posizione al momento dell'attivazione
    const currentWpIndex = useRef(0);
    
    // Vettori riutilizzabili per non creare garbage collection
    const v = useRef({
        pos: new THREE.Vector3(),
        nextWp: new THREE.Vector3(),
        dir: new THREE.Vector3(),
    }).current;

    const activate = () => {
        if (!waypoints || waypoints.length === 0) return;
        
        setIsActive(true);
        timer.current = 0;
        startRank.current = currentRank; // Memorizza la posizione iniziale (es. 8°)
        
        // Trova il waypoint più vicino per iniziare subito nella direzione giusta
        // (Logica identica al Red Shell)
        if (rb.current) {
            const pos = rb.current.translation();
            let closestDist = Infinity;
            let closestIdx = 0;
            for(let i=0; i<waypoints.length; i++) {
                const d = (pos.x - waypoints[i].x)**2 + (pos.z - waypoints[i].z)**2;
                if(d < closestDist) { closestDist = d; closestIdx = i; }
            }
            currentWpIndex.current = (closestIdx + 1) % waypoints.length;
        }

        // Effetti sonori o particellari qui
        console.log("BULLET BILL ATTIVATO! Rank iniziale:", currentRank);
    };

    const deactivate = () => {
        setIsActive(false);
        if (onEnd) onEnd();
        console.log("BULLET BILL TERMINATO.");
    };

    useFrame((state, delta) => {
        if (!isActive || !rb.current) return;

        timer.current += delta;

        // 1. GESTIONE DURATA E SORPASSI
        const overtakes = (startRank.current || currentRank) - currentRank; // Es. Partito 8°, ora 3° -> 5 sorpassi
        const isLeader = currentRank === 1;

        // Condizioni di uscita:
        // A. Tempo massimo raggiunto
        if (timer.current >= MAX_DURATION) {
            deactivate();
            return;
        }
        // B. Tempo minimo trascorso E (target sorpassi raggiunto O siamo primi)
        if (timer.current >= MIN_DURATION) {
            if (overtakes >= OVERTAKE_LIMIT || isLeader) {
                deactivate();
                return;
            }
        }

        // 2. MOVIMENTO AUTOMATICO (Logica Red Shell)
        const currentPos = rb.current.translation();
        v.pos.set(currentPos.x, currentPos.y, currentPos.z);
        
        const targetWp = waypoints[currentWpIndex.current];
        v.nextWp.set(targetWp.x, v.pos.y, targetWp.z); // Mantieni altezza attuale

        // Distanza dal waypoint
        const dist = v.pos.distanceTo(v.nextWp);
        
        // Se vicino, passa al prossimo
        if (dist < 6.0) {
            currentWpIndex.current = (currentWpIndex.current + 1) % waypoints.length;
        }

        // Calcola direzione e velocità
        v.dir.subVectors(v.nextWp, v.pos).normalize();

        // 3. APPLICAZIONE FISICA
        // Sovrascriviamo totalmente la velocità. Niente drift, niente attrito.
        // Y = -5 per tenerlo incollato a terra
        rb.current.setLinvel({ 
            x: v.dir.x * BILL_SPEED, 
            y: -5.0, 
            z: v.dir.z * BILL_SPEED 
        }, true);

        // Rotazione: Facciamo guardare il Kart verso la direzione di marcia
        // Usiamo un lerp per non farlo scattare troppo bruscamente
        const targetRot = Math.atan2(v.dir.x, v.dir.z);
        const currentRot = rb.current.rotation(); 
        // Nota: convertire quaternione in Eulero se necessario, ma qui semplifichiamo forzando la rotazione Y visiva nel componente padre o usando slerp sul rigidbody se cinematico.
        // Per un dynamic body bloccato sulle rotazioni (come il kart), ruotiamo solo la mesh grafica solitamente, 
        // ma qui il Bullet Bill "guida" il rigidbody.
        
        // Approccio rapido rotazione fisica (poiché lockRotations è true nel kart):
        // Dobbiamo ruotare il CHASSIS visivo, non il rigidbody fisico se è lockato.
        // Ma il Bullet Bill deve sembrare che ruoti. Lo gestiremo nel return del hook o nel componente.
    });

    return { 
        isBulletBill: isActive, 
        activateBulletBill: activate 
    };
}