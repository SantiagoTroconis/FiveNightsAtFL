import { DEFAULT_SETTINGS } from './config';
import type { Progress, Settings } from './types';

const KEY = 'snake-of-freddy:v1';

interface Saved {
  settings: Settings;
  progress: Progress;
}

export const EMPTY_PROGRESS: Progress = { unlocked: 1, stars: {}, best: {}, words: {} };

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Saved>;
      return {
        settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
        progress: { ...EMPTY_PROGRESS, ...(data.progress ?? {}) },
      };
    }
  } catch {
    /* almacenamiento bloqueado o corrupto: empezamos de cero */
  }
  return { settings: { ...DEFAULT_SETTINGS }, progress: { ...EMPTY_PROGRESS } };
}

export function persist(settings: Settings, progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ settings, progress }));
  } catch {
    /* sin almacenamiento: el progreso dura solo esta sesión */
  }
}
