const AVATAR_COLORS = [
  'bg-primary-container text-on-primary',
  'bg-secondary-container text-on-secondary',
  'bg-surface-bright text-primary-container',
  'bg-surface-container-high text-secondary',
];

export function LetterAvatar({ name, isHost }: { name: string; isHost: boolean }) {
  const colorClass = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black ${colorClass}`}
    >
      <span className="font-display text-[22px] leading-none">{name.charAt(0).toUpperCase()}</span>
      {isHost && (
        <div className="absolute right-0 top-0 border-b border-l border-black bg-primary-container p-0.5">
          <span
            className="material-symbols-outlined text-[10px] text-on-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}
          ></span>
        </div>
      )}
    </div>
  );
}
