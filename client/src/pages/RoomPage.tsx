import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLobbyState, leaveRoom } from '../api/rooms';
import type { Room } from '../../../shared/types';
import { PlayerCard } from '../components/PlayerCard';
import socket from '../socket/index';

export default function RoomPage() {
  const leavingRef = useRef(false);
  const { code } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLobbyState(code!);
        setRoom(data);
      } catch {
        navigate('/', { replace: true });
      }
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [code, navigate]);

  useEffect(() => {
    return () => {
      if (leavingRef.current) return;
      const playerId = localStorage.getItem('playerId');
      if (!playerId || !code) return;
      fetch(`/api/rooms/${code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
        keepalive: true,
      });
    };
  }, [code]);

  //socket events handling
  useEffect(() => {
    socket.connect();
    socket.emit('room:join', {
      roomCode: code!,
      playerName: JSON.parse(localStorage.getItem('guestUser') ?? 'null')?.name ?? '',
    });

    socket.on('room:state', (room) => {
      if (room.status === 'in_progress') {
        navigate(`/game/${code}`, { replace: true });
      }
    });

    return () => {
      socket.off('room:state');
      socket.disconnect();
    };
  }, [code, navigate]);

  const handleLeave = async () => {
    const playerId = localStorage.getItem('playerId');
    if (!playerId || !code) return;
    leavingRef.current = true;
    await leaveRoom(code, playerId);
    navigate('/lobby');
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="font-display text-3xl text-primary-container animate-pulse">LOADING...</p>
      </div>
    );
  }

  const activePlayers = room.players.filter((p) => p.status === 'active');
  console.log(activePlayers);
  const hostName = room.players.find((p) => p.isHost)?.name ?? '—';
  const playerId = localStorage.getItem('playerId');
  const isHost = room.players.find((p) => p.isHost)?.id === playerId;

  return (
    <div className="page-shell flex h-screen flex-col">
      {/* ── Header — same structure as LobbyPage ─────────── */}
      <header className="relative z-10 flex items-center justify-between border-b-2 border-primary bg-background px-6 py-4 xl:px-8">
        <div className="font-display text-2xl uppercase tracking-tight text-primary-container xl:text-4xl">
          Messed Up Cards
        </div>

        {/* Centred room badge */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <div className="bg-primary-container text-on-primary px-4 py-1 border-2 border-black neo-shadow">
            <span className="font-mono-ui text-sm">ROOM: {room.name}</span>
          </div>
        </div>
      </header>

      {/* ── Main — same calc as LobbyPage ────────────────── */}
      <main className="relative z-10 flex h-[calc(100vh-100px)] flex-col xl:flex-row">
        {/* Left: Player list (60%) — mirrors LobbyPage right section */}
        <section className="flex w-full flex-col border-b-2 border-primary px-5 py-5 xl:w-[60%] xl:border-b-0 xl:border-r-2 xl:px-6 xl:py-6">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h1 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none tracking-tight text-primary">
              Players
            </h1>
            <span className="font-mono-ui text-sm uppercase tracking-[0.2em] text-secondary">
              {activePlayers.length}/{room.maxPlayers} active
            </span>
          </div>

          <div className="room-scrollbar flex-1 overflow-y-auto pr-0 xl:pr-4">
            <div className="flex flex-col gap-4 pb-6">
              {room.players.length === 0 ? (
                <p className="font-mono-ui text-sm text-outline mt-8 text-center">NO PLAYERS YET</p>
              ) : (
                room.players.map((player) => <PlayerCard key={player.id} player={player} />)
              )}
            </div>
          </div>

          {/* Room code strip — pinned to bottom of left col */}
          <div className="border-t-2 border-primary pt-4">
            <p className="font-mono-ui text-xs uppercase text-secondary mb-2">Room Code</p>
            <div className="flex items-center justify-between">
              <span className="font-display text-[clamp(1.8rem,3vw,2.5rem)] text-primary-container tracking-widest">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="neo-shadow active-press bg-primary-container p-2 text-on-primary hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Settings + button (40%) — mirrors LobbyPage aside */}
        <aside className="flex w-full flex-col gap-5 bg-surface-container-lowest px-5 py-5 xl:w-[40%] xl:px-6 xl:py-6">
          <section className="space-y-4">
            <h2 className="font-display text-[clamp(1.5rem,2vw,2.2rem)] uppercase leading-none text-primary">
              Room Settings
            </h2>

            <div className="space-y-3">
              {/* each row: label + value, same as LobbyPage form field layout */}
              <div className="flex items-center justify-between border-b border-primary border-opacity-20 pb-2">
                <span className="font-mono-ui text-xs uppercase text-secondary">Host</span>
                <span className="font-display text-base text-primary-container">{hostName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-primary border-opacity-20 pb-2">
                <span className="font-mono-ui text-xs uppercase text-secondary">Mode</span>
                <span className="bg-primary-container px-2 font-mono-ui text-xs text-on-primary">
                  {room.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-primary border-opacity-20 pb-2">
                <span className="font-mono-ui text-xs uppercase text-secondary">Rounds</span>
                <span className="font-display text-base text-primary">
                  {room.currentRound} / {room.totalRounds}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-primary border-opacity-20 pb-2">
                <span className="font-mono-ui text-xs uppercase text-secondary">Players</span>
                <span className="font-display text-base text-primary">
                  {activePlayers.length} / {room.maxPlayers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-xs uppercase text-secondary">Room</span>
                <span className="font-display text-base text-primary">{room.name}</span>
              </div>
            </div>
          </section>

          <div className="h-1 w-full bg-primary opacity-20" />

          <section className="space-y-4">
            {isHost ? (
              <button
                type="button"
                onClick={() => socket.emit('game:start', { roomCode: code! })}
                className="neo-shadow active-press w-full bg-primary-container py-3 font-display text-2xl uppercase text-on-primary-container"
              >
                Start Game1
              </button>
            ) : (
              <div className="font-mono-ui text-xs uppercase text-primary-container animate-pulse">
                Waiting for host...
              </div>
            )}

            <button
              type="button"
              onClick={handleLeave}
              className="active-press w-full border-4 border-primary py-3 font-display text-2xl uppercase text-primary transition-colors hover:bg-primary hover:text-background"
            >
              Leave Room
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
}
