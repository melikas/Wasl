import { motion } from 'framer-motion';
import { SceneLayout, VideoText } from '@/lib/video';
import { useEffect, useState } from 'react';

export function Scene0() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <SceneLayout className="bg-gradient-cream flex items-center justify-center relative overflow-hidden">
      <motion.div 
        className="texture-overlay"
        exit={{ opacity: 0 }}
      />
      
      {/* Background abstract shapes */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full border border-secondary/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: 45 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 4, ease: "easeOut" }}
        style={{ left: '-10vw', top: '-20vw' }}
      />
      <motion.div 
        className="absolute w-[60vw] h-[60vw] rounded-full border border-secondary/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1, rotate: -30 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 5, ease: "easeOut", delay: 0.2 }}
        style={{ right: '-5vw', bottom: '-20vw' }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: phase >= 2 ? -40 : 0,
            scale: phase >= 2 ? 0.8 : 1
          }}
          exit={{ opacity: 0, scale: 0.9, y: -100 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-6 rounded-[2.5rem] shadow-soft mb-8"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="Wasl Logo" 
            className="w-[12vw] h-auto object-contain"
          />
        </motion.div>

        <div className="h-[8vh] flex items-center justify-center overflow-hidden relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 1 ? { opacity: 1, y: phase >= 2 ? -20 : 0 } : { opacity: 0, y: 40 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
          >
            <VideoText 
              as="h2"
              className="text-primary font-display font-medium text-center whitespace-nowrap tracking-tight"
            >
              Care coordination, <span className="text-secondary italic font-light">simplified.</span>
            </VideoText>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-10"
          >
            <VideoText 
              as="p"
              className="text-text-secondary text-center max-w-[40vw] text-[2.5vh]"
            >
              For elders, families, and companions.
            </VideoText>
          </motion.div>
        </div>
      </div>
    </SceneLayout>
  );
}
