import { motion } from 'motion/react';
import type { Player } from '../../../shared/types';
import { useState } from 'react';

type GridPlayerCardProps = {
  player: Player;
  backText: string;
};

export default function GridPlayerCard({ player, backText }: GridPlayerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeIn' }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 0.95 }}
      onClick={() => setIsFlipped((p) => !p)}
      className="group mx-auto w-full max-w-44 perspective-distant sm:max-w-44 md:max-w-48 cursor-pointer"
    >
      <div
        className={`relative aspect-5/7 w-full transition-transform duration-500 transform-3d ${isFlipped ? 'transform-[rotateY(180deg)]' : ''}`}
      >
        <div className="absolute inset-0 flex flex-col justify-between border-4 border-background bg-primary p-4 text-background backface-hidden">
          {/* name and host tag */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={`px-2 py-1 text-s font-bold tracking-[0.18em] uppercase ${
                player.isHost ? 'border-2 border-background' : ''
              }`}
            >
              {player.isHost ? 'Host' : player.isBot ? 'Bot' : 'Player'}
            </span>
          </div>

          {/* name and stuff */}
          <div className="space-y-3">
            <p className="text-xs tracking-[0.2em] uppercase text-background/65">Click here!</p>
            <p className="text-[clamp(1.8rem,3vw,2.5rem)] leading-[0.9] font-extrabold uppercase">
              {player.name}
            </p>
          </div>
        </div>

        {/* back text */}
        <div className="absolute inset-0 flex border-4 border-background bg-primary p-4 text-background backface-hidden shadow-[8px_8px_0_0_#000] transform-[rotateY(180deg)]">
          <p className="text-2xl leading-tight font-bold">{backText}</p>
        </div>
      </div>
    </motion.article>
  );
}
