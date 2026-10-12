import { memo } from 'react';
import type { ItemKind } from '../../game/types';

/** Ícono SVG de cada objeto, centrado en (0,0), aprox. 56 px de alto. */
export const ItemIcon = memo(function ItemIcon({ kind }: { kind: ItemKind }) {
  switch (kind) {
    case 'battery':
      return (
        <g transform="rotate(-12)">
          <rect x="-13" y="-26" width="26" height="52" rx="5" fill="#c9a227" stroke="#3a2d06" strokeWidth="2.5" />
          <rect x="-13" y="-26" width="26" height="20" rx="5" fill="#1f1f22" />
          <rect x="-6" y="-32" width="12" height="7" rx="2" fill="#9b9b9b" />
          <path d="M-4,8 h8 M0,4 v8" stroke="#3a2d06" strokeWidth="3" strokeLinecap="round" />
          <rect x="-9" y="-2" width="4" height="22" rx="2" fill="#fff" opacity="0.25" />
        </g>
      );
    case 'bell':
      return (
        <g>
          <path d="M-6,-30 a6,6 0 1,1 12,0" stroke="#7a5a12" strokeWidth="4" fill="none" />
          <path d="M-24,16 Q-22,-26 0,-26 Q22,-26 24,16 L28,22 L-28,22 Z" fill="#c99a2e" stroke="#5a420c" strokeWidth="2.5" />
          <circle cx="0" cy="26" r="6" fill="#7a5a12" />
          <path d="M-12,-14 Q-14,2 -12,14" stroke="#fff3c4" strokeWidth="3" opacity="0.4" fill="none" />
        </g>
      );
    case 'mask':
      return (
        <g>
          <circle cx="-22" cy="-18" r="11" fill="#6b4626" stroke="#2a180a" strokeWidth="2" />
          <circle cx="22" cy="-18" r="11" fill="#6b4626" stroke="#2a180a" strokeWidth="2" />
          <ellipse cx="0" cy="2" rx="30" ry="27" fill="#6b4626" stroke="#2a180a" strokeWidth="2.5" />
          <ellipse cx="-11" cy="-4" rx="7" ry="6" fill="#050302" />
          <ellipse cx="11" cy="-4" rx="7" ry="6" fill="#050302" />
          <ellipse cx="0" cy="13" rx="15" ry="10" fill="#b48d5f" />
          <ellipse cx="0" cy="8" rx="6" ry="4" fill="#1a0f08" />
          <path d="M-8,18 h16" stroke="#1a0f08" strokeWidth="2" />
        </g>
      );
    case 'book':
      return (
        <g transform="rotate(8)">
          <rect x="-22" y="-26" width="44" height="52" rx="3" fill="#6d1717" stroke="#2e0808" strokeWidth="2.5" />
          <rect x="16" y="-24" width="6" height="48" fill="#e6dfcc" />
          <rect x="-16" y="-14" width="28" height="14" rx="2" fill="#c9a227" />
          <text x="-2" y="-3" fontSize="10" textAnchor="middle" fill="#2e0808" fontFamily="VT323, monospace">
            ABC
          </text>
          <text x="-2" y="16" fontSize="9" textAnchor="middle" fill="#e6dfcc" fontFamily="VT323, monospace">
            EN·ES
          </text>
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle cx="-17" cy="-24" r="9" fill="#9aa1a7" stroke="#3b3f44" strokeWidth="2" />
          <circle cx="17" cy="-24" r="9" fill="#9aa1a7" stroke="#3b3f44" strokeWidth="2" />
          <line x1="-16" y1="22" x2="-22" y2="30" stroke="#3b3f44" strokeWidth="4" strokeLinecap="round" />
          <line x1="16" y1="22" x2="22" y2="30" stroke="#3b3f44" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="0" r="26" fill="#b0b6bb" stroke="#3b3f44" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="20" fill="#efeadd" />
          <line x1="0" y1="0" x2="0" y2="-14" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="10" y2="5" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="2.5" fill="#b3261e" />
        </g>
      );
  }
});

/** Versión HTML (para el inventario y las tarjetas). */
export function ItemBadge({ kind, size = 40 }: { kind: ItemKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-36 -36 72 72" aria-hidden>
      <ItemIcon kind={kind} />
    </svg>
  );
}
