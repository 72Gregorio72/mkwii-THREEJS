import { io } from 'socket.io-client';

// Se sei su https://localhost:8443, questo diventa quell'URL
const SERVER_URL = `${window.location.protocol}//${window.location.host}`;

console.log('Connecting via Nginx to:', SERVER_URL);

export const socket = io(SERVER_URL, {
    path: '/socket.io/', // Default, ma meglio esplicitarlo
    transports: ['websocket'], // Forza websocket
    secure: true, // Usa WSS
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 20
});
