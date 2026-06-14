type Props = {
  text: string;
  pick?: number;
};

export function BlackCard({ text, pick = 1 }: Props) {
  return (
    <div
      className="
        w-full
        max-w-[500px]
        aspect-[2.2/1]
        bg-surface
        border-2
        border-primary-container
        shadow-[0_0_24px_rgba(166,250,0,0.8)]
        neo-shadow
        p-6
        flex
        flex-col
      "
    >
      <div className="flex-1 flex items-center">
        <p className="font-display text-primary text-3xl leading-none">{text}</p>
      </div>

      {pick > 1 && <p className="font-body text-sm text-primary-container">Pick {pick}</p>}
    </div>
  );
}
