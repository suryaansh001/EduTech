import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socketConfig = {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
};

let socket = null;

export const getSocket = (token) => {
    if (!socket && token) {
        socket = io(SOCKET_URL, {
            ...socketConfig,
            auth: { token },
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
