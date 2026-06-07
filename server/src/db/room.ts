import sql from './client';
import generateRoomCode from '../utils/generateRoomCode';

export async function createRoom(data: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
}) {
  const code = generateRoomCode();
  const [room] = await sql`
    INSERT INTO rooms
    (
      code,
      name,
      is_private,
      max_players,
      total_rounds,
      status
    )
    VALUES
    (
      ${code},
      ${data.name},
      ${data.isPrivate},
      ${data.maxPlayers},
      ${data.totalRounds},
      'waiting'
    )
    RETURNING *
  `;

  return room;
}

export async function getPublicRooms() {
  return await sql`
    SELECT
      id,
      code,
      name,
      max_players,
      total_rounds,
      created_at
    FROM rooms
    WHERE is_private = false
      AND status = 'waiting'
    ORDER BY created_at DESC
  `;
}

export async function getRoomById(roomId: string) {
  console.log('SEARCHING FOR:', roomId);

  const result = await sql`
    SELECT *
    FROM rooms
    WHERE id = ${roomId}
  `;

  const [room] = result;

  console.log('ROOM:', room);

  return room;
}
