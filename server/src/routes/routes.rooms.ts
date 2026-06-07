import { Router } from 'express';
import {
  createRoom,
  getLobbyState,
  getPublicRooms,
  getRoomById,
  getRoomPlayers,
  joinRoom,
} from '../db/room';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const room = await createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Failed to create room.',
    });
  }
});

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

router.get('/:id', async (req, res) => {
  try {
    const room = await getRoomById(req.params.id);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to get room by id.',
    });
  }
});

router.post('/:id/join', async (req, res) => {
  const playerName = typeof req.body?.playerName === 'string' ? req.body.playerName.trim() : '';

  if (!playerName) {
    return res.status(400).json({
      message: 'playerName is required',
    });
  }

  try {
    const player = await joinRoom(req.params.id, playerName);
    const players = await getRoomPlayers(req.params.id);

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

router.get('/:id/lobby', async (req, res) => {
  try {
    const lobbyState = await getLobbyState(req.params.id);

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
