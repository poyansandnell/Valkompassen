import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Scene3Match = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Title
      setTimeout(() => setPhase(2), 1200), // Card 1
      setTimeout(() => setPhase(3), 1600), // Card 2
      setTimeout(() => setPhase(4), 2000), // Card 3
      setTimeout(() => setPhase(5), 3500), // Note about neutral
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const results = [
    { name: "Parti A", percent: 82, color: "#10b981" },
    { name: "Parti B", percent: 75, color: "#3b82f6" },
    { name: "Lokalt Parti", percent: 68, color: "#f59e0b" },
    { name: "Parti C", percent: 43, color: "#ef4444" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between px-20">
        
        {/* Left Side: Typography */}
        <div className="w-1/2 pr-16">
          <motion.div className="overflow-hidden mb-6">
            <motion.h2 
              initial={{ y: "100%" }}
              animate={phase >= 1 ? { y: 0 } : { y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="text-7xl font-extrabold text-[var(--color-secondary)] leading-tight"
            >
              Högst sakpolitisk <span className="text-[var(--color-primary)]">matchning.</span>
            </motion.h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={phase >= 5 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="text-3xl text-[var(--color-text-secondary)] mt-6 border-l-4 border-[var(--color-primary)] pl-6"
          >
            Aldrig en röstuppmaning.<br/>
            Bara ren fakta om var partierna står.
          </motion.p>
        </div>

        {/* Right Side: Results List */}
        <div className="w-1/2 flex flex-col gap-6">
          {results.map((res, i) => {
            const isVisible = phase >= i + 2;
            const barWidth = isVisible ? `${res.percent}%` : "0%";
            
            return (
              <motion.div
                key={res.name}
                initial={{ opacity: 0, x: 100 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-8"
              >
                {/* Percentage Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <motion.circle 
                      cx="48" cy="48" r="40" fill="none" 
                      stroke={res.color} strokeWidth="12" 
                      strokeLinecap="round"
                      strokeDasharray="251.2" // 2 * pi * 40
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={isVisible ? { strokeDashoffset: 251.2 - (251.2 * res.percent) / 100 } : { strokeDashoffset: 251.2 }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                  </svg>
                  <span className="text-2xl font-bold text-[var(--color-secondary)]">{res.percent}%</span>
                </div>

                {/* Name & Bar */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[var(--color-secondary)] mb-3">{res.name}</h3>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: res.color }}
                      initial={{ width: "0%" }}
                      animate={{ width: barWidth }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
};
