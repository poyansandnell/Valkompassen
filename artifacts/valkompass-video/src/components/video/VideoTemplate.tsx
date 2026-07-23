import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene0Intro } from './Scene0Intro';
import { Scene1Levels } from './Scene1Levels';
import { Scene2Scale } from './Scene2Scale';
import { Scene3Match } from './Scene3Match';
import { Scene4Privacy } from './Scene4Privacy';
import { Scene5Outro } from './Scene5Outro';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 4500,
  levels: 7000,
  scale: 7000,
  match: 8000,
  privacy: 6000,
  outro: 5500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene0Intro,
  levels: Scene1Levels,
  scale: Scene2Scale,
  match: Scene3Match,
  privacy: Scene4Privacy,
  outro: Scene5Outro,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div
      className="w-full h-screen overflow-hidden relative flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-light)' }}
    >
      {/* Persistent Background Elements */}

      {/* Animated gradient blob 1 */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-40 mix-blend-multiply"
        style={{ background: 'var(--color-primary)' }}
        animate={{
          x: sceneIndex === 0 ? '-30vw' : sceneIndex === 1 ? '40vw' : sceneIndex === 2 ? '-10vw' : sceneIndex === 3 ? '20vw' : sceneIndex === 4 ? '-40vw' : '0vw',
          y: sceneIndex === 0 ? '-20vh' : sceneIndex === 1 ? '30vh' : sceneIndex === 2 ? '-40vh' : sceneIndex === 3 ? '10vh' : sceneIndex === 4 ? '-20vh' : '0vh',
          scale: sceneIndex === 5 ? 1.5 : 1,
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />

      {/* Animated gradient blob 2 */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-30 mix-blend-multiply"
        style={{ background: '#10b981' }} // accent green
        animate={{
          x: sceneIndex === 0 ? '40vw' : sceneIndex === 1 ? '-30vw' : sceneIndex === 2 ? '30vw' : sceneIndex === 3 ? '-20vw' : sceneIndex === 4 ? '40vw' : '0vw',
          y: sceneIndex === 0 ? '20vh' : sceneIndex === 1 ? '-20vh' : sceneIndex === 2 ? '40vh' : sceneIndex === 3 ? '-10vh' : sceneIndex === 4 ? '20vh' : '0vh',
          scale: sceneIndex === 5 ? 0 : 1,
          opacity: sceneIndex === 5 ? 0 : 0.3,
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)`,
          backgroundSize: '4vw 4vw'
        }}
      />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Scenes Container */}
      <div className="relative w-full h-full z-10 flex items-center justify-center">
        <AnimatePresence mode="sync">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
