import { ACTIONS, CONTROLS, SPOTS } from '../../game/content';
import { useGame } from '../../game/store';
import type { ActionId, Side } from '../../game/types';
import { WINDOW_FACE, eyePositions, monsterPlacement } from './layout';

/**
 * Capa que se dibuja ENCIMA de la oscuridad: todo lo que emite luz propia
 * (ojos de Freddy, pantallas, LEDs, controles desbloqueados).
 */

function Eyes({ pts, r, color = '#ff2a2a', blink = false }: { pts: [number, number][]; r: number; color?: string; blink?: boolean }) {
  return (
    <g className={blink ? 'eyes-blink' : undefined}>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 4} fill={color} opacity="0.18" filter="url(#bloom)" />
          <circle cx={x} cy={y} r={r * 1.6} fill={color} opacity="0.7" />
          <circle cx={x} cy={y} r={r} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

const MAP_DOT: Record<string, [number, number]> = {
  '0': [1200, 493],
  '1': [1200, 532],
  '2L': [1111, 585],
  '2R': [1289, 585],
  '3L': [1150, 591],
  '3R': [1250, 591],
};

function CameraScreen({ active, pos, side }: { active: boolean; pos: number; side: Side }) {
  const dotKey = pos >= 2 ? `${pos}${side}` : `${pos}`;
  const [dx, dy] = MAP_DOT[dotKey];
  return (
    <g>
      <rect x="1076" y="454" width="248" height="166" rx="10" fill="#0b2a14" opacity={active ? 0.75 : 0.35} />
      <g clipPath="url(#glowScreen)">
        <g className="screen-scan">
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x="1076" y={454 + i * 24} width="248" height="3" fill="#7dff9b" opacity="0.06" />
          ))}
        </g>
      </g>
      <text x="1088" y="476" fontSize="18" fill="#7dff9b" opacity={active ? 0.95 : 0.4} fontFamily="VT323, monospace">
        CAM 01
      </text>
      {active ? (
        <g stroke="#7dff9b" strokeWidth="2" fill="none" fontFamily="VT323, monospace">
          <circle cx="1306" cy="470" r="5" fill="#ff3030" stroke="none" className="blink" />
          <rect x="1150" y="480" width="100" height="26" />
          <rect x="1110" y="512" width="180" height="40" />
          <rect x="1086" y="560" width="50" height="50" />
          <rect x="1264" y="560" width="50" height="50" />
          <rect x="1160" y="572" width="80" height="38" />
          <line x1="1136" y1="585" x2="1160" y2="591" />
          <line x1="1264" y1="585" x2="1240" y2="591" />
          <line x1="1120" y1="552" x2="1111" y2="560" />
          <line x1="1280" y1="552" x2="1289" y2="560" />
          <g stroke="none" fill="#7dff9b" fontSize="13" opacity="0.85">
            <text x="1200" y="498" textAnchor="middle">STAGE</text>
            <text x="1200" y="548" textAnchor="middle">DINING ROOM</text>
            <text x="1111" y="606" textAnchor="middle">HALL L</text>
            <text x="1289" y="606" textAnchor="middle">HALL R</text>
            <text x="1200" y="596" textAnchor="middle">YOU</text>
          </g>
          <circle cx={dx} cy={dy} r="7" fill="#ff3030" stroke="none" className="blink" />
        </g>
      ) : (
        <text x="1200" y="548" fontSize="16" textAnchor="middle" fill="#7dff9b" opacity="0.25" fontFamily="VT323, monospace">
          · · ·
        </text>
      )}
    </g>
  );
}

export function GlowLayer() {
  const pos = useGame((s) => s.monster.pos);
  const side = useGame((s) => s.monster.side);
  const doorL = useGame((s) => s.doors.L > 0);
  const doorR = useGame((s) => s.doors.R > 0);
  const camera = useGame((s) => s.fx.camera > 0);
  const light = useGame((s) => s.fx.lightFlash > 0);
  const face = useGame((s) => s.fx.windowFace > 0);
  const alarmOn = useGame((s) => s.alarmOn);
  const unlocked = useGame((s) => s.unlocked);
  const order = useGame((s) => s.order);
  const inspecting = useGame((s) => s.inspecting);
  const items = useGame((s) => s.items);

  const doorClosed = side === 'L' ? doorL : doorR;
  const p = monsterPlacement(pos, side);
  const eyes = eyePositions(p);
  const showEyes = pos <= 1 || !doorClosed;
  const eyeR = pos === 3 ? 6 : pos === 2 ? 2.4 : pos === 1 ? 3.2 : 1.3;

  const unlockedIds = (Object.keys(unlocked) as ActionId[]).filter((a) => (unlocked[a] ?? 0) > 0);
  const hasMsg = !!order && order.stage === 'speak';

  const inspectItem = inspecting ? items.find((i) => i.uid === inspecting.uid) : undefined;

  const led = (s: Side) => {
    const a: ActionId = s === 'L' ? 'closeLeft' : 'closeRight';
    const closed = s === 'L' ? doorL : doorR;
    if ((unlocked[a] ?? 0) > 0) return '#3cff7a';
    if (closed) return '#ffb020';
    return '#ff3030';
  };

  return (
    <svg className="scene-svg glow-svg" viewBox="0 0 2400 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="glowScreen">
          <rect x="1076" y="454" width="248" height="166" rx="10" />
        </clipPath>
        <clipPath id="glowWindow">
          <rect x="735" y="215" width="310" height="230" />
        </clipPath>
      </defs>

      {/* Letrero EXIT */}
      <text x="2110" y="156" fontSize="28" textAnchor="middle" fill="#ff3b3b" opacity="0.5" fontFamily="VT323, monospace" filter="url(#bloom)">
        EXIT
      </text>
      <text x="2110" y="156" fontSize="28" textAnchor="middle" fill="#ff5a5a" opacity="0.55" fontFamily="VT323, monospace">
        EXIT
      </text>

      {/* Bombilla */}
      {light && (
        <g>
          <circle cx="1200" cy="121" r="90" fill="#fff3c0" opacity="0.35" filter="url(#bloom)" />
          <circle cx="1200" cy="121" r="15" fill="#fffbe6" />
        </g>
      )}

      {/* Ojos de Freddy */}
      {showEyes && (
        <g clipPath={pos <= 1 ? 'url(#glowWindow)' : undefined}>
          <Eyes pts={eyes} r={eyeR} blink={pos === 1} />
        </g>
      )}
      {face && (
        <g clipPath="url(#glowWindow)">
          <Eyes pts={eyePositions(WINDOW_FACE)} r={8} />
        </g>
      )}

      {/* Monitor */}
      <CameraScreen active={camera} pos={pos} side={side} />

      {/* Radio */}
      <rect x="902" y="602" width="58" height="22" rx="2" fill="#39ff6a" opacity={hasMsg ? 0.35 : 0.15} />
      <text x="931" y="619" fontSize="17" textAnchor="middle" fill="#9dffb4" opacity="0.9" fontFamily="VT323, monospace" className={hasMsg ? 'blink' : undefined}>
        {hasMsg ? 'MSG' : 'CH 06'}
      </text>

      {/* LEDs de las puertas */}
      <circle cx="555" cy="556" r="7" fill={led('L')} opacity="0.85" />
      <circle cx="555" cy="556" r="16" fill={led('L')} opacity="0.2" filter="url(#bloom)" />
      <circle cx="1845" cy="556" r="7" fill={led('R')} opacity="0.85" />
      <circle cx="1845" cy="556" r="16" fill={led('R')} opacity="0.2" filter="url(#bloom)" />

      {/* Baliza de alarma */}
      {alarmOn && (
        <g>
          <circle cx="1700" cy="266" r="22" fill="#ff2020" opacity="0.8" filter="url(#bloom)" />
          <g className="beacon-spin" style={{ transformOrigin: '1700px 266px' }}>
            <polygon points="1700,266 1900,200 1900,330" fill="#ff2020" opacity="0.12" />
            <polygon points="1700,266 1500,200 1500,330" fill="#ff2020" opacity="0.12" />
          </g>
        </g>
      )}

      {/* Controles desbloqueados: brillan en verde */}
      {unlockedIds.map((a) => {
        const c = CONTROLS[ACTIONS[a].control];
        return (
          <g key={a}>
            <g className="ring-pulse" style={{ transformOrigin: `${c.x}px ${c.y}px` }}>
              <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="#3cff7a" strokeWidth="6" />
              <circle cx={c.x} cy={c.y} r={c.r} fill="#3cff7a" opacity="0.08" />
            </g>
            <text x={c.x} y={c.y - c.r - 14} fontSize="30" textAnchor="middle" fill="#3cff7a" fontFamily="VT323, monospace" className="press-label">
              ▼ CLICK ▼
            </text>
          </g>
        );
      })}

      {/* Objeto que estás inspeccionando */}
      {inspectItem && (
        <g className="ring-pulse" style={{ transformOrigin: `${SPOTS[inspectItem.spot].x}px ${SPOTS[inspectItem.spot].y}px` }}>
          <circle cx={SPOTS[inspectItem.spot].x} cy={SPOTS[inspectItem.spot].y} r="46" fill="none" stroke="#ffcf4a" strokeWidth="4" strokeDasharray="10 8" />
        </g>
      )}
    </svg>
  );
}
