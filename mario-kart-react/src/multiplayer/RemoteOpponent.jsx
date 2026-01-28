import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, MathUtils, Color } from 'three'; 
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { SkeletonUtils } from 'three-stdlib'; 

// Import Models
import { RacerModel } from '../models/RacerModel.jsx'; 
import { VehicleModel } from '../models/VehicleModel.jsx'; 

const PHYSICS_RADIUS = 1; 

export const RemoteOpponent = ({ playerId, opponentsDataRef, character, vehicle, userData, data }) => {
    const racerId = userData?.id || "player";
    const rb = useRef();
    const visualGroupRef = useRef();
    
    // Visual State Refs
    const isHitRef = useRef(false);
    const spinTimer = useRef(0);
    
    // Load Bullet Bill Model
    const { scene: billScene } = useGLTF('/items/BulletBill.glb');

    const billClone = useMemo(() => {
        const clone = SkeletonUtils.clone(billScene);
        clone.traverse((obj) => {
            if (obj.isMesh) {
                obj.frustumCulled = false;
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
        return clone;
    }, [billScene]);

	// Aggiungi questo ref per gestire la coda dei messaggi
const renderBuffer = useRef([]);

// Quando ricevi nuovi dati (tramite useEffect o prop), aggiungili al buffer
	useEffect(() => {
		renderBuffer.current.push({
			t: Date.now(),
			pos: new Vector3(data.x, data.y, data.z),
			rot: new Quaternion(
				data.rotation?.x ?? 0, 
				data.rotation?.y ?? 0, 
				data.rotation?.z ?? 0, 
				data.rotation?.w ?? 1
			)
		});
		
		// Mantieni il buffer corto (ultimi 10 pacchetti)
		if (renderBuffer.current.length > 10) renderBuffer.current.shift();
	}, [data]);

	// Aggiungi questi ref all'inizio del componente
	const INTERPOLATION_DELAY = 100; // ms di ritardo per assorbire i lag di rete

	useEffect(() => {
		// Inseriamo il pacchetto nel buffer con il timestamp di ricezione
		renderBuffer.current.push({
			t: Date.now(),
			pos: [data.x, data.y, data.z],
			rot: [
				data.rotation?.x ?? 0,
				data.rotation?.y ?? 0,
				data.rotation?.z ?? 0,
				data.rotation?.w ?? 1
			]
		});
		// Pulizia buffer vecchio
		if (renderBuffer.current.length > 20) renderBuffer.current.shift();
	}, [data]);

	useFrame((state, delta) => {
		if (!rb.current || renderBuffer.current.length < 2) return;

		const now = Date.now();
		const renderTime = now - INTERPOLATION_DELAY;

		// 1. Trova i due pacchetti tra cui interpolare
		let i = 0;
		for (; i < renderBuffer.current.length - 1; i++) {
			if (renderBuffer.current[i + 1].t > renderTime) break;
		}

		const b0 = renderBuffer.current[i];
		const b1 = renderBuffer.current[i + 1];

		if (b0 && b1 && b1.t !== b0.t) {
			// 2. Calcola il fattore di interpolazione (0 a 1)
			const alpha = (renderTime - b0.t) / (b1.t - b0.t);

			// Interpolazione Posizione
			const interpX = MathUtils.lerp(b0.pos[0], b1.pos[0], alpha);
			const interpY = MathUtils.lerp(b0.pos[1], b1.pos[1], alpha);
			const interpZ = MathUtils.lerp(b0.pos[2], b1.pos[2], alpha);

			// Interpolazione Rotazione
			const q0 = new Quaternion(...b0.rot);
			const q1 = new Quaternion(...b1.rot);
			q0.slerp(q1, alpha);

			// 3. Applica i dati (usa setNextKinematic per Rapier)
			rb.current.setNextKinematicTranslation({ x: interpX, y: interpY, z: interpZ });
			rb.current.setNextKinematicRotation(q0);
		}
	});

    // Destructure effects
    const { isBulletBill, isStar, isMega } = data.effects || {};

    // --- FIX: Store latest effects in a Ref so Event Listener can read them without re-rendering ---
    const latestEffects = useRef({ isBulletBill, isStar, isMega });
    useEffect(() => {
        latestEffects.current = { isBulletBill, isStar, isMega };
    }, [isBulletBill, isStar, isMega]);

    const isSmall = useRef(false);
    const smallTimer = useRef(null);

    const activateLightning = () => {
	isSmall.current = true;
	if (smallTimer.current) clearTimeout(smallTimer.current);
	
	// CORREZIONE: Chiama la funzione direttamente ()
	smallTimer.current = setTimeout(() => {
		deactivateLightning(); 
	}, 10000);     
	};

	const deactivateLightning = () => {
	isSmall.current = false;
	// Non serve resettare la scala qui, se ne occupa lo useFrame al prossimo frame
	};

    // --- 1. HANDLE STANDARD HITS (Banana/Shell/Bomb) ---
    useEffect(() => {
        const handleHit = (e) => {
            const victimId = e.detail?.victimId;
            const type = e.detail?.type || 'standard';

            // Check ID
            if (victimId === data.id) {
                // Check Invincibility using the REF (Always fresh)
                const { isBulletBill, isStar, isMega } = latestEffects.current;
                
                if (isBulletBill || isStar || isMega) return;

                console.log(`Remote opponent ${data.id} hit by ${type}`);
                isHitRef.current = true;
                spinTimer.current = 1.0; 
            }
        };

        window.addEventListener('banana-hit', handleHit);
        return () => window.removeEventListener('banana-hit', handleHit);
    }, [data.id]); // Run ONCE per ID change (practically once)


    // --- 2. HANDLE LIGHTNING STRIKE ---
    useEffect(() => {
		const handleLightningStrike = (e) => {
			const attackerId = e.detail?.attackerId;
			
			// 1. Se questo avversario remoto è l'attaccante, NON deve rimpicciolirsi
			if (data.id === attackerId) {
				return;
			}

			// 2. Controllo invincibilità (usando il Ref aggiornato)
			const { isBulletBill, isStar, isMega } = latestEffects.current;
			if (isBulletBill || isStar || isMega) return;

			const delay = Math.random() * 400; // Delay per stile MK
			setTimeout(() => {
				if (!rb.current) return;
				isHitRef.current = true;
				spinTimer.current = 1.0; 
				activateLightning();
			}, delay);
		};

		window.addEventListener('lightning-strike', handleLightningStrike);
		return () => window.removeEventListener('lightning-strike', handleLightningStrike);
	}, [data.id]);


    useFrame((state, delta) => {
        // LEGGIAMO I DATI DIRETTAMENTE DAL REF
        const serverData = opponentsDataRef.current[playerId];
        if (!serverData || !rb.current) return;

        // Aggiungiamo i dati al buffer di interpolazione
        renderBuffer.current.push({
            t: Date.now(),
            pos: [serverData.x, serverData.y, serverData.z],
            rot: [
                serverData.rotation?.x ?? 0,
                serverData.rotation?.y ?? 0,
                serverData.rotation?.z ?? 0,
                serverData.rotation?.w ?? 1
            ]
        });

        if (renderBuffer.current.length > 20) renderBuffer.current.shift();
        if (renderBuffer.current.length < 2) return;

        // --- LOGICA DI INTERPOLAZIONE (già presente nel tuo codice) ---
        const now = Date.now();
        const renderTime = now - INTERPOLATION_DELAY;
        let i = 0;
        for (; i < renderBuffer.current.length - 1; i++) {
            if (renderBuffer.current[i + 1].t > renderTime) break;
        }
        const b0 = renderBuffer.current[i];
        const b1 = renderBuffer.current[i + 1];

        if (b0 && b1 && b1.t !== b0.t) {
            const alpha = (renderTime - b0.t) / (b1.t - b0.t);
            const interpX = MathUtils.lerp(b0.pos[0], b1.pos[0], alpha);
            const interpY = MathUtils.lerp(b0.pos[1], b1.pos[1], alpha);
            const interpZ = MathUtils.lerp(b0.pos[2], b1.pos[2], alpha);
            const q0 = new Quaternion(...b0.rot);
            const q1 = new Quaternion(...b1.rot);
            q0.slerp(q1, alpha);

            rb.current.setNextKinematicTranslation({ x: interpX, y: interpY, z: interpZ });
            rb.current.setNextKinematicRotation(q0);
        }

        // --- B. VISUAL EFFECTS ---
        if (visualGroupRef.current) {
            if (isHitRef.current) {
                spinTimer.current -= delta;
                visualGroupRef.current.rotation.y += 25 * delta; 
                if (spinTimer.current <= 0) {
                    isHitRef.current = false;
                    visualGroupRef.current.rotation.y = 0; 
                }
            } else {
                visualGroupRef.current.rotation.y = MathUtils.lerp(visualGroupRef.current.rotation.y, 0, 10 * delta);
            }

            // Scale handling
            let targetScale = 1;
            if (isMega) targetScale = 2.5;
            else if (isSmall.current) targetScale = 0.5;
			else if (!isSmall.current && !isMega) targetScale = 1;

            const currentScale = visualGroupRef.current.scale.x;
            const smoothScale = MathUtils.lerp(currentScale, targetScale, delta * 5);
            visualGroupRef.current.scale.set(smoothScale, smoothScale, smoothScale);

            // Star Power
            if (isStar) {
                const time = state.clock.elapsedTime * 5;
                const rainbowColor = new Color().setHSL((time % 1), 1.0, 0.5);
                visualGroupRef.current.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (!child.userData.hasCloned) {
                            child.material = child.material.clone();
                            child.userData.hasCloned = true;
                        }
                        child.material.emissive.copy(rainbowColor);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            } else {
                visualGroupRef.current.traverse((child) => {
                    if (child.isMesh && child.material && child.userData.hasCloned) {
                        child.material.emissive.setHex(0x000000);
                    }
                });
            }
        }
    });

    return (
        <RigidBody 
            ref={rb} 
            type="kinematicPosition" 
            position={[data.x, data.y, data.z]} 
            colliders={false} 
            name="opponent"
            userData={{ 
                type: 'opponent', 
                id: data.id, 
                effects: { isBulletBill, isStar, isMega } 
            }}
        >
            <BallCollider args={[PHYSICS_RADIUS]} position={[0, 0, 0]} />
            <group ref={visualGroupRef} position={[0, -PHYSICS_RADIUS, 0]}>
                <group visible={!isBulletBill}>
                    <group position={vehicle.vehicleOffset || [0,0,0]}>
                        <VehicleModel 
                            vehicleConfig={vehicle.modelConfig} 
                            scale={1.4} rotation={[0, Math.PI, 0]} isBike={vehicle.isBike} speed={0} steer={data.steer || 0} drift={data.drift || 0} 
                        />
                        <group rotation={[0, Math.PI, 0]}>
                            <RacerModel
                                isInMenu={false} isRemote={true} characterConfig={character.modelConfig} vehicleConfig={vehicle} isKart={true} steer={data.steer || 0} drift={data.drift || 0} scale={1.5} speed={0} key={vehicle.name + "_racer"}
                            />
                        </group>
                    </group>
                </group>
                <group visible={isBulletBill} scale={2.5} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]}>
                    <primitive object={billClone} />
                </group>
            </group>
        </RigidBody>
    );
}