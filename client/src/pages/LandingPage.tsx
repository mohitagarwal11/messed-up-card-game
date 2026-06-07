import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement | null>(null);

  return (
    <div className="page-shell flex items-center justify-center px-6">
      <main
        ref={heroRef}
        className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center transition-transform duration-150 will-change-transform"
      >
        <h1 className="font-display text-[clamp(3rem,6vw,6rem)] uppercase leading-[0.95] tracking-[-0.04em] text-primary-container">
          Messed Up Cards
        </h1>

        <p className="mt-4 font-mono-ui text-[0.85rem] uppercase tracking-[0.28em] text-secondary">
          A party game for horrible people
        </p>

        <div className="mt-14 flex w-full max-w-md flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate('/lobby')}
            className="neo-shadow active-press w-full border-4 border-black bg-primary-container px-6 py-5 font-display text-3xl uppercase text-on-primary-container"
          >
            Sign In / Sign Up
          </button>

          <button
            type="button"
            onClick={() => navigate('/lobby')}
            className="active-press w-full border-4 border-primary bg-transparent px-6 py-5 font-display text-3xl uppercase text-primary"
          >
            Play as Guest
          </button>
        </div>

        <p className="mt-14 font-mono-ui text-xs uppercase tracking-[0.25em] text-secondary/60">
          Guests can only join public rooms. Sign in to track stats.
        </p>
      </main>
    </div>
  );
}
