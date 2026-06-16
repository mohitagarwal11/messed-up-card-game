# Project Context

## 1. Project Overview
**Messed Up Cards** is a web‑based implementation of a party card game inspired by *Cards Against Humanity*.  Players join a lobby (public or private), the host starts the game, and each round proceeds through three phases:
1. **Submitting** – a black card is shown and each player selects a white card from their hand.
2. **Voting** – submitted white cards are displayed (excluding the player's own) and everyone votes for the best answer.
3. **Results** – the winning submission is revealed, scores are updated and the next round begins.

The primary purpose is to provide a lightweight, real‑time multiplayer experience that can be run locally (or deployed) without external authentication services.

### Main User Flows
* Guest user creation (no sign‑up required).
* Create a new room or join an existing public/private room.
* Host starts the game → rounds progress automatically with timers.
* Players submit cards, vote, view results, and the game ends after the configured number of rounds.

## 2. Tech Stack
| Layer | Technology |
|-------|------------|
| Front‑end | React (functional components), TypeScript, Vite, Tailwind CSS, React‑Router‑DOM, Axios, socket.io‑client |
| State Management | Local component state (`useState`, `useEffect`).  The project includes **zustand** as a dependency but it is not currently used.
| Back‑end | Node.js, Express, TypeScript, socket.io, `postgres` library for raw SQL, dotenv for env variables |
| Database | PostgreSQL (accessed via raw SQL, no ORM) |
| Build / Dev Tools | `npm` scripts, `concurrently` (run client & server together), `tsx` for server hot‑reloading, `tsc` for type‑checking |

## 3. Repository Structure
```
PROJECT_ROOT/
├─ .clinerules               # Project‑specific coding guidelines
├─ .prettierrc               # Prettier configuration
├─ README.md
├─ package.json              # Root scripts (dev, install:all)
├─ client/                   # React front‑end
│   ├─ package.json
│   ├─ tsconfig.json
│   ├─ vite.config.ts
│   ├─ tailwind.config.js
│   └─ src/
│       ├─ main.tsx          # React entry point
│       ├─ App.tsx           # Router definition
│       ├─ globals.d.ts
│       ├─ api/              # Thin wrappers around Axios
│       ├─ components/       # UI components (cards, header, avatar, etc.)
│       ├─ pages/            # Route pages (Landing, Lobby, Room, Game)
│       └─ socket/           # socket.io client instance
├─ server/                   # Express back‑end
│   ├─ package.json
│   ├─ tsconfig.json
│   └─ src/
│       ├─ index.ts          # Server bootstrap, socket.io setup
│       ├─ config/env.ts     # Loads .env variables
│       ├─ db/               # Raw‑SQL data‑access layer (player.ts, room.ts, client.ts)
│       ├─ routes/           # Express routers (rooms, users)
│       └─ utils/            # Helper utilities (room‑code generator)
└─ shared/                   # TypeScript types shared between client & server
    └─ types/index.ts
```

## 4. Architecture
* **Client‑Server Communication** – The UI uses REST endpoints (`/rooms`, `/users`) for CRUD‑style actions and a persistent **socket.io** connection for real‑time game events (phase changes, submissions, votes, round results).
* **Data Flow** – On page load the client fetches lobby or game state via the API, then listens to socket events:
  * `phase:vote` – server sends the list of submissions for the voting phase.
  * `round:end` – final round result.
  * `game:end` – final scores.
  * `room:reset` – host resets after game over.
* **State Management** – Each page/component keeps its own local state (React `useState`).  No global store is required for the current flow.
* **Server Architecture** – Express routes handle HTTP requests; a thin service layer (`src/db/*.ts`) performs raw SQL using the `postgres` library.  Socket.io events are emitted from the server logic in `src/index.ts` and from DB helper functions (e.g., `startSubmitTimer`).
* **Timers** – Server‑side `setTimeout` drives automatic card submission and voting when a player does not act within 30 seconds.

## 5. Database
* **Access Method** – Direct SQL via the `postgres` npm package; no ORM is used.
* **Core Tables** (inferred from queries):
  * `rooms` – room metadata (code, name, host, status, round counters).
  * `room_players` – player records linked to a room (guest name, score, status, host flag).
  * `cards` – master list of black and white cards.
  * `rounds` – each round belongs to a room and references a black card.
  * `submissions` – player‑card pairs for a given round.
  * `votes` – votes cast for submissions.
  * `player_hands` – mapping of a player to the white cards currently in their hand.
  * `round_winners` – records of winning submissions per round.
* **Relationships** – `rooms` 1‑* `room_players`; `rooms` 1‑* `rounds`; `rounds` 1‑* `submissions`; `submissions` 1‑* `votes`; `room_players` 1‑* `player_hands`.
* **Migrations** – Not included in the repository; the schema is expected to be created externally (e.g., via a separate migration tool or manual SQL scripts).

## 6. Frontend Patterns
* **Component Organization** – UI components live under `src/components`; page‑level components under `src/pages`.  Reusable pieces (cards, header, avatar) are pure functional components.
* **Styling** – Tailwind CSS utility classes are used throughout; a small `index.css` provides global styles.
* **State Management** – Local component state (`useState`, `useEffect`).  The imported `zustand` library is currently unused.
* **Routing** – React Router v6 (`Routes`/`Route`) defines four routes: `/` (landing), `/lobby`, `/lobby/:code`, `/game/:code`.
* **API Layer** – Thin wrapper modules (`api/client.ts`, `api/rooms.ts`, `api/users.ts`) expose async functions that return the `data` field from Axios responses.
* **Socket Layer** – A singleton socket instance (`socket/index.ts`) connects to `http://localhost:3001` and is used by pages to emit and listen for game events.

## 7. Backend Patterns
* **API Organization** – Express routers (`routes.rooms.ts`, `routes.users.ts`) are mounted under `/rooms` and `/users` respectively.
* **Service Layer** – All database interactions are encapsulated in `src/db/*.ts`.  Functions return plain objects that match the shared TypeScript types.
* **Authentication** – Very lightweight; a guest user is created via `POST /users/guest` which returns a UUID.  No session or token handling.
* **Real‑time Features** – Socket.io events drive the game lifecycle.  Server‑side timers enforce automatic actions for inactive players.
* **Error Handling** – Routes wrap logic in `try/catch` and return appropriate HTTP status codes.  Socket handlers emit an `error` event on failure.

## 8. Development Conventions
* **Naming** – PascalCase for React components, camelCase for functions/variables, snake_case for database columns.
* **Type Safety** – Shared types (`shared/types/index.ts`) are imported on both client and server to guarantee contract compatibility.
* **Project Rules** – As defined in `.clinerules`:
  * Modify only files directly related to a task.
  * Prefer small, targeted changes over large rewrites.
  * Keep TypeScript strict (`strict: true`).
  * Run builds from the appropriate sub‑directory (`client/` or `server/`).
* **Linting / Formatting** – ESLint and Prettier are configured; scripts are provided in each `package.json`.

## 9. Important Files
* `package.json` (root) – defines the `dev` script that runs both client and server concurrently.
* `client/package.json` – client dependencies and build scripts.
* `server/package.json` – server dependencies and start scripts.
* `client/tsconfig.json` & `server/tsconfig.json` – TypeScript compiler options.
* `shared/types/index.ts` – canonical type definitions used by both sides.
* `client/src/App.tsx` – top‑level router.
* `client/src/main.tsx` – ReactDOM bootstrap.
* `client/src/socket/index.ts` – socket.io client configuration.
* `server/src/index.ts` – Express & socket.io server bootstrap.
* `server/src/routes/routes.rooms.ts` – REST API for room lifecycle.
* `server/src/routes/routes.users.ts` – Guest user endpoint.
* `server/src/db/*` – data‑access functions (room, player, client).
* `server/src/utils/generateRoomCode.ts` – helper for unique room codes.

## 10. Future AI Agent Notes
* **Pitfalls**
  * The server expects a `DATABASE_URL` environment variable; without it the DB client will fail to connect.
  * CORS is locked to `http://localhost:5173`; changing the client port requires updating the server CORS config.
  * Socket.io URLs are hard‑coded (`http://localhost:3001`).  Deployments must adjust these values.
  * The database schema is not version‑controlled in this repo – any schema change must be coordinated with the raw‑SQL queries.
* **Sensitive Areas** – Modifying table structures, changing socket event names, or altering shared type definitions can break the contract between client and server.
* **Assumptions** – The game runs on a single Node process; timers are server‑side and rely on the process staying alive.  No scaling or clustering is currently considered.

---
*This document is intended as a long‑term knowledge base for future AI agents or developers working on the **Messed Up Cards** codebase.*
