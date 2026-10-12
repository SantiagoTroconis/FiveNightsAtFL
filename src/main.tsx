import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/creepster';
import '@fontsource/special-elite';
import '@fontsource/vt323';
import './styles.css';
import { App } from './App';
import { audio } from './audio/audio';
import { game, useGame } from './game/store';

audio.setVolume(useGame.getState().settings.volume);

// Acceso de depuración en desarrollo: window.__sof.game / window.__sof.useGame
if (import.meta.env.DEV) (window as unknown as { __sof: unknown }).__sof = { game, useGame };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
