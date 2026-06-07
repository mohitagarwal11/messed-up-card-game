import { Router } from 'express';
import { createRoom, getPublicRooms, getRoomById } from '../db/room';

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

export default router;
