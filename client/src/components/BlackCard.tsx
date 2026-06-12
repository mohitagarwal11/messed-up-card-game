type Props = { text: string; pick?: number };

export function BlackCard({ text, pick = 1 }: Props) {
  return (
    <div className="w-full max-w-lg mx-auto bg-black text-white border-4 border-black neo-shadow p-8 flex flex-col justify-between aspect-[3/2]">
      <p className="font-display text-2xl md:text-3xl leading-snug">{text}</p>
      {pick > 1 && (
        <p className="font-mono-ui text-xs uppercase tracking-widest text-white/50">Pick {pick}</p>
      )}
    </div>
  );
}
