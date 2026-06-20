import { motion } from 'motion/react';
import type { Room } from '../../../shared/types';
import { useState } from 'react';

type RoomInfoPanelProps = {
  room: Room;
  hostName: string;
  isHost: boolean;
  starting: boolean;
  copied: boolean;
  onCopyCode: () => void;
  onLeave: () => void;
  onStart: () => void;
};

export default function RoomInfoPanel({
  room,
  hostName,
  isHost,
  starting,
  copied,
  onCopyCode,
  onLeave,
  onStart,
}: RoomInfoPanelProps) {
  const canStart = room.players.length >= 3 && !starting;
  const [isCodeHover, setCodeHover] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.5, translateY: 100 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ duration: 0.5, ease: 'easeIn' }}
      className="flex flex-col border-2 border-primary bg-black p-5 aspect-5/7 text-primary min-w-100"
    >
      {/* title */}
      <div className="flex flex-col border-b border-primary/50">
        <p className="text-s tracking-[0.15em] uppercase text-primary/65">Room Name</p>
        <motion.h2
          className="text-[clamp(2.4rem,10vw,3.2rem)] uppercase leading-none text-primary truncate"
          whileHover={{ letterSpacing: '0.1em' }}
        >
          {room.name}
        </motion.h2>
      </div>

      {/* host and mode */}
      <div className="flex justify-between text-s text-primary/60 mt-3 uppercase">
        <p className="tracking-[0.15em]">
          Hosted by <span className="text-accent">{hostName}</span>
        </p>
        <span className="text-primary">{room.is_private ? 'Private' : 'Public'}</span>
      </div>

      {/* seats + rounds */}
      <div className="mt-4 flex items-end justify-between gap-6">
        <div>
          <p className="text-s tracking-[0.15em] uppercase text-primary/60">Seats</p>
          <p className="mt-1 text-3xl font-bold leading-none">
            {room.players.length}
            <span className="text-primary/50">/{room.max_players}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-s tracking-[0.15em] uppercase text-primary/60">Round</p>
          <p className="mt-1 text-3xl font-bold leading-none">
            {room.current_round}
            <span className="text-primary/50">/{room.total_rounds}</span>
          </p>
        </div>
      </div>

      {/* room code */}
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 p-4">
        <p className="text-s tracking-[0.15em] uppercase text-primary/60">Room Code</p>
        <motion.h2
          className="text-[clamp(2rem,10vw,2.8rem)] uppercase leading-none text-accent"
          animate={{ letterSpacing: isCodeHover ? '0.15em' : '0em' }}
        >
          {room.code}
        </motion.h2>
        <motion.button
          type="button"
          onClick={onCopyCode}
          onMouseEnter={() => setCodeHover(true)}
          onMouseLeave={() => setCodeHover(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="rounded-full border-2 border-primary px-5 py-1.5 text-xs font-bold tracking-[0.15em] uppercase text-primary transition-colors hover:bg-primary hover:text-black"
        >
          {copied ? 'Copied' : 'Copy code'}
        </motion.button>
      </div>

      {/* buttons */}
      <div className="mt-3 space-y-2">
        {room.players.length < 3 && (
          <p className="text-center text-sm tracking-[0.15em] uppercase text-accent animate-pulse">
            Need {3 - room.players.length} more imbecil to start...
          </p>
        )}

        {!isHost && (
          <p className="text-center text-sm tracking-[0.15em] uppercase text-accent animate-pulse">
            Waiting for host to start...
          </p>
        )}

        {isHost && (
          <motion.button
            type="button"
            disabled={!canStart}
            onClick={onStart}
            whileHover={{ scale: 1.05, letterSpacing: '0.1em' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
            className={`w-full text-3xl font-bold bg-accent text-black uppercase border-2 py-3 leading-none ${
              canStart
                ? 'bg-accent text-black active:translate-y-0.5'
                : 'cursor-not-allowed border-secondary bg-secondary text-secondary-foreground'
            }`}
          >
            {starting ? 'Starting...' : 'Start Game'}
          </motion.button>
        )}

        <motion.button
          type="button"
          onClick={onLeave}
          whileHover={{ scale: 1.05, letterSpacing: '0.1em' }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
          className={`w-full text-2xl border-2 border-primary bg-black py-3 leading-none font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-black`}
        >
          Leave Room
        </motion.button>
      </div>
    </motion.article>
  );
}
