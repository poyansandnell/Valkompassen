import { motion } from 'framer-motion';
import { ShieldCheck, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Scene4Privacy = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),  // Shield anim
      setTimeout(() => setPhase(2), 1200), // Privacy text
      setTimeout(() => setPhase(3), 2500), // Timer anim
      setTimeout(() => setPhase(4), 3000), // Time text
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col items-center text-center max-w-4xl">
        
        {/* Privacy Section */}
        <motion.div 
          className="flex flex-col items-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div 
            className="w-24 h-24 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-500/30"
            animate={phase >= 1 ? { scale: [0, 1.2, 1] } : { scale: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ShieldCheck size={48} strokeWidth={2.5} />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            className="text-6xl font-extrabold text-[var(--color-secondary)]"
          >
            Inget konto behövs.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl text-[var(--color-text-secondary)] mt-4"
          >
            Svaren stannar på din enhet.
          </motion.p>
        </motion.div>

        {/* Divider */}
        <motion.div 
          className="w-32 h-1 bg-slate-200 rounded-full mb-16"
          initial={{ scaleX: 0 }}
          animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Time Section */}
        <motion.div 
          className="flex items-center gap-8 bg-white px-10 py-6 rounded-full shadow-xl border border-slate-100"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div
            animate={phase >= 3 ? { rotate: [0, -20, 20, -10, 10, 0] } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Timer size={40} className="text-[var(--color-accent)]" strokeWidth={2.5} />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            className="text-3xl font-bold text-[var(--color-secondary)]"
          >
            Tar cirka <span className="text-[var(--color-primary)]">5 minuter</span> per nivå.
          </motion.p>
        </motion.div>

      </div>
    </motion.div>
  );
};
