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
    <div className="w-full border-b-2 border-accent">
      <div className="h-1 w-full bg-card"></div>
      <div className="flex flex-col items-center gap-1 py-3">
        <p className="text-3xl uppercase text-accent">{text}</p>
        <p className="text-xs uppercase text-secondary-foreground">
          ROUND {roundNumber} / {totalRounds}
        </p>
      </div>
    </div>
  );
}
