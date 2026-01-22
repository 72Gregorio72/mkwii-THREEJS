import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';

export const NetworkManager = ({ socket, playerRef, setOpponents, roomId, character, vehicle }) => {
    
    // 2. Tell the server who we are when we join/load
    useEffect(() => {
        if (!socket || !character || !vehicle) return;
        console.log("Sending player details to server:", character.id, vehicle.id);
        socket.emit('set_details', {
            charId: character.id,
            vehicleId: vehicle.id
        });
    }, [socket, character, vehicle]);

    // 3. SEND: Update server with my position every frame
    useFrame(({ clock }) => {
        if (!playerRef.current || !socket) return;

        // Recupera dati fisici
        const pos = playerRef.current.translation(); 
        const rot = playerRef.current.rotation(); 
        
        // Recupera input (Sterzo/Drift)
        const inputState = playerRef.current.getInputState 
            ? playerRef.current.getInputState() 
            : { steer: 0, drift: 0 };

        // --- NEW: Recupera effetti (Bullet Bill, Star, etc.) ---
        // Assicurati che OutsideDriftKart abbia esposto questa funzione!
        const effectState = playerRef.current.getEffectState
            ? playerRef.current.getEffectState()
            : { isBulletBill: false, isStar: false, isMega: false, isSmall: false, isSpinning: false };

        if (pos && rot) {
            socket.emit('move_kart', {
                x: pos.x, 
                y: pos.y, 
                z: pos.z,
                rotation: rot,
                steer: inputState.steer,
                drift: inputState.drift,
                // Invia l'oggetto effetti intero
                effects: effectState 
            });
        }
    });

    // 4. RECEIVE: Listen for other players 
    useEffect(() => {
        if (!socket) return;
        socket.on('world_update', (serverPlayers) => {
            const others = serverPlayers.filter(p => p.id !== socket.id);
            setOpponents(others);
        });
        return () => {
            socket.off('world_update');
        };
    }, [socket, setOpponents]);

    useEffect(() => {
        if (!socket) return;

        const handleSocketHit = (payload) => {
            console.log("Socket received hit:", payload);
            
            // Dispatch to Window so RemoteOpponent (Visuals) and Player (Physics) can hear it
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: payload 
            }));
        };

        socket.on('banana-hit', handleSocketHit);

        return () => {
            socket.off('banana-hit', handleSocketHit);
        };
    }, [socket]);

    return null;
};