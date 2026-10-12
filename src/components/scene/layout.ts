import type { Monster, Side } from '../../game/types';
import { MONSTER_EYES } from './Monster';

export interface Placement {
  tx: number;
  ty: number;
  s: number;
  where: 'stage' | 'window' | 'hall' | 'door';
}

const DOOR_CENTER: Record<Side, number> = { L: 290, R: 2110 };

/** Dónde y a qué escala se dibuja a Freddy según su posición. */
export function monsterPlacement(pos: Monster['pos'], side: Side): Placement {
  switch (pos) {
    case 3:
      return { tx: DOOR_CENTER[side] - 176, ty: 227, s: 0.88, where: 'door' };
    case 2:
      return { tx: DOOR_CENTER[side] - 60, ty: 377, s: 0.3, where: 'hall' };
    case 1:
      return { tx: 806, ty: 250, s: 0.42, where: 'window' };
    default:
      return { tx: 945, ty: 226, s: 0.1, where: 'stage' };
  }
}

export function eyePositions(p: { tx: number; ty: number; s: number }): [number, number][] {
  return MONSTER_EYES.map(([x, y]) => [p.tx + x * p.s, p.ty + y * p.s]);
}

/** Cara de Freddy pegada a la ventana (susto). */
export const WINDOW_FACE = { tx: 730, ty: 147, s: 0.8 };
