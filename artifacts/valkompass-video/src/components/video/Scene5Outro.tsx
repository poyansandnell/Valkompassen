import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Scene5Outro = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Logo icon
      setTimeout(() => setPhase(2), 1200), // Logo text
      setTimeout(() => setPhase(3), 2200), // Tagline
      setTimeout(() => setPhase(4), 4500), // Exit prep
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-white"
      style={{ background: 'linear-gradient(160deg, #6d28d9 0%, #7c3aed 55%, #8b5cf6 100%)' }}
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex flex-col items-center z-10">
        
        {/* Logo Icon */}
        <motion.div 
          className="w-32 h-32 mb-8 flex items-center justify-center rounded-3xl bg-white shadow-2xl"
          initial={{ scale: 0, rotate: -45, borderRadius: "50%" }}
          animate={phase >= 1 ? { scale: 1, rotate: 0, borderRadius: "24px" } : { scale: 0, rotate: -45, borderRadius: "50%" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Flag className="w-16 h-16 text-[#6d28d9]" strokeWidth={3} />
        </motion.div>

        {/* Logo Text */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%" }}
            animate={phase >= 2 ? { y: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-8xl font-extrabold tracking-tight"
          >
            Valkompass
          </motion.h1>
        </div>

        {/* Tagline */}
        <div className="overflow-hidden mt-8">
          <motion.p
            initial={{ y: "100%", opacity: 0 }}
            animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-4xl font-medium tracking-wide text-purple-200"
          >
            Din röst. Ditt val.
          </motion.p>
        </div>
      </div>

      {/* Decorative floating rings in background */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-purple-300/30 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-purple-300/20 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      />
    </motion.div>
  );
};
