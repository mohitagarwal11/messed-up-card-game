import { client } from './client';

export async function createRoom(payload: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
  playerName: string;
  hostId: string;
}) {
  const response = await client.post('/rooms', payload);
  return response.data;
}

export async function getPublicRooms() {
  const response = await client.get('/rooms');
  return response.data;
}

export async function getRoomByCode(roomCode: string) {
  const response = await client.get(`/rooms/${roomCode}`);
  return response.data;
}

export async function getLobbyState(roomCode: string) {
  const response = await client.get(`/rooms/${roomCode}/lobby`);
  return response.data;
}

export async function joinRoom(roomCode: string, playerName: string) {
  const response = await client.post(`/rooms/${roomCode}/join`, { playerName });
  return response.data;
}

export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
  await client.post(`/rooms/${roomCode}/leave`, { playerId });
}

export async function resetRoom(roomCode: string) {
  await client.post(`/rooms/${roomCode}/reset`);
}

export async function getGameState(roomCode: string, playerId: string) {
  const response = await client.get(`/rooms/${roomCode}/game-state`, {
    params: { playerId },
  });
  return response.data;
}
