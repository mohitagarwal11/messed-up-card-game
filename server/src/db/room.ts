import sql from './client';
import generateRoomCode from '../utils/generateRoomCode';

export async function createRoom(data: {
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  totalRounds: number;
  hostId?: string | null;
}) {
  // duplicate check not rly req now but did it for future
  let code: string = '';

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
      ${data.hostId ?? null},
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
      r.id,
      r.code,
      r.name,
      r.max_players,
      r.total_rounds,
      r.created_at,
      COUNT(rp.id)::int AS player_count
    FROM rooms r
    LEFT JOIN room_players rp
      ON rp.room_id = r.id AND rp.status = 'active'
    WHERE r.is_private = false
      AND r.status = 'waiting'
    GROUP BY r.id
    ORDER BY r.created_at DESC
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

    // Check for existing player (case-insensitive)
    const [existing] = await tx`
      SELECT *
      FROM room_players
      WHERE room_id = ${room.id}
        AND LOWER(guest_name) = LOWER(${playerName})
    `;

    if (existing) {
      if (existing.status === 'active') {
        return { player: existing, roomId: room.id };
      }
      if (existing.status === 'disconnected') {
        const [updated] = await tx`
          UPDATE room_players
          SET status = 'active'
          WHERE id = ${existing.id}
          RETURNING *
        `;
        return { player: updated, roomId: room.id };
      }
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
      host_id         AS "hostId",
      code,
      name,
      is_private      AS "isPrivate",
      max_players     AS "maxPlayers",
      total_rounds    AS "totalRounds",
      status,
      current_round   AS "currentRound"
    FROM rooms
    WHERE code = ${roomCode}
  `;

  if (!room) throw new Error('Room not found');

  const players = await sql`
    SELECT
      id,
      guest_name              AS "name",
      score,
      status,
      (joined_at = MIN(joined_at) OVER ()) AS "isHost"
    FROM room_players
    WHERE room_id = ${room.id}
      AND status = 'active'
    ORDER BY joined_at ASC
  `;

  return { ...room, players };
}

// Leave room function
export async function leaveRoom(roomCode: string, playerId: string) {
  await sql.begin(async (tx) => {
    // Get room id
    const [room] = await tx`
      SELECT id FROM rooms WHERE code = ${roomCode}
    `;
    if (!room) {
      // Room may already be deleted
      return;
    }

    const roomId = room.id;

    // Get earliest-joined active player
    const [earliest] = await tx`
      SELECT id FROM room_players
      WHERE room_id = ${roomId} AND status = 'active'
      ORDER BY joined_at ASC
      LIMIT 1
    `;

    if (earliest && earliest.id === playerId) {
      // Host leaving, delete room (cascade deletes players)
      await tx`DELETE FROM rooms WHERE id = ${roomId}`;
    } else {
      // Update player status to disconnected
      await tx`
        UPDATE room_players
        SET status = 'disconnected'
        WHERE id = ${playerId}
      `;
    }
  });
}

// Start game function
export async function startGame(roomCode: string) {
  // Get the room
  const room = await getRoomByCode(roomCode);

  // Pick a random black card
  const [blackCard] = await sql`
    SELECT id, text, pick
    FROM cards
    WHERE color = 'black'
    ORDER BY RANDOM()
    LIMIT 1
  `;

  // Insert a new round
  const [round] = await sql`
    INSERT INTO rounds (room_id, round_number, black_card_id, phase)
    VALUES (${room.id}, 1, ${blackCard.id}, 'submitting')
    RETURNING id
  `;
  const roundId = round.id;

  // Get all active players in the room
  const players = await sql`
    SELECT id
    FROM room_players
    WHERE room_id = ${room.id}
      AND status = 'active'
  `;

  // For each player, assign 7 random white cards
  for (const player of players) {
    await sql`
      INSERT INTO player_hands (room_player_id, card_id, is_played)
      SELECT ${player.id}, id, false
      FROM cards
      WHERE color = 'white'
      ORDER BY RANDOM()
      LIMIT 7
    `;
  }
  return { blackCard, roundId };
}
