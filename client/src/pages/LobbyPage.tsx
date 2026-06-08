import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getPublicRooms, getRoomByCode } from '../api/rooms';

type RoomRow = {
  id: string;
  code: string;
  name: string;
  players: string;
  rounds: string;
  status: 'WAITING' | 'IN PROGRESS';
  actionLabel: string;
  disabled: boolean;
};

// hardcoding for now to focus on UI
// const roomRows: RoomRow[] = [
//   {
//     id: 'chaos-pit',
//     name: 'CHAOS_PIT_666',
//     players: '3/8',
//     rounds: '10',
//     status: 'WAITING',
//     actionLabel: 'JOIN',
//     disabled: false,
//   },
//   {
//     id: 'the-void',
//     name: 'THE_VOID',
//     players: '8/8',
//     rounds: '15',
//     status: 'IN PROGRESS',
//     actionLabel: 'FULL',
//     disabled: true,
//   },
//   {
//     id: 'death-match-a',
//     name: 'DEATH_MATCH_A',
//     players: '1/8',
//     rounds: '10',
//     status: 'WAITING',
//     actionLabel: 'JOIN',
//     disabled: false,
//   },
//   {
//     id: 'neon-nights',
//     name: 'NEON_NIGHTS',
//     players: '5/8',
//     rounds: '5',
//     status: 'WAITING',
//     actionLabel: 'JOIN',
//     disabled: false,
//   },
//   {
//     id: 'silent-hill',
//     name: 'SILENT_HILL',
//     players: '4/8',
//     rounds: '25',
//     status: 'IN PROGRESS',
//     actionLabel: 'LOCKED',
//     disabled: true,
//   },
//   // {
//   //   id: 'chaos-pit',
//   //   name: 'CHAOS_PIT_666',
//   //   players: '3/8',
//   //   rounds: '10',
//   //   status: 'WAITING',
//   //   actionLabel: 'JOIN',
//   //   disabled: false,
//   // },
//   // {
//   //   id: 'the-void',
//   //   name: 'THE_VOID',
//   //   players: '8/8',
//   //   rounds: '15',
//   //   status: 'IN PROGRESS',
//   //   actionLabel: 'FULL',
//   //   disabled: true,
//   // },
//   // {
//   //   id: 'death-match-a',
//   //   name: 'DEATH_MATCH_A',
//   //   players: '1/8',
//   //   rounds: '10',
//   //   status: 'WAITING',
//   //   actionLabel: 'JOIN',
//   //   disabled: false,
//   // },
//   // {
//   //   id: 'neon-nights',
//   //   name: 'NEON_NIGHTS',
//   //   players: '5/8',
//   //   rounds: '5',
//   //   status: 'WAITING',
//   //   actionLabel: 'JOIN',
//   //   disabled: false,
//   // },
//   // {
//   //   id: 'silent-hill',
//   //   name: 'SILENT_HILL',
//   //   players: '4/8',
//   //   rounds: '25',
//   //   status: 'IN PROGRESS',
//   //   actionLabel: 'LOCKED',
//   //   disabled: true,
//   // },
// ];

export default function LobbyPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [totalRounds, setTotalRounds] = useState('10');
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [roomRows, setRoomRows] = useState<RoomRow[]>([]);
  const activeRoomCount = roomRows.length;

  // these do as their name suggests
  const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: roomName.trim(),
      isPrivate,
      maxPlayers: Number(maxPlayers),
      totalRounds: Number(totalRounds),
    };

    console.log(payload);

    const room = await createRoom(payload);
    navigate(`/lobby/${room.code}`);
  };

  const handleJoinPrivateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const room = await getRoomByCode(roomCode);
    navigate(`/lobby/${room.code}`);
  };

  const handleJoinPublicRoom = (code: string) => {
    navigate(`/lobby/${code}`);
  };

  // to fetch public rooms when entering lobby refreshes or will add a reload button if needed in future
  useEffect(() => {
    getPublicRooms().then((data) => {
      const rows: RoomRow[] = data.map((room: any) => ({
        id: room.id,
        code: room.code,
        name: room.name,
        players: `${room.player_count}/${room.max_players}`,
        rounds: String(room.total_rounds),
        status: 'WAITING',
        actionLabel: 'JOIN',
        disabled: false,
      }));
      setRoomRows(rows);
    });
  }, []);

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <header className="relative z-10 flex items-center justify-between border-b-2 border-primary bg-background px-6 py-4 xl:px-8">
        <div className="font-display text-2xl uppercase tracking-tight text-primary-container xl:text-4xl">
          Messed Up Cards
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
            <span className="font-display text-base uppercase leading-none text-primary xl:text-2xl">
              DEGEN_KING_99
            </span>
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-primary-container">
              Points 42
            </span>
          </div>

          <div className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-surface-container">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-container to-surface-container-high" />
          </div>

          {/* leaderboard is for future  */}
          {/* <button
            type="button"
            className="p-2 text-primary transition-transform duration-75 active:translate-x-1 active:translate-y-1"
            aria-label="Leaderboard"
          >
            <span className="material-symbols-outlined text-3xl">leaderboard</span>
          </button> */}
        </div>
      </header>

      {/* create and join sections on the left bcuz i just realised mobile users would have a hard time accessing them at the bottom of the page */}
      <main className="relative z-10 flex h-[calc(100vh-100px)] flex-col xl:flex-row">
        {/* this part is for the create room and join private sections on the left */}
        <aside className="flex w-full flex-col gap-5 border-t-4 border-primary border-r-2 bg-surface-container-lowest px-5 py-5 xl:w-[30%] xl:border-l-0 xl:border-t-0 xl:px-6 xl:py-6">
          {/* create custom room */}
          <section className="space-y-4">
            <h2 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary">
              Create Room
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono-ui text-xs uppercase text-secondary">Room Name</label>

                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="ENTER_NAME..."
                  className="w-full border-2 border-primary bg-background p-3 font-mono-ui text-primary placeholder:text-surface-variant focus:border-primary-container focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsPrivate((value) => !value)}
                className={`w-full border-2 p-3 font-mono-ui uppercase transition-colors ${
                  isPrivate
                    ? 'border-primary bg-primary text-background'
                    : 'border-primary text-primary'
                }`}
              >
                {isPrivate ? 'Private Room: ON' : 'Private Room: OFF'}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono-ui text-xs uppercase text-secondary">
                    Max Players
                  </label>

                  <select
                    value={maxPlayers}
                    onChange={(event) => setMaxPlayers(event.target.value)}
                    className="w-full border-2 border-primary bg-background p-3 font-mono-ui text-primary focus:border-primary-container focus:outline-none"
                  >
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono-ui text-xs uppercase text-secondary">
                    Total Rounds
                  </label>

                  <select
                    value={totalRounds}
                    onChange={(event) => setTotalRounds(event.target.value)}
                    className="w-full border-2 border-primary bg-background p-3 font-mono-ui text-primary focus:border-primary-container focus:outline-none"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="25">25</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="neo-shadow active-press w-full bg-primary-container py-3 font-display text-2xl uppercase text-on-primary-container"
              >
                Start Room
              </button>
            </form>
          </section>

          <div className="h-1 w-full bg-primary opacity-20" />

          {/* join private room */}
          <section className="space-y-4">
            <h2 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary">
              Join Private
            </h2>

            <form onSubmit={handleJoinPrivateRoom} className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono-ui text-xs uppercase text-secondary">
                  Secret Room Code
                </label>

                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={6}
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className="w-full border-2 border-primary bg-background p-3 text-center font-mono-ui tracking-[0.35em] text-primary placeholder:text-surface-variant focus:border-primary-container focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="active-press w-full border-4 border-primary py-3 font-display text-2xl uppercase text-primary transition-colors hover:bg-primary hover:text-background"
              >
                Connect
              </button>
            </form>
          </section>
        </aside>
        {/* this part is for the public rooms on the right */}
        <section className="flex w-full flex-col border-r-0 border-primary px-5 py-5 xl:w-[70%] xl:px-6 xl:py-6">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h1 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none tracking-tight text-primary">
              Public Rooms
            </h1>

            <span className="font-mono-ui text-sm uppercase tracking-[0.2em] text-secondary">
              {activeRoomCount} rooms active
            </span>
          </div>
          {/* the list of public rooms is scrollable becuz it is just so cool */}
          <div className="room-scrollbar flex-1 overflow-y-auto pr-0 xl:pr-4">
            <div className="flex flex-col gap-4 pb-6">
              {roomRows.map((room) => (
                <article
                  key={room.id}
                  className={`border-2 px-8 py-3 transition-colors ${
                    room.disabled
                      ? 'border-outline bg-surface-container-low opacity-70'
                      : 'border-primary bg-surface-container'
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-[2.5fr_1fr_1fr_1.5fr] md:items-center">
                      <div className="flex flex-col gap-2">
                        <p className="font-mono-ui text-xs uppercase text-secondary">Room Name</p>
                        <p
                          className={`truncate font-body text-lg font-bold xl:text-xl ${
                            room.disabled ? 'text-secondary' : 'text-primary'
                          }`}
                        >
                          {room.name}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-mono-ui text-xs uppercase text-secondary">Players</p>
                        <p
                          className={`font-body text-xl font-bold ${
                            room.disabled ? 'text-secondary' : 'text-primary'
                          }`}
                        >
                          {room.players}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-mono-ui text-xs uppercase text-secondary">Rounds</p>
                        <p
                          className={`font-body text-xl font-bold ${
                            room.disabled ? 'text-secondary' : 'text-primary'
                          }`}
                        >
                          {room.rounds}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-mono-ui text-xs uppercase text-secondary">Status</p>
                        <p
                          className={`font-mono-ui text-base uppercase ${
                            room.status === 'WAITING' ? 'text-primary-container' : 'text-error'
                          }`}
                        >
                          {room.status}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={room.disabled}
                      onClick={() => handleJoinPublicRoom(room.code)}
                      className={`w-full px-8 py-2 font-mono-ui text-base uppercase md:w-auto ${
                        room.disabled
                          ? 'cursor-not-allowed bg-secondary-container text-on-secondary-container'
                          : 'neo-shadow active-press bg-primary-container text-on-primary-container'
                      }`}
                    >
                      {room.actionLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
