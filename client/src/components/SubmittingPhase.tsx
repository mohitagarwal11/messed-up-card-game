import { BlackCard } from './BlackCard';
import { WhiteCard } from './WhiteCard';
import type { Card } from '../../../shared/types';
import { motion } from 'motion/react';
import { PhaseCountdown } from './PhaseCountdown';

interface SubmittingPhaseProps {
  blackCard: Pick<Card, 'text' | 'pick'>;
  hand: Card[];
  selectedCardId: number | null;
  isSubmitDisabled: boolean;
  onSelectCard: (id: number) => void;
  onSubmit: () => void;
  phaseEndsAt: number;
}

export default function SubmittingPhase({
  blackCard,
  hand,
  selectedCardId,
  isSubmitDisabled,
  onSelectCard,
  onSubmit,
  phaseEndsAt,
}: SubmittingPhaseProps) {
  return (
    <>
      {/* desktop view */}
      <section className="hidden h-[calc(100vh-60px)] overflow-hidden grid-cols-3 lg:block">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
          className="flex flex-col"
        >
          {hand[0] && (
            <div className="absolute left-[16%] top-[5%]">
              <WhiteCard
                text={hand[0].text}
                isSelected={selectedCardId === hand[0].id}
                onClick={() => onSelectCard(hand[0].id)}
                tilt={7}
              />
            </div>
          )}
          {hand[1] && (
            <div className="absolute left-[5%] top-[30%]">
              <WhiteCard
                text={hand[1].text}
                isSelected={selectedCardId === hand[1].id}
                onClick={() => onSelectCard(hand[1].id)}
                tilt={7}
              />
            </div>
          )}
          {hand[2] && (
            <div className="absolute left-[16%] top-[55%]">
              <WhiteCard
                text={hand[2].text}
                isSelected={selectedCardId === hand[2].id}
                onClick={() => onSelectCard(hand[2].id)}
                tilt={7}
              />
            </div>
          )}
        </motion.div>

        {/* center column */}
        <div className="flex flex-col h-[calc(100vh-60px)] items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: 'easeIn',
              type: 'spring',
              stiffness: 300,
              damping: 10,
              mass: 1,
            }}
          >
            <BlackCard text={blackCard.text} />
          </motion.div>
          <PhaseCountdown
            phase="submitting"
            className="text-center text-m uppercase tracking-wide"
            phaseEndsAt={phaseEndsAt}
          />
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            whileHover={isSubmitDisabled ? undefined : { scale: 1.05, letterSpacing: '0.15em' }}
            whileTap={isSubmitDisabled ? undefined : { scale: 0.9 }}
            transition={{
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
              damping: 10,
              mass: 1,
              ease: 'easeIn',
            }}
            className={`text-3xl w-[clamp(14rem,12vw,22rem)] py-3 uppercase ${
              isSubmitDisabled
                ? 'cursor-not-allowed bg-card text-foreground opacity-50'
                : 'bg-accent font-bold text-black'
            }`}
          >
            submit
          </motion.button>
        </div>

        {/* Right column */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
          className="flex flex-col"
        >
          {hand[3] && (
            <div className="absolute right-[16%] top-[5%]">
              <WhiteCard
                text={hand[3].text}
                isSelected={selectedCardId === hand[3].id}
                onClick={() => onSelectCard(hand[3].id)}
                tilt={-7}
              />
            </div>
          )}
          {hand[4] && (
            <div className="absolute right-[5%] top-[30%]">
              <WhiteCard
                text={hand[4].text}
                isSelected={selectedCardId === hand[4].id}
                onClick={() => onSelectCard(hand[4].id)}
                tilt={-7}
              />
            </div>
          )}
          {hand[5] && (
            <div className="absolute right-[16%] top-[55%]">
              <WhiteCard
                text={hand[5].text}
                isSelected={selectedCardId === hand[5].id}
                onClick={() => onSelectCard(hand[5].id)}
                tilt={-7}
              />
            </div>
          )}
        </motion.div>
      </section>

      {/* mobile view */}
      <section className="flex h-screen items-center flex-col overflow-y-auto p-5 lg:hidden">
        {/* black card */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: 'easeIn',
            type: 'spring',
            stiffness: 300,
            damping: 10,
            mass: 1,
          }}
        >
          <BlackCard text={blackCard.text} />
        </motion.div>

        <PhaseCountdown
          phase="submitting"
          className="text-center text-m uppercase tracking-wide"
          phaseEndsAt={phaseEndsAt}
        />

        {/* white cards */}
        <div className="grid grid-cols-2 py-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {hand.map((card) => (
            <WhiteCard
              key={card.id}
              text={card.text}
              isSelected={selectedCardId == card.id}
              onClick={() => onSelectCard(card.id)}
              tilt={0}
            />
          ))}
        </div>

        <motion.button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          whileHover={isSubmitDisabled ? undefined : { scale: 1.05, letterSpacing: '0.15em' }}
          whileTap={isSubmitDisabled ? undefined : { scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
          className={`text-3xl w-[clamp(12rem,12vw,16rem)] py-3 uppercase ${
            isSubmitDisabled
              ? 'cursor-not-allowed bg-card text-foreground opacity-50'
              : 'bg-accent font-bold text-black'
          }`}
        >
          submit
        </motion.button>
      </section>
    </>
  );
}
