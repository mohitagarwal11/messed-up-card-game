export function GameHeader({
  text,
  progress,
  roundNumber,
  totalRounds,
}: {
  text: string;
  progress: number;
  roundNumber: number;
  totalRounds: number;
}) {
  return (
    <div className="w-full border-b-2 border-[var(--accent)]">
      <div className="w-full h-1 bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-col items-center py-3 gap-1">
        <p className="font-display text-3xl uppercase text-[var(--accent)]">{text}</p>
        <p className="font-mono-ui text-xs uppercase text-secondary">
          ROUND {roundNumber} / {totalRounds}
        </p>
      </div>
    </div>
  );
}
