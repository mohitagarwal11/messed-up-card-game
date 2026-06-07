import sql from './client';
import generateRoomCode from '../utils/generateRoomCode';

export default async function createRoom(data: {
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
