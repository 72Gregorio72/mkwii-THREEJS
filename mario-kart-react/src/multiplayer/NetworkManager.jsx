import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';

export const NetworkManager = ({ socket, playerRef, setOpponents, roomId, character, vehicle, setItems, opponentsDataRef }) => {
    const [ping, setPing] = useState(0);
    // 2. Tell the server who we are when we join/load
    useEffect(() => {
        if (!socket || !character || !vehicle) return;
        console.log("Sending player details to server:", character.id, vehicle.id);
        socket.emit('set_details', {
            charId: character.id,
            vehicleId: vehicle.id
        });
    }, [socket, character, vehicle]);

    const lastSendTime = useRef(0);

	useEffect(() => {
        if (!socket) return;

        const interval = setInterval(() => {
            const start = Date.now();
            socket.emit('ping');
            
            socket.once('pong', () => {
                setPing(Date.now() - start);
            });
        }, 2000); // Misura ogni 2 secondi per non intasare

        return () => {
            clearInterval(interval);
            socket.off('pong');
        };
    }, [socket]);

	// --- NetworkManager.jsx ---
	useFrame(({ clock }) => {
		if (!playerRef.current || !socket) return;

		const now = clock.getElapsedTime();
		// Invio a 30Hz è perfetto per un gioco di corse
		if (now - lastSendTime.current < 0.033) return; 
		lastSendTime.current = now;

		// PRENDI I DATI REALI DALLA FISICA LOCALE (L'AUTORITÀ)
		const pos = playerRef.current.translation(); 
		const rot = playerRef.current.rotation();
		
		const inputState = playerRef.current.getInputState?.() || { steer: 0, drift: 0 };
		const effectState = playerRef.current.getEffectState?.() || { isBulletBill: false };

		// IL CLIENT È SOVRANO: Manda la sua verità al server
		socket.emit('move_kart', {
			x: pos.x, 
			y: pos.y, 
			z: pos.z,
			rotation: rot, // Assicurati che sia l'oggetto {x,y,z,w}
			steer: inputState.steer,
			drift: inputState.drift,
			effects: effectState,
		});
	});

	// --- NetworkManager.jsx ---
	useEffect(() => {
		if (!socket) return;

		const onWorldUpdate = (data) => {
			const allPlayers = data.players || [];
			const others = allPlayers.filter(p => p.id !== socket.id);

			// 1. Aggiorna il REF (Dati per il movimento fluido senza re-render)
			others.forEach(p => {
				opponentsDataRef.current[p.id] = p;
			});

			// 2. Aggiorna lo STATO (Solo per dire a React QUALI componenti RemoteOpponent montare)
			// Usiamo un set di ID per evitare re-render inutili se i dati cambiano ma i giocatori sono gli stessi
			setOpponents(prev => {
				const newIds = others.map(o => o.id).join(',');
				const prevIds = prev.map(o => o.id).join(',');
				if (newIds === prevIds) return prev; // Se i giocatori sono gli stessi, non aggiornare lo stato
				return others;
			});

			if (data.items) setItems(data.items);
		};

		socket.on('world_update', onWorldUpdate);
		return () => socket.off('world_update', onWorldUpdate);
	}, [socket, setOpponents, setItems, opponentsDataRef]);

    return (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                color: ping > 100 ? '#ff4444' : '#00ff00',
                fontFamily: 'monospace',
                fontSize: '14px',
                background: 'rgba(0,0,0,0.5)',
                padding: '5px 10px',
                borderRadius: '5px'
            }}>
                PING: {ping}ms
            </div>
        </Html>
    );
};