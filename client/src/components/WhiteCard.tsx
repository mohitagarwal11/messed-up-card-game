type Props = {
  text: string;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
};

export function WhiteCard({ text, selected, onClick, style }: Props) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`w-[120px] h-[160px] bg-white text-black border-4 cursor-pointer p-3 neo-shadow flex flex-col justify-start transition-all duration-150 ${
        selected ? 'border-black' : 'border-gray-300 hover:border-gray-500'
      }`}
    >
      <p className="font-body text-sm leading-tight">{text}</p>
    </div>
  );
}
