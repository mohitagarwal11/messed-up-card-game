import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RoomPage from './pages/RoomPage';
// import SubmittingPhase from './components/SubmittingPhase';
// import VotingPhase from './components/VotingPhase';
// import ResultsPhase from './components/ResultsPhase';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage />
          // <SubmittingPhase
          //   blackCard={{ text: "What's the worst thing to say at a funeral?", pick: 1 }}
          //   hand={[
          //     { id: 1, color: 'white', text: 'A surprise party', pick: 1 },
          //     { id: 2, color: 'white', text: 'My feelings', pick: 1 },
          //     { id: 3, color: 'white', text: 'Nothing, forever', pick: 1 },
          //   ]}
          //   selectedCardId={null}
          //   onSelectCard={() => {}}
          //   onSubmit={() => {}}
          //   timeLeft={30000}
          //   hasSubmitted={false}
          //   roundNumber={2}
          //   totalRounds={10}
          // />

          // <ResultsPhase
          //   blackCard={{ text: "What's the worst thing to say at a funeral?", pick: 1 }}
          //   submissions={[
          //     {
          //       id: 'sub-1',
          //       playerId: 'player-2',
          //       card: { id: 2, color: 'white', text: 'A surprise party', pick: 1 },
          //       isAutoPicked: false,
          //     },
          //     {
          //       id: 'sub-2',
          //       playerId: 'player-3',
          //       card: { id: 3, color: 'white', text: 'My feelings', pick: 1 },
          //       isAutoPicked: false,
          //     },
          //   ]}
          //   roundResult={{
          //     winners: ['player-2'],
          //     players: [
          //       {
          //         id: 'dev-player-id',
          //         name: 'DevPlayer',
          //         score: 3,
          //         status: 'active',
          //         isHost: true,
          //       },
          //       { id: 'player-2', name: 'Alice', score: 5, status: 'active', isHost: false },
          //       { id: 'player-3', name: 'Bob', score: 1, status: 'active', isHost: false },
          //     ],
          //     isGameOver: false,
          //   }}
          //   roundNumber={2}
          //   totalRounds={10}
          //   onLeave={() => {}}
          // />

          // <VotingPhase
          //   blackCard={{ text: "What's the worst thing to say at a funeral?", pick: 1 }}
          //   submissions={[
          //     {
          //       id: 'sub-1',
          //       playerId: 'player-2',
          //       card: { id: 2, color: 'white', text: 'A surprise party', pick: 1 },
          //       isAutoPicked: false,
          //     },
          //     {
          //       id: 'sub-2',
          //       playerId: 'player-3',
          //       card: { id: 3, color: 'white', text: 'My feelings', pick: 1 },
          //       isAutoPicked: false,
          //     },
          //     {
          //       id: 'sub-3',
          //       playerId: 'player-4',
          //       card: { id: 4, color: 'white', text: 'Nothing, forever', pick: 1 },
          //       isAutoPicked: false,
          //     },
          //   ]}
          //   selectedSubmissionId={null}
          //   onSelectSubmission={() => {}}
          //   onVote={() => {}}
          //   timeLeft={20}
          //   hasVoted={false}
          //   playerId="dev-player-id"
          //   roundNumber={2}
          //   totalRounds={10}
          // />
        }
      />

      <Route path="/lobby" element={<LobbyPage />} />

      <Route path="/lobby/:code" element={<RoomPage />} />
      <Route path="/game/:code" element={<GamePage />} />
    </Routes>
  );
}
