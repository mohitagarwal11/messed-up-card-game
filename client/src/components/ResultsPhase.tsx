import type { Submission, RoundResult, Card } from '../../../shared/types';
import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import { GameHeader } from './GameHeader';
import { useEffect, useState } from 'react';
import { RESULTS_DURATION_MS } from '../../../shared/constants';

interface ResultsPhaseProps {
  roundResult: RoundResult;
  blackCard: Pick<Card, 'text' | 'pick'>;
  submissions: Submission[];
  roundNumber: number;
  totalRounds: number;
  onLeave: () => void;
}

export default function ResultsPhase({
  roundResult,
  blackCard,
  submissions,
  roundNumber,
  totalRounds,
  onLeave,
}: ResultsPhaseProps) {
  const [countdown, setCountdown] = useState(RESULTS_DURATION_MS / 1000);

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

  const winningSubmission = submissions.find((s) => roundResult.winners.includes(s.playerId));
  const winnerPlayer = roundResult.players.find((p) => p.id === winningSubmission?.playerId);
  const winnerName = winnerPlayer?.name ?? '';

  const sortedPlayers = [...roundResult.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)] overflow-y-auto">
      <GameHeader text="the winning combo" roundNumber={roundNumber} totalRounds={totalRounds} />

      {/* Winning pair */}
      <div className="flex justify-center items-center gap-8 p-5">
        <BlackCard text={blackCard.text} pick={blackCard.pick} />
        <span className="font-display text-4xl text-[var(--accent)]">+</span>
        <div className="flex flex-col items-center pt-5">
          <WhiteCard text={winningSubmission?.card.text ?? ''} selected />
          <div className="bg-[var(--accent)] text-black px-4 py-1 font-mono-ui text-sm mt-2">
            {winnerName}
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="max-w-md mx-auto w-full border-2 border-[var(--border)] mt-4">
        <div className="bg-[var(--border)] text-black px-4 py-2 font-mono-ui text-xs uppercase">
          CURRENT STANDINGS
        </div>
        {sortedPlayers.map((p, idx) => {
          const isWinner = roundResult.winners.includes(p.id);
          return (
            <div
              key={p.id}
              className={`flex justify-between px-4 py-3 border-b border-[var(--border-muted)] ${isWinner ? 'bg-[var(--accent)] text-black' : 'bg-[var(--surface)]'}`}
            >
              <span className="font-mono-ui">
                {`${String(idx + 1).padStart(2, '0')} ${p.name}`}
              </span>
              <span className="font-display text-xl">{p.score} PTS</span>
            </div>
          );
        })}
      </div>

      {/* Auto-advance countdown */}
      <div className="text-center py-4 font-mono-ui text-sm uppercase">
        {roundResult.isGameOver ? (
          <span className="text-[var(--accent)] text-2xl font-display">GAME OVER</span>
        ) : (
          `NEXT ROUND IN ${countdown}s`
        )}
      </div>

      <div className="flex justify-center items-center gap-6 mb-10">
        <button
          type="button"
          onClick={onLeave}
          className="w-full max-w-sm mt-4 font-display text-2xl uppercase py-4 neo-shadow active-press transition-all bg-[var(--accent)] text-black"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
