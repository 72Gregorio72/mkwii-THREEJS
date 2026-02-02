import { io } from 'socket.io-client';

// window.location.host include la porta (es. localhost:8443)
// window.location.hostname include solo il dominio (es. localhost)
const SERVER_URL = `${window.location.protocol}//${window.location.host}`;

console.log('Connecting via Nginx Proxy to:', SERVER_URL);

export const socket = io(SERVER_URL, {
    transports: ['websocket'],
	upgrade: false, 
    withCredentials: true,
    rejectUnauthorized: false,
	secure: true,
    // Opzionale: riconnessione più aggressiva
    reconnection: true,
    reconnectionAttempts: 10
});

//https://localhost:8443/socket.io/?EIO=4&transport=websocket