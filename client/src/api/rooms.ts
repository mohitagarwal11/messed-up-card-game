import { client } from './client';

export async function createRoom(payload: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
}) {
  const response = await client.post('/rooms', payload);

  console.log(response);

  return response.data;
}

export async function getPublicRooms() {
  const response = await client.get('/rooms');

  console.log(response);

  return response.data;
}

export async function getRoomByCode(roomCode: string) {
  const response = await client.get(`/rooms/${roomCode}`);

  console.log(response);

  return response.data;
}
