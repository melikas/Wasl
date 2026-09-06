import { motion } from 'framer-motion';
import { SceneLayout, VideoText } from '@/lib/video';

export function Scene4() {
  return (
    <SceneLayout className="bg-gradient-cream flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div 
        className="absolute inset-0 z-0 opacity-10 mix-blend-multiply" 
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/texture.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        exit={{ opacity: 0 }}
      />
      <motion.div 
        className="texture-overlay" 
        exit={{ opacity: 0 }}
      />
      
      {/* Abstract elegant rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <motion.div
          className="w-[80vw] h-[80vw] rounded-full border-[1px] border-secondary/20"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 3, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-[100vw] h-[100vw] rounded-full border-[1px] border-primary/10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 4, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      <div className="relative z-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="Wasl Logo" 
            className="w-[14vw] h-auto object-contain mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <VideoText as="h2" className="text-primary font-display font-medium text-[5vh]">
            Peace of mind.
          </VideoText>
          <VideoText as="h2" className="text-text-secondary mt-2 text-[3vh] font-light">
            For the whole family.
          </VideoText>
        </motion.div>
      </div>
      
    </SceneLayout>
  );
}
