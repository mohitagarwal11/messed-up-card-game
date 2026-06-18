import { useState, useEffect } from 'react';
import { BlackCard } from './BlackCard';
import { GameHeader } from './GameHeader';
import { WhiteCard } from './WhiteCard';
import type { Card } from '../../../shared/types';
import { SUBMIT_DURATION_MS } from '../../../shared/constants';

interface SubmittingPhaseProps {
  blackCard: Pick<Card, 'text' | 'pick'>;
  hand: Card[];
  selectedCardId: number | null;
  onSelectCard: (id: number) => void;
  onSubmit: () => void;
  roundNumber: number;
  totalRounds: number;
}

export default function SubmittingPhase({
  blackCard,
  hand,
  selectedCardId,
  onSelectCard,
  onSubmit,
  roundNumber,
  totalRounds,
}: SubmittingPhaseProps) {
  const [countdown, setCountdown] = useState(SUBMIT_DURATION_MS / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)]">
      <GameHeader
        text="submit your best answer"
        roundNumber={roundNumber}
        totalRounds={totalRounds}
      />

      {/* Black card area */}
      <div className="flex justify-center pt-5">
        <BlackCard text={blackCard.text} pick={blackCard.pick} />
      </div>

      {/* Auto-advance countdown */}
      <div className="text-center font-mono-ui text-sm uppercase p-5">SUBMIT IN {countdown}s</div>

      {/* Hand or waiting message */}
      <div className="flex flex-row items-center justify-center gap-3 flex-wrap">
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

      {/* Submit button */}
      <div className="flex justify-center items-center px-4 pb-4 gap-4">
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
