import { motion } from 'motion/react';

type Props = {
  text: string;
};

export function BlackCard({ text }: Props) {
  return (
    <motion.article
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 6, 0],
        rotate: [0, 1.5, -1.5, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <div className="w-[clamp(14rem,12vw,22rem)] aspect-5/7 bg-black justify-between border-2 border-primary p-6 flex flex-col hover:scale-105 hover:-translate-y-2 duration-200">
        <p className="text-[clamp(1.4rem,1.6vw,2rem)] text-start text-priamry">{text}</p>
        <p className="text-[clamp(0.65rem,0.9vw,1rem)] text-start text-primary/50">un-hinged</p>
      </div>
    </motion.article>
  );
}
