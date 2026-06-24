import { useEffect, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameState, leaveRoom, resetRoom } from '../api/rooms';
import socket, { joinSocketRoom, leaveSocketRoom, resetSocketRoom } from '../socket/index';
import SubmittingPhase from '../components/SubmittingPhase';
import VotingPhase from '../components/VotingPhase';
import ResultsPhase from '../components/ResultsPhase';
import type { Submission, GamePhase, GameState, RoundResult, Card } from '../../../shared/types';
import TitleHeader from '../components/TitleHeader';
import Particles from '../components/Particles';
import ClickSpark from '../components/ClickSpark';
import { LetterAvatar } from '../components/LetterAvatar';

type GamePagePhase = GamePhase | 'waiting';

type GamePageProps = {
  previewGameState?: GameState;
  previewPlayerId?: string;
  previewSubmissions?: Submission[];
  previewRoundResult?: RoundResult;
  previewPhase?: GamePagePhase;
};

type GamePageState = {
  phase: GamePagePhase;
  gameState: GameState | null;
  selectedCardId: number | null;
  hasSubmittedCard: boolean;
  submissions: Submission[];
  roundResult: RoundResult | null;
  selectedSubmissionId: string | null;
  hasVoted: boolean;
};

type GamePageAction =
  | { type: 'hydrate'; gameState: GameState }
  | { type: 'phase:vote'; submissions: Submission[]; phaseEndsAt: number }
  | { type: 'round:end'; roundResult: RoundResult; phaseEndsAt: number }
  | { type: 'round:start'; gameState: GameState; phase: GamePhase }
  | { type: 'hand:update'; hand: Card[] }
  | { type: 'select:card'; selectedCardId: number }
  | { type: 'select:submission'; selectedSubmissionId: string }
  | { type: 'submit:card' }
  | { type: 'submit:vote' };

function createInitialGamePageState({
  previewGameState,
  previewSubmissions,
  previewRoundResult,
  previewPhase,
}: Pick<
  GamePageProps,
  'previewGameState' | 'previewSubmissions' | 'previewRoundResult' | 'previewPhase'
>): GamePageState {
  return {
    phase: previewPhase ?? previewGameState?.round.phase ?? 'submitting',
    gameState: previewGameState ?? null,
    selectedCardId: null,
    hasSubmittedCard: false,
    submissions: previewSubmissions ?? previewGameState?.round.submissions ?? [],
    roundResult: previewRoundResult ?? null,
    selectedSubmissionId: null,
    hasVoted: false,
  };
}

function gamePageReducer(state: GamePageState, action: GamePageAction): GamePageState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        gameState: action.gameState,
        phase: action.gameState.round.phase,
        hasSubmittedCard: false,
        submissions: action.gameState.round.submissions,
      };
    case 'phase:vote':
      return {
        ...state,
        phase: 'voting',
        hasSubmittedCard: false,
        submissions: action.submissions,
        selectedSubmissionId: null,
        hasVoted: false,
        gameState: state.gameState
          ? {
              ...state.gameState,
              round: { ...state.gameState.round, phase: 'voting', phaseEndsAt: action.phaseEndsAt },
            }
          : null,
      };
    case 'round:end':
      return {
        ...state,
        phase: 'results',
        roundResult: action.roundResult,
        gameState: state.gameState
          ? {
              ...state.gameState,
              round: {
                ...state.gameState.round,
                phase: 'results',
                phaseEndsAt: action.phaseEndsAt,
              },
            }
          : null,
      };
    case 'round:start':
      return {
        ...state,
        gameState: action.gameState,
        phase: action.phase,
        submissions: action.gameState.round.submissions,
        roundResult: null,
        selectedCardId: null,
        hasSubmittedCard: false,
        selectedSubmissionId: null,
        hasVoted: false,
      };
    case 'hand:update':
      return {
        ...state,
        gameState: state.gameState ? { ...state.gameState, hand: action.hand } : null,
      };
    case 'select:card':
      return {
        ...state,
        selectedCardId: action.selectedCardId,
      };
    case 'select:submission':
      return {
        ...state,
        selectedSubmissionId: action.selectedSubmissionId,
      };
    case 'submit:card':
      return {
        ...state,
        phase: 'waiting',
        hasSubmittedCard: true,
      };
    case 'submit:vote':
      return {
        ...state,
        phase: 'waiting',
        hasVoted: true,
      };
    default:
      return state;
  }
}

export default function GamePage({
  previewGameState,
  previewPlayerId,
  previewSubmissions,
  previewRoundResult,
  previewPhase,
}: GamePageProps) {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const isPreview = Boolean(previewGameState);
  const guestUser = JSON.parse(localStorage.getItem('guestUser') ?? 'null') as {
    id: string;
    name: string;
  } | null;
  const playerId = localStorage.getItem('playerId') ?? previewPlayerId ?? null;
  const roomCode = code ?? 'PREVIEW';
  const [state, dispatch] = useReducer(
    gamePageReducer,
    {
      previewGameState,
      previewSubmissions,
      previewRoundResult,
      previewPhase,
    },
    createInitialGamePageState,
  );

  const {
    phase,
    gameState,
    selectedCardId,
    hasSubmittedCard,
    submissions,
    roundResult,
    selectedSubmissionId,
    hasVoted,
  } = state;

  useEffect(() => {
    if (isPreview) return;

    if (!playerId) {
      navigate('/');
      return;
    }

    getGameState(roomCode, playerId)
      .then((data) => {
        dispatch({ type: 'hydrate', gameState: data });
      })
      .catch(() => navigate('/'));

    joinSocketRoom(roomCode, playerId);

    const handlePhaseVote = (nextSubmissions: Submission[], phaseEndsAt: number) => {
      dispatch({ type: 'phase:vote', submissions: nextSubmissions, phaseEndsAt });
    };

    const handleRoundEnd = (result: RoundResult, phaseEndsAt: number) => {
      dispatch({ type: 'round:end', roundResult: result, phaseEndsAt });
    };

    const handleGameEnd = () => {
      leaveSocketRoom(roomCode);
      navigate('/lobby');
    };

    const handleRoundStart = (round: GameState['round'], phaseEndsAt: number) => {
      getGameState(roomCode, playerId!).then((data) => {
        dispatch({
          type: 'round:start',
          gameState: { ...data, round: { ...data.round, phaseEndsAt } },
          phase: round.phase,
        });
      });
    };

    const handleHandUpdate = (hand: Card[]) => {
      dispatch({ type: 'hand:update', hand });
    };

    const handleRoomReset = () => {
      leaveSocketRoom(roomCode);
      navigate(`/lobby/${roomCode}`);
    };

    socket.on('phase:vote', handlePhaseVote);
    socket.on('round:end', handleRoundEnd);
    socket.on('game:end', handleGameEnd);
    socket.on('round:start', handleRoundStart);
    socket.on('hand:update', handleHandUpdate);
    socket.on('room:reset:done', handleRoomReset);

    return () => {
      socket.off('phase:vote', handlePhaseVote);
      socket.off('round:end', handleRoundEnd);
      socket.off('game:end', handleGameEnd);
      socket.off('round:start', handleRoundStart);
      socket.off('hand:update', handleHandUpdate);
      socket.off('room:reset:done', handleRoomReset);
    };
  }, [isPreview, navigate, roomCode, playerId]);

  const submitCard = () => {
    if (!gameState || !selectedCardId || hasSubmittedCard) return;
    if (isPreview || !playerId) {
      dispatch({ type: 'submit:card' });
      return;
    }
    socket.emit('card:submit', roomCode, selectedCardId, playerId);
    dispatch({ type: 'submit:card' });
  };

  const submitVote = () => {
    if (!gameState || !selectedSubmissionId) return;
    if (isPreview || !playerId) {
      dispatch({ type: 'submit:vote' });
      return;
    }
    socket.emit('vote:cast', roomCode, selectedSubmissionId, playerId);
    dispatch({ type: 'submit:vote' });
  };

  const handleLeaveRoom = async () => {
    if (isPreview || !playerId) return;
    leaveSocketRoom(roomCode);
    await leaveRoom(roomCode, playerId);
    navigate('/lobby');
  };

  const handleResetRoom = async () => {
    if (isPreview || !playerId) return;
    if (gameState?.hostId !== playerId) {
      console.log('Only host can reset room!');
      return;
    }
    await resetRoom(roomCode);
    resetSocketRoom(roomCode);
  };

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-3xl text-primary animate-pulse">LOADING...</p>
      </div>
    );
  }

  return (
    <ClickSpark sparkColor="#ffffff" className="w-full min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-primary">
        {/* background */}
        <Particles
          particleColors={['#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
        {/* header */}
        <header className="relative flex items-center justify-between border-b-2 border-primary bg-background px-6 py-2">
          <TitleHeader />
          <span className="text-2xl font-bold text-accent">
            {roundResult?.isGameOver
              ? 'GAME OVER'
              : `Round: ${gameState.round.roundNumber} / ${gameState.totalRounds}`}
          </span>
          {/* top right username and avatar? */}
          <div className="flex items-center gap-4">
            <span className="text-2xl uppercase text-primary">{guestUser?.name ?? ''}</span>
            <LetterAvatar name={guestUser?.name ?? ''} />
          </div>
        </header>

        {/* hero section ig */}
        <main className="relative flex-1">
          {phase === 'submitting' && (
            <SubmittingPhase
              blackCard={gameState.round.blackCard}
              hand={gameState.hand}
              selectedCardId={selectedCardId}
              isSubmitDisabled={!selectedCardId || hasSubmittedCard}
              onSelectCard={(nextSelectedCardId) =>
                dispatch({ type: 'select:card', selectedCardId: nextSelectedCardId })
              }
              onSubmit={submitCard}
              phaseEndsAt={gameState.round.phaseEndsAt}
            />
          )}
          {phase === 'waiting' && (
            <p className="flex min-h-screen items-center justify-center text-4xl text-accent animate-pulse">
              WAITING FOR OTHERS...
            </p>
          )}
          {phase === 'voting' && (
            <VotingPhase
              submissions={submissions}
              selectedSubmissionId={selectedSubmissionId}
              onSelectSubmission={(nextSelectedSubmissionId) =>
                dispatch({
                  type: 'select:submission',
                  selectedSubmissionId: nextSelectedSubmissionId,
                })
              }
              hasVoted={hasVoted}
              onVote={submitVote}
              playerId={playerId!}
              gameState={gameState}
            />
          )}
          {phase === 'results' && roundResult && (
            <ResultsPhase
              roundResult={roundResult}
              submissions={submissions}
              onLeave={handleLeaveRoom}
              onReset={handleResetRoom}
              gameState={gameState}
              playerId={playerId!}
            />
          )}
        </main>
      </div>
    </ClickSpark>
  );
}
