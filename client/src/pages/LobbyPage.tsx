import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getPublicRooms, getRoomByCode, joinRoom } from '../api/rooms';
import { motion } from 'motion/react';
import { LetterAvatar } from '../components/LetterAvatar';

import CheckPattern from '../components/CheckPattern';
import TitleHeader from '../components/TitleHeader';

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
    status: 'WAITING',
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
    status: 'WAITING',
  },
  {
    id: '4',
    code: 'JKL83N',
    name: 'Bad Decisions Only',
    player_count: 8,
    max_players: 8,
    total_rounds: 20,
    status: 'WAITING',
  },
  {
    id: '5',
    code: 'PQR15Y',
    name: 'Group Chat Evidence',
    player_count: 5,
    max_players: 8,
    total_rounds: 15,
    status: 'WAITING',
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
    status: 'WAITING',
  },
  {
    id: '8',
    code: 'GHT90M',
    name: 'Unsupervised Adults',
    player_count: 8,
    max_players: 8,
    total_rounds: 10,
    status: 'WAITING',
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
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [totalRounds, setTotalRounds] = useState('10');
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomRows, setRoomRows] = useState<PublicRoom[]>([]);
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
        total_round: room.total_rounds,
        status: 'WAITING',
      }));
      setRoomRows(rows);
    });
    // setRoomRows(MOCK_PUBLIC_ROOMS);
  }, [isPreview]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* background check pattern */}
      <CheckPattern />

      <header className="relative flex items-center justify-between border-b-4 border-primary bg-background py-2 px-6 tracking-tight">
        {/* title */}
        <TitleHeader />

        {/* all errors on header cuz why not */}
        {error && (
          <p className="text-s tracking-wide uppercase text-destructive">
            {error}
          </p>
        )}

        {/* top right username and avatar? */}
        <div className="flex items-center gap-4">
          <span className="text-2xl uppercase text-primary">{guestUser?.name ?? ''}</span>

          <LetterAvatar name={guestUser?.name ?? ''} />
        </div>
      </header>

      <main className="relative flex h-[calc(100vh-75px)] flex-col xl:flex-row">
        {/* custom room and private room area */}
        <aside className="flex w-full flex-col gap-5 border-b-2 border-primary bg-background p-5 xl:w-[30%] xl:border-r-2 xl:border-b-0">
          {/* create custom room */}
          <section className="space-y-2">
            <h2 className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary">
              Create Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <label className="text-xs tracking-widest uppercase text-secondary-foreground">
                Room Name
              </label>

              <motion.input
                type="text"
                autoFocus
                required
                maxLength={24}
                value={roomName}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                placeholder="Enter room name..."
                onChange={(event) => setRoomName(event.target.value)}
                className="relative w-full tracking-widest bg-background border-2 border-foreground text-foreground p-3 outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
              />

              <motion.button
                type="button"
                onClick={() => setIsPrivate((value) => !value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                  <label className="text-xs tracking-widest uppercase text-secondary-foreground">
                    Max Players (min 3)
                  </label>

                  <motion.select
                    value={maxPlayers}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onChange={(event) => setMaxPlayers(event.target.value)}
                    className="w-full border-2 border-primary bg-background p-3 tracking-widest text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                  </motion.select>
                </div>

                <div>
                  <label className="text-xs tracking-widest uppercase text-secondary-foreground">
                    Total Rounds
                  </label>

                  <motion.select
                    value={totalRounds}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onChange={(event) => setTotalRounds(event.target.value)}
                    className="w-full border-2 border-primary bg-background p-3 tracking-widest text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="25">25</option>
                  </motion.select>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-2xl font-extrabold bg-accent text-black py-3 uppercase"
              >
                start room
              </motion.button>
            </form>
          </section>

          {/* join private room */}
          <section className="mt-4 space-y-2">
            <h2 className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary">
              Join Private
            </h2>

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
                whileTap={{ scale: 0.98 }}
                placeholder="XXXXXX"
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                className="relative w-full tracking-widest text-center bg-background border-2 border-foreground text-foreground p-3 outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
              />

              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-2xl font-extrabold bg-accent text-black py-3 uppercase"
              >
                Connect
              </motion.button>
            </form>
          </section>
        </aside>

        {/* public room area */}
        <section className="flex w-full flex-col border-r-0 border-primary p-5 xl:w-[70%]">
          {/* title and active room and refresh button */}
          <div className="flex items-end justify-between">
            <h1 className="text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none tracking-tight text-primary">
              Public Rooms
            </h1>
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
                      total_round: room.total_rounds,
                      status: 'WAITING',
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
          <div className="flex-1 overflow-y-auto pr-0 xl:pr-4">
            <div className="grid grid-cols-1 gap-4 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {roomRows.map((room) => {
                const isJoinable =
                  room.status === 'WAITING' && room.player_count < room.max_players;
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
                    whileHover={{ scale: 1.03 }}
                    whileTap={isJoinable ? { scale: 0.98 } : {}}
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
