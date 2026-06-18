export function GameHeader({
  text,
  roundNumber,
  totalRounds,
}: {
  text: string;
  roundNumber: number;
  totalRounds: number;
}) {
  return (
    <div className="w-full border-b-2 border-[var(--accent)]">
      <div className="w-full h-1 bg-[var(--surface)]"></div>
      <div className="flex flex-col items-center py-3 gap-1">
        <p className="font-display text-3xl uppercase text-[var(--accent)]">{text}</p>
        <p className="font-mono-ui text-xs uppercase text-secondary">
          ROUND {roundNumber} / {totalRounds}
        </p>
      </div>
    </div>
  );
}
