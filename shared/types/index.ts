// ─── Enums ───────────────────────────────────────────────────
export type RoomStatus = 'waiting' | 'in_progress' | 'finished';
export type GamePhase = 'submitting' | 'voting' | 'results';
export type PlayerStatus = 'active' | 'disconnected';

// ─── Entities ────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
}

export interface Card {
  id: number;
  color: 'black' | 'white';
  text: string;
  pick: number;
}

export interface Room {
  id: string;
  host_id: string | null;
  code: string;
  name: string;
  is_private: boolean;
  max_players: number;
  total_rounds: number;
  status: RoomStatus;
  current_round: number;
  players: Player[];
}

export interface Submission {
  id: string;
  playerId: string;
  card: Card;
  isAutoPicked: boolean;
}

export interface RoundState {
  id: string;
  roundNumber: number;
  blackCard: Card;
  phase: GamePhase;
  phaseEndsAt: string;
  submissions: Submission[];
  winners: string[];
}

// ─── Socket Event Maps ───────────────────────────────────────
export interface ServerToClientEvents {
  'room:state': (room: Room) => void;
  'round:start': (round: RoundState) => void;
  'phase:vote': (submissions: Submission[]) => void;
  'round:end': (round: RoundState) => void;
  'game:end': (finalScores: Player[]) => void;
  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: { roomCode: string; playerName: string }) => void;
  'room:create': (payload: {
    name: string;
    isPrivate: boolean;
    maxPlayers: number;
    totalRounds: number;
    playerName: string;
  }) => void;
  'game:start': (payload: { roomCode: string; playerId: string }) => void;
  'card:submit': (payload: { cardId: number }) => void;
  'vote:cast': (payload: { submissionId: string }) => void;
}
