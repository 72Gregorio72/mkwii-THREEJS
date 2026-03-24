import { io } from 'socket.io-client';

const SERVER_URL = `${window.location.protocol}//${window.location.host}`;
console.log('Connecting via Nginx to:', SERVER_URL);

export const socket = io(SERVER_URL, {
    auth: (cb) => {
        // Questa funzione viene chiamata da Socket.io ESATTAMENTE un istante prima di connettersi --> il token è sempre aggiornato
        const token = sessionStorage.getItem('accessToken');
        cb({ token: token }); 
    },
    path: '/socket.io/', 
    transports: ['websocket'], 
    secure: true, 
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 20
});