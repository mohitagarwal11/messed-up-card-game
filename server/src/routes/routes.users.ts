import { Router } from 'express';
import { randomUUID } from 'crypto';

const router = Router();

router.post('/guest', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 2 || name.length > 20) {
    return res.status(400).json({ message: 'Name must be 2-20 characters long.' });
  }
  const id = randomUUID();
  return res.status(201).json({ id, name });
});

export default router;
