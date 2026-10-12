import type { NightConfig, Settings, Strictness } from './types';


export const GAME_TITLE = 'Snake of Freddy';
export const GAME_SUBTITLE = 'Sobrevive la noche. Habla ingles.';

export const SCENE_W = 2400;
export const SCENE_H = 1000;

export const UNLOCK_SECONDS = 9;
export const DOOR_CLOSED_SECONDS = 7;
export const PICKUP_SECONDS = 16;

export const THRESHOLDS: Record<Strictness, number> = {
  easy: 0.6,
  normal: 0.72,
  hard: 0.86,
};

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  strictness: 'normal',
  inputMode: 'voice',
  radioVoice: true,
  reducedScares: false,
  accent: 'en-US',
  translations: 'auto',
};

export const NIGHTS: NightConfig[] = [
  {
    night: 1,
    title: { en: 'First shift', es: 'Primer turno' },
    level: 1,
    hourSeconds: 40,
    translations: true,
    hints: true,
    revealSide: true,
    monster: { base: 0.16, perAnger: 0.06, interval: 10 },
    orderGap: [8, 13],
    orderTime: 30,
    doorTime: 24,
    findTime: 45,
    batteryDrain: 0.5,
    help: 'full',
    maskRadio: false,
    kinds: { action: 0.45, talk: 0.2, check: 0.2, find: 0.15 },
    extraItems: 2,
    script: [
      { kind: 'talk', id: 'hear' },
      { kind: 'action', action: 'lightOn' },
      { kind: 'find', item: 'battery' },
      { kind: 'check', check: 'door', side: 'L' },
      { kind: 'action', action: 'checkCamera' },
    ],
    forcedDoorAt: 95,
  },
  {
    night: 2,
    title: { en: 'Choose wisely', es: 'Elige bien' },
    level: 1,
    hourSeconds: 42,
    translations: true,
    hints: true,
    revealSide: true,
    monster: { base: 0.22, perAnger: 0.06, interval: 9 },
    orderGap: [7, 12],
    orderTime: 27,
    doorTime: 20,
    findTime: 40,
    batteryDrain: 0.65,
    help: 'choices',
    maskRadio: false,
    kinds: { action: 0.45, talk: 0.2, check: 0.2, find: 0.15 },
    extraItems: 2,
  },
  {
    night: 3,
    title: { en: 'No translations', es: 'Sin traducciones' },
    level: 2,
    hourSeconds: 44,
    translations: false,
    hints: true,
    revealSide: false,
    monster: { base: 0.27, perAnger: 0.07, interval: 8 },
    orderGap: [7, 11],
    orderTime: 25,
    doorTime: 17,
    findTime: 36,
    batteryDrain: 0.75,
    help: 'gaps',
    maskRadio: false,
    kinds: { action: 0.45, talk: 0.2, check: 0.2, find: 0.15 },
    extraItems: 3,
  },
  {
    night: 4,
    title: { en: 'Your own words', es: 'Tus propias palabras' },
    level: 2,
    hourSeconds: 45,
    translations: false,
    hints: false,
    revealSide: false,
    monster: { base: 0.32, perAnger: 0.07, interval: 7.5 },
    orderGap: [6, 10],
    orderTime: 23,
    doorTime: 15,
    findTime: 32,
    batteryDrain: 0.85,
    help: 'hint',
    maskRadio: false,
    kinds: { action: 0.45, talk: 0.2, check: 0.2, find: 0.15 },
    extraItems: 3,
  },
  {
    night: 5,
    title: { en: 'The last night', es: 'La última noche' },
    level: 3,
    hourSeconds: 45,
    translations: false,
    hints: false,
    revealSide: false,
    monster: { base: 0.38, perAnger: 0.08, interval: 7 },
    orderGap: [5, 9],
    orderTime: 21,
    doorTime: 13,
    findTime: 30,
    batteryDrain: 0.95,
    help: 'none',
    maskRadio: true,
    kinds: { action: 0.45, talk: 0.2, check: 0.2, find: 0.15 },
    extraItems: 3,
  },
];

export function nightConfig(n: number): NightConfig {
  return NIGHTS[Math.max(0, Math.min(NIGHTS.length - 1, n - 1))];
}

/**
 * Modo de prueba: aÃ±ade ?fast a la URL para que cada hora dure 8 segundos.
 * Ãštil para revisar el juego completo rÃ¡pidamente.
 */
export const FAST_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast');
