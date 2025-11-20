import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5001';

// 🛠️ FIX: Set to TRUE. 
// This creates ONE stable connection that stays alive as you navigate pages.
const socket = io(SOCKET_SERVER_URL, {
    autoConnect: true, 
    reconnection: true,       // Keep trying if internet drops
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;