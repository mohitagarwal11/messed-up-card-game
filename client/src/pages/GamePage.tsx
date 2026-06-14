import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameState, leaveRoom, resetRoom } from '../api/rooms';
import socket from '../socket/index';
import SubmittingPhase from '../components/SubmittingPhase';
import VotingPhase from '../components/VotingPhase';
import ResultsPhase from '../components/ResultsPhase';
import type { Submission, GameState, RoundResult } from '../../../shared/types';

export default function GamePage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const playerId = localStorage.getItem('playerId');
  const roomCode = code!;
  const [phase, setPhase] = useState<'submitting' | 'waiting' | 'voting' | 'results'>('submitting');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  // Determine host ID from gameState (if available) or from roundResult players list
  const hostId = gameState?.hostId ?? roundResult?.players?.find((p) => p.isHost)?.id;
  const isHost = hostId === playerId;

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }

    getGameState(roomCode, playerId)
      .then(setGameState)
      .catch(() => navigate('/'));

    socket.connect();
    socket.emit('room:join', { roomCode, playerName: '' });

    socket.on('phase:vote', (subs) => {
      setSubmissions(subs);
      setPhase('voting');
      setTimeLeft(30);
    });

    socket.on('round:end', (result) => {
      setRoundResult(result);
      setPhase('results');
    });

    socket.on('game:end', () => {
      navigate('/lobby');
    });

    // When the host resets the room after game over, navigate all players back to lobby
    socket.on('room:reset', () => {
      navigate('/lobby');
    });

    socket.on('round:start', (round) => {
      getGameState(roomCode, playerId!).then((data) => {
        setGameState(data);
        setPhase(round.phase as 'submitting');
        setTimeLeft(30);
        setHasSubmitted(false);
        setHasVoted(false);
        setSelectedCardId(null);
        setSelectedSubmissionId(null);
      });
    });

    return () => {
      socket.off('phase:vote');
      socket.off('round:end');
      socket.off('game:end');
      socket.off('room:reset');
      socket.off('round:start');
      socket.disconnect();
    };
  }, [navigate, roomCode, playerId]);

  useEffect(() => {
    if (phase !== 'submitting' || hasSubmitted || !gameState) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const randomCard = gameState.hand[Math.floor(Math.random() * gameState.hand.length)];
          socket.emit('card:submit', {
            roomCode,
            roundId: gameState.round.id,
            cardId: randomCard.id,
            playerId: playerId!,
          });
          setHasSubmitted(true);
          setPhase('waiting');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, hasSubmitted, gameState, roomCode, playerId]);

  useEffect(() => {
    if (phase !== 'voting' || hasVoted || !gameState || submissions.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const eligibleSubs = submissions.filter((sub) => sub.playerId !== playerId);
          const randomSub = eligibleSubs[Math.floor(Math.random() * eligibleSubs.length)];
          if (randomSub) {
            socket.emit('vote:cast', {
              roomCode,
              roundId: gameState.round.id,
              submissionId: randomSub.id,
              playerId: playerId!,
            });
            setHasVoted(true);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, hasVoted, gameState, submissions, playerId, roomCode]);

  const submitCard = () => {
    if (!gameState || !selectedCardId || !playerId) return;
    socket.emit('card:submit', {
      roomCode,
      roundId: gameState.round.id,
      cardId: selectedCardId,
      playerId,
    });
    setHasSubmitted(true);
    setPhase('waiting');
  };

  const submitVote = () => {
    if (!gameState || !selectedSubmissionId || !playerId) return;
    socket.emit('vote:cast', {
      roomCode,
      roundId: gameState.round.id,
      submissionId: selectedSubmissionId,
      playerId,
    });
    setHasVoted(true);
  };

  const handleLeaveRoom = async () => {
    if (!playerId) return;
    await leaveRoom(roomCode, playerId);
    navigate('/lobby');
  };

  const handleBackToLobby = async () => {
    await resetRoom(roomCode);
    navigate('/lobby');
  };

  if (!gameState) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="font-display text-3xl text-primary-container animate-pulse">LOADING...</p>
      </div>
    );
  }

  if (phase === 'submitting' || phase === 'waiting') {
    return (
      <SubmittingPhase
        blackCard={gameState.round.blackCard}
        hand={gameState.hand}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
        onSubmit={submitCard}
        timeLeft={timeLeft}
        hasSubmitted={hasSubmitted}
        roundNumber={gameState.round.roundNumber}
        totalRounds={gameState.totalRounds}
      />
    );
  }

  if (phase === 'voting') {
    return (
      <VotingPhase
        submissions={submissions}
        selectedSubmissionId={selectedSubmissionId}
        onSelectSubmission={setSelectedSubmissionId}
        hasVoted={hasVoted}
        onVote={submitVote}
        blackCard={gameState.round.blackCard}
        timeLeft={timeLeft}
        playerId={playerId!}
        roundNumber={gameState.round.roundNumber}
        totalRounds={gameState.totalRounds}
      />
    );
  }

  if (phase === 'results' && roundResult) {
    return (
      <ResultsPhase
        roundResult={roundResult}
        blackCard={gameState.round.blackCard}
        submissions={submissions}
        roundNumber={gameState.round.roundNumber}
        totalRounds={gameState.totalRounds}
        onLeave={handleLeaveRoom}
        onBackToLobby={handleBackToLobby}
        isHost={isHost}
      />
    );
  }

  return null;
}
