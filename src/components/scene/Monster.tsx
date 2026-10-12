import { memo } from 'react';

/**
 * Freddy: animatrónico de oso, dibujado en coordenadas locales 400 x 750.
 * La cabeza está centrada en (200, 235). Los ojos en (148, 208) y (252, 208).
 */

export const MONSTER_EYES: [number, number][] = [
  [148, 208],
  [252, 208],
];

/** Definiciones de gradientes. Debe incluirse una vez dentro de cada <svg> que use a Freddy. */
export function MonsterDefs({ prefix = 'm' }: { prefix?: string }) {
  return (
    <defs>
      <radialGradient id={`${prefix}-fur`} cx="0.45" cy="0.38" r="0.75">
        <stop offset="0" stopColor="#6e4828" />
        <stop offset="0.55" stopColor="#4b2e17" />
        <stop offset="1" stopColor="#24150a" />
      </radialGradient>
      <radialGradient id={`${prefix}-muzzle`} cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#c7a06d" />
        <stop offset="1" stopColor="#80603b" />
      </radialGradient>
      <radialGradient id={`${prefix}-belly`} cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#a98053" />
        <stop offset="1" stopColor="#6d4f30" />
      </radialGradient>
      <radialGradient id={`${prefix}-shade`} cx="0.5" cy="0.42" r="0.6">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.6" />
      </radialGradient>
      <linearGradient id={`${prefix}-endo`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a9098" />
        <stop offset="1" stopColor="#3b3f45" />
      </linearGradient>
    </defs>
  );
}

function Wires({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x},${y} q8,14 2,30`} stroke="#b3261e" strokeWidth="3" fill="none" />
      <path d={`M${x + 8},${y} q-6,16 4,32`} stroke="#c9a227" strokeWidth="3" fill="none" />
      <path d={`M${x + 16},${y + 2} q4,12 -2,26`} stroke="#2f6db3" strokeWidth="3" fill="none" />
    </g>
  );
}

interface HeadProps {
  prefix?: string;
  jaw?: number;
  eyeColor?: string;
}

export const MonsterHead = memo(function MonsterHead({ prefix = 'm', jaw = 0, eyeColor = '#3a0b0b' }: HeadProps) {
  const fur = `url(#${prefix}-fur)`;
  return (
    <g>
      {/* Orejas */}
      <circle cx="86" cy="122" r="46" fill={fur} stroke="#1a0f07" strokeWidth="3" />
      <circle cx="89" cy="126" r="24" fill="#8a6a45" />
      <path
        d="M269,118 a46,46 0 1,1 76,34 l-14,-10 l-8,14 l-12,-12 z"
        fill={fur}
        stroke="#1a0f07"
        strokeWidth="3"
      />
      <circle cx="312" cy="124" r="22" fill="#8a6a45" />

      {/* Cabeza */}
      <ellipse cx="200" cy="235" rx="150" ry="132" fill={fur} stroke="#1a0f07" strokeWidth="4" />

      {/* Rasgadura en la mejilla que deja ver el endoesqueleto */}
      <path d="M78,236 l34,-16 l14,30 l-30,18 z" fill={`url(#${prefix}-endo)`} stroke="#1a0f07" strokeWidth="2" />
      <circle cx="96" cy="240" r="3" fill="#222" />
      <circle cx="110" cy="252" r="3" fill="#222" />
      <Wires x={84} y={252} />

      {/* Sombrero de copa */}
      <g transform="rotate(-7 200 110)">
        <rect x="152" y="32" width="96" height="78" rx="5" fill="#0d0d0f" />
        <rect x="152" y="88" width="96" height="14" fill="#5e0d0d" />
        <rect x="126" y="104" width="148" height="16" rx="5" fill="#0d0d0f" />
      </g>

      {/* Cejas */}
      <path d="M98,168 Q138,146 178,176" stroke="#160c06" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M302,168 Q262,146 222,176" stroke="#160c06" strokeWidth="15" strokeLinecap="round" fill="none" />

      {/* Cuencas de los ojos */}
      <ellipse cx="146" cy="207" rx="40" ry="33" fill="#060302" />
      <ellipse cx="254" cy="207" rx="40" ry="33" fill="#060302" />
      <circle cx={MONSTER_EYES[0][0]} cy={MONSTER_EYES[0][1]} r="10" fill={eyeColor} />
      <circle cx={MONSTER_EYES[1][0]} cy={MONSTER_EYES[1][1]} r="10" fill={eyeColor} />

      {/* Hocico */}
      <ellipse cx="200" cy="292" rx="100" ry="64" fill={`url(#${prefix}-muzzle)`} stroke="#3b2814" strokeWidth="3" />
      <ellipse cx="200" cy="254" rx="31" ry="20" fill="#120a07" />
      <ellipse cx="191" cy="247" rx="9" ry="4" fill="#fff" opacity="0.22" />

      {/* Boca */}
      <path
        d={`M118,304 Q200,332 282,304 L276,${348 + jaw * 50} Q200,${372 + jaw * 60} 124,${348 + jaw * 50} Z`}
        fill="#150404"
      />
      {/* Dientes del endoesqueleto, al fondo */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`e${i}`} x={150 + i * 21} y={326 + jaw * 20} width="14" height="16" rx="2" fill="#7c8188" />
      ))}
      {/* Dientes superiores */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={`u${i}`}
          x={130 + i * 20.5}
          y={304 + Math.sin((i / 6) * Math.PI) * 9}
          width="16"
          height="23"
          rx="3"
          fill="#d8cfb4"
          stroke="#6d6450"
          strokeWidth="1.5"
        />
      ))}

      {/* Mandíbula */}
      <g transform={`translate(0 ${jaw * 58})`}>
        <path d="M116,346 Q200,388 284,346 L278,378 Q200,418 122,378 Z" fill={fur} stroke="#1a0f07" strokeWidth="3" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={`l${i}`}
            x={140 + i * 21}
            y={334 + Math.sin(((i + 0.5) / 6) * Math.PI) * 14}
            width="15"
            height="20"
            rx="3"
            fill="#cfc5a8"
            stroke="#6d6450"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* Manchas y sombra */}
      <ellipse cx="250" cy="300" rx="22" ry="10" fill="#2a0e08" opacity="0.35" />
      <ellipse cx="200" cy="235" rx="150" ry="132" fill={`url(#${prefix}-shade)`} pointerEvents="none" />
    </g>
  );
});

interface MonsterProps {
  prefix?: string;
  jaw?: number;
  eyeColor?: string;
}

export const Monster = memo(function Monster({ prefix = 'm', jaw = 0, eyeColor }: MonsterProps) {
  const fur = `url(#${prefix}-fur)`;
  return (
    <g>
      {/* Brazos */}
      <path d="M62,414 Q18,430 20,520 L26,652 Q28,694 54,694 Q80,694 82,652 L88,470 Z" fill={fur} stroke="#1a0f07" strokeWidth="3" />
      <path d="M338,414 Q382,430 380,520 L374,652 Q372,694 346,694 Q320,694 318,652 L312,470 Z" fill={fur} stroke="#1a0f07" strokeWidth="3" />
      <rect x="28" y="540" width="44" height="26" rx="4" fill={`url(#${prefix}-endo)`} />
      <Wires x={36} y={560} />
      {/* Garras metálicas */}
      {[34, 46, 58, 70].map((x, i) => (
        <line key={`cl${i}`} x1={x} y1="690" x2={x - 4 + i * 2} y2="734" stroke="#6a6e74" strokeWidth="7" strokeLinecap="round" />
      ))}
      {[330, 342, 354, 366].map((x, i) => (
        <line key={`cr${i}`} x1={x} y1="690" x2={x - 2 + i * 2} y2="734" stroke="#6a6e74" strokeWidth="7" strokeLinecap="round" />
      ))}

      {/* Torso */}
      <path
        d="M72,400 Q50,402 48,452 L58,682 Q64,742 130,744 L270,744 Q336,742 342,682 L352,452 Q350,402 328,400 Z"
        fill={fur}
        stroke="#1a0f07"
        strokeWidth="4"
      />
      <ellipse cx="200" cy="584" rx="102" ry="126" fill={`url(#${prefix}-belly)`} />
      <ellipse cx="236" cy="640" rx="16" ry="9" fill="#2a160b" opacity="0.4" />
      <ellipse cx="168" cy="540" rx="10" ry="6" fill="#2a160b" opacity="0.35" />

      {/* Cuello metálico */}
      <rect x="170" y="352" width="60" height="52" fill={`url(#${prefix}-endo)`} />
      {[362, 376, 390].map((y) => (
        <line key={y} x1="170" y1={y} x2="230" y2={y} stroke="#2a2d31" strokeWidth="3" />
      ))}

      {/* Moño */}
      <path d="M200,408 L148,384 L148,432 Z" fill="#111" stroke="#000" strokeWidth="2" />
      <path d="M200,408 L252,384 L252,432 Z" fill="#111" stroke="#000" strokeWidth="2" />
      <circle cx="200" cy="408" r="12" fill="#1b1b1b" />

      <MonsterHead prefix={prefix} jaw={jaw} eyeColor={eyeColor} />
    </g>
  );
});

/** Silueta negra para cuando Freddy está lejos (ventana / escenario). */
export const MonsterSilhouette = memo(function MonsterSilhouette({ fill = '#030303' }: { fill?: string }) {
  return (
    <g fill={fill}>
      <circle cx="86" cy="122" r="46" />
      <circle cx="314" cy="122" r="46" />
      <ellipse cx="200" cy="240" rx="152" ry="136" />
      <g transform="rotate(-7 200 110)">
        <rect x="152" y="32" width="96" height="78" rx="5" />
        <rect x="126" y="104" width="148" height="16" rx="5" />
      </g>
      <rect x="160" y="350" width="80" height="60" />
      <path d="M72,400 Q50,402 48,452 L58,682 Q64,742 130,744 L270,744 Q336,742 342,682 L352,452 Q350,402 328,400 Z" />
      <path d="M62,414 Q18,430 20,520 L26,652 Q28,694 54,694 Q80,694 82,652 L88,470 Z" />
      <path d="M338,414 Q382,430 380,520 L374,652 Q372,694 346,694 Q320,694 318,652 L312,470 Z" />
    </g>
  );
});
