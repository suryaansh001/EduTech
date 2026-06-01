/**
 * Socket.io client utility
 * Manages real-time communication with backend
 */

import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Get or create Socket.io connection
 * @param {string} token - JWT authentication token
 * @returns {Socket} Socket.io client instance
 */
export function getSocket(token) {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(API_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    socket = null;
  });

  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected() {
  return socket && socket.connected;
}

export default {
  getSocket,
  disconnectSocket,
  isSocketConnected,
};
