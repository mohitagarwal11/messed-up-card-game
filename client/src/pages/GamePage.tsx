import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameState, leaveRoom } from '../api/rooms';
import socket, { joinSocketRoom, leaveSocketRoom } from '../socket/index';
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
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }

    getGameState(roomCode, playerId)
      .then((data) => {
        setGameState(data);
        setPhase(data.round.phase);
        if (data.round.phase === 'voting') {
          setSubmissions(data.round.submissions);
        }
      })
      .catch(() => navigate('/'));

    joinSocketRoom(roomCode, playerId);

    socket.on('phase:vote', (subs) => {
      setSubmissions(subs);
      setPhase('voting');
    });

    socket.on('round:end', (result) => {
      setRoundResult(result);
      setPhase('results');
    });

    socket.on('game:end', () => {
      leaveSocketRoom(roomCode);
      navigate('/lobby');
    });

    socket.on('room:reset', () => {
      leaveSocketRoom(roomCode);
      navigate('/lobby');
    });

    socket.on('round:start', (round) => {
      getGameState(roomCode, playerId!).then((data) => {
        setGameState(data);
        setPhase(round.phase as 'submitting');
        setHasVoted(false);
        setSelectedCardId(null);
        setSelectedSubmissionId(null);
      });
    });

    // Listen for hand updates from the server to keep the player's hand in sync
    socket.on('hand:update', (hand) => {
      setGameState((prev) => (prev ? { ...prev, hand } : null));
    });

    return () => {
      socket.off('phase:vote');
      socket.off('round:end');
      socket.off('game:end');
      socket.off('room:reset');
      socket.off('round:start');
      socket.off('hand:update');
    };
  }, [navigate, roomCode, playerId]);

  const submitCard = () => {
    if (!gameState || !selectedCardId || !playerId) return;
    socket.emit('card:submit', roomCode, selectedCardId, playerId);
    setPhase('waiting');
  };

  const submitVote = () => {
    if (!gameState || !selectedSubmissionId || !playerId) return;
    socket.emit('vote:cast', roomCode, selectedSubmissionId, playerId);
    setHasVoted(true);
  };

  const handleLeaveRoom = async () => {
    if (!playerId) return;
    leaveSocketRoom(roomCode);
    await leaveRoom(roomCode, playerId);
    navigate('/lobby');
  };

  if (!gameState) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="font-display text-3xl text-primary-container animate-pulse">LOADING...</p>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <SubmittingPhase
        blackCard={gameState.round.blackCard}
        hand={gameState.hand}
        selectedCardId={selectedCardId}
        onSelectCard={setSelectedCardId}
        onSubmit={submitCard}
        roundNumber={gameState.round.roundNumber}
        totalRounds={gameState.totalRounds}
      />
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="font-display text-3xl text-primary-container animate-pulse">
          WAITING FOR OTHERS...
        </p>
      </div>
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
      />
    );
  }

  return null;
}
