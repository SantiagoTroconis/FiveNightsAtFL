import { useEffect, useRef, useState } from 'react';
import { SCENE_H, SCENE_W } from '../game/config';
import { game, useGame } from '../game/store';
import { useSpeechRecognition } from '../speech/useSpeechRecognition';
import { CommandsPanel } from './hud/CommandsPanel';
import { FxOverlays } from './hud/FxOverlays';
import { HUD } from './hud/HUD';
import { PickupCard } from './hud/PickupCard';
import { RadioPanel } from './hud/RadioPanel';
import { SpeechPanel } from './hud/SpeechPanel';
import { Toasts } from './hud/Toasts';
import { Jumpscare } from './screens/Jumpscare';
import { PauseMenu } from './screens/PauseMenu';
import { GlowLayer } from './scene/GlowLayer';
import { Office } from './scene/Office';

const RATIO = SCENE_W / SCENE_H;
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

export function GameScreen() {
  const screen = useGame((s) => s.screen);
  const accent = useGame((s) => s.settings.accent);
  const inputMode = useGame((s) => s.settings.inputMode);
  const commandsOpen = useGame((s) => s.commandsOpen);
  const sceneRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const [micOn, setMicOn] = useState(true);

  const speech = useSpeechRecognition({
    lang: accent,
    active: screen === 'playing' && inputMode === 'voice' && micOn,
    onResult: game.handleSpeech,
  });

  // Lógica del juego a 10 Hz.
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      game.tick(dt);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  // Linterna + paneo de la oficina a 60 fps (sin re-render de React).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);

    let raf = 0;
    let pan = -1;
    let lastW = 0;
    let lastH = 0;
    let flickDark = false;
    let nextFlick = 0;
    const frame = (now: number) => {
      const scene = sceneRef.current;
      const dark = darkRef.current;
      const beam = beamRef.current;
      if (scene && dark && beam) {
        const s = useGame.getState();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const H = Math.max(vh, vw / RATIO);
        const W = H * RATIO;
        if (W !== lastW || H !== lastH) {
          scene.style.width = `${W}px`;
          scene.style.height = `${H}px`;
          lastW = W;
          lastH = H;
        }
        const range = Math.max(0, W - vw);
        const t = Math.max(0, Math.min(1, (pointer.x / vw - 0.16) / 0.68));
        const target = range * t;
        pan = pan < 0 ? target : pan + (target - pan) * 0.09;
        const oy = (vh - H) / 2;
        let sx = 0;
        let sy = 0;
        if (s.fx.shake > 0) {
          const a = 16 * Math.min(1, s.fx.shake);
          sx = (Math.random() - 0.5) * a;
          sy = (Math.random() - 0.5) * a;
        }
        scene.style.transform = `translate3d(${-pan + sx}px, ${oy + sy}px, 0)`;

        const on = s.flashlight && s.battery > 0;
        let r = on ? Math.min(vw, vh) * 0.22 + 80 : 1;
        if (on && s.battery < 25) r *= 0.65 + 0.35 * (s.battery / 25);
        if (on && s.battery < 15 && Math.random() < 0.07) r *= 0.2;
        let a = 0.955;
        // Parpadeo: el estado se mantiene unos 70-190 ms para no ser estroboscópico.
        if (s.fx.flicker > 0) {
          if (now >= nextFlick) {
            const p = (s.powerFailing ? 0.15 : 0.4) * (s.settings.reducedScares ? 0.5 : 1);
            flickDark = Math.random() < p;
            nextFlick = now + 70 + Math.random() * 120;
          }
        } else flickDark = false;
        if (flickDark) {
          a = 1;
          r = Math.max(1, r * 0.1);
        }
        if (s.fx.lightFlash > 0) a = 0.16;
        const lx = `${pointer.x + pan}px`;
        const ly = `${pointer.y - oy}px`;
        for (const el of [dark, beam]) {
          el.style.setProperty('--x', lx);
          el.style.setProperty('--y', ly);
          el.style.setProperty('--r', `${r}px`);
        }
        dark.style.setProperty('--a', `${a}`);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  }, []);

  // Teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') {
        if (s.commandsOpen) game.toggleCommands(false);
        else if (s.screen === 'playing') game.pause();
        else if (s.screen === 'paused') game.resume();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        game.toggleCommands();
        return;
      }
      if (typing || e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'f') game.toggleFlashlight();
      else if (k === 'm') setMicOn((v) => !v);
      else if (k === 'r') game.replay();
      else if (k === 'b') game.useItem('bell');
    };
    const onVis = () => {
      if (document.hidden) game.pause();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      className="game"
      onContextMenu={(e) => {
        e.preventDefault();
        game.toggleFlashlight();
      }}
    >
      <div className="scene" ref={sceneRef}>
        <Office />
        <div className="darkness" ref={darkRef} />
        <div className="beam" ref={beamRef} />
        <GlowLayer />
        <PickupCard />
      </div>
      <FxOverlays />
      <HUD micOn={micOn} onToggleMic={() => setMicOn((v) => !v)} />
      <RadioPanel />
      <SpeechPanel status={speech.status} error={speech.error} micOn={micOn} onRetry={speech.retry} onToggleMic={() => setMicOn((v) => !v)} />
      <Toasts />
      {commandsOpen && <CommandsPanel />}
      {screen === 'paused' && <PauseMenu />}
      {screen === 'jumpscare' && <Jumpscare />}
    </div>
  );
}
