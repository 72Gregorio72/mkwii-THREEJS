import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';

export const NetworkManager = ({ socket, playerRef, setOpponents, roomId, character, vehicle, setItems, opponentsDataRef, setRemoteBots, isHost }) => {
    const [ping, setPing] = useState(0);
    
    
    // 2. Tell the server who we are when we join/load
    useEffect(() => {
        if (!socket || !character || !vehicle) return;
        socket.emit('set_details', {
            charId: character.id,
            vehicleId: vehicle.id
        });
    }, [socket, character?.id, vehicle?.id]);

    const lastSendTime = useRef(0);

    // Gestione Ping (Opzionale)
    useEffect(() => {
    // Gestione Ping (Opzionale)
    useEffect(() => {
        if (!socket) return;
        const interval = setInterval(() => {
            const start = Date.now();
            socket.emit('ping'); 
            socket.once('pong', () => setPing(Date.now() - start));
        }, 2000); 
            socket.emit('ping'); 
            socket.once('pong', () => setPing(Date.now() - start));
        }, 2000); 
        return () => {
            clearInterval(interval);
            socket.off('pong');
        };
    }, [socket]);

    // Invio dati movimento
    useFrame(({ clock }) => {
        if (!playerRef.current || !socket) return;
        const now = clock.getElapsedTime();
        if (now - lastSendTime.current < 0.033) return; 
        lastSendTime.current = now;
    // Invio dati movimento
    useFrame(({ clock }) => {
        if (!playerRef.current || !socket) return;
        const now = clock.getElapsedTime();
        if (now - lastSendTime.current < 0.033) return; 
        lastSendTime.current = now;

        try {
            const pos = playerRef.current.translation(); 
            const rot = playerRef.current.rotation();
            const inputState = playerRef.current.getInputState?.() || { steer: 0, drift: 0, speed: 0, driftLevel: 0 };
            const effectState = playerRef.current.getEffectState?.() || { isBulletBill: false };

            socket.emit('move_kart', {
                x: pos.x, y: pos.y, z: pos.z,
                rotation: rot,
                steer: inputState.steer,
                drift: inputState.drift,
                speed: inputState.speed,
                driftLevel: inputState.driftLevel,
                effects: effectState,
            });
        } catch (error) { }
    });

    // Ref per tracciare la "firma" della configurazione della stanza (chi c'è e chi sono)
    const rosterSignature = useRef("");

    useEffect(() => {
        if (!socket) return;
    // Ref per tracciare la "firma" della configurazione della stanza (chi c'è e chi sono)
    const rosterSignature = useRef("");

    useEffect(() => {
        if (!socket) return;

        const onWorldUpdate = (data) => {
            const allPlayers = data.players || [];
            const others = allPlayers.filter(p => p.id !== socket.id);
            
            // 1. Aggiorna sempre i dati fisici/posizionali nel Ref (per il loop di gioco fluido)
            others.forEach(p => {
                opponentsDataRef.current[p.id] = p;
            });

            // 3. FIX: Controllo se la composizione o i DETTAGLI dei giocatori sono cambiati
            // Creiamo una stringa unica che rappresenta ID + Personaggio + Veicolo di tutti
            const currentSignature = others
                .map(p => `${p.id}:${p.charId}:${p.vehicleId}`)
                .sort()
                .join('|');

            // Se la firma è diversa da quella salvata (es. qualcuno ha caricato la skin), aggiorniamo lo stato React
            if (currentSignature !== rosterSignature.current) {
                console.log("Roster update detected:", currentSignature);
                rosterSignature.current = currentSignature;
                setOpponents(others);
            }
        };

        const onItemSpawned = (newItem) => {
            const isMine = newItem.ownerId === socket.id;
            setItems(prev => {
                if (prev.find(i => i.id === newItem.id)) return prev;
                return [...prev, { ...newItem, isLocal: isMine }];
            });
        };
        const onItemSpawned = (newItem) => {
            const isMine = newItem.ownerId === socket.id;
            setItems(prev => {
                if (prev.find(i => i.id === newItem.id)) return prev;
                return [...prev, { ...newItem, isLocal: isMine }];
            });
        };

        const onItemRemoved = ({ itemId }) => {
            setItems(prev => prev.filter(i => i.id !== itemId));
        };
        const onItemRemoved = ({ itemId }) => {
            setItems(prev => prev.filter(i => i.id !== itemId));
        };

        const handleRemoteHit = (data) => {
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: data.victimId, type: data.type } 
            }));
        };
        const handleRemoteHit = (data) => {
            window.dispatchEvent(new CustomEvent('banana-hit', { 
                detail: { victimId: data.victimId, type: data.type } 
            }));
        };

        socket.on('banana-hit', handleRemoteHit);
        socket.on('world_update', onWorldUpdate);
        socket.on('item_spawned', onItemSpawned);
        socket.on('item_removed', onItemRemoved);
        socket.on('banana-hit', handleRemoteHit);
        socket.on('world_update', onWorldUpdate);
        socket.on('item_spawned', onItemSpawned);
        socket.on('item_removed', onItemRemoved);

        return () => {
            socket.off('world_update', onWorldUpdate);
            socket.off('item_spawned', onItemSpawned);
            socket.off('item_removed', onItemRemoved);
            socket.off('banana-hit', handleRemoteHit);
        };
    }, [socket, setOpponents, setItems, opponentsDataRef, isHost, setRemoteBots]);

    return null;
        return () => {
            socket.off('world_update', onWorldUpdate);
            socket.off('item_spawned', onItemSpawned);
            socket.off('item_removed', onItemRemoved);
            socket.off('banana-hit', handleRemoteHit);
        };
    }, [socket, setOpponents, setItems, opponentsDataRef, isHost, setRemoteBots]);

    return null;
};