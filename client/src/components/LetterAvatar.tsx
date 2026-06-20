export function LetterAvatar({ name }: { name: string; isHost?: boolean }) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary-foreground bg-accent text-primary-foreground">
      <span className="text-[22px] leading-none">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
