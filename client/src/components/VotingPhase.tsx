import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import { motion } from 'motion/react';
import type { Submission, Card } from '../../../shared/types';
import { PhaseCountdown } from './PhaseCountdown';

interface VotingPhaseProps {
  blackCard: Pick<Card, 'text' | 'pick'>;
  submissions: Submission[];
  selectedSubmissionId: string | null;
  onSelectSubmission: (id: string) => void;
  onVote: () => void;
  hasVoted: boolean;
  playerId: string;
  roundNumber: number;
  totalRounds: number;
  phaseEndsAt: number;
}

export default function VotingPhase({
  blackCard,
  submissions,
  selectedSubmissionId,
  onSelectSubmission,
  onVote,
  hasVoted,
  playerId,
  phaseEndsAt,
}: VotingPhaseProps) {
  const filteredSubs = submissions.filter((sub) => sub.playerId !== playerId);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="mt-6">
        <BlackCard text={blackCard.text} />
      </div>

      {/* timer and button */}
      <div className="flex items-center justify-center gap-4">
        <PhaseCountdown
          phase="voting"
          className="text-center text-m uppercase"
          phaseEndsAt={phaseEndsAt}
        />
        <p className="uppercase text-accent">
          {hasVoted ? 'WAITING FOR OTHERS' : 'PICK THE BEST ANSWER'}
        </p>
        <motion.button
          onClick={onVote}
          disabled={hasVoted}
          whileHover={hasVoted ? undefined : { scale: 1.05, letterSpacing: '0.15em' }}
          whileTap={hasVoted ? undefined : { scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
          className={`text-2xl w-[clamp(5rem,7vw,10rem)] ${hasVoted ? 'cursor-not-allowed bg-card text-foreground opacity-50' : 'bg-accent font-bold text-black'} uppercase`}
        >
          vote
        </motion.button>
      </div>

      {/* white hand cards */}
      <div className="lg:flex lg:flex-row grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredSubs.map((sub) => {
          const isSelected = selectedSubmissionId === sub.id;
          return (
            <WhiteCard
              key={sub.id}
              text={sub.card.text}
              isSelected={isSelected}
              onClick={() => {
                if (!hasVoted) onSelectSubmission(sub.id);
              }}
              tilt={0}
            />
          );
        })}
      </div>
    </div>
  );
}
