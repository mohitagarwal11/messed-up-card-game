import { Router } from 'express';
import { createRoom, getRoomByCode } from '../db/room';
import {
  initRoomCache,
  joinRoomCache,
  leaveRoomCache,
  getLobbyStateFromCache,
  getPublicRoomsFromCache,
  getGameStateFromCache,
  getRoomFromCache,
  resetRoomInCache,
  roomCache,
  deleteRoomCacheEntry,
  roomTimers,
  clearRoomTimer,
  type DbRoomRow,
} from '../cache/roomCache';
import { io } from '../index';
import { ROOM_TIMEOUT_MS } from '@shared/constants';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, isPrivate, maxPlayers, totalRounds, playerName, hostId } = req.body;

    const trimmedPlayerName = typeof playerName === 'string' ? playerName.trim() : '';
    const trimmedHostId = typeof hostId === 'string' ? hostId.trim() : '';

    if (!trimmedPlayerName) {
      return res.status(400).json({ message: 'playerName is required' });
    }

    if (!trimmedHostId) {
      return res.status(400).json({ message: 'hostId is required' });
    }

    const room = await createRoom({
      name,
      isPrivate,
      maxPlayers,
      totalRounds,
      hostId: trimmedHostId,
    });

    initRoomCache(room as DbRoomRow, { id: trimmedHostId, name: trimmedPlayerName });

    const timeoutTimer = setTimeout(() => {
      if (!roomCache.has(room.code)) return;
      io.to(room.code).emit('room:closing', 'Room timed out and is closing.');
      deleteRoomCacheEntry(room.code);
      clearRoomTimer(room.code);
    }, ROOM_TIMEOUT_MS);
    roomTimers.set(room.code, timeoutTimer);

    const lobby = getLobbyStateFromCache(room.code);
    const hostPlayer = lobby.players.find((p) => p.isHost)!;

    res.status(201).json({ room: lobby, player: hostPlayer });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create room.',
    });
  }
});

router.get('/', async (_req, res) => {
  try {
    const rooms = getPublicRoomsFromCache();
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get public rooms.',
    });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const cached = getRoomFromCache(req.params.code);
    if (cached) {
      return res.status(200).json(cached);
    }

    const room = await getRoomByCode(req.params.code);
    res.status(200).json({
      ...room,
      current_round: 0,
      players: [],
    });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : 'Failed to get room by code.';

    if (message === 'Room not found') {
      return res.status(404).json({ message });
    }

    res.status(500).json({
      message: 'Failed to get room by code.',
    });
  }
});

router.post('/:code/join', async (req, res) => {
  const playerName = typeof req.body?.playerName === 'string' ? req.body.playerName.trim() : '';

  if (!playerName) {
    return res.status(400).json({
      message: 'playerName is required',
    });
  }

  try {
    const { player, players } = joinRoomCache(req.params.code, playerName);

    res.status(201).json({
      player,
      players,
    });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : 'Failed to join room.';

    if (message === 'Room not found') {
      return res.status(404).json({ message });
    }

    if (message === 'Game already started') {
      return res.status(409).json({ message });
    }

    if (message === 'Room is full') {
      return res.status(409).json({ message });
    }

    res.status(500).json({
      message: 'Failed to join room.',
    });
  }
});

router.get('/:code/lobby', async (req, res) => {
  try {
    const lobbyState = getLobbyStateFromCache(req.params.code);

    res.status(200).json(lobbyState);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : 'Failed to get lobby details.';

    if (message === 'Room not found') {
      return res.status(404).json({
        message,
      });
    }

    res.status(500).json({
      message: 'Failed to get lobby details.',
    });
  }
});

router.post('/:code/leave', async (req, res) => {
  const playerId = typeof req.body?.playerId === 'string' ? req.body.playerId.trim() : '';
  if (!playerId) {
    return res.status(400).json({ message: 'playerId is required' });
  }
  try {
    const { wasReset } = leaveRoomCache(req.params.code, playerId);
    if (wasReset) {
      io.to(req.params.code).emit('room:reset:done', req.params.code);
    }
    res.status(200).json({ ok: true, wasReset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to leave room.' });
  }
});

router.post('/:code/reset', async (req, res) => {
  try {
    resetRoomInCache(req.params.code);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset room.' });
  }
});

router.get('/:code/game-state', async (req, res) => {
  const playerId = req.query.playerId as string;
  if (!playerId) {
    return res.status(400).json({ message: 'playerId is required' });
  }
  try {
    const gameState = getGameStateFromCache(req.params.code, playerId);
    return res.status(200).json(gameState);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to get game state.';
    if (
      message === 'Room not found' ||
      message === 'No active round in cache' ||
      message === 'Player not in room'
    ) {
      return res.status(404).json({ message });
    }
    return res.status(500).json({ message: 'Failed to get game state.' });
  }
});

export default router;
