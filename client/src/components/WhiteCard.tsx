import { motion } from 'motion/react';

type Props = {
  text: string;
  isSelected?: boolean;
  onClick?: () => void;
  tilt: number;
};

export function WhiteCard({ text, isSelected, onClick, tilt }: Props) {
  return (
    <motion.article
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0, 4, 0],
        rotate: [tilt, tilt + 1.5, tilt - 1.5, tilt],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05, translateY: -2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className={`w-[clamp(11rem,12vw,20rem)] perspective-distant aspect-5/7 p-4 border-2 border-black ${isSelected ? 'bg-accent -translate-y-2' : 'bg-primary'}`}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <p className="text-[clamp(1.4rem,1.6vw,2rem)] text-start text-black">{text}</p>
          <p className="text-[clamp(0.65rem,0.9vw,1rem)] text-start text-black/50">un-hinged</p>
        </div>
      </motion.button>
    </motion.article>
  );
}
