import sql from './client';

export async function createGuestPlayer(roomId: string, guestName: string) {
  const [player] = await sql`
    INSERT INTO room_players
    (room_id, guest_name, score, status)
    VALUES
    (${roomId}, ${guestName}, 0, 'active')
    RETURNING id, guest_name AS name, score, status
  `;

  if (!player) throw new Error('Failed to create guest player');

  return player;
}

export async function getPlayerById(playerId: string) {
  const [player] = await sql`
    SELECT id, guest_name AS name, score, status
    FROM room_players
    WHERE id = ${playerId}
  `;

  return player ?? null;
}

export async function updatePlayerScore(playerId: string, score: number) {
  const [player] = await sql`
    UPDATE room_players
    SET score = ${score}
    WHERE id = ${playerId}
    RETURNING id, guest_name AS name, score, status
  `;

  return player ?? null;
}

export async function updatePlayerStatus(playerId: string, status: 'active' | 'disconnected') {
  const [player] = await sql`
    UPDATE room_players
    SET status = ${status}
    WHERE id = ${playerId}
    RETURNING id, guest_name AS name, score, status
  `;

  return player ?? null;
}
