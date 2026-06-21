import { randomUUID } from 'crypto';
import type {
  Room,
  Player,
  Card,
  Submission,
  RoundState,
  GameState,
  RoomCacheEntry,
  RoundResult,
} from '../../../shared/types';
import {
  getWhiteCard,
  pickRandomBlackCard,
  pickRandomWhiteCard,
  pickRandomWhiteCardIds,
} from '../data/cards';
import { io } from '../index';
import {
  RESULTS_DURATION_MS,
  SUBMIT_DURATION_MS,
  VOTE_DURATION_MS,
} from '../../../shared/constants';

export const roomCache = new Map<string, RoomCacheEntry>();
const HAND_SIZE = 6;

export type DbRoomRow = {
  id: string;
  host_id: string;
  code: string;
  name: string;
  is_private: boolean;
  max_players: number;
  total_rounds: number;
  status: Room['status'];
};

function requireRound(entry: RoomCacheEntry): RoundState {
  if (!entry.round) throw new Error('No active round in cache');
  return entry.round;
}

function getActivePlayers(entry: RoomCacheEntry): Player[] {
  return entry.room.players.filter((player) => player.status === 'active');
}

function dealFreshHand(): Card[] {
  const cardIds = pickRandomWhiteCardIds(HAND_SIZE);
  return cardIds.map((id) => getWhiteCard(id));
}

function buildRoom(entry: RoomCacheEntry): Room {
  const { room } = entry;
  return {
    ...room,
    current_round: entry.round?.roundNumber ?? 0,
    players: [...room.players],
  };
}

function mapDbRowToRoom(row: DbRoomRow, players: Player[] = []): Room {
  return {
    id: row.id,
    host_id: row.host_id,
    code: row.code,
    name: row.name,
    is_private: row.is_private,
    max_players: row.max_players,
    total_rounds: row.total_rounds,
    status: row.status,
    current_round: 0,
    players,
  };
}

export function initRoomCache(
  dbRoom: DbRoomRow,
  hostPlayer: { id: string; name: string },
): RoomCacheEntry {
  const host: Player = {
    id: hostPlayer.id,
    name: hostPlayer.name,
    score: 0,
    status: 'active',
    isHost: true,
  };

  const room = mapDbRowToRoom(dbRoom, [host]);

  const entry: RoomCacheEntry = {
    room,
    hands: {},
    votes: [],
    round: null,
    deck: { white: [], black: [] },
    sockets: {},
  };

  roomCache.set(dbRoom.code, entry);
  return entry;
}

export function joinRoomCache(
  roomCode: string,
  playerName: string,
): { player: Player; players: Player[] } {
  const entry = roomCache.get(roomCode);
  if (!entry) throw new Error('Room not found');

  const { room } = entry;

  if (room.status !== 'waiting') {
    throw new Error('Game already started');
  }

  const activePlayers = getActivePlayers(entry);
  if (activePlayers.length >= room.max_players) {
    throw new Error('Room is full');
  }

  const existing = room.players.find((p) => p.name.toLowerCase() === playerName.toLowerCase());

  if (existing) {
    if (existing.status === 'active') {
      return { player: existing, players: activePlayers };
    }
    if (existing.status === 'disconnected') {
      existing.status = 'active';
      return { player: existing, players: room.players.filter((p) => p.status === 'active') };
    }
  }

  const player: Player = {
    id: randomUUID(),
    name: playerName,
    score: 0,
    status: 'active',
    isHost: false,
  };

  room.players.push(player);

  return {
    player,
    players: room.players.filter((p) => p.status === 'active'),
  };
}

export function leaveRoomCache(
  roomCode: string,
  playerId: string,
): { playerCount: number; wasReset: boolean } {
  const entry = roomCache.get(roomCode);
  if (!entry) {
    return { playerCount: 0, wasReset: false };
  }

  const { room } = entry;
  const roomStatus = room.status;
  const wasHost = room.players.find((p) => p.id === playerId)?.isHost ?? false;

  room.players = room.players.filter((p) => p.id !== playerId);
  delete entry.hands[playerId];
  delete entry.sockets[playerId];

  if (wasHost) {
    const nextHost = room.players.find((p) => p.status === 'active');
    if (nextHost) {
      room.players.forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
    }
  }

  const playerCount = getActivePlayers(entry).length;
  let wasReset = false;

  if (playerCount === 0) {
    roomCache.delete(roomCode);
  } else if (roomStatus === 'in_progress' && playerCount < 3) {
    resetRoomInCache(roomCode);
    wasReset = true;
  }

  return { playerCount, wasReset };
}

export function getLobbyStateFromCache(roomCode: string) {
  const entry = getRoomCacheEntry(roomCode);
  return buildRoom(entry);
}

export function getPublicRoomsFromCache() {
  const rooms: {
    id: string;
    code: string;
    name: string;
    player_count: number;
    max_players: number;
    total_rounds: number;
    status: string;
  }[] = [];

  for (const entry of roomCache.values()) {
    const { room } = entry;
    if (room.is_private) continue;

    rooms.push({
      id: room.id,
      code: room.code,
      name: room.name,
      player_count: room.players.filter((p) => p.status === 'active').length,
      max_players: room.max_players,
      total_rounds: room.total_rounds,
      status: room.status,
    });
  }

  return rooms;
}

export function getRoomFromCache(roomCode: string): Room | null {
  const entry = roomCache.get(roomCode);
  if (!entry) return null;
  return buildRoom(entry);
}

export function getGameStateFromCache(roomCode: string, playerId: string): GameState {
  const entry = getRoomCacheEntry(roomCode);
  const round = requireRound(entry);

  if (!entry.hands[playerId]) {
    throw new Error('Player not in room');
  }

  return {
    round: { ...round, submissions: [...round.submissions], winners: [...round.winners] },
    hand: [...(entry.hands[playerId] ?? [])],
    totalRounds: entry.room.total_rounds,
    hostId: entry.room.players.find((p) => p.isHost)?.id ?? '',
  };
}

export function startGameInCache(roomCode: string): { roundId: string } {
  const entry = getRoomCacheEntry(roomCode);
  const { room } = entry;

  const activePlayers = getActivePlayers(entry);
  if (activePlayers.length < 3) {
    throw new Error('Need at least 3 players to start');
  }

  const blackCard = pickRandomBlackCard();
  const roundId = randomUUID();

  entry.round = {
    id: roundId,
    roundNumber: 1,
    blackCard,
    phase: 'submitting',
    phaseEndsAt: Date.now() + SUBMIT_DURATION_MS,
    submissions: [],
    winners: [],
  };

  entry.hands = {};
  entry.votes = [];

  for (const player of activePlayers) {
    entry.hands[player.id] = dealFreshHand();
  }

  room.status = 'in_progress';

  return { roundId };
}

export function resetRoomInCache(roomCode: string): void {
  const entry = roomCache.get(roomCode);
  if (!entry) return;

  entry.room.status = 'waiting';
  entry.round = null;
  entry.hands = {};
  entry.votes = [];

  for (const player of entry.room.players) {
    player.score = 0;
  }
}

/** Remove a disconnected socket from all cached room mappings. */
export function removeStaleSocketMapping(socketId: string): void {
  for (const entry of roomCache.values()) {
    for (const [playerId, sid] of Object.entries(entry.sockets)) {
      if (sid === socketId) {
        delete entry.sockets[playerId];
      }
    }
  }
}

/** Retrieve a cache entry – throws if missing. */
export function getRoomCacheEntry(roomCode: string): RoomCacheEntry {
  const entry = roomCache.get(roomCode);
  if (!entry) throw new Error('Room not found');
  return entry;
}

/** Delete a cache entry when the game ends or the room is empty. */
export function deleteRoomCacheEntry(roomCode: string): void {
  roomCache.delete(roomCode);
}

/** Update cache when a player submits a card. */
export function cacheSubmitCard(
  roomCode: string,
  roundId: string,
  playerId: string,
  cardId: number,
  card: Card,
  isAutoPicked = false,
): void {
  const entry = getRoomCacheEntry(roomCode);
  const hand = entry.hands[playerId] ?? [];
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx !== -1) hand.splice(idx, 1);

  const submission: Submission = {
    id: `${roundId}-${playerId}-${cardId}`,
    playerId,
    card,
    isAutoPicked,
  };
  requireRound(entry).submissions.push(submission);
}

/** Update cache when a vote is cast. */
export function cacheCastVote(roomCode: string, voterId: string, submissionId: string): void {
  const entry = getRoomCacheEntry(roomCode);
  entry.votes.push({ voterId, submissionId });
}

/** Resolve the current round using only cached data. */
export function cacheResolveRound(roomCode: string): RoundResult {
  const entry = getRoomCacheEntry(roomCode);
  const round = requireRound(entry);
  const { votes } = entry;
  const { submissions } = round;
  const players = entry.room.players;

  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v.submissionId] = (voteCounts[v.submissionId] ?? 0) + 1;
  }

  let max = 0;
  for (const count of Object.values(voteCounts)) {
    if (count > max) max = count;
  }

  const winningSubmissionIds = Object.entries(voteCounts)
    .filter(([, cnt]) => cnt === max)
    .map(([subId]) => subId);

  const winnerPlayerIds: string[] = [];
  for (const subId of winningSubmissionIds) {
    const sub = submissions.find((s: Submission) => s.id === subId);
    if (sub) winnerPlayerIds.push(sub.playerId);
  }

  for (const player of players) {
    if (winnerPlayerIds.includes(player.id)) {
      player.score += 1;
    }
  }
  for (const player of getActivePlayers(entry)) {
    const hand = dealFreshHand();
    entry.hands[player.id] = hand;
    const socketId = entry.sockets[player.id];
    if (socketId) {
      io.to(socketId).emit('hand:update', hand);
    }
  }

  round.roundNumber += 1;
  round.submissions = [];
  round.winners = [];
  entry.votes = [];

  const isGameOver = round.roundNumber > entry.room.total_rounds;

  if (!isGameOver) {
    round.blackCard = pickRandomBlackCard();
    round.phase = 'submitting';
    round.phaseEndsAt = Date.now() + SUBMIT_DURATION_MS;
  }

  return { winners: winnerPlayerIds, players, isGameOver };
}
