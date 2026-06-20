import { useEffect, useState } from 'react';
import type { GamePhase } from '../../../shared/types';

type PhaseCountdownProps = {
  phase: GamePhase;
  phaseEndsAt: number;
  isGameOver?: boolean;
  winnerName?: string;
  className?: string;
};

const PHASE_LABELS: Record<GamePhase, string> = {
  submitting: 'SUBMIT IN',
  voting: 'VOTE ENDS IN',
  results: 'NEXT ROUND IN',
};

export function PhaseCountdown({
  phase,
  phaseEndsAt,
  isGameOver = false,
  winnerName,
  className,
}: PhaseCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (phase === 'results' && isGameOver) return;

    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, phase, phaseEndsAt]);

  if (phase === 'results' && isGameOver) {
    return;
  }

  return (
    <div className={className}>
      {PHASE_LABELS[phase]} {remaining}s
    </div>
  );
}
