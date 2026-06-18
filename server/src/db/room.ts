import sql from './client';
import generateRoomCode from '../utils/generateRoomCode';
import type { RoomStatus } from '@shared/types';

export async function createRoom(data: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
  hostId: string;
}) {
  let code = '';

  for (let i = 0; i < 5; i++) {
    const candidate = generateRoomCode();
    const [existing] = await sql`SELECT id FROM rooms WHERE code = ${candidate}`;
    if (!existing) {
      code = candidate;
      break;
    }
  }

  if (!code) throw new Error('Failed to generate unique room code');

  const [room] = await sql`
    INSERT INTO rooms
    (
      code,
      name,
      is_private,
      max_players,
      total_rounds,
      host_id,
      status
    )
    VALUES
    (
      ${code},
      ${data.name},
      ${data.isPrivate},
      ${data.maxPlayers},
      ${data.totalRounds},
      ${data.hostId},
      'waiting'
    )
    RETURNING *
  `;

  if (!room) {
    throw new Error('Room could not be created');
  }

  return room;
}

export async function setRoomStatus(roomCode: string, status: RoomStatus): Promise<void> {
  await sql`UPDATE rooms SET status = ${status} WHERE code = ${roomCode}`;
}

export async function getRoomByCode(roomCode: string) {
  const [room] = await sql`
    SELECT *
    FROM rooms
    WHERE code = ${roomCode}
  `;

  if (!room) {
    throw new Error('Room not found');
  }

  return room;
}
