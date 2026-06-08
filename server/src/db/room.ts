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

  if (!room) {
    throw new Error('Room could not be created');
  }

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

export async function getRoomByCode(roomCode: string) {
  // console.log('SEARCHING FOR:', roomCode);

  const [room] = await sql`
    SELECT *
    FROM rooms
    WHERE code = ${roomCode}
  `;

  if (!room) {
    throw new Error('Room not found');
  }

  // console.log('ROOM:', room);

  return room;
}

export async function joinRoom(roomCode: string, playerName: string) {
  return await sql.begin(async (tx) => {
    const [room] = await tx`
      SELECT id, status, max_players
      FROM rooms
      WHERE code = ${roomCode}
      FOR UPDATE
    `;

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already started');
    }

    const [playerCount] = await tx`
      SELECT COUNT(*)::int AS count
      FROM room_players
      WHERE room_id = ${room.id}
        AND status = 'active'
    `;

    if (playerCount.count >= room.max_players) {
      throw new Error('Room is full');
    }

    const [player] = await tx`
      INSERT INTO room_players
      (
        room_id,
        guest_name,
        score,
        status
      )
      VALUES
      (
        ${room.id},
        ${playerName},
        0,
        'active'
      )
      RETURNING *
    `;

    return { player, roomId: room.id };
  });
}

export async function getRoomPlayers(roomId: string) {
  return await sql`
    SELECT *
    FROM room_players
    WHERE room_id = ${roomId}
      AND status = 'active'
    ORDER BY joined_at ASC
  `;
}

export async function getLobbyState(roomCode: string) {
  const [room] = await sql`
    SELECT
      id,
      name,
      code,
      status,
      max_players AS "maxPlayers"
    FROM rooms
    WHERE code = ${roomCode}
  `;

  if (!room) {
    throw new Error('Room not found');
  }

  const players = await sql`
    SELECT
      id,
      guest_name,
      score
    FROM room_players
    WHERE room_id = ${room.id}
      AND status = 'active'
    ORDER BY joined_at ASC
  `;

  return {
    room,
    players,
  };
}
