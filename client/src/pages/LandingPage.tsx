import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGuestUser } from '../api/users';

export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'home' | 'username'>('home');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, redirect if guestUser exists
  useEffect(() => {
    const stored = localStorage.getItem('guestUser');
    if (stored) {
      try {
        JSON.parse(stored);
        navigate('/lobby');
      } catch {
        // ignore malformed JSON
      }
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = await createGuestUser(username.trim());
      localStorage.setItem('guestUser', JSON.stringify(user));
      navigate('/lobby');
    } catch {
      setError('Failed to create guest user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center px-6">
      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center transition-transform duration-150 will-change-transform">
        <h1 className="font-display text-[clamp(3rem,6vw,6rem)] uppercase leading-[0.95] tracking-[-0.04em] text-primary-container">
          Messed Up Cards
        </h1>

        <p className="mt-4 font-mono-ui text-[0.85rem] uppercase tracking-[0.28em] text-secondary">
          A game designed to test the limits of your friend group
        </p>

        <div className="mt-14 flex w-full max-w-md flex-col gap-4">
          {step === 'home' && (
            <button
              type="button"
              onClick={() => setStep('username')}
              className="neo-shadow active-press w-full border-4 border-black bg-primary-container px-6 py-5 font-display text-3xl uppercase text-on-primary-container"
            >
              Play a game
            </button>
          )}
          {step === 'username' && (
            <>
              <input
                type="text"
                maxLength={20}
                autoFocus
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-4 border-primary bg-transparent px-6 py-5 font-display text-3xl uppercase text-primary"
              />
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="neo-shadow active-press w-full border-4 border-black bg-primary-container px-6 py-5 font-display text-3xl uppercase text-on-primary-container"
              >
                {loading ? 'Loading...' : "Let's Go"}
              </button>
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStep('home');
                  setUsername('');
                  setError(null);
                }}
                className="mt-2 text-sm underline"
              >
                Back
              </a>
            </>
          )}
        </div>

        <p className="mt-24 font-mono-ui text-xs uppercase tracking-[0.25em] text-secondary/60">
          Disclaimer: This game is not meant to offend anyone.
        </p>
        <p className="mt-4 font-mono-ui text-xs uppercase tracking-[0.25em] text-secondary/60">
          It is carefully engineered to offend everyone equally.
        </p>
      </main>
    </div>
  );
}
