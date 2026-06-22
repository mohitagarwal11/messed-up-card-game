import { motion } from 'motion/react';
import type { Player } from '../../../shared/types';
import type { BoardPlayerLayout } from './BoardLayout';

type BoardPlayerCardProps = {
  player: Player;
  backText: string;
  layout: BoardPlayerLayout;
};

export default function BoardPlayerCard({ player, backText, layout }: BoardPlayerCardProps) {
  return (
    <div
      className="absolute w-[clamp(11rem,12vw,20rem)] aspect-5/7 -translate-x-1/2 -translate-y-1/2 hover:z-12"
      style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
    >
      <motion.article
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -6, 0, 4, 0],
          rotate: [layout.tilt, layout.tilt + 1.5, layout.tilt - 1.5, layout.tilt],
        }}
        transition={{
          duration: layout.floatDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: layout.delay,
        }}
        // adjust this for white player card resizing
        className="w-[clamp(12rem,12vw,16rem)] perspective-distant"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, translateY: 100, translateX: 100, rotate: 30 }}
          animate={{ scale: 1, opacity: 1, translateY: 0, translateX: 0, rotate: 0 }}
          className="relative aspect-5/7 w-full transform-3d"
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
        >
          <div className="absolute inset-0 flex flex-col justify-between border-2 border-background bg-primary p-4 text-background backface-hidden">
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

            <div className="space-y-3">
              <p className="text-xs tracking-[0.2em] uppercase text-background/65">Hover here!</p>
              <p className="truncate text-[clamp(1.6rem,2.4vw,2.5rem)] leading-[0.9] font-bold uppercase">
                {player.name}
              </p>
            </div>
          </div>

          {/* back text */}
          <div
            className="absolute inset-0 flex border-2 border-background bg-primary p-4 text-background backface-hidden"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="text-[clamp(1.2rem,1.5vw,2rem)] leading-none font-bold uppercase">
              {backText}
            </p>
          </div>
        </motion.div>
      </motion.article>
    </div>
  );
}
