type Props = {
  text: string;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
};

export function WhiteCard({ text, selected, onClick, style }: Props) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`
        relative
        w-[180px]
        h-[250px]
        shrink-0
        bg-primary
        text-dark
        border-2
        rounded-sm
        p-4
        text-left
        transition-all
        duration-200
        hover:-translate-y-1
        ${
          selected
            ? 'border-primary-container shadow-[0_0_24px_rgba(166,250,0,0.8)]'
            : 'border-surface-bright'
        }
      `}
    >
      <p className="font-display text-xl text-balance leading-tight">{text}</p>

      <div
        className={`
          absolute
          top-3
          right-3
          w-4
          h-4
          rounded-full
          border-2
          ${selected ? 'bg-primary-container border-primary-container' : 'border-outline'}
        `}
      />
    </button>
  );
}
