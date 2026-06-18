import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getPublicRooms, getRoomByCode, joinRoom } from '../api/rooms';
import { LetterAvatar } from '../components/LetterAvatar';

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

type PublicRoom = {
  id: string;
  code: string;
  name: string;
  player_count: number;
  max_players: number;
  total_rounds: number;
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const guestUser = JSON.parse(localStorage.getItem('guestUser') ?? 'null') as {
    id: string;
    name: string;
  } | null;

  useEffect(() => {
    if (!guestUser) navigate('/');
  }, [guestUser, navigate]);

  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [totalRounds, setTotalRounds] = useState('10');
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [roomRows, setRoomRows] = useState<RoomRow[]>([]);
  const activeRoomCount = roomRows.length;

  const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { room, player } = await createRoom({
        name: roomName.trim(),
        isPrivate,
        maxPlayers: Number(maxPlayers),
        totalRounds: Number(totalRounds),
        playerName: guestUser!.name,
        hostId: guestUser!.id,
      });
      localStorage.setItem('playerId', player.id);
      navigate(`/lobby/${room.code}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Try again.');
    }
  };

  const handleJoinPrivateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const room = await getRoomByCode(roomCode);
      const { player } = await joinRoom(room.code, guestUser!.name);
      localStorage.setItem('playerId', player.id);
      navigate(`/lobby/${room.code}`);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Try again.');
    }
  };

  const handleJoinPublicRoom = async (code: string) => {
    try {
      const { player } = await joinRoom(code, guestUser!.name);
      localStorage.setItem('playerId', player.id);
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Try again.');
    }
  };

  useEffect(() => {
    getPublicRooms().then((data) => {
      const rows: RoomRow[] = data.map((room: PublicRoom) => ({
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
    <div className="page-shell flex h-screen flex-col">
      <header className="relative z-10 flex items-center justify-between border-b-2 border-primary bg-background px-6 py-4 xl:px-8">
        <div className="font-display text-2xl uppercase tracking-tight text-primary-container xl:text-4xl">
          Messed Up Cards
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
            <span className="font-display text-base uppercase leading-none text-primary xl:text-2xl">
              {guestUser?.name ?? ''}
            </span>
          </div>

          <LetterAvatar name={guestUser?.name ?? ''} isHost={false} />
        </div>
      </header>

      <main className="relative z-10 flex h-[calc(100vh-100px)] flex-col xl:flex-row">
        <aside className="flex w-full flex-col gap-5 border-t-4 border-primary border-r-2 bg-surface-container-lowest px-5 py-5 xl:w-[30%] xl:border-l-0 xl:border-t-0 xl:px-6 xl:py-6">
          {error && <p className="font-mono-ui text-xs uppercase text-error">{error}</p>}

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
        <section className="flex w-full flex-col border-r-0 border-primary px-5 py-5 xl:w-[70%] xl:px-6 xl:py-6">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h1 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none tracking-tight text-primary">
              Public Rooms
            </h1>

            <span className="font-mono-ui text-sm uppercase tracking-[0.2em] text-secondary">
              {activeRoomCount} rooms active
            </span>
          </div>
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
