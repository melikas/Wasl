import { motion } from 'framer-motion';
import { SceneLayout, VideoText } from '@/lib/video';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <SceneLayout className="bg-gradient-cream flex relative overflow-hidden">
      <div className="texture-overlay" />
      
      {/* Background shape */}
      <motion.div 
        className="absolute top-0 right-0 w-[60vw] h-[100vh] bg-primary/5 -skew-x-12 origin-top"
        initial={{ x: '100%' }}
        animate={{ x: '10%' }}
        exit={{ x: '100%' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="w-[45vw] h-full flex flex-col justify-center pl-[8vw] relative z-30">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-[1.8vh] mb-6 tracking-wide uppercase">
            Shared Dashboard
          </div>
          
          <VideoText as="h2" className="text-primary font-display mb-6 leading-tight text-[6vh]">
            Keep the whole <br/>
            <span className="text-secondary italic">care circle</span> <br/>
            on the same page.
          </VideoText>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <VideoText as="p" className="text-text-secondary text-[2.5vh] max-w-[30vw]">
              Shared calendar, task coordination, and status updates in real-time.
            </VideoText>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="flex-1 relative h-full flex items-center justify-center perspective-[1200px]"
        exit={{ opacity: 0, scale: 1.1, x: 100 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Calendar Image */}
        <motion.div
          initial={{ opacity: 0, z: -200, x: 100, rotateY: 20 }}
          animate={{ 
            opacity: 1, 
            z: phase >= 2 ? -150 : 0, 
            x: phase >= 2 ? -80 : 0,
            y: phase >= 2 ? -30 : 0,
            rotateY: phase >= 2 ? 10 : -10 
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[20vw] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-10px_rgba(16,42,67,0.2)] border-[0.5rem] border-white z-10 bg-white"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/photo_1_2026-09-05_20-17-01_1788653833768.jpg`} 
            alt="Calendar View"
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* Tasks Options Image */}
        <motion.div
          initial={{ opacity: 0, z: -100, x: 150, y: 150 }}
          animate={phase >= 2 ? { 
            opacity: 1, 
            z: phase >= 3 ? -50 : 50, 
            x: phase >= 3 ? 20 : 60,
            y: phase >= 3 ? 0 : 50,
            rotateY: phase >= 3 ? -5 : -15 
          } : { opacity: 0, z: -100, x: 150, y: 150 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[18vw] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(16,42,67,0.3)] border-[0.5rem] border-white z-20 bg-white"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/photo_6_2026-09-05_20-17-01_1788653833767.jpg`} 
            alt="Task Options"
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* New Task Image (photo_5) */}
        <motion.div
          initial={{ opacity: 0, z: -50, x: 200, y: 100 }}
          animate={phase >= 3 ? { 
            opacity: 1, 
            z: 80, 
            x: 100,
            y: 70,
            rotateY: -20,
            rotateZ: 5 
          } : { opacity: 0, z: -50, x: 200, y: 100 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[18vw] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(16,42,67,0.4)] border-[0.5rem] border-white z-30 bg-white"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/photo_5_2026-09-05_20-17-01_1788653833766.jpg`} 
            alt="New Task"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </motion.div>

    </SceneLayout>
  );
}
