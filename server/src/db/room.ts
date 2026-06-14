import sql from './client';
import generateRoomCode from '../utils/generateRoomCode';
import type { Player } from '@shared/types';

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

export async function deleteRoom(roomCode: string) {
  await sql`DELETE FROM rooms WHERE code = ${roomCode}`;
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
      host_id,
      code,
      name,
      is_private,
      max_players,
      total_rounds,
      status,
      current_round
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

export async function leaveRoom(roomCode: string, playerId: string) {
  return await sql.begin(async (tx) => {
    // Get room id and status
    const [room] = await tx`
      SELECT id, status FROM rooms WHERE code = ${roomCode}`;
    if (!room) {
      // Room may already be deleted
      return { playerCount: 0, wasReset: false };
    }

    const roomId = room.id;
    const roomStatus = room.status;

    // Determine earliest active player before deletion (host)
    const [earliest] = await tx`
      SELECT id FROM room_players
      WHERE room_id = ${roomId} AND status = 'active'
      ORDER BY joined_at ASC
      LIMIT 1`;

    // Delete the leaving player's row (cascade deletes related data)
    await tx`DELETE FROM room_players WHERE id = ${playerId}`;

    // If the leaving player was the host, transfer host to next earliest active player
    if (earliest && earliest.id === playerId) {
      const [newHost] = await tx`
        SELECT id FROM room_players
        WHERE room_id = ${roomId} AND status = 'active'
        ORDER BY joined_at ASC
        LIMIT 1`;
      await tx`UPDATE rooms SET host_id = ${newHost ? newHost.id : null} WHERE id = ${roomId}`;
    }

    // Count remaining active players
    const [countRow] = await tx`
      SELECT COUNT(*)::int AS count
      FROM room_players
      WHERE room_id = ${roomId} AND status = 'active'`;
    const playerCount = countRow.count;

    let wasReset = false;

    if (playerCount === 0) {
      // Delete the room entirely
      await tx`DELETE FROM rooms WHERE id = ${roomId}`;
    } else if (roomStatus === 'in_progress' && playerCount < 3) {
      // Reset the room if in progress and too few players
      await resetRoom(roomCode);
      wasReset = true;
    }

    return { playerCount, wasReset };
  });
}

// Reset a room to waiting state, clear rounds and player hands
export async function resetRoom(roomCode: string) {
  await sql.begin(async (tx) => {
    const [room] = await tx`SELECT id FROM rooms WHERE code = ${roomCode}`;
    if (!room) return;
    const roomId = room.id;
    // Reset room status and round counter
    await tx`UPDATE rooms SET status = 'waiting', current_round = 0 WHERE id = ${roomId}`;
    // Delete all rounds (cascades submissions, votes, round_winners)
    await tx`DELETE FROM rounds WHERE room_id = ${roomId}`;
    // Delete all player hands for active players in this room
    await tx`
      DELETE FROM player_hands
      WHERE room_player_id IN (
        SELECT id FROM room_players WHERE room_id = ${roomId} AND status = 'active'
      )`;
  });
}

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
  await sql`
    UPDATE rooms SET current_round = 1 WHERE id = ${room.id}
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

export async function getGameState(roomCode: string, playerId: string) {
  const room = await getRoomByCode(roomCode);

  // Fetch the latest round for the room
  const [round] = await sql`
    SELECT id, black_card_id AS "blackCardId", phase, round_number AS "roundNumber"
    FROM rounds
    WHERE room_id = ${room.id}
    ORDER BY round_number DESC
    LIMIT 1
  `;

  if (!round) {
    throw new Error('Round not found');
  }

  // Fetch the black card for the round
  const [blackCard] = await sql`
    SELECT id, text, pick
    FROM cards
    WHERE id = ${round.blackCardId}
  `;

  // Fetch the player's hand (unplayed cards)
  const hand = await sql`
    SELECT c.id, c.text, c.pick
    FROM player_hands ph
    JOIN cards c ON c.id = ph.card_id
    WHERE ph.room_player_id = ${playerId}
      AND ph.is_played = false
  `;

  return { round, blackCard, hand, totalRounds: room.total_rounds };
}

// Submit a card for a round and mark it as played for that player
export async function submitCard(
  roundId: string,
  playerId: string,
  cardId: number,
): Promise<number> {
  return await sql.begin(async (tx) => {
    await tx`
      INSERT INTO submissions (round_id, room_player_id, card_id)
      VALUES (${roundId}, ${playerId}, ${cardId})
    `;
    await tx`
      UPDATE player_hands
      SET is_played = true
      WHERE room_player_id = ${playerId}
        AND card_id = ${cardId}
    `;
    const [result] = await tx`
      SELECT COUNT(*)::int AS count
      FROM submissions
      WHERE round_id = ${roundId}
    `;
    return result.count;
  });
}

// Deal a new random white card to a player
export async function dealNewCard(playerId: string): Promise<void> {
  // Get all card IDs the player has ever held
  const heldRows = await sql`
    SELECT card_id FROM player_hands
    WHERE room_player_id = ${playerId}
  `;
  const heldIds = heldRows.map((row: any) => row.card_id);
  // Select a random white card not already held, if possible
  const [card] = await sql`
    SELECT id FROM cards
    WHERE color = 'white'
    ${heldIds.length > 0 ? sql`AND id != ALL(${heldIds})` : sql``}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  let cardId: number;
  if (card) {
    cardId = card.id;
  } else {
    // All cards exhausted, pick any random white card
    const [fallback] = await sql`
      SELECT id FROM cards
      WHERE color = 'white'
      ORDER BY RANDOM()
      LIMIT 1
    `;
    if (!fallback) throw new Error('No white cards available');
    cardId = fallback.id;
  }
  // Insert the new card into the player's hand
  await sql`
    INSERT INTO player_hands (room_player_id, card_id, is_played)
    VALUES (${playerId}, ${cardId}, false)
  `;
}

// Cast a vote for a submission in a round
export async function castVote(
  roundId: string,
  voterId: string,
  submissionId: string,
): Promise<number> {
  return await sql.begin(async (tx) => {
    await tx`
      INSERT INTO votes (round_id, voter_id, submission_id)
      VALUES (${roundId}, ${voterId}, ${submissionId})
    `;
    const [result] = await tx`
      SELECT COUNT(*)::int AS count
      FROM votes
      WHERE round_id = ${roundId}
    `;
    return result.count;
  });
}

// Resolve a round: determine winners, update scores, deal new cards, advance round
export async function resolveRound(
  roomCode: string,
  roundId: string,
): Promise<{ winners: string[]; players: Player[]; isGameOver: boolean }> {
  const voteCounts = await sql`
    SELECT submission_id, COUNT(*)::int AS count
    FROM votes
    WHERE round_id = ${roundId}
    GROUP BY submission_id
  `;

  let maxCount = 0;
  for (const row of voteCounts) {
    if (row.count > maxCount) maxCount = row.count;
  }

  const winningSubmissionIds = voteCounts
    .filter((row) => row.count === maxCount)
    .map((row) => row.submission_id);

  let winnerPlayerIds: string[] = [];

  await sql.begin(async (tx) => {
    if (winningSubmissionIds.length > 0) {
      const winningSubs = await tx`
        SELECT room_player_id FROM submissions
        WHERE id = ANY(${winningSubmissionIds})
      `;
      winnerPlayerIds = winningSubs.map((row) => row.room_player_id);

      for (const playerId of winnerPlayerIds) {
        await tx`
          INSERT INTO round_winners (round_id, room_player_id, vote_count)
          VALUES (${roundId}, ${playerId}, ${maxCount})
        `;
      }

      await tx`
        UPDATE room_players
        SET score = score + 1
        WHERE id = ANY(${winnerPlayerIds})
      `;
    }

    await tx`
      UPDATE rooms
      SET current_round = current_round + 1
      WHERE code = ${roomCode}
    `;
  });

  const activePlayers = await sql`
    SELECT id FROM room_players
    WHERE room_id = (SELECT id FROM rooms WHERE code = ${roomCode})
      AND status = 'active'
  `;
  for (const p of activePlayers) {
    await dealNewCard(p.id);
  }

  const [room] = await sql`
    SELECT current_round, total_rounds FROM rooms WHERE code = ${roomCode}
  `;
  const isGameOver = room.current_round > room.total_rounds;

  if (isGameOver) {
    await sql`UPDATE rooms SET status = 'finished' WHERE code = ${roomCode}`;
  }

  const lobby = await getLobbyState(roomCode);
  const players: Player[] = lobby.players.map((p: any) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    status: p.status,
    isHost: p.isHost,
  }));

  return { winners: winnerPlayerIds, players, isGameOver };
}
