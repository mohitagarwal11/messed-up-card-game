import './config/env';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Room,
  Submission,
} from '../../shared/types/index';
import sql from './db/client';
import {
  getLobbyState,
  startGame,
  submitCard,
  castVote,
  resolveRound,
  deleteRoom,
} from './db/room';
import roomRouter from './routes/routes.rooms';
import usersRouter from './routes/routes.users';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});
export { io };

// Map of room code to active timeout for submission/voting phases
const roomTimers = new Map<string, NodeJS.Timeout>();

function clearRoomTimer(roomCode: string) {
  const t = roomTimers.get(roomCode);
  if (t) {
    clearTimeout(t);
    roomTimers.delete(roomCode);
  }
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/rooms', roomRouter);
app.use('/users', usersRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

async function startVotePhase(roomCode: string, roundId: string) {
  const rawSubs = await sql`
    SELECT s.id, s.room_player_id AS "playerId", c.id AS "cardId", c.text, c.pick
    FROM submissions s
    JOIN cards c ON c.id = s.card_id
    WHERE s.round_id = ${roundId}
  `;
  const submissions: Submission[] = rawSubs.map((row: any) => ({
    id: row.id,
    playerId: row.playerId,
    card: { id: row.cardId, color: 'white', text: row.text, pick: row.pick },
    isAutoPicked: false,
  }));
  io.to(roomCode).emit('phase:vote', submissions);

  const voteTimer = setTimeout(async () => {
    const votedRows = await sql`SELECT voter_id FROM votes WHERE round_id = ${roundId}`;
    const votedIds = votedRows.map((r: any) => r.voter_id);
    const activePlayers = await sql`
      SELECT id FROM room_players
      WHERE room_id = (SELECT id FROM rooms WHERE code = ${roomCode})
        AND status = 'active'
    `;
    const allSubs =
      await sql`SELECT id, room_player_id FROM submissions WHERE round_id = ${roundId}`;
    const unvoted = activePlayers.filter((p: any) => !votedIds.includes(p.id));
    for (const p of unvoted) {
      const possible = allSubs.filter((s: any) => s.room_player_id !== p.id);
      if (possible.length === 0) continue;
      const randomSub = possible[Math.floor(Math.random() * possible.length)];
      await castVote(roundId, p.id, randomSub.id);
    }
    const result = await resolveRound(roomCode, roundId);
    io.to(roomCode).emit('round:end', result);
    clearRoomTimer(roomCode);
  }, 30_000);
  roomTimers.set(roomCode, voteTimer);
}

async function startSubmitTimer(roomCode: string, roundId: string) {
  const submitTimer = setTimeout(async () => {
    const submittedRows =
      await sql`SELECT room_player_id FROM submissions WHERE round_id = ${roundId}`;
    const submittedIds = submittedRows.map((r: any) => r.room_player_id);
    const activePlayers = await sql`
      SELECT id FROM room_players
      WHERE room_id = (SELECT id FROM rooms WHERE code = ${roomCode})
        AND status = 'active'
    `;
    const unsubmitted = activePlayers.filter((p: any) => !submittedIds.includes(p.id));
    for (const p of unsubmitted) {
      const [hand] = await sql`
        SELECT card_id FROM player_hands
        WHERE room_player_id = ${p.id} AND is_played = false
        ORDER BY RANDOM()
        LIMIT 1
      `;
      if (hand) await submitCard(roundId, p.id, hand.card_id);
    }
    await startVotePhase(roomCode, roundId);
  }, 30_000);
  roomTimers.set(roomCode, submitTimer);
}

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
  socket.on('game:start', async (payload: { roomCode: string; playerId: string }) => {
    const { roomCode, playerId } = payload;
    try {
      const [earliest] = await sql`
        SELECT rp.id FROM room_players rp
        JOIN rooms r ON r.id = rp.room_id
        WHERE r.code = ${roomCode} AND rp.status = 'active'
        ORDER BY rp.joined_at ASC
        LIMIT 1
      `;
      if (!earliest || earliest.id !== playerId) {
        socket.emit('error', 'Only the host can start the game');
        return;
      }
      await sql`UPDATE rooms SET status = 'in_progress' WHERE code = ${roomCode}`;
      const { roundId } = await startGame(roomCode);
      const roomData = await getLobbyState(roomCode);
      const room = roomData as unknown as Room;
      io.to(roomCode).emit('room:state', room);
      await startSubmitTimer(roomCode, roundId);
    } catch (err) {
      console.error('gameStart error:', err);
      socket.emit('error', 'Failed to start game');
    }
  });

  // Handle card submission from a player
  socket.on('card:submit', async (payload) => {
    const { roomCode, roundId, cardId, playerId } = payload;
    try {
      const submissionCount = await submitCard(roundId, playerId, cardId);
      const [{ count: activeCount }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM room_players rp
      JOIN rooms r ON rp.room_id = r.id
      WHERE r.code = ${roomCode} AND rp.status = 'active'
    `;

      if (submissionCount >= activeCount) {
        clearRoomTimer(roomCode);
        await startVotePhase(roomCode, roundId);
      } else {
        if (!roomTimers.has(roomCode)) {
          await startSubmitTimer(roomCode, roundId);
        }
      }
    } catch (err) {
      console.error('cardSubmit error:', err);
      socket.emit('error', 'Failed to submit card');
    }
  });

  socket.on(
    'vote:cast',
    async (payload: {
      roomCode: string;
      roundId: string;
      submissionId: string;
      playerId: string;
    }) => {
      const { roomCode, roundId, submissionId, playerId } = payload;
      try {
        await castVote(roundId, playerId, submissionId);
        const [{ count: activeCount }] = await sql`
         SELECT COUNT(*)::int AS count
         FROM room_players rp
         JOIN rooms r ON rp.room_id = r.id
         WHERE r.code = ${roomCode} AND rp.status = 'active'
       `;
        const [{ count: voteCount }] = await sql`
         SELECT COUNT(*)::int AS count FROM votes WHERE round_id = ${roundId}
       `;
        if (voteCount >= activeCount) {
          clearRoomTimer(roomCode);
          const result = await resolveRound(roomCode, roundId);
          io.to(roomCode).emit('round:end', result);

          if (result.isGameOver) {
            setTimeout(async () => {
              io.to(roomCode).emit('game:end', result.players);
              await deleteRoom(roomCode);
            }, 30_000);
          } else {
            setTimeout(async () => {
              const [room] =
                await sql`SELECT id, current_round FROM rooms WHERE code = ${roomCode}`;
              const [blackCard] =
                await sql`SELECT id, text, pick FROM cards WHERE color = 'black' ORDER BY RANDOM() LIMIT 1`;
              const newRoundNumber = room.current_round;
              const [round] = await sql`
                INSERT INTO rounds (room_id, round_number, black_card_id, phase)
                VALUES (${room.id}, ${newRoundNumber}, ${blackCard.id}, 'submitting')
                RETURNING id
                `;
              io.to(roomCode).emit('round:start', {
                id: round.id,
                roundNumber: newRoundNumber,
                blackCard: {
                  id: blackCard.id,
                  color: 'black',
                  text: blackCard.text,
                  pick: blackCard.pick,
                },
                phase: 'submitting',
                phaseEndsAt: '',
                submissions: [],
                winners: [],
              });
              await startSubmitTimer(roomCode, round.id);
            }, 30_000);
          }
        }
      } catch (err) {
        console.error('voteCast error:', err);
        socket.emit('error', 'Failed to cast vote');
      }
    },
  );
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
