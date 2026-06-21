import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../../../shared/types';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001', {
  autoConnect: false,
});

export function ensureSocketConnected() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function joinSocketRoom(roomCode: string, playerId: string) {
  ensureSocketConnected();
  socket.emit('room:join', roomCode, playerId);
}

export function leaveSocketRoom(roomCode: string) {
  if (socket.connected) {
    socket.emit('room:leave', roomCode);
  }
}

export function resetSocketRoom(roomCode: string) {
  if (socket.connected) {
    socket.emit('room:reset', roomCode);
  }
}

export default socket;
