import { io } from 'socket.io-client';


// multiplayer
const protocol = window.location.protocol; // 'http:' or 'https:'
const hostname = window.location.hostname; // 'localhost' or '192.168.X.X'
const port = 3000; // Your backend port

// 2. Construct the URL dynamically
const SERVER_URL = `${protocol}//${hostname}:${port}`;

console.log('Connecting to Server at:', SERVER_URL);

// 3. Connect
export const socket = io(SERVER_URL, {
    transports: ['websocket'],
    secure: true, 
    rejectUnauthorized: false
});