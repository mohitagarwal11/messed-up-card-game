import type { Submission, RoundResult, GameState } from '../../../shared/types';
import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import { motion } from 'motion/react';
import { PhaseCountdown } from './PhaseCountdown';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

interface ResultsPhaseProps {
  roundResult: RoundResult;
  submissions: Submission[];
  onLeave: () => void;
  onReset: () => void;
  gameState: GameState;
  playerId: string;
}

export default function ResultsPhase({
  roundResult,
  submissions,
  onLeave,
  onReset,
  gameState,
  playerId,
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

      {/* final winner display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 10,
          mass: 1,
          ease: 'easeIn',
        }}
        className="flex items-center justify-center gap-8 mt-6"
      >
        <BlackCard text={gameState.round.blackCard.text} />
        <span className="text-4xl text-accent">+</span>
        <div className="flex flex-col items-center pt-5">
          <WhiteCard text={winningSubmission?.card.text ?? ''} tilt={0} />
          <div className="mt-2 text-2xl text-center w-[clamp(4rem,8vw,10rem)] font-bold text-accent uppercase">
            {winnerName}
          </div>
        </div>
      </motion.div>

      {/* leaderboard stadndings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 10,
          mass: 1,
          ease: 'easeIn',
        }}
        className="w-full max-w-lg"
      >
        <div className="bg-card text-xl uppercase tracking-[0.15em] font-bold text-primary p-3 border border-primary">
          CURRENT STANDINGS
        </div>
        {sortedPlayers.map((p, idx) => {
          const isWinner = roundResult.winners.includes(p.id);
          return (
            <div
              key={p.id}
              className={`flex justify-between font-medium leading-none p-2 border border-primary ${
                isWinner ? 'bg-accent text-black text-2xl' : 'bg-card text-xl'
              }`}
            >
              <span>{`${String(idx + 1).padStart(2, '0')} ${p.name}`}</span>
              <span className="text-xl">{p.score} PTS</span>
            </div>
          );
        })}
      </motion.div>

      <PhaseCountdown
        phase="results"
        isGameOver={roundResult.isGameOver}
        className="text-center text-md uppercase"
        phaseEndsAt={gameState.round.phaseEndsAt}
      />

      <div className="flex flex-row gap-4 w-full justify-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onLeave}
          whileHover={{ scale: 1.05, letterSpacing: '0.15em' }}
          whileTap={{ scale: 0.9 }}
          transition={{
            duration: 0.5,
            type: 'spring',
            stiffness: 300,
            damping: 10,
            mass: 1,
            ease: 'easeIn',
          }}
          className="text-3xl w-[clamp(14rem,12vw,22rem)] py-3 uppercase font-bold border-2 border-primary bg-black text-primary transition-colors hover:bg-primary hover:text-black"
        >
          Leave Room
        </motion.button>

        {roundResult.players.find((p) => p.isHost)?.id === playerId && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onReset}
            whileHover={{ scale: 1.05, letterSpacing: '0.15em' }}
            whileTap={{ scale: 0.9 }}
            transition={{
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
              damping: 10,
              mass: 1,
              ease: 'easeIn',
            }}
            className="text-3xl w-[clamp(14rem,12vw,22rem)] py-3 uppercase font-bold bg-accent text-black"
          >
            Reset Room
          </motion.button>
        )}
      </div>
    </div>
  );
}
