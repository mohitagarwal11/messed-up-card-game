import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import { GameHeader } from './GameHeader';
import type { Submission, Card } from '../../../shared/types';

interface VotingPhaseProps {
  blackCard: Pick<Card, 'text' | 'pick'>;
  submissions: Submission[];
  selectedSubmissionId: string | null;
  onSelectSubmission: (id: string) => void;
  onVote: () => void;
  timeLeft: number;
  hasVoted: boolean;
  playerId: string;
  roundNumber: number;
  totalRounds: number;
}

export default function VotingPhase({
  blackCard,
  submissions,
  selectedSubmissionId,
  onSelectSubmission,
  onVote,
  timeLeft,
  hasVoted,
  playerId,
  roundNumber,
  totalRounds,
}: VotingPhaseProps) {
  const progress = (timeLeft / 30) * 100;
  const filteredSubs = submissions.filter((sub) => sub.playerId !== playerId);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)]">
      <GameHeader
        text="vote for the best answer"
        progress={progress}
        roundNumber={roundNumber}
        totalRounds={totalRounds}
      />

      {/* Black card area */}
      <div className="flex justify-center pt-5">
        <BlackCard text={blackCard.text} pick={blackCard.pick} />
      </div>

      {/* Submissions grid */}
      <div className="flex flex-row items-center justify-center gap-3 pt-5">
        {filteredSubs.map((sub) => {
          const isSelected = selectedSubmissionId === sub.id;
          return (
            <WhiteCard
              key={sub.id}
              text={sub.card.text}
              selected={isSelected}
              onClick={() => {
                if (!hasVoted) onSelectSubmission(sub.id);
              }}
              style={{
                opacity: hasVoted && !isSelected ? 0.4 : 1,
                filter: hasVoted && !isSelected ? 'grayscale(1)' : 'none',
                pointerEvents: hasVoted && !isSelected ? 'none' : 'auto',
              }}
            />
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="flex justify-center items-center pt-5 px-4 pb-4 gap-4">
        <p className="font-mono-ui uppercase text-[var(--accent)]">
          {hasVoted ? 'WAITING FOR OTHERS' : 'PICK THE BEST ANSWER'}
        </p>
        <button
          onClick={onVote}
          disabled={!selectedSubmissionId || hasVoted}
          className={`
            neo-shadow active-press font-display text-xl uppercase px-6 py-3
            ${
              !selectedSubmissionId || hasVoted
                ? 'opacity-50 cursor-not-allowed bg-[var(--surface)] text-[var(--text)]'
                : 'bg-[var(--accent)] text-black'
            }
          `}
        >
          VOTE
        </button>
      </div>
    </div>
  );
}
