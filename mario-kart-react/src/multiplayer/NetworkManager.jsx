import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';

export const NetworkManager = ({ socket, playerRef, setOpponents, roomId }) => {
    // 1. SEND: Update server with my position every frame
    useFrame(({ clock }) => {
        if (!playerRef.current || !socket) return;

        // We call the functions exposed by useImperativeHandle in OutsideDriftKart
        const pos = playerRef.current.translation(); 
        const rot = playerRef.current.rotation(); // This returns a Quaternion {x,y,z,w}

        if (pos && rot) {
            
            socket.emit('move_kart', {
                x: pos.x, 
                y: pos.y, 
                z: pos.z,
                rotation: rot // Send the whole quaternion
            });
        }
    });

    // 2. RECEIVE: Listen for other players 
    useEffect(() => {
        if (!socket) return;

        socket.on('world_update', (serverPlayers) => {
            // Filter out MY ID so I don't see a ghost of myself
            const others = serverPlayers.filter(p => p.id !== socket.id);
            setOpponents(others);
        });

        return () => {
            socket.off('world_update');
        };
    }, [socket, setOpponents]);

    return null;
};