// Video Template - Replace ReplitLoadingScene with your scenes

import {
  VideoCanvas,
  VideoPausedContext,
  type VideoAspectRatio,
  useVideoPlayer,
} from '@/lib/video';
import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

import { Scene0 } from './video_scenes/Scene0';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

export const SCENE_DURATIONS = {
  scene0: 4000,
  scene1: 6000,
  scene2: 5500,
  scene3: 5500,
  scene4: 5000,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const SCENES = { scene0: Scene0, scene1: Scene1, scene2: Scene2, scene3: Scene3, scene4: Scene4 };
const STARTS = Object.entries(SCENE_DURATIONS).reduce<Record<string, number>>((out, [key, ms]) => {
  out[key] = Object.values(out).length ? Object.entries(SCENE_DURATIONS).slice(0, Object.keys(out).length).reduce((sum, [, value]) => sum + value, 0) / 1000 : 0;
  return out;
}, {});

export default function VideoTemplate({ durations = SCENE_DURATIONS, loop = true, paused = false, muted = false, onSceneChange }: {
  durations?: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  const baseKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENES;
  const Scene = SCENES[baseKey];
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastKey = useRef<string | null>(null);
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    if (paused) { audio.pause(); return; }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      const target = STARTS[baseKey] ?? 0;
      if (Math.abs(audio.currentTime - target) > 0.18) audio.currentTime = target;
    }
    audio.play().catch(() => {});
  }, [baseKey, currentSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: 'var(--color-bg-light)' }}>
        <AnimatePresence mode="popLayout">{Scene && <Scene key={currentSceneKey} />}</AnimatePresence>
        <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
