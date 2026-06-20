import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RoomPage from './pages/RoomPage';
import type { GameState, Room, RoundResult, Submission } from '../../shared/types';

type DevPreview =
  | null
  | 'lobby'
  | 'room'
  | 'game-submitting'
  | 'game-waiting'
  | 'game-voting'
  | 'game-results';

// Change this value while working on UI previews.
const DEV_PREVIEW: DevPreview = null;
const DEV_PLAYER_ID = 'dev-player-id';
const DEV_GUEST_USER = {
  id: 'guest-dev-1',
  name: 'DevPlayer',
};

const MOCK_ROOM: Room = {
  id: 'mock-room-1',
  host_id: DEV_PLAYER_ID,
  code: 'DEV123',
  name: 'UI Sandbox',
  is_private: true,
  max_players: 8,
  total_rounds: 10,
  status: 'waiting',
  current_round: 1,
  players: [
    {
      id: DEV_PLAYER_ID,
      name: 'DevPlayer',
      score: 0,
      status: 'active',
      isHost: true,
    },
    {
      id: 'player-2',
      name: 'Ayesha',
      score: 2,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-3',
      name: 'Marcus',
      score: 1,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-4',
      name: 'tester',
      score: 0,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-5',
      name: 'mohit',
      score: 2,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-6',
      name: 'Tisha',
      score: 1,
      status: 'active',
      isHost: false,
    },
  ],
};

const MOCK_BLACK_CARD = {
  id: 99,
  color: 'black' as const,
  text: "What's the worst thing to say at a funeral?",
  pick: 1,
};

const MOCK_HAND = [
  { id: 1, color: 'white' as const, text: 'A surprise party', pick: 1 },
  { id: 2, color: 'white' as const, text: 'My feelings', pick: 1 },
  { id: 3, color: 'white' as const, text: 'Nothing, forever', pick: 1 },
  { id: 4, color: 'white' as const, text: 'A surprise party', pick: 1 },
  { id: 5, color: 'white' as const, text: 'My feelings', pick: 1 },
  { id: 6, color: 'white' as const, text: 'Nothing, forever', pick: 1 },
];

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    playerId: 'player-2',
    card: { id: 11, color: 'white', text: 'A surprise party', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-2',
    playerId: 'player-3',
    card: { id: 12, color: 'white', text: 'My feelings', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-3',
    playerId: 'player-4',
    card: { id: 13, color: 'white', text: 'Nothing, forever', pick: 1 },
    isAutoPicked: false,
  },
];

const MOCK_ROUND_RESULT: RoundResult = {
  winners: ['player-2'],
  players: [
    {
      id: DEV_PLAYER_ID,
      name: 'DevPlayer',
      score: 3,
      status: 'active',
      isHost: true,
    },
    { id: 'player-2', name: 'Alice', score: 5, status: 'active', isHost: false },
    { id: 'player-3', name: 'Bob', score: 1, status: 'active', isHost: false },
  ],
  isGameOver: false,
};

function createMockGameState(
  phase: GameState['round']['phase'] = 'submitting',
  submissions: Submission[] = [],
): GameState {
  return {
    round: {
      id: 'round-2',
      roundNumber: 2,
      blackCard: MOCK_BLACK_CARD,
      phase,
      phaseEndsAt: 10,
      submissions,
      winners: [],
    },
    hand: MOCK_HAND,
    totalRounds: 10,
    hostId: DEV_PLAYER_ID,
  };
}

function getPreviewElement(preview: DevPreview) {
  switch (preview) {
    case 'lobby':
      return <LobbyPage previewGuestUser={DEV_GUEST_USER} />;
    case 'room':
      return <RoomPage previewRoom={MOCK_ROOM} previewPlayerId={DEV_PLAYER_ID} />;
    case 'game-submitting':
      return (
        <GamePage
          previewGameState={createMockGameState('submitting')}
          previewPlayerId={DEV_PLAYER_ID}
        />
      );
    case 'game-waiting':
      return (
        <GamePage
          previewGameState={createMockGameState('submitting')}
          previewPlayerId={DEV_PLAYER_ID}
          previewPhase="waiting"
        />
      );
    case 'game-voting':
      return (
        <GamePage
          previewGameState={createMockGameState('voting', MOCK_SUBMISSIONS)}
          previewPlayerId={DEV_PLAYER_ID}
          previewSubmissions={MOCK_SUBMISSIONS}
          previewPhase="voting"
        />
      );
    case 'game-results':
      return (
        <GamePage
          previewGameState={createMockGameState('results', MOCK_SUBMISSIONS)}
          previewPlayerId={DEV_PLAYER_ID}
          previewSubmissions={MOCK_SUBMISSIONS}
          previewRoundResult={MOCK_ROUND_RESULT}
          previewPhase="results"
        />
      );
    default:
      return <LandingPage />;
  }
}

export default function App() {
  const rootElement = getPreviewElement(DEV_PREVIEW);

  return (
    <Routes>
      <Route path="/" element={rootElement} />

      <Route path="/lobby" element={<LobbyPage />} />

      <Route path="/lobby/:code" element={<RoomPage />} />
      <Route path="/game/:code" element={<GamePage />} />
    </Routes>
  );
}
