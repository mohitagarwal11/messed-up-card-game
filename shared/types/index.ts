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
  voteCount?: number;
}

export interface RoundState {
  id: string;
  roundNumber: number;
  blackCard: Card;
  phase: GamePhase;
  phaseEndsAt: number;
  submissions: Submission[];
  winners: string[];
}

export interface GameState {
  round: RoundState;
  hand: Card[];
  totalRounds: number;
  hostId: string;
}

export interface RoundResult {
  winners: string[];
  players: Player[];
  isGameOver: boolean;
}

export interface RoomCacheEntry {
  room: Room;
  hands: Record<string, Card[]>;
  votes: { voterId: string; submissionId: string }[];
  round: RoundState | null;
  deck: { white: Card[]; black: Card[] };
  sockets: Record<string, string>;
}

// ─── Socket Event Maps ───────────────────────────────────────
export interface ServerToClientEvents {
  'room:state': (room: Room) => void;
  'round:start': (round: RoundState, phaseEndsAt: number) => void;
  'phase:vote': (submissions: Submission[], phaseEndsAt: number) => void;
  'round:end': (result: RoundResult, phaseEndsAt: number) => void;
  'game:end': (finalScores: Player[]) => void;
  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;
  'hand:update': (hand: Card[]) => void;
  'room:reset:done': (roomCode: string) => void;
  'room:closing': (message: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (roomCode: string, playerId: string) => void;
  'room:leave': (roomCode: string) => void;
  'game:start': (roomCode: string, playerId: string) => void;
  'card:submit': (roomCode: string, cardId: number, playerId: string) => void;
  'vote:cast': (roomCode: string, submissionId: string, playerId: string) => void;
  'room:reset': (roomCode: string) => void;
}
