import './config/env';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ServerToClientEvents, ClientToServerEvents, Room } from '../../shared/types/index';
import sql from './db/client';
import { getLobbyState, startGame } from './db/room';
import roomRouter from './routes/routes.rooms';
import usersRouter from './routes/routes.users';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/rooms', roomRouter);
app.use('/users', usersRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Handle client request to join a room
  socket.on('room:join', async (payload: { roomCode: string; playerName: string }) => {
    const { roomCode } = payload;
    try {
      socket.join(roomCode);
    } catch (err) {
      console.error('joinRoom error:', err);
      socket.emit('error', 'Failed to join room');
    }
  });

  // Handle client request to start the game
  socket.on('game:start', async (payload: { roomCode: string }) => {
    const { roomCode } = payload;
    try {
      await sql`UPDATE rooms SET status = 'in_progress' WHERE code = ${roomCode}`;
      await startGame(roomCode);
      const roomData = await getLobbyState(roomCode);
      // Cast to Room to satisfy type expectations
      const room = roomData as unknown as Room;
      io.to(roomCode).emit('room:state', room);
    } catch (err) {
      console.error('gameStart error:', err);
      socket.emit('error', 'Failed to start game');
    }
  });
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
