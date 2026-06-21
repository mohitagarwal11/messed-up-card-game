import { motion } from 'motion/react';

export default function TitleHeader() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10, mass: 1 }}
    >
      <motion.h2
        className="text-[clamp(2.2rem,2.4vw,2.8rem)] uppercase leading-none text-primary"
        whileHover={{ letterSpacing: '0.15em' }}
      >
        <span className="text-primary">un-</span>
        <span className="text-accent">hinged</span>
      </motion.h2>
    </motion.button>
  );
}
