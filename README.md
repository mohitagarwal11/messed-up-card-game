# Messed Up Cards

A real-time multiplayer card game inspired by Cards Against Humanity. Players join public or private lobbies and compete through submit → vote → results round cycles, with all game state synchronized across clients via WebSockets.

No sign-up required — guest sessions are created automatically.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | PostgreSQL (raw SQL, no ORM) |
| Real-time | Socket.io (persistent WebSocket connections) |
| Shared | TypeScript types shared across client and server |

## Architecture

Communication is split across two layers:

- **REST** (`/rooms`, `/users`) — handles room creation, joining, guest user provisioning, and other CRUD-style lifecycle operations
- **WebSocket** (Socket.io) — drives all real-time game events: phase transitions, card submissions, votes, round results, and score updates

The server emits events (`phase:vote`, `round:end`, `game:end`, `room:reset`) that all connected clients in a room receive simultaneously. Server-side `setTimeout` timers enforce submission and voting deadlines automatically if a player is inactive, without breaking room state for other players.

A `shared/types/index.ts` module is imported by both the client and server, enforcing strict TypeScript contract compatibility across all Socket.io event payloads and REST responses at compile time.

```
client/          # React frontend
server/          # Express + Socket.io backend
  src/
    db/          # Raw SQL data-access layer
    routes/      # REST routers
    index.ts     # Server bootstrap + socket event handlers
shared/
  types/         # Shared TypeScript types (client + server)
```

## Game Flow

1. Guest session created on load (UUID, no auth required)
2. Create a new room or join via public lobby / private room code
3. Host starts the game
4. Each round: black card is shown → players submit a white card → all players vote → winner revealed → scores updated
5. Game ends after the configured number of rounds

## Database Schema

Core tables: `rooms`, `room_players`, `cards`, `rounds`, `submissions`, `votes`, `player_hands`, `round_winners`

All queries are raw SQL via the `postgres` npm package.

## Local Setup

```bash
# Clone the repo
git clone https://github.com/mohitagarwal11/messed-up-cards
cd messed-up-cards

# Install dependencies for client and server
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
# Add your DATABASE_URL to server/.env

# Run client and server concurrently
npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:3001`.

You'll need a PostgreSQL database and the schema applied before running. Schema migration scripts are not currently included in the repo.

## Status

Core gameplay is fully functional locally — room management, public/private lobbies, join-by-code, game phases, server-side timers, and scoring all work end-to-end.

In progress:
- Caching layer to reduce database round-trips
- Deployment configuration
- Schema migration tooling
