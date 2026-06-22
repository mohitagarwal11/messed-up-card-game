import { useState } from 'react';
import { motion } from 'framer-motion';

export function Logo() {
  const [idle, setIdle] = useState(false);

  return (
    <div>
      {/* "un-" : calm entrance, high damping, settles fast, no idle motion */}
      <motion.h1
        className="text-primary uppercase tracking-tight leading-none"
        style={{
          fontWeight: 900,
          fontSize: 'clamp(4rem, 10vw, 7rem)',
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20, // high damping = settles calmly, no overshoot
          mass: 1,
        }}
      >
        un-
      </motion.h1>

      {/* outer wrapper: only animates AFTER entrance finishes, loops a slow idle float forever */}
      <motion.div
        animate={
          idle
            ? {
                y: [0, -6, 0, 4, 0],
                rotate: [0, 1.5, 0, -1.5, 0],
              }
            : {}
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* "hinged" : wobbly entrance, low damping, overshoots once, then handed off to idle float, glitch on hover */}
        <motion.h1
          className="uppercase tracking-tight leading-none"
          style={{
            fontWeight: 900,
            fontSize: 'clamp(4rem, 10vw, 7rem)',
            color: 'var(--accent)',
            transformOrigin: 'left center', // hinge pivot point
          }}
          initial={{ opacity: 0, y: -50, rotate: -15 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          onAnimationComplete={() => setIdle(true)}
          transition={{
            opacity: { duration: 0.3, delay: 0.15 },
            y: {
              type: 'spring',
              stiffness: 300,
              damping: 8, // low damping = overshoots and wobbles before settling
              mass: 1,
              delay: 0.15,
            },
            rotate: {
              type: 'spring',
              stiffness: 300,
              damping: 8,
              delay: 0.15,
            },
          }}
          whileHover={{
            rotate: [0, 28, 19, 24, 21, 22.5], // overshoots past target, settles unevenly instead of locking on
            transition: {
              duration: 0.8,
              times: [0, 0.3, 0.5, 0.7, 0.85, 1],
              ease: 'easeOut',
            },
          }}
        >
          hinged
        </motion.h1>
      </motion.div>
    </div>
  );
}
