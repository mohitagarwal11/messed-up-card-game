// DisclaimerModal.tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DisclaimerModalProps = {
  open: boolean;
  onAccept: () => void;
};

export default function DisclaimerModal({ open, onAccept }: DisclaimerModalProps) {
  const handleLeave = () => {
    alert('You have chosen to preserve your innocence.\nRedirecting to rehabilitation...');
    setTimeout(() => {
      window.location.href = 'https://www.youtube.com/watch?v=hvL1339luv0';
    }, 100);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl border-2 border-primary bg-background p-8"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-6 text-5xl font-black text-accent uppercase tracking-normal">
              Content Warning
            </h2>

            <div className="space-y-4 text-muted-foreground text-lg tracking-wide">
              <p>This game contains dark, offensive and absurd humor.</p>

              <p>
                The content generated during gameplay reflects the choices of the players and does
                not represent the views of the developer.
              </p>

              <p>
                This experience is intended for mature audiences only. If you are easily offended,
                uncomfortable with explicit content, or under the required age to view such content,
                you should not proceed.
              </p>

              <p className="text-primary">
                By continuing, you acknowledge that you understand and accept these terms.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleLeave}
                className="flex-1 border border-primary/20 px-6 py-3 font-bold uppercase text-2xl transition hover:border-primary"
              >
                Leave
              </button>
              <button
                onClick={onAccept}
                className="flex-1 border border-primary bg-primary px-6 py-3 font-bold text-2xl uppercase text-black transition hover:bg-transparent hover:text-primary"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
