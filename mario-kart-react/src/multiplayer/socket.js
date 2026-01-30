import { io } from 'socket.io-client';

// Poiché Nginx fa da proxy, l'URL è lo stesso da cui viene servito il frontend
// Se sei su https://localhost, il socket deve puntare a https://localhost
const SERVER_URL = `${window.location.protocol}//${window.location.hostname}`;

console.log('Connecting via Nginx Proxy to:', SERVER_URL);

export const socket = io(SERVER_URL, {
    // Rimuovi la porta 3000! Nginx gestisce lo smistamento sulla 443
    transports: ['websocket', 'polling'], // È meglio lasciare polling come fallback
    withCredentials: true,
    // Con Nginx, 'secure' viene ereditato dal protocollo della pagina
    rejectUnauthorized: false // Ancora necessario finché usi certificati self-signed (mkcert)
});