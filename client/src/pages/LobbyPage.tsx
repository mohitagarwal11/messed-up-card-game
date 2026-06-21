import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getPublicRooms, getRoomByCode, joinRoom } from '../api/rooms';
import { motion } from 'motion/react';
import { LetterAvatar } from '../components/LetterAvatar';
import TitleHeader from '../components/TitleHeader';
import Particles from '../components/Particles';
import ClickSpark from '../components/ClickSpark';

type PublicRoom = {
  id: string;
  code: string;
  name: string;
  player_count: number;
  max_players: number;
  total_rounds: number;
  status: string;
};

type LobbyPageProps = {
  previewGuestUser?: {
    id: string;
    name: string;
  };
};

const MOCK_PUBLIC_ROOMS: PublicRoom[] = [
  {
    id: '1',
    code: 'FKD92A',
    name: 'Family Trauma Night',
    player_count: 6,
    max_players: 8,
    total_rounds: 10,
    status: 'waiting',
  },
  {
    id: '2',
    code: 'XQW71P',
    name: 'Therapy Was Cheaper',
    player_count: 8,
    max_players: 12,
    total_rounds: 5,
    status: 'IN PROGRESS',
  },
  {
    id: '3',
    code: 'MNC44Z',
    name: 'HR Violation Simulator',
    player_count: 2,
    max_players: 4,
    total_rounds: 10,
    status: 'waiting',
  },
  {
    id: '4',
    code: 'JKL83N',
    name: 'Bad Decisions Only',
    player_count: 8,
    max_players: 8,
    total_rounds: 20,
    status: 'waiting',
  },
  {
    id: '5',
    code: 'PQR15Y',
    name: 'Group Chat Evidence',
    player_count: 5,
    max_players: 8,
    total_rounds: 15,
    status: 'waiting',
  },
  {
    id: '6',
    code: 'ZTB67K',
    name: 'Future Regret Factory',
    player_count: 7,
    max_players: 8,
    total_rounds: 10,
    status: 'IN PROGRESS',
  },
  {
    id: '7',
    code: 'WED22R',
    name: 'Lawyer Recommended No',
    player_count: 3,
    max_players: 4,
    total_rounds: 5,
    status: 'waiting',
  },
  {
    id: '8',
    code: 'GHT90M',
    name: 'Unsupervised Adults',
    player_count: 8,
    max_players: 8,
    total_rounds: 10,
    status: 'waiting',
  },
];

export default function LobbyPage({ previewGuestUser }: LobbyPageProps) {
  const navigate = useNavigate();
  const guestUser =
    previewGuestUser ??
    (JSON.parse(localStorage.getItem('guestUser') ?? 'null') as {
      id: string;
      name: string;
    } | null);
  const isPreview = Boolean(previewGuestUser);

  useEffect(() => {
    if (!guestUser && !isPreview) navigate('/');
  }, [guestUser, isPreview, navigate]);

  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [totalRounds, setTotalRounds] = useState(10);
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomRows, setRoomRows] = useState<PublicRoom[]>(() =>
    isPreview ? MOCK_PUBLIC_ROOMS : [],
  );
  const activeRoomCount = roomRows.length;

  const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreview) {
      setError('Preview mode only');
      return;
    }
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
    if (isPreview) {
      setError('Preview mode only');
      return;
    }

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
    if (isPreview) {
      setError(`Preview mode only (${code})`);
      return;
    }

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
    if (isPreview) return;

    getPublicRooms().then((data) => {
      const rows: PublicRoom[] = data.map((room: PublicRoom) => ({
        id: room.id,
        code: room.code,
        name: room.name,
        player_count: room.player_count,
        max_players: room.max_players,
        total_rounds: room.total_rounds,
        status: room.status,
      }));
      setRoomRows(rows);
    });
    // setRoomRows(MOCK_PUBLIC_ROOMS);
  }, [isPreview]);

  return (
    <ClickSpark sparkColor="#ffffff" className="w-full min-h-screen">
      <div className="relative flex min-h-screen flex-col bg-background">
        {/* background */}
        <Particles
          particleColors={['#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
        <header className="relative flex items-center justify-between border-b-2 border-primary bg-black py-2 px-6">
          {/* title */}
          <TitleHeader />

          {/* all errors on header cuz why not */}
          {error && <p className="text-s tracking-wide uppercase text-destructive">{error}</p>}

          {/* top right username and avatar? */}
          <div className="flex items-center gap-4">
            <span className="text-2xl uppercase text-primary">{guestUser?.name ?? ''}</span>

            <LetterAvatar name={guestUser?.name ?? ''} />
          </div>
        </header>

        <main className="relative flex h-[calc(100vh-65px)] flex-col xl:flex-row">
          {/* custom room and private room area */}
          <aside className="flex w-full flex-col gap-5 border-b-2 border-primary p-5 xl:w-[30%] xl:border-r-2 xl:border-b-0">
            {/* create custom room */}
            <section className="space-y-2">
              <motion.h2
                className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary"
                whileHover={{ letterSpacing: '0.1em' }}
              >
                Create Room
              </motion.h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <label className="text-s tracking-[0.18em] uppercase text-primary/60">
                  Room Name
                </label>

                <motion.input
                  type="text"
                  required
                  maxLength={24}
                  value={roomName}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  placeholder="Enter room name..."
                  onChange={(event) => setRoomName(event.target.value)}
                  className="relative w-full tracking-widest bg-background border-2 border-foreground text-foreground p-3 outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
                />

                <motion.button
                  type="button"
                  onClick={() => setIsPrivate((value) => !value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
                  className={`group relative overflow-hidden w-full border-2 p-3 tracking-widest uppercase transition-colors ${
                    isPrivate
                      ? 'border-primary bg-primary text-background'
                      : 'border-primary text-primary'
                  }`}
                >
                  <span className="block transition-transform duration-300 group-hover:-translate-y-15">
                    {isPrivate ? 'Private Room: ON' : 'Private Room: OFF'}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center translate-y-15 transition-transform duration-300 group-hover:translate-y-0">
                    {isPrivate ? 'me too :(' : 'Oh I see, u r scared of getting judged'}
                  </span>
                </motion.button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-s tracking-[0.18em] uppercase text-primary/60">
                      Max Players ({maxPlayers})
                    </label>

                    <motion.input
                      type="range"
                      min={3}
                      max={8}
                      step={1}
                      value={maxPlayers}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onChange={(event) => setMaxPlayers(Number(event.target.value))}
                      className="w-full accent-primary"
                    />

                    <div className="flex justify-between text-s text-primary tracking-widest">
                      <span>3</span>
                      <span>8</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-s tracking-[0.18em] uppercase text-primary/60">
                      Total Rounds ({totalRounds})
                    </label>

                    <motion.input
                      type="range"
                      min={3}
                      max={20}
                      step={1}
                      value={totalRounds}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onChange={(event) => setTotalRounds(Number(event.target.value))}
                      className="w-full accent-primary"
                    />

                    <div className="flex justify-between text-s text-primary tracking-widest">
                      <span>3</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, letterSpacing: '0.15em' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
                  className="w-full text-3xl font-extrabold bg-accent text-black py-3 uppercase"
                >
                  create
                </motion.button>
              </form>
            </section>

            {/* join private room */}
            <section className="mt-4 space-y-2">
              <motion.h2
                className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary"
                whileHover={{ letterSpacing: '0.1em' }}
              >
                Join private
              </motion.h2>

              <form onSubmit={handleJoinPrivateRoom} className="space-y-4">
                <label className="text-xs tracking-widest uppercase text-secondary-foreground">
                  Secret Room Code
                </label>

                <motion.input
                  type="text"
                  autoFocus
                  required
                  minLength={6}
                  maxLength={6}
                  value={roomCode}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  placeholder="XXXXXX"
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  className="relative w-full tracking-widest text-center bg-background border-2 border-foreground text-foreground p-3 outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
                />

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05, letterSpacing: '0.15em' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
                  className="w-full text-3xl font-extrabold bg-accent text-black py-3 uppercase"
                >
                  join
                </motion.button>
              </form>
            </section>
          </aside>

          {/* public room area */}
          <section className="flex w-full flex-col border-r-0 border-primary p-5 xl:w-[70%]">
            {/* title and active room and refresh button */}
            <div className="flex items-end justify-between ml-3">
              <motion.h2
                className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary"
                whileHover={{ letterSpacing: '0.1em' }}
              >
                Public Rooms
              </motion.h2>
              <div>
                <span className="text-sm uppercase tracking-[0.2em] text-secondary-foreground">
                  {activeRoomCount} rooms active
                </span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isPreview) {
                      setRoomRows(MOCK_PUBLIC_ROOMS);
                      return;
                    }
                    getPublicRooms().then((data) => {
                      const rows: PublicRoom[] = data.map((room: PublicRoom) => ({
                        id: room.id,
                        code: room.code,
                        name: room.name,
                        player_count: room.player_count,
                        max_players: room.max_players,
                        total_rounds: room.total_rounds,
                        status: room.status,
                      }));
                      setRoomRows(rows);
                    });
                  }}
                  className="text-sm px-4 underline"
                >
                  Refresh
                </a>
              </div>
            </div>

            {/* room cards */}
            <motion.div
              className="overflow-y-auto l:pr-4 grid grid-cols-1 gap-4 p-3 sm:grid-cols-2 md:grid-cols-3  2xl:grid-cols-4"
              initial={{ scale: 0.5, opacity: 0, translateY: 100 }}
              animate={{ scale: 1, opacity: 1, translateY: 0 }}
              transition={{ duration: 0.5 }}
            >
              {roomRows.map((room) => {
                const isJoinable =
                  room.status === 'waiting' && room.player_count < room.max_players;
                const isFull = room.player_count >= room.max_players;
                const backPun = isFull
                  ? 'ROOM FOR RENT (NOT)'
                  : room.status === 'IN PROGRESS'
                    ? 'CARDS ALREADY FLYING'
                    : 'JOIN NOW';

                return (
                  <motion.button
                    key={room.id}
                    onClick={() => handleJoinPublicRoom(room.code)}
                    disabled={!isJoinable}
                    className={`group relative h-48 w-full overflow-hidden border-2 perspective-[1000px] ${
                      isJoinable
                        ? 'border-primary bg-card text-primary cursor-pointer'
                        : 'border-border bg-secondary opacity-70 cursor-not-allowed'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 10,
                      mass: 1,
                    }}
                  >
                    <div className="relative h-full w-full transition-transform duration-500 transform-3d group-hover:transform-[rotateY(180deg)] focus:outline-none">
                      {/* card front */}
                      <div className="absolute inset-0 flex flex-col gap-3 p-5 backface-hidden">
                        <p className="text-start truncate text-2xl font-bold">{room.name}</p>

                        <div className="mt-auto flex items-end justify-between">
                          <div className="flex flex-col gap-1">
                            <p className="text-xs uppercase text-secondary-foreground">Players</p>
                            <p className="text-2xl font-bold">
                              {room.player_count}/{room.max_players}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-xs uppercase text-secondary-foreground">Rounds</p>
                            <p className="text-2xl font-bold">{room.total_rounds}</p>
                          </div>
                          <p className="mb-2 tracking-widest uppercase text-primary">
                            {room.status}
                          </p>
                        </div>
                      </div>

                      {/* card back */}
                      <div
                        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center backface-hidden transform-[rotateY(180deg)] ${
                          isJoinable ? 'bg-primary text-black' : 'bg-secondary'
                        }`}
                      >
                        <span className="text-2xl font-extrabold uppercase leading-tight">
                          {backPun}
                        </span>
                        {isJoinable && (
                          <span className="text-xs uppercase tracking-[0.15em] opacity-70">
                            deal me in
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </section>
        </main>
      </div>
    </ClickSpark>
  );
}
