import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';

// 1. Add character and vehicle to props
export const NetworkManager = ({ socket, playerRef, setOpponents, roomId, character, vehicle }) => {
    
    // --- NEW CODE START ---
    // 2. Tell the server who we are when we join/load
    useEffect(() => {
        if (!socket || !character || !vehicle) return;

        console.log("Sending player details to server:", character.id, vehicle.id);

        socket.emit('set_details', {
            charId: character.id,
            vehicleId: vehicle.id
        });
        
    }, [socket, character, vehicle]);
    // --- NEW CODE END ---

    // 3. SEND: Update server with my position every frame
    useFrame(({ clock }) => {
        if (!playerRef.current || !socket) return;

        const pos = playerRef.current.translation(); 
        const rot = playerRef.current.rotation(); 
        const inputState = playerRef.current.getInputState 
            ? playerRef.current.getInputState() 
            : { steer: 0, drift: 0 };

        if (pos && rot) {
            socket.emit('move_kart', {
                x: pos.x, 
                y: pos.y, 
                z: pos.z,
                rotation: rot,
                steer: inputState.steer,
                drift: inputState.drift,
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

    return null;
};