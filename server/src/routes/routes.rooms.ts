import { Router } from 'express';
import createRoom from '../db/room';

const router = Router();

router.post('/create', async (req, res) => {
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

export default router;
