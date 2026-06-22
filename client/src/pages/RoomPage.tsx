import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLobbyState, leaveRoom } from '../api/rooms';
import type { Room } from '../../../shared/types';
import socket, { joinSocketRoom, leaveSocketRoom } from '../socket/index';
import { motion } from 'motion/react';
import TitleHeader from '../components/TitleHeader';
import RoomInfoPanel from '../components/RoomPanelInfo';
import BoardPlayerCard from '../components/BoardPlayerCard';
import GridPlayerCard from '../components/GridPlayerCard';
import { getBoardPlayerLayout } from '../components/BoardLayout';
import Particles from '../components/Particles';
import ClickSpark from '../components/ClickSpark';

const PLAYER_CARD_BACKTEXT = [
  'The family disappointment spreadsheet needed a dedicated tab.',
  'A participation trophy that learned to talk.',
  'Someone who could turn a rescue mission into a missing persons case.',
  'The reason intelligence is measured as an average.',
  'Not the dumbest person alive, but clearly fighting for promotion.',
  'The human version of a typo.',
  'Proof that confidence and competence are not a package deal.',
  'Someone who treats common sense as an optional DLC.',
  'The kind of person who would lose a game of rock-paper-scissors against a wall.',
  'The human equivalent of a software update that fixes nothing.',
];

function getStableMotionTiming(seed: string) {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return {
    duration: 8 + (hash % 5),
    delay: 0.5 + ((hash >>> 3) % 7) * 0.25,
  };
}

type RoomPageProps = {
  previewRoom?: Room;
  previewPlayerId?: string;
};

export default function RoomPage({ previewRoom, previewPlayerId }: RoomPageProps) {
  const leavingRef = useRef(false);
  const { code } = useParams();
  const navigate = useNavigate();
  const isPreview = Boolean(previewRoom && !code);
  const roomCode = code ?? previewRoom?.code;

  const [starting, setStarting] = useState(false);
  const [room, setRoom] = useState<Room | null>(previewRoom ?? null);
  const [copied, setCopied] = useState(false);
  const playerId = localStorage.getItem('playerId') ?? previewPlayerId ?? null;

  useEffect(() => {
    if (isPreview || !code) return;

    const fetch = async () => {
      try {
        const data = await getLobbyState(code);
        setRoom(data);
      } catch {
        navigate('/', { replace: true });
      }
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [code, isPreview, navigate]);

  useEffect(() => {
    if (isPreview) return;

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
  }, [code, isPreview]);

  useEffect(() => {
    if (isPreview) return;

    const playerId = localStorage.getItem('playerId');
    if (playerId && code) {
      joinSocketRoom(code, playerId);
    }

    socket.on('room:state', (room) => {
      if (room.status === 'in_progress') {
        leavingRef.current = true;
        navigate(`/game/${code}`, { replace: true });
      }
    });

    socket.on('room:closing', (message) => {
      leavingRef.current = true;
      alert(message);
      navigate('/lobby');
    });

    return () => {
      socket.off('room:state');
      socket.off('room:closing');
    };
  }, [code, isPreview, navigate]);

  const handleLeave = async () => {
    if (isPreview) return;
    if (!playerId || !code) return;
    leavingRef.current = true;
    leaveSocketRoom(code);
    await leaveRoom(code, playerId);
    navigate('/lobby');
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (isPreview || !roomCode || !playerId) return;
    setStarting(true);
    socket.emit('game:start', roomCode, playerId);
  };

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-3xl text-accent animate-pulse">LOADING...</p>
      </div>
    );
  }

  const hostName = room.players.find((p) => p.isHost)?.name ?? '-';
  const isHost = room.players.find((p) => p.isHost)?.id === playerId;
  const playerLayouts = room.players.map((player, index) =>
    getBoardPlayerLayout(player, index, room.players.length),
  );
  const roomInfoMotionTiming = getStableMotionTiming(room.code);

  return (
    <ClickSpark sparkColor="#ffffff" className="w-full min-h-screen">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-primary">
        {/* background */}
        <Particles
          particleColors={['#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />

        <header className="relative flex items-center justify-between border-b-2 border-primary bg-background px-6 py-2">
          <TitleHeader />

          <div className="hidden items-center gap-3 sm:flex">
            <span className="border-2 border-primary px-3 py-1 text-sm tracking-[0.22em] uppercase">
              {room.players.length}/{room.max_players} seated
            </span>
            {isPreview && (
              <span className="border-2 border-accent bg-accent px-3 py-1 text-sm tracking-[0.22em] uppercase text-black">
                Preview
              </span>
            )}
          </div>
        </header>

        <main className="relative flex-1">
          {/* Desktop: floating board layout */}
          <section className="hidden h-[calc(100vh-100px)] overflow-hidden lg:block">
            {/* white player cards */}
            <div className="relative z-11 h-full w-full">
              {room.players.map((player, index) => (
                <BoardPlayerCard
                  key={player.id}
                  player={player}
                  backText={PLAYER_CARD_BACKTEXT[index % PLAYER_CARD_BACKTEXT.length]}
                  layout={playerLayouts[index]}
                />
              ))}
            </div>

            {/* black room info card */}
            <motion.div
              className="absolute inset-y-0 right-10 z-11 flex w-[30%] min-w-100 items-center justify-center p-6 lg:p-10"
              animate={{
                y: [0, -6, 0, 4, 0],
                rotate: [-5, -2.5, -5],
              }}
              transition={{
                duration: roomInfoMotionTiming.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: roomInfoMotionTiming.delay,
              }}
            >
              <RoomInfoPanel
                room={room}
                hostName={hostName}
                isHost={isHost}
                starting={starting}
                copied={copied}
                onCopyCode={handleCopyCode}
                onLeave={handleLeave}
                onStart={handleStart}
              />
            </motion.div>
          </section>

          {/* Mobile: scrollable panel + grid of player cards */}
          <section className="relative z-10 flex h-[calc(100vh-73px)] flex-col overflow-y-auto px-4 py-5 lg:hidden">
            <RoomInfoPanel
              room={room}
              hostName={hostName}
              isHost={isHost}
              starting={starting}
              copied={copied}
              onCopyCode={handleCopyCode}
              onLeave={handleLeave}
              onStart={handleStart}
            />

            <div className="mt-6 grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 md:grid-cols-4">
              {room.players.map((player, index) => (
                <GridPlayerCard
                  key={player.id}
                  player={player}
                  backText={PLAYER_CARD_BACKTEXT[index % PLAYER_CARD_BACKTEXT.length]}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </ClickSpark>
  );
}
