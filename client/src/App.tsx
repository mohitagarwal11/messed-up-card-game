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
  name: 'Test Room',
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
      name: 'tester1',
      score: 2,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-3',
      name: 'tester2',
      score: 1,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-4',
      name: 'tester3',
      score: 0,
      status: 'active',
      isHost: false,
      isBot: true,
    },
    {
      id: 'player-5',
      name: 'tester4',
      score: 2,
      status: 'active',
      isHost: false,
    },
    {
      id: 'player-6',
      name: 'tester5',
      score: 1,
      status: 'active',
      isHost: false,
      isBot: true,
    },
  ],
};

const MOCK_BLACK_CARD = {
  id: 99,
  color: 'black' as const,
  text: 'The secret ingredient in your favorite street food: _____',
  pick: 1,
};

const MOCK_HAND = [
  { id: 1, color: 'white' as const, text: 'A startup idea I had in the shower', pick: 1 },
  { id: 2, color: 'white' as const, text: 'My feelings', pick: 1 },
  { id: 3, color: 'white' as const, text: 'A bag of dicks', pick: 1 },
  { id: 4, color: 'white' as const, text: 'Inflation', pick: 1 },
  { id: 5, color: 'white' as const, text: 'A flaming bag of horse shit', pick: 1 },
  { id: 6, color: 'white' as const, text: 'A suspicious amount of coconut oil', pick: 1 },
];

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    playerId: 'player-2',
    card: { id: 99, color: 'white', text: 'A bucket of unclaimed underwear', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-2',
    playerId: 'player-3',
    card: { id: 4, color: 'white', text: 'Inflation', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-3',
    playerId: 'player-4',
    card: { id: 45, color: 'white', text: 'A suspicious amount of coconut oil', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-4',
    playerId: 'player-5',
    card: { id: 2, color: 'white', text: 'My feelings', pick: 1 },
    isAutoPicked: false,
  },
  {
    id: 'sub-5',
    playerId: 'player-6',
    card: { id: 11, color: 'white', text: 'Crippling depression', pick: 1 },
    isAutoPicked: false,
  },
];

const MOCK_ROUND_RESULT: RoundResult = {
  winners: ['player-3'],
  players: [
    {
      id: DEV_PLAYER_ID,
      name: 'DevPlayer',
      score: 2,
      status: 'active',
      isHost: true,
    },
    { id: 'player-2', name: 'tester1', score: 1, status: 'active', isHost: false },
    { id: 'player-3', name: 'tester2', score: 3, status: 'active', isHost: false },
    { id: 'player-4', name: 'tester3', score: 2, status: 'active', isHost: false },
    { id: 'player-5', name: 'tester4', score: 1, status: 'active', isHost: false },
    { id: 'player-6', name: 'tester5', score: 1, status: 'active', isHost: false },
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
      phaseEndsAt: 30,
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
