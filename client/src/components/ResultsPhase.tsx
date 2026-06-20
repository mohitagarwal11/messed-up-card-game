import type { Submission, RoundResult, Card } from '../../../shared/types';
import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import { motion } from 'motion/react';
import { PhaseCountdown } from './PhaseCountdown';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

interface ResultsPhaseProps {
  roundResult: RoundResult;
  blackCard: Pick<Card, 'text' | 'pick'>;
  submissions: Submission[];
  roundNumber: number;
  totalRounds: number;
  onLeave: () => void;
  phaseEndsAt: number;
}

export default function ResultsPhase({
  roundResult,
  blackCard,
  submissions,
  onLeave,
  phaseEndsAt,
}: ResultsPhaseProps) {
  const winningSubmission = submissions.find((s) => roundResult.winners.includes(s.playerId));
  const winnerPlayer = roundResult.players.find((p) => p.id === winningSubmission?.playerId);
  const winnerName = winnerPlayer?.name ?? '';

  const sortedPlayers = [...roundResult.players].sort((a, b) => b.score - a.score);

  const { width, height } = useWindowSize();

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* left */}
      <Confetti
        width={width}
        height={height}
        confettiSource={{ x: 0, y: (2 * height) / 3, w: 0, h: 0 }}
        initialVelocityX={{ min: 10, max: 25 }}
        initialVelocityY={{ min: -25, max: -10 }}
        gravity={0.3}
        numberOfPieces={100}
        recycle={false}
        tweenDuration={1000}
      />
      {/* right */}
      <Confetti
        width={width}
        height={height}
        confettiSource={{ x: width, y: (2 * height) / 3, w: 0, h: 0 }}
        initialVelocityX={{ min: -25, max: -10 }}
        initialVelocityY={{ min: -25, max: -10 }}
        gravity={0.3}
        numberOfPieces={100}
        recycle={false}
        tweenDuration={1000}
      />
      <div className="flex items-center justify-center gap-8 mt-6">
        <BlackCard text={blackCard.text} />
        <span className="text-4xl text-accent">+</span>
        <div className="flex flex-col items-center pt-5">
          <WhiteCard text={winningSubmission?.card.text ?? ''} tilt={0} />
          <div className="mt-2 text-2xl text-center w-[clamp(4rem,8vw,10rem)] font-bold text-accent uppercase">
            {winnerName}
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg border-2 border-black">
        <div className="bg-black text-xl uppercase tracking-[0.15em] font-bold text-primary p-3">
          CURRENT STANDINGS
        </div>
        {sortedPlayers.map((p, idx) => {
          const isWinner = roundResult.winners.includes(p.id);
          return (
            <div
              key={p.id}
              className={`flex justify-between border font-medium leading-none p-2 ${
                isWinner
                  ? 'bg-accent text-black border-black text-2xl'
                  : 'bg-card border-white text-xl'
              }`}
            >
              <span>{`${String(idx + 1).padStart(2, '0')} ${p.name}`}</span>
              <span className="text-xl">{p.score} PTS</span>
            </div>
          );
        })}
      </div>

      <PhaseCountdown
        phase="results"
        isGameOver={roundResult.isGameOver}
        className="text-center text-md uppercase"
        phaseEndsAt={phaseEndsAt}
      />

      <motion.button
        type="button"
        onClick={onLeave}
        whileHover={{ scale: 1.05, letterSpacing: '0.1em' }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
        className={`w-full max-w-sm text-2xl border-2 border-primary bg-black py-3 leading-none font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-black`}
      >
        Leave Room
      </motion.button>
    </div>
  );
}
