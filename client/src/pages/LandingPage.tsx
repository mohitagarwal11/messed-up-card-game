import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGuestUser } from '../api/users';
import { motion } from 'motion/react';
import CheckPattern from '../components/CheckPattern';

const CARD_AREA = 240 * 160 * 2;
const MIN_CARD_COUNT = 5;
const MAX_CARD_COUNT = 18;
const CARD_WIDTH = 160;
const CARD_HEIGHT = 240;
const CARD_GAP = 20;
const VIEWPORT_PADDING = 20;
const MAX_PLACEMENT_ATTEMPTS = 50;
const MOTION_RANGE = 160;
const CARD_MESSAGES = [
  'friendship stress test',
  'bad decisions encouraged',
  'judge your friends loudly',
  'say the worst thing first',
  'for the terminally unhinged',
  'wrong answers only',
  'the court finds you guilty',
  'one card away from disaster',
  'making therapists rich',
  'career-ending opinions',
  'absolutely no survivors',
  'everyone loses eventually',
  'social consequences enabled',
  'certified bad influence',
  'chaos is a game mechanic',
  'winning feels suspicious',
  'powered by poor judgment',
  'group chat lore begins',
  'unlimited bad takes',
  'your honor, hear me out',
  'questionable life choices',
  'too funny to apologize',
  'normal people need not apply',
  'human resources nightmare',
  'lawyers strongly advised',
  'this seemed funnier earlier',
  'one more round, trust me',
];

type FloatingCard = {
  x: number;
  y: number;
  moveX: number;
  moveY: number;
  rotate: number;
  duration: number;
  text: string;
};

// this checks if cards are overlapping or not on creation
function cardsOverlap(cardA: FloatingCard, cardB: FloatingCard) {
  return !(
    cardA.x + CARD_WIDTH + CARD_GAP <= cardB.x ||
    cardB.x + CARD_WIDTH + CARD_GAP <= cardA.x ||
    cardA.y + CARD_HEIGHT + CARD_GAP <= cardB.y ||
    cardB.y + CARD_HEIGHT + CARD_GAP <= cardA.y
  );
}

// this creates the backgroiund floating cards array
function createFloatingCards(width: number, height: number): FloatingCard[] {
  const count = Math.max(
    MIN_CARD_COUNT,
    Math.min(MAX_CARD_COUNT, Math.round((width * height) / CARD_AREA)),
  );

  const cards: FloatingCard[] = [];
  const maxX = Math.max(width - CARD_WIDTH - VIEWPORT_PADDING * 2, 0);
  const maxY = Math.max(height - CARD_HEIGHT - VIEWPORT_PADDING * 2, 0);

  for (let i = 0; i < count; i += 1) {
    let nextCard: FloatingCard | null = null;

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt += 1) {
      const candidate: FloatingCard = {
        x: VIEWPORT_PADDING + Math.random() * maxX,
        y: VIEWPORT_PADDING + Math.random() * maxY,
        moveX: (Math.random() - 0.5) * MOTION_RANGE,
        moveY: (Math.random() - 0.5) * MOTION_RANGE,
        rotate: (Math.random() - 0.5) * 20,
        duration: 8 + Math.random() * 5,
        text: CARD_MESSAGES[Math.floor(Math.random() * CARD_MESSAGES.length)],
      };
      if (cards.every((card) => !cardsOverlap(card, candidate))) {
        nextCard = candidate;
        break;
      }
    }
    if (!nextCard) {
      break;
    }
    cards.push(nextCard);
  }
  return cards;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'home' | 'username'>('home');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<FloatingCard[]>(() =>
    createFloatingCards(window.innerWidth, window.innerHeight),
  );

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

  // to update the background based ont he screen resize
  useEffect(() => {
    let frameId: number | null = null;

    const syncCardsToViewport = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        setCards(createFloatingCards(window.innerWidth, window.innerHeight));
      });
    };

    syncCardsToViewport();
    window.addEventListener('resize', syncCardsToViewport);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', syncCardsToViewport);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* background check pattern */}
      <CheckPattern />

      {/* background floating card */}
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="group absolute flex h-70 w-45 items-end rounded-xl border-2 border-card-foreground p-4 transition-colors duration-300 hover:-translate-y-5 hover:bg-card hover:z-11"
          style={{
            left: card.x,
            top: card.y,
          }}
          animate={{
            x: [0, card.moveX, 0],
            y: [0, card.moveY, 0],
            rotate: [card.rotate, card.rotate + 10, card.rotate],
          }}
          transition={{
            duration: card.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <p className="font-semibold text-xs uppercase tracking-[0.18em] text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {card.text}
          </p>
        </motion.div>
      ))}

      <main className="relative w-full max-w-md items-center text-center justify-center z-10">
        {/* the name and its substitle */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1
            className="text-foreground uppercase tracking-tight leading-none"
            style={{
              fontWeight: 900,
              fontSize: 'clamp(4rem, 10vw, 5.5rem)',
            }}
          >
            un-
          </h1>
          <h1
            className="uppercase tracking-tight leading-none"
            style={{
              fontWeight: 900,
              fontSize: 'clamp(4rem, 10vw, 5.5rem)',
              color: 'var(--accent)',
            }}
          >
            hinged
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-foreground">
            A game designed to test the limits of your friend group
          </p>
        </motion.div>

        {/* buttons and username */}
        <div className="mt-14 flex w-full max-w-md flex-col gap-4">
          {step === 'home' && (
            <motion.button
              type="button"
              onClick={() => setStep('username')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden w-full bg-accent text-black py-4 uppercase tracking-widest transition-opacity"
              style={{
                fontWeight: 800,
                fontSize: '1.5rem',
                letterSpacing: '0.15em',
              }}
            >
              <span className="block transition-transform duration-300 group-hover:-translate-y-15">
                Play Now
              </span>
              <span className="absolute inset-0 flex items-center justify-center translate-y-15 transition-transform duration-300 group-hover:translate-y-0">
                at your own risk
              </span>
            </motion.button>
          )}
          {step === 'username' && (
            <>
              <input
                type="text"
                maxLength={12}
                placeholder="Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border-2 border-foreground text-foreground p-3 outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
                style={{
                  fontSize: '1.5rem',
                  letterSpacing: '0.15em',
                }}
              />
              <motion.button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden w-full bg-accent text-black py-3 uppercase tracking-widest transition-opacity"
                style={{
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: '0.15em',
                }}
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-15">
                  Let's Go!
                </span>
                <span className="absolute inset-0 flex items-center justify-center translate-y-15 transition-transform duration-300 group-hover:translate-y-0">
                  only because u want to...
                </span>
              </motion.button>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
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

        {/* disclaimer */}
        {step === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-15 flex flex-col gap-5 text-center text-xs uppercase tracking-[0.25em] text-secondary-foreground"
          >
            <p>Disclaimer: This game is not meant to offend anyone in particular</p>
            <p>It is carefully engineered to offend everyone equally.</p>
            <p className="text-m font-bold text-accent">
              these cards are trying to say something...
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
