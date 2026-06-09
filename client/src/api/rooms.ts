import { client } from './client';

export async function createRoom(payload: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
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
