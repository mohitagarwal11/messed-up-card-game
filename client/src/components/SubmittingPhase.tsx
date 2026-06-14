import { BlackCard } from './BlackCard';
import { GameHeader } from './GameHeader';
import { WhiteCard } from './WhiteCard';

interface SubmittingPhaseProps {
  blackCard: { text: string; pick: number };
  hand: { id: number; text: string; pick: number }[];
  selectedCardId: number | null;
  onSelectCard: (id: number) => void;
  onSubmit: () => void;
  timeLeft: number;
  hasSubmitted: boolean;
  roundNumber: number;
  totalRounds: number;
}

export default function SubmittingPhase({
  blackCard,
  hand,
  selectedCardId,
  onSelectCard,
  onSubmit,
  timeLeft,
  hasSubmitted,
  roundNumber,
  totalRounds,
}: SubmittingPhaseProps) {
  const progress = (timeLeft / 30) * 100;

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)]">
      <GameHeader
        text="submit your best answer"
        progress={progress}
        roundNumber={roundNumber}
        totalRounds={totalRounds}
      />

      {/* Black card area */}
      <div className="flex justify-center pt-5">
        <BlackCard text={blackCard.text} pick={blackCard.pick} />
      </div>

      {/* Hand or waiting message */}
      <div className="flex flex-row items-center justify-center gap-3 pt-5">
        {hasSubmitted ? (
          <p className="font-mono-ui uppercase opacity-60">WAITING FOR OTHER PLAYERS...</p>
        ) : (
          <>
            <div className="flex row justify-center gap-3 flex-wrap">
              {hand.map((card) => (
                <WhiteCard
                  key={card.id}
                  text={card.text}
                  selected={selectedCardId === card.id}
                  onClick={() => onSelectCard(card.id)}
                  style={{
                    transform: selectedCardId === card.id ? 'translateY(-20px)' : undefined,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-center items-center pt-5 px-4 pb-4 gap-4">
        <button
          onClick={onSubmit}
          disabled={selectedCardId === null}
          className={`
                w-full max-w-sm mx-auto mt-4
                font-display text-2xl uppercase py-6
                neo-shadow active-press transition-all
                ${
                  selectedCardId !== null
                    ? 'bg-[var(--accent)] text-black'
                    : 'opacity-50 cursor-not-allowed bg-[var(--surface)] text-[var(--text)]'
                }
              `}
        >
          SUBMIT ANSWER
        </button>
      </div>
    </div>
  );
}
