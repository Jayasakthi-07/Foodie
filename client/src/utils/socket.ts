import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
  const { accessToken, isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated || !accessToken) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: {
      token: accessToken,
    },
    transports: ['websocket'],
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

