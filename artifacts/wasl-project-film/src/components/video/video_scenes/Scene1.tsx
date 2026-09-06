import { motion } from 'framer-motion';
import { SceneLayout, VideoText } from '@/lib/video';
import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';

const languages = [
  { text: "Talk to Wasl in your language.", lang: "English", font: "font-display" },
  { text: "Parlez à Wasl dans votre langue.", lang: "French", font: "font-display" },
  { text: "تحدث إلى وصل بلغتك.", lang: "Arabic", font: "font-arabic" },
  { text: "به زبان خود با وصل صحبت کنید.", lang: "Persian", font: "font-arabic" }
];

export function Scene1() {
  const [langIndex, setLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % languages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <SceneLayout className="bg-gradient-navy flex flex-row items-center relative overflow-hidden px-[10vw]">
      <motion.div 
        className="texture-overlay opacity-20" 
        exit={{ opacity: 0 }}
      />

      {/* Blurred background image of the app */}
      <motion.div 
        className="absolute right-[-10vw] top-[-10vh] w-[60vw] opacity-20 blur-[12px] rotate-12"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 0.15 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/photo_2_2026-09-05_20-17-01_1788653833767.jpg`} 
          alt="App Background"
          className="w-full h-auto rounded-[3rem] border border-white/10"
        />
      </motion.div>

      {/* Voice pulse rings */}
      <motion.div 
        className="absolute right-[25vw] top-1/2 -translate-y-1/2 w-[30vw] h-[30vw] flex items-center justify-center"
        exit={{ opacity: 0, scale: 0.8 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-secondary/30"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              delay: i * 0.8,
              ease: "linear"
            }}
          />
        ))}
        
        {/* Floating Voice UI Card */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
          className="relative z-10 w-[20vw] h-[20vw] bg-white/10 backdrop-blur-xl rounded-[4rem] flex flex-col items-center justify-center border border-white/20 shadow-2xl"
        >
          <div className="w-[6vw] h-[6vw] rounded-full bg-secondary flex items-center justify-center mb-6">
            <Mic className="w-[3vw] h-[3vw] text-white" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((bar) => (
              <motion.div 
                key={bar}
                className="w-1.5 bg-white rounded-full"
                animate={{ height: ['1vh', '4vh', '1vh'] }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: bar * 0.1,
                  ease: "easeInOut" 
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="w-[45vw] z-10 relative">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-block px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 text-secondary font-medium text-[1.8vh] mb-6 tracking-wide uppercase">
            Voice-First AI
          </div>
          
          <div className="h-[25vh] relative">
            {languages.map((l, idx) => (
              <motion.div
                key={l.lang}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: langIndex === idx ? 1 : 0,
                  y: langIndex === idx ? 0 : -20,
                  scale: langIndex === idx ? 1 : 0.95
                }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <VideoText as="h2" className={`text-white ${l.font} leading-tight text-[5vh]`}>
                  {l.text}
                </VideoText>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
    </SceneLayout>
  );
}
