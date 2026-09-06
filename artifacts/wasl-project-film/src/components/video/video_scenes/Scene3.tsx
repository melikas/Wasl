import { motion } from 'framer-motion';
import { SceneLayout, VideoText } from '@/lib/video';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <SceneLayout className="bg-primary flex relative overflow-hidden">
      <motion.div 
        className="texture-overlay opacity-10" 
        exit={{ opacity: 0 }}
      />
      
      {/* Background shape */}
      <motion.div 
        className="absolute bottom-0 left-0 w-[100vw] h-[40vh] bg-secondary/10 rounded-t-[100%] scale-x-150 origin-bottom"
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        exit={{ y: '100%' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="w-[50vw] h-full flex flex-col justify-center pl-[8vw] relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium text-[1.8vh] mb-6 tracking-wide uppercase">
            Smart Alerts
          </div>
          
          <VideoText as="h2" className="text-white font-display mb-6 leading-tight">
            Never miss a dose <br/>
            <span className="text-secondary italic">or an appointment.</span>
          </VideoText>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <VideoText as="p" className="text-white/70 text-[2.5vh] max-w-[35vw]">
              Set up automated reminders that notify the right people at the right time.
            </VideoText>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="flex-1 relative h-full flex items-center justify-center perspective-[1200px]"
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Medication Image */}
        <motion.div
          initial={{ opacity: 0, y: 200, rotateZ: 5 }}
          animate={{ 
            opacity: 1, 
            y: phase >= 2 ? -20 : 20, 
            x: phase >= 2 ? -70 : -30,
            rotateZ: phase >= 2 ? -8 : 0,
            scale: phase >= 2 ? 0.9 : 1
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[22vw] rounded-[2rem] overflow-hidden shadow-2xl border-[0.5rem] border-secondary/20 z-10 bg-white"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/photo_4_2026-09-05_20-17-01_1788653833766.jpg`} 
            alt="Medication Reminder"
            className="w-full h-auto object-cover"
          />
        </motion.div>

        {/* Appointment Image */}
        <motion.div
          initial={{ opacity: 0, y: 200, x: 50, rotateZ: -5 }}
          animate={phase >= 2 ? { 
            opacity: 1, 
            y: 30, 
            x: 50,
            rotateZ: 6,
            scale: 1.05
          } : { opacity: 0, y: 200, x: 50, rotateZ: -5 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="absolute w-[22vw] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-[0.5rem] border-white z-20 bg-white"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/photo_3_2026-09-05_20-17-01_1788653833768.jpg`} 
            alt="Appointment Reminder"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </motion.div>
    </SceneLayout>
  );
}
