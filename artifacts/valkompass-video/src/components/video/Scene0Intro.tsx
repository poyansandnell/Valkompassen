import { motion } from 'framer-motion';
import { Flag, Compass } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Scene0Intro = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200), // Compass in
      setTimeout(() => setPhase(2), 2400), // Subtitle
      setTimeout(() => setPhase(3), 3600), // Exit prep
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const letterAnim = {
    initial: { y: 100, opacity: 0, rotateX: -90 },
    animate: { y: 0, opacity: 1, rotateX: 0 },
    exit: { y: -100, opacity: 0, rotateX: 90 },
  };

  const text = "VALKOMPASS 2026".split("");

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col items-center z-10">
        
        {/* Icon Lockup */}
        <motion.div 
          className="relative w-32 h-32 mb-8 flex items-center justify-center rounded-full bg-white shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <motion.div
            className="absolute"
            animate={{ opacity: phase >= 1 ? 0 : 1, scale: phase >= 1 ? 0 : 1, rotate: phase >= 1 ? 90 : 0 }}
            transition={{ duration: 0.6, ease: "backIn" }}
          >
            <Flag className="w-16 h-16 text-[var(--color-primary)]" strokeWidth={2.5} />
          </motion.div>
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0, rotate: phase >= 1 ? 0 : -90 }}
            transition={{ duration: 0.6, ease: "backOut", delay: phase >= 1 ? 0.2 : 0 }}
          >
            <Compass className="w-16 h-16 text-[var(--color-accent)]" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <div className="flex space-x-2 overflow-hidden perspective-[1000px]">
          {text.map((char, i) => (
            <motion.span
              key={i}
              variants={letterAnim}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.6,
                delay: 0.5 + i * 0.05,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
              className="text-7xl font-extrabold text-[var(--color-secondary)] tracking-tight"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <div className="overflow-hidden mt-6">
          <motion.p
            initial={{ y: "100%", opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-3xl font-medium text-[var(--color-text-secondary)] tracking-wide"
          >
            Oberoende. Neutral. Helt gratis.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
