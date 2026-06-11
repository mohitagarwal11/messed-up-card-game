import { Router } from 'express';
import {
  createRoom,
  getLobbyState,
  getPublicRooms,
  getRoomByCode,
  getRoomPlayers,
  joinRoom,
} from '../db/room';

const router = Router();

// create room route
router.post('/', async (req, res) => {
  try {
    const { name, isPrivate, maxPlayers, totalRounds, playerName } = req.body;

    const trimmedPlayerName = typeof playerName === 'string' ? playerName.trim() : '';

    if (!trimmedPlayerName) {
      return res.status(400).json({ message: 'playerName is required' });
    }

    const room = await createRoom({
      name,
      isPrivate,
      maxPlayers,
      totalRounds,
      hostId: null,
    });

    const { player } = await joinRoom(room.code, trimmedPlayerName);

    res.status(201).json({ room, player });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Failed to create room.',
    });
  }
});

// get public rooms route
router.get('/', async (req, res) => {
  try {
    const rooms = await getPublicRooms();
    res.status(200).json(rooms);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Failed to get public rooms.',
    });
  }
});

// get room by code route
router.get('/:code', async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code);

    res.status(200).json(room);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to get room by code.',
    });
  }
});

// join room route
router.post('/:code/join', async (req, res) => {
  const playerName = typeof req.body?.playerName === 'string' ? req.body.playerName.trim() : '';

  if (!playerName) {
    return res.status(400).json({
      message: 'playerName is required',
    });
  }

  try {
    const { player, roomId } = await joinRoom(req.params.code, playerName);
    const players = await getRoomPlayers(roomId);

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

// get lobby details route
router.get('/:code/lobby', async (req, res) => {
  try {
    const lobbyState = await getLobbyState(req.params.code);

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

export default router;
