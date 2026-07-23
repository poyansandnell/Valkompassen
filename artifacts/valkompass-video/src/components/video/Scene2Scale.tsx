import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Scene2Scale = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800), // Card appears
      setTimeout(() => setPhase(2), 2000), // Option selected
      setTimeout(() => setPhase(3), 3200), // Star toggled
      setTimeout(() => setPhase(4), 4500), // Scale up
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const options = [
    { label: "Stämmer inte alls", color: "bg-red-100 text-red-600 border-red-200" },
    { label: "Stämmer ganska dåligt", color: "bg-orange-50 text-orange-600 border-orange-200" },
    { label: "Varken eller", color: "bg-slate-100 text-slate-600 border-slate-200" },
    { label: "Stämmer ganska bra", color: "bg-teal-50 text-teal-600 border-teal-200" },
    { label: "Stämmer helt", color: "bg-green-100 text-green-600 border-green-300" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -100, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <motion.div className="mb-12 text-center overflow-hidden">
        <motion.h2 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
          className="text-6xl font-extrabold text-[var(--color-secondary)]"
        >
          Ta ställning till <span className="text-[var(--color-primary)]">förslagen</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-3xl text-[var(--color-text-secondary)] mt-4"
        >
          5-gradig skala för nyanserat resultat
        </motion.p>
      </motion.div>

      {/* Mockup Card */}
      <motion.div
        initial={{ y: 100, opacity: 0, rotateX: 20 }}
        animate={phase >= 1 ? { y: 0, opacity: 1, rotateX: 0, scale: phase >= 4 ? 1.05 : 1 } : { y: 100, opacity: 0, rotateX: 20 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl p-12 border border-slate-100 perspective-[1000px]"
      >
        <div className="flex justify-between items-start mb-10">
          <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-lg font-semibold uppercase tracking-wider">
            Kommunfråga
          </span>
          <motion.div
            animate={phase >= 3 ? { scale: [1, 1.5, 1], rotate: [0, 15, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xl border-2 transition-colors duration-500 ${
              phase >= 3 ? "bg-amber-50 text-amber-500 border-amber-300" : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            <Star fill={phase >= 3 ? "currentColor" : "none"} strokeWidth={2.5} />
            Extra viktig
          </motion.div>
        </div>

        <h3 className="text-4xl font-bold text-[var(--color-secondary)] leading-snug mb-16">
          "Kommunen bör bygga fler hyresrätter i centrum även om det minskar antalet parkeringsplatser."
        </h3>

        <div className="flex gap-4 w-full">
          {options.map((opt, i) => {
            const isSelected = phase >= 2 && i === 4;
            const notSelected = phase >= 2 && i !== 4;
            
            return (
              <motion.div
                key={i}
                animate={{
                  scale: isSelected ? 1.1 : notSelected ? 0.95 : 1,
                  opacity: notSelected ? 0.5 : 1,
                  y: isSelected ? -10 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex-1 h-32 rounded-2xl border-2 flex items-center justify-center text-center p-4 text-lg font-bold transition-colors ${
                  isSelected ? opt.color : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                {opt.label}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};
