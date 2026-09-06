import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  scene0: { title: 'Connected Care', filePath: 'src/components/video/video_scenes/Scene0.tsx' },
  scene1: { title: 'Voice-First AI', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  scene2: { title: 'Shared Dashboard', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  scene3: { title: 'Smart Alerts', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  scene4: { title: 'Care Connected', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
};

const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

function PlaybackStatus({ sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo }: {
  sceneKeys: string[]; activeIndex: number; activeDuration: number; activeStartTime: number; totalDuration: number;
  tick: number; paused: boolean; onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  useEffect(() => { setElapsed(0); base.current = 0; }, [tick]);
  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(base.current + performance.now() - start), 60);
    return () => { window.clearInterval(id); base.current += performance.now() - start; };
  }, [paused, tick]);
  const progress = activeDuration ? Math.min(1, elapsed / activeDuration) : 0;
  return <>
    <div className="flex flex-1 items-center gap-1.5">
      {sceneKeys.map((key, index) => <button key={key} onClick={() => onJumpTo(index)} className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/20" aria-label={`Jump to scene ${index + 1}`}>
        <span className="absolute inset-y-0 left-0 rounded-full bg-white/90" style={{ width: index === activeIndex ? `${progress * 100}%` : '0%' }} />
      </button>)}
    </div>
    <span className="shrink-0 font-mono text-lg text-white/70">{activeIndex + 1}/{sceneKeys.length}</span>
    <span className="min-w-[11ch] shrink-0 text-right font-mono text-lg text-white/80">{formatTime(activeStartTime + Math.min(elapsed, activeDuration))} / {formatTime(totalDuration)}</span>
  </>;
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!controls.paused) return;
    const frozen = document.getAnimations().filter(animation => animation.playState === 'running');
    frozen.forEach(animation => animation.pause());
    return () => frozen.forEach(animation => animation.play());
  }, [controls.paused]);

  const jump = useCallback((index: number) => {
    controls.jumpTo(index);
    const key = controls.sceneKeys[index];
    const details = SCENE_DETAILS[key];
    if (details) window.parent.postMessage({ type: 'REPLIT_VIDEO_SCENE_SELECTED', payload: { sceneIndex: index, sceneCount: controls.sceneKeys.length, sceneTitle: details.title, filePath: details.filePath, lineNumber: 1 } }, '*');
  }, [controls]);

  if (!isIframed) return <VideoTemplate />;
  const visible = !collapsed || hovering;
  return <div className="relative h-screen w-full">
    <VideoTemplate key={controls.mountKey} durations={controls.durations} paused={controls.paused} muted={muted} onSceneChange={controls.onSceneChange} />
    <div className="absolute inset-x-0 bottom-0 z-50 flex h-1/4 flex-col justify-end" onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
      <div className={`flex items-center gap-3 bg-black/55 px-5 py-4 backdrop-blur-md transition-all ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <button onClick={controls.togglePause} className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">{controls.paused ? <Play /> : <Pause />}</button>
        <button onClick={controls.toggleLock} className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${controls.locked ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'}`}><Repeat /></button>
        <button onClick={() => setMuted(value => !value)} className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">{muted ? <VolumeX /> : <Volume2 />}</button>
        <span className="h-10 w-px bg-white/15" />
        <PlaybackStatus sceneKeys={controls.sceneKeys} activeIndex={controls.activeIndex} activeDuration={controls.activeDuration} activeStartTime={controls.activeStartTime} totalDuration={controls.totalDuration} tick={controls.tick} paused={controls.paused} onJumpTo={jump} />
        <button onClick={() => setCollapsed(value => !value)} className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">{collapsed ? <ChevronUp /> : <ChevronDown />}</button>
      </div>
    </div>
  </div>;
}