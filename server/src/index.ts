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
  RoundResult,
} from '../../shared/types/index';
import { setRoomStatus } from './db/room';
import { pickRandomWhiteCard } from './data/cards';
import {
  roomCache,
  getRoomCacheEntry,
  getRoomFromCache,
  cacheSubmitCard,
  cacheCastVote,
  cacheResolveRound,
  deleteRoomCacheEntry,
  removeStaleSocketMapping,
  startGameInCache,
} from './cache/roomCache';
import roomRouter from './routes/routes.rooms';
import usersRouter from './routes/routes.users';
import {
  RESULTS_DURATION_MS,
  SUBMIT_DURATION_MS,
  VOTE_DURATION_MS,
  GAME_OVER_DURATION_MS,
} from '../../shared/constants';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});
export { io };

const roomTimers = new Map<string, NodeJS.Timeout>();

function clearRoomTimer(roomCode: string) {
  const t = roomTimers.get(roomCode);
  if (t) {
    clearTimeout(t);
    roomTimers.delete(roomCode);
  }
}

async function finishRound(roomCode: string, result: RoundResult) {
  const entry = getRoomCacheEntry(roomCode);
  if (entry.round) {
    entry.round.phaseEndsAt =
      Date.now() + (result.isGameOver ? GAME_OVER_DURATION_MS : RESULTS_DURATION_MS);
  }
  io.to(roomCode).emit('round:end', result);

  if (result.isGameOver) {
    const endTimer = setTimeout(async () => {
      io.to(roomCode).emit('game:end', result.players);
      deleteRoomCacheEntry(roomCode);
      clearRoomTimer(roomCode);
      await setRoomStatus(roomCode, 'finished');
    }, GAME_OVER_DURATION_MS);
    roomTimers.set(roomCode, endTimer);
  } else {
    const nextRoundTimer = setTimeout(async () => {
      if (!roomCache.has(roomCode)) return;
      const updatedEntry = getRoomCacheEntry(roomCode);
      if (!updatedEntry.round) return;
      io.to(roomCode).emit('round:start', updatedEntry.round);
      await startSubmitTimer(roomCode, updatedEntry.round.id);
    }, RESULTS_DURATION_MS);
    roomTimers.set(roomCode, nextRoundTimer);
  }
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/rooms', roomRouter);
app.use('/users', usersRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

async function startVotePhase(roomCode: string) {
  const entry = getRoomCacheEntry(roomCode);
  if (!entry.round) return;
  entry.round.phase = 'voting';
  entry.round.phaseEndsAt = Date.now() + VOTE_DURATION_MS;
  const submissions: Submission[] = entry.round.submissions;
  io.to(roomCode).emit('phase:vote', submissions);

  const voteTimer = setTimeout(async () => {
    const votedIds = entry.votes.map((v) => v.voterId);
    const activePlayerIds = entry.room.players
      .filter((player) => player.status === 'active')
      .map((player) => player.id);
    const unvoted = activePlayerIds.filter((id) => !votedIds.includes(id));

    for (const playerId of unvoted) {
      if (!entry.round) return;
      const possible = entry.round.submissions.filter((s) => s.playerId !== playerId);
      if (possible.length === 0) continue;
      const randomSub = possible[Math.floor(Math.random() * possible.length)];
      cacheCastVote(roomCode, playerId, randomSub.id);
    }

    const result = cacheResolveRound(roomCode);
    clearRoomTimer(roomCode);
    await finishRound(roomCode, result);
  }, VOTE_DURATION_MS);
  roomTimers.set(roomCode, voteTimer);
}

async function startSubmitTimer(roomCode: string, roundId: string) {
  const submitTimer = setTimeout(async () => {
    const entry = getRoomCacheEntry(roomCode);
    if (!entry.round || entry.round.id !== roundId) return;
    const submittedIds = entry.round.submissions.map((s) => s.playerId);
    const activeIds = entry.room.players
      .filter((player) => player.status === 'active')
      .map((player) => player.id);
    const unsubmitted = activeIds.filter((id) => !submittedIds.includes(id));

    for (const playerId of unsubmitted) {
      let card = entry.hands[playerId]?.shift();
      if (!card) {
        card = pickRandomWhiteCard();
      }
      if (card) {
        cacheSubmitCard(roomCode, roundId, playerId, card.id, card, true);
      }
    }
    await startVotePhase(roomCode);
  }, SUBMIT_DURATION_MS);
  roomTimers.set(roomCode, submitTimer);
}

io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);
  socket.on('room:join', async (roomCode: string, playerId: string) => {
    try {
      socket.join(roomCode);
      if (roomCache.has(roomCode)) {
        const entry = getRoomCacheEntry(roomCode);
        entry.sockets[playerId] = socket.id;
      }
    } catch (err) {
      console.error('joinRoom error:', err);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('room:leave', (roomCode: string) => {
    socket.leave(roomCode);
  });

  socket.on('game:start', async (roomCode: string, playerId: string) => {
    try {
      const entry = getRoomCacheEntry(roomCode);
      const host = entry.room.players.find((p) => p.isHost);
      if (!host || host.id !== playerId) {
        socket.emit('error', 'Only the host can start the game');
        return;
      }

      await setRoomStatus(roomCode, 'in_progress');
      const { roundId } = startGameInCache(roomCode);
      const room = getRoomFromCache(roomCode) as Room;
      io.to(roomCode).emit('room:state', room);
      await startSubmitTimer(roomCode, roundId);
    } catch (err) {
      console.error('gameStart error:', err);
      socket.emit('error', 'Failed to start game');
    }
  });

  socket.on('card:submit', async (roomCode: string, cardId: number, playerId: string) => {
    try {
      const entry = getRoomCacheEntry(roomCode);
      if (!entry.round || entry.round.phase !== 'submitting') {
        socket.emit('error', 'No active round');
        return;
      }
      const roundId = entry.round.id;
      const alreadySubmitted = entry.round.submissions.some(
        (submission) => submission.playerId === playerId,
      );
      if (alreadySubmitted) {
        socket.emit('error', 'Player already submitted this round');
        return;
      }
      const card = entry.hands[playerId]?.find((c) => Number(c.id) === Number(cardId));
      if (!card) {
        socket.emit('error', 'Card not found in hand');
        return;
      }
      cacheSubmitCard(roomCode, roundId, playerId, cardId, card);
      const activeCount = entry.room.players.filter((player) => player.status === 'active').length;
      const submissionCount = entry.round.submissions.length;

      if (submissionCount >= activeCount) {
        clearRoomTimer(roomCode);
        await startVotePhase(roomCode);
      } else if (!roomTimers.has(roomCode)) {
        await startSubmitTimer(roomCode, roundId);
      }
    } catch (err) {
      console.error('cardSubmit error:', err);
      socket.emit('error', 'Failed to submit card');
    }
  });

  socket.on('vote:cast', async (roomCode: string, submissionId: string, playerId: string) => {
    try {
      const entry = getRoomCacheEntry(roomCode);
      if (!entry.round || entry.round.phase !== 'voting') {
        socket.emit('error', 'Voting is not active');
        return;
      }
      const alreadyVoted = entry.votes.some((vote) => vote.voterId === playerId);
      if (alreadyVoted) {
        socket.emit('error', 'Player already voted this round');
        return;
      }
      const submission = entry.round.submissions.find((item) => item.id === submissionId);
      if (!submission) {
        socket.emit('error', 'Submission not found');
        return;
      }
      if (submission.playerId === playerId) {
        socket.emit('error', 'Players cannot vote for themselves');
        return;
      }
      cacheCastVote(roomCode, playerId, submissionId);
      const activeCount = entry.room.players.filter((player) => player.status === 'active').length;
      const voteCount = entry.votes.length;
      if (voteCount >= activeCount) {
        clearRoomTimer(roomCode);
        const result = cacheResolveRound(roomCode);
        await finishRound(roomCode, result);
      }
    } catch (err) {
      console.error('voteCast error:', err);
      socket.emit('error', 'Failed to cast vote');
    }
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected:', socket.id);
    removeStaleSocketMapping(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
