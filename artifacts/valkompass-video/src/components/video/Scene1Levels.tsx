import { motion } from 'framer-motion';
import { Landmark, Map, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Scene1Levels = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800), // Card 1
      setTimeout(() => setPhase(2), 1200), // Card 2
      setTimeout(() => setPhase(3), 1600), // Card 3
      setTimeout(() => setPhase(4), 3000), // Fan out
      setTimeout(() => setPhase(5), 4500), // Even local parties text
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const levels = [
    { title: "Riksdag", icon: Landmark, color: "var(--color-primary)", text: "Hela Sverige" },
    { title: "Region", icon: Map, color: "#0ea5e9", text: "Din sjukvård" },
    { title: "Kommun", icon: MapPin, color: "var(--color-accent)", text: "Ditt närområde" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between px-20">
        
        {/* Left Side: Typography */}
        <div className="w-1/2 pr-10">
          <motion.div className="overflow-hidden mb-4">
            <motion.h2 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-7xl font-extrabold text-[var(--color-secondary)] leading-tight"
            >
              Tre nivåer.
              <br />
              <span className="text-[#0d9488]">Ett val.</span>
            </motion.h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-3xl text-[var(--color-text-secondary)] mt-8"
          >
            Matchar dig även mot <span className="font-bold text-[var(--color-secondary)]">små lokala partier</span> utanför fullmäktige.
          </motion.p>
        </div>

        {/* Right Side: Cards */}
        <div className="w-1/2 relative h-[600px] flex items-center justify-center perspective-[1000px]">
          {levels.map((lvl, i) => {
            const Icon = lvl.icon;
            const isFanned = phase >= 4;
            const yOffset = isFanned ? (i - 1) * 160 : 0;
            const xOffset = isFanned ? (i - 1) * 40 : 0;
            const rotation = isFanned ? (i - 1) * 5 : 0;
            const zIndex = 10 - i;
            
            return (
              <motion.div
                key={lvl.title}
                initial={{ opacity: 0, y: 300, scale: 0.8, rotateX: 45 }}
                animate={phase >= i + 1 ? { 
                  opacity: 1, 
                  y: yOffset, 
                  x: xOffset,
                  scale: 1, 
                  rotateZ: rotation,
                  rotateX: 0
                } : { 
                  opacity: 0, 
                  y: 300, 
                  scale: 0.8, 
                  rotateX: 45 
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: isFanned ? 150 : 250, 
                  damping: isFanned ? 20 : 25 
                }}
                className="absolute w-96 bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-6"
                style={{ zIndex }}
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: lvl.color }}
                >
                  <Icon size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-[var(--color-secondary)]">{lvl.title}</h3>
                  <p className="text-xl text-[var(--color-text-muted)] mt-1">{lvl.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.div>
  );
};
