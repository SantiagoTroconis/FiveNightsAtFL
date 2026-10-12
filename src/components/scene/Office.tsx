import { memo, type ReactNode } from 'react';
import { SPOTS } from '../../game/content';
import { game, useGame } from '../../game/store';
import type { ControlId, Side, SpotId, WorldItem } from '../../game/types';
import { ItemIcon } from './ItemIcon';
import { Monster, MonsterDefs, MonsterHead, MonsterSilhouette } from './Monster';
import { WINDOW_FACE, monsterPlacement } from './layout';

/* ------------------------------------------------------------------ */
/*  Definiciones compartidas                                           */
/* ------------------------------------------------------------------ */

function SceneDefs() {
  return (
    <>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3b47" />
          <stop offset="0.6" stopColor="#33313b" />
          <stop offset="1" stopColor="#292731" />
        </linearGradient>
        <linearGradient id="lowerWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2d33" />
          <stop offset="1" stopColor="#1f171c" />
        </linearGradient>
        <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <pattern id="checker" width="70" height="70" patternUnits="userSpaceOnUse">
          <rect width="70" height="70" fill="#c4bfb0" />
          <rect width="35" height="35" fill="#1a1a1a" />
          <rect x="35" y="35" width="35" height="35" fill="#1a1a1a" />
        </pattern>
        <pattern id="stripe" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill="#141414" />
          <rect width="18" height="18" fill="#9a2020" />
          <rect x="18" y="18" width="18" height="18" fill="#9a2020" />
        </pattern>
        <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060609" />
          <stop offset="0.5" stopColor="#0c0c11" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <pattern id="shutter" width="40" height="34" patternUnits="userSpaceOnUse">
          <rect width="40" height="34" fill="#4b4f55" />
          <rect y="28" width="40" height="6" fill="#2b2d31" />
          <rect width="40" height="3" fill="#6c7076" />
        </pattern>
        <pattern id="hazard" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="20" height="40" fill="#c99a16" />
          <rect x="20" width="20" height="40" fill="#111" />
        </pattern>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7d828a" />
          <stop offset="1" stopColor="#3a3d43" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e4430" />
          <stop offset="1" stopColor="#36261a" />
        </linearGradient>
        <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a524a" />
          <stop offset="1" stopColor="#3a352f" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f1b29" />
          <stop offset="1" stopColor="#04070b" />
        </linearGradient>
        <radialGradient id="stain">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clipDoorL">
          <rect x="120" y="190" width="340" height="690" />
        </clipPath>
        <clipPath id="clipDoorR">
          <rect x="1940" y="190" width="340" height="690" />
        </clipPath>
        <clipPath id="clipWindow">
          <rect x="735" y="215" width="310" height="230" />
        </clipPath>
      </defs>
      <MonsterDefs prefix="m" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fondo estático (no cambia nunca → memo sin props)                  */
/* ------------------------------------------------------------------ */

const Backdrop = memo(function Backdrop() {
  return (
    <g>
      {/* Pared y techo */}
      <rect x="0" y="0" width="2400" height="880" fill="url(#wall)" />
      <rect x="0" y="0" width="2400" height="108" fill="#16161b" />
      <rect x="0" y="40" width="2400" height="14" fill="#2c2d33" />
      <rect x="0" y="64" width="2400" height="8" fill="#232429" />
      {[300, 820, 1580, 2100].map((x) => (
        <rect key={x} x={x} y="36" width="10" height="22" fill="#3a3b42" />
      ))}
      <rect x="0" y="108" width="100" height="772" fill="#1f1d25" />
      <rect x="2300" y="108" width="100" height="772" fill="#1f1d25" />

      {/* Manchas de humedad */}
      {[
        [620, 300, 120, 70],
        [1620, 230, 90, 140],
        [1980, 120, 160, 50],
        [880, 140, 140, 40],
        [1320, 520, 110, 60],
      ].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="url(#stain)" />
      ))}

      {/* Telarañas */}
      <path d="M100,108 L170,108 M100,108 L100,178 M100,108 L160,160 M118,108 Q122,126 100,128 M140,108 Q146,146 100,150" stroke="#555" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M2300,108 L2230,108 M2300,108 L2300,180 M2300,108 L2242,164 M2280,108 Q2276,128 2300,130 M2258,108 Q2252,148 2300,152" stroke="#555" strokeWidth="1.5" fill="none" opacity="0.5" />

      {/* Zócalo a cuadros y pared inferior */}
      <rect x="0" y="590" width="2400" height="34" fill="url(#stripe)" />
      <rect x="0" y="624" width="2400" height="250" fill="url(#lowerWall)" />

      {/* Piso */}
      <rect x="0" y="880" width="2400" height="120" fill="url(#checker)" />
      <rect x="0" y="880" width="2400" height="120" fill="url(#floorShade)" />
      <rect x="0" y="872" width="2400" height="10" fill="#0a0a0a" />
      <ellipse cx="1500" cy="960" rx="120" ry="16" fill="#2a0c08" opacity="0.35" />

      {/* Lámpara del techo */}
      <line x1="1200" y1="0" x2="1200" y2="84" stroke="#333" strokeWidth="3" />
      <path d="M1160,84 L1240,84 L1272,118 L1128,118 Z" fill="#2b2b2b" />
      <circle cx="1200" cy="121" r="12" fill="#4a4a40" />

      {/* Cartel de la pizzería */}
      <g transform="rotate(-2 1200 285)">
        <rect x="1100" y="150" width="200" height="270" fill="#cdbb91" />
        <rect x="1100" y="150" width="200" height="50" fill="#8a1c1c" />
        <text x="1200" y="186" fontSize="26" textAnchor="middle" fill="#f3e3b5" fontFamily="'Special Elite', monospace">
          LET'S PARTY!
        </text>
        <circle cx="1158" cy="240" r="18" fill="#6b4626" />
        <circle cx="1242" cy="240" r="18" fill="#6b4626" />
        <circle cx="1200" cy="282" r="54" fill="#6b4626" />
        <rect x="1176" y="208" width="48" height="26" fill="#111" />
        <rect x="1166" y="230" width="68" height="8" fill="#111" />
        <circle cx="1182" cy="272" r="9" fill="#fff" />
        <circle cx="1218" cy="272" r="9" fill="#fff" />
        <circle cx="1184" cy="274" r="4" fill="#111" />
        <circle cx="1216" cy="274" r="4" fill="#111" />
        <ellipse cx="1200" cy="304" rx="28" ry="19" fill="#b48d5f" />
        <ellipse cx="1200" cy="296" rx="9" ry="6" fill="#111" />
        <path d="M1184,310 Q1200,322 1216,310" stroke="#111" strokeWidth="3" fill="none" />
        <text x="1200" y="372" fontSize="15" textAnchor="middle" fill="#5a1414" fontFamily="'Special Elite', monospace">
          FREDDY'S
        </text>
        <text x="1200" y="394" fontSize="13" textAnchor="middle" fill="#5a1414" fontFamily="'Special Elite', monospace">
          FAMILY DINER
        </text>
        <polygon points="1300,420 1268,420 1300,390" fill="#1c1b22" />
        <rect x="1094" y="144" width="34" height="12" fill="#d8d2b0" opacity="0.6" transform="rotate(-20 1110 150)" />
        <rect x="1272" y="144" width="34" height="12" fill="#d8d2b0" opacity="0.6" transform="rotate(20 1290 150)" />
      </g>

      {/* Dibujos de niños */}
      <g transform="rotate(4 1385 235)">
        <rect x="1335" y="175" width="100" height="120" fill="#e8e4d8" />
        <circle cx="1360" cy="200" r="11" fill="none" stroke="#e0a019" strokeWidth="3" />
        <circle cx="1400" cy="248" r="20" fill="none" stroke="#6b4626" strokeWidth="4" />
        <circle cx="1386" cy="230" r="7" fill="none" stroke="#6b4626" strokeWidth="3" />
        <circle cx="1414" cy="230" r="7" fill="none" stroke="#6b4626" strokeWidth="3" />
        <circle cx="1393" cy="246" r="2.5" fill="#c41d1d" />
        <circle cx="1407" cy="246" r="2.5" fill="#c41d1d" />
        <path d="M1352,290 l8,-26 l8,26 M1360,264 v-14 M1350,256 h20" stroke="#2c4fa3" strokeWidth="3" fill="none" />
      </g>
      <g transform="rotate(-6 1497 247)">
        <rect x="1450" y="190" width="95" height="115" fill="#ece6d3" />
        <path d="M1465,290 L1497,215 L1530,290 Z" fill="none" stroke="#a31d1d" strokeWidth="3" />
        <text x="1497" y="212" fontSize="16" textAnchor="middle" fill="#a31d1d" fontFamily="'Special Elite', monospace">
          RUN
        </text>
        <circle cx="1488" cy="262" r="4" fill="#111" />
        <circle cx="1506" cy="262" r="4" fill="#111" />
      </g>
      <g transform="rotate(7 1362 352)">
        <rect x="1330" y="315" width="64" height="76" fill="#e3ddc9" />
        <path d="M1340,375 h44 v-26 l-22,-16 l-22,16 z" fill="none" stroke="#3a7a2c" strokeWidth="3" />
      </g>

      {/* Estante con cosas */}
      <rect x="1330" y="425" width="240" height="14" fill="url(#wood)" />
      <polygon points="1352,439 1372,439 1352,462" fill="#2a1d13" />
      <polygon points="1548,439 1528,439 1548,462" fill="#2a1d13" />
      <rect x="1346" y="378" width="34" height="47" rx="5" fill="#3b4a4a" opacity="0.8" />
      <rect x="1350" y="372" width="26" height="8" fill="#555" />
      <rect x="1390" y="372" width="12" height="53" fill="#5a1d1d" />
      <rect x="1403" y="380" width="10" height="45" fill="#24405a" />
      <rect x="1414" y="376" width="11" height="49" fill="#3a4a22" />
      <ellipse cx="1520" cy="410" rx="22" ry="16" fill="#4e4260" />
      <ellipse cx="1510" cy="374" rx="6" ry="22" fill="#4e4260" transform="rotate(-12 1510 374)" />
      <ellipse cx="1532" cy="372" rx="6" ry="24" fill="#4e4260" transform="rotate(10 1532 372)" />
      <circle cx="1513" cy="406" r="3" fill="#111" />
      <circle cx="1527" cy="406" r="3" fill="#111" />

      {/* Letrero EXIT */}
      <rect x="2050" y="126" width="120" height="40" rx="3" fill="#1a0505" stroke="#2e0a0a" strokeWidth="2" />
      <text x="2110" y="156" fontSize="28" textAnchor="middle" fill="#4a0e0e" fontFamily="VT323, monospace">
        EXIT
      </text>

      {/* Cables al generador */}
      <path d="M1700,108 C1690,250 1720,380 1700,480" stroke="#111" strokeWidth="6" fill="none" />
      <path d="M1752,108 C1770,260 1744,400 1760,480" stroke="#1a1a1a" strokeWidth="5" fill="none" />
    </g>
  );
});

/* ------------------------------------------------------------------ */
/*  Piezas dinámicas                                                   */
/* ------------------------------------------------------------------ */

function Ctl({ id, children, label }: { id: ControlId; children: ReactNode; label: string }) {
  return (
    <g
      className="ctl"
      role="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        game.pressControl(id);
      }}
    >
      {children}
    </g>
  );
}

function Items({ items, spot }: { items: WorldItem[]; spot: SpotId }) {
  const s = SPOTS[spot];
  return (
    <>
      {items
        .filter((i) => i.spot === spot && !i.found)
        .map((i) => (
          <g
            key={i.uid}
            className="item"
            transform={`translate(${s.x} ${s.y})`}
            onClick={(e) => {
              e.stopPropagation();
              game.clickItem(i.uid);
            }}
          >
            <circle r="42" fill="transparent" />
            <ItemIcon kind={i.kind} />
          </g>
        ))}
    </>
  );
}

function Doorway({ side, closed, monsterHere }: { side: Side; closed: boolean; monsterHere: 0 | 2 | 3 }) {
  const ox = side === 'L' ? 0 : 1820;
  const clip = side === 'L' ? 'url(#clipDoorL)' : 'url(#clipDoorR)';
  const p = monsterHere ? monsterPlacement(monsterHere, side) : null;
  return (
    <g>
      <rect x={100 + ox} y="170" width="380" height="720" fill="url(#metal)" />
      <rect x={120 + ox} y="190" width="340" height="690" fill="url(#hall)" />
      <g clipPath={clip}>
        <polygon points={`${120 + ox},190 ${460 + ox},190 ${330 + ox},430 ${250 + ox},430`} fill="#0a0a0d" />
        <polygon points={`${120 + ox},190 ${250 + ox},430 ${250 + ox},600 ${120 + ox},880`} fill="#0b0b10" />
        <polygon points={`${460 + ox},190 ${330 + ox},430 ${330 + ox},600 ${460 + ox},880`} fill="#08080b" />
        <polygon points={`${120 + ox},880 ${460 + ox},880 ${330 + ox},600 ${250 + ox},600`} fill="url(#checker)" opacity="0.16" />
        <rect x={250 + ox} y="430" width="80" height="170" fill="#020202" />
        <rect x={276 + ox} y="436" width="28" height="5" fill="#1d1d1d" />
        <rect x={160 + ox} y="330" width="34" height="56" fill="#2a2620" opacity="0.5" transform={`skewY(${side === 'L' ? 28 : -28})`} />
        {p && (
          <g transform={`translate(${p.tx} ${p.ty}) scale(${p.s})${p.where === 'door' ? ` rotate(${side === 'L' ? 3 : -3} 200 400)` : ''}`} opacity={p.where === 'hall' ? 0.55 : 1}>
            <Monster prefix="m" />
          </g>
        )}
        <g className="shutter" style={{ transform: `translateY(${closed ? 0 : -700}px)` }}>
          <rect x={120 + ox} y="190" width="340" height="690" fill="url(#shutter)" />
          <rect x={120 + ox} y="846" width="340" height="34" fill="url(#hazard)" />
          <rect x={120 + ox} y="842" width="340" height="5" fill="#222" />
        </g>
      </g>
      <rect x={100 + ox} y="170" width="380" height="720" fill="none" stroke="#0c0c0c" strokeWidth="6" />
    </g>
  );
}

function DoorPanel({ side, closed }: { side: Side; closed: boolean }) {
  const x = side === 'L' ? 515 : 1805;
  const id: ControlId = side === 'L' ? 'doorL' : 'doorR';
  return (
    <Ctl id={id} label={side === 'L' ? 'Botón puerta izquierda' : 'Botón puerta derecha'}>
      <rect x={x - 10} y="390" width="100" height="220" fill="transparent" />
      <rect x={x} y="400" width="80" height="200" rx="8" fill="url(#metal)" stroke="#0c0c0c" strokeWidth="3" />
      {[
        [x + 8, 408],
        [x + 72, 408],
        [x + 8, 592],
        [x + 72, 592],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#1b1b1b" />
      ))}
      <circle cx={x + 40} cy="470" r="27" fill={closed ? '#3d0a0a' : '#a51a1a'} stroke="#000" strokeWidth="4" />
      <ellipse cx={x + 32} cy="460" rx="9" ry="6" fill="#fff" opacity={closed ? 0.08 : 0.22} />
      <text x={x + 40} y="517" fontSize="15" textAnchor="middle" fill="#bbb" fontFamily="VT323, monospace">
        DOOR
      </text>
      <circle cx={x + 40} cy="556" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
    </Ctl>
  );
}

function Window({ pos, face }: { pos: number; face: boolean }) {
  const p = pos <= 1 ? monsterPlacement(pos as 0 | 1, 'L') : null;
  return (
    <g>
      <rect x="720" y="200" width="340" height="260" fill="#18181d" stroke="#2a2a30" strokeWidth="6" />
      <rect x="735" y="215" width="310" height="230" fill="url(#glass)" />
      <g clipPath="url(#clipWindow)">
        <rect x="735" y="215" width="310" height="230" fill="#060a0f" />
        <polygon points="905,232 1025,232 1025,300 905,300" fill="#1b0709" />
        {[915, 940, 965, 990].map((x) => (
          <polygon key={x} points={`${x},232 ${x + 20},232 ${x + 14},300 ${x + 4},300`} fill="#2a0a0d" />
        ))}
        <rect x="900" y="300" width="130" height="55" fill="#120a08" />
        {p && (
          <g transform={`translate(${p.tx} ${p.ty}) scale(${p.s})`}>
            <MonsterSilhouette fill={pos === 0 ? '#0a0605' : '#020202'} />
          </g>
        )}
        <ellipse cx="800" cy="410" rx="52" ry="10" fill="#0b1118" />
        <ellipse cx="975" cy="425" rx="62" ry="12" fill="#0b1118" />
        <polygon points="790,400 798,378 806,400" fill="#1a1030" />
        <polygon points="965,415 973,392 981,415" fill="#2a1020" />
        {face && (
          <g transform={`translate(${WINDOW_FACE.tx} ${WINDOW_FACE.ty}) scale(${WINDOW_FACE.s})`}>
            <MonsterHead prefix="m" jaw={0.5} eyeColor="#fff" />
          </g>
        )}
        <polygon points="760,215 800,215 735,330 735,270" fill="#fff" opacity="0.035" />
        <polygon points="960,215 985,215 870,445 845,445" fill="#fff" opacity="0.03" />
      </g>
      <rect x="887" y="215" width="6" height="230" fill="#18181d" />
      <rect x="735" y="327" width="310" height="6" fill="#18181d" />
      <rect x="712" y="455" width="356" height="14" fill="#26262b" />
    </g>
  );
}

function Fan({ on }: { on: boolean }) {
  return (
    <Ctl id="fan" label="Ventilador">
      <rect x="1465" y="505" width="140" height="170" fill="transparent" />
      <ellipse cx="1535" cy="664" rx="42" ry="9" fill="#262626" />
      <rect x="1529" y="598" width="12" height="64" fill="#383838" />
      <circle cx="1535" cy="575" r="16" fill="#2a2a2a" />
      <g className={`fan-blades ${on ? 'on' : ''}`} style={{ transformOrigin: '1535px 575px' }}>
        {[0, 120, 240].map((r) => (
          <ellipse key={r} cx="1535" cy="548" rx="14" ry="27" fill="#6b7075" opacity="0.92" transform={`rotate(${r} 1535 575)`} />
        ))}
      </g>
      <circle cx="1535" cy="575" r="60" fill="none" stroke="#8a8f95" strokeWidth="4" />
      <circle cx="1535" cy="575" r="38" fill="none" stroke="#7a7f85" strokeWidth="2" />
      {[0, 45, 90, 135].map((r) => (
        <line key={r} x1="1475" y1="575" x2="1595" y2="575" stroke="#777" strokeWidth="1.5" transform={`rotate(${r} 1535 575)`} />
      ))}
      <circle cx="1535" cy="575" r="9" fill="#1a1a1a" />
    </Ctl>
  );
}

function Lever({ down }: { down: boolean }) {
  return (
    <Ctl id="lever" label="Palanca del generador">
      <rect x="1655" y="475" width="140" height="232" fill="transparent" />
      <rect x="1660" y="480" width="130" height="220" rx="6" fill="url(#metal)" stroke="#0c0c0c" strokeWidth="3" />
      <rect x="1675" y="490" width="100" height="24" rx="3" fill="#161616" />
      <text x="1725" y="509" fontSize="20" textAnchor="middle" fill="#c99a16" fontFamily="VT323, monospace">
        POWER
      </text>
      <rect x="1718" y="524" width="14" height="150" rx="4" fill="#080808" />
      <g className="lever-arm" style={{ transform: `translateY(${down ? 120 : 0}px)` }}>
        <rect x="1716" y="536" width="18" height="24" rx="4" fill="#3a3a3a" />
        <circle cx="1725" cy="534" r="15" fill="#a51a1a" stroke="#000" strokeWidth="3" />
      </g>
      <path d="M1760,676 l12,-22 l12,22 z" fill="#c99a16" stroke="#111" strokeWidth="2" />
      <text x="1772" y="673" fontSize="12" textAnchor="middle" fill="#111" fontWeight="bold">
        !
      </text>
    </Ctl>
  );
}

function Alarm({ on }: { on: boolean }) {
  return (
    <Ctl id="alarm" label="Botón rojo de alarma">
      <rect x="1640" y="250" width="120" height="180" fill="transparent" />
      <rect x="1684" y="272" width="32" height="10" fill="#333" />
      <path d="M1686,272 a14,14 0 0,1 28,0 z" fill={on ? '#c31b1b' : '#4a0c0c'} />
      <circle cx="1700" cy="345" r="50" fill="url(#hazard)" stroke="#111" strokeWidth="3" />
      <circle cx="1700" cy="345" r="37" fill="#1d1d1d" />
      <circle cx="1700" cy="345" r="28" fill={on ? '#d21f1f' : '#8f1515'} stroke="#000" strokeWidth="3" />
      <ellipse cx="1691" cy="335" rx="9" ry="6" fill="#fff" opacity="0.25" />
      <text x="1700" y="420" fontSize="16" textAnchor="middle" fill="#999" fontFamily="VT323, monospace">
        ALARM
      </text>
    </Ctl>
  );
}

function LightSwitch() {
  return (
    <Ctl id="light" label="Interruptor de luz">
      <rect x="612" y="430" width="76" height="110" fill="transparent" />
      <rect x="625" y="440" width="50" height="80" rx="5" fill="#b7ae9a" stroke="#4d473c" strokeWidth="2" />
      <rect x="642" y="458" width="16" height="30" rx="3" fill="#e8e3d6" stroke="#6d6658" strokeWidth="1.5" />
      <text x="650" y="538" fontSize="13" textAnchor="middle" fill="#888" fontFamily="VT323, monospace">
        LIGHT
      </text>
    </Ctl>
  );
}

function Desk({ items, fanOn }: { items: WorldItem[]; fanOn: boolean }) {
  return (
    <g>
      {/* Bajo el escritorio */}
      <ellipse cx="1200" cy="905" rx="440" ry="34" fill="#000" opacity="0.55" />
      <rect x="730" y="722" width="36" height="170" fill="#161412" />
      <rect x="1634" y="722" width="36" height="170" fill="#161412" />
      <rect x="766" y="722" width="868" height="70" fill="#191714" />
      <Items items={items} spot="underDesk" />

      {/* Bote de basura */}
      <ellipse cx="880" cy="814" rx="38" ry="9" fill="#0d0e0f" />
      <circle cx="866" cy="812" r="12" fill="#cfcabd" opacity="0.7" />
      <Items items={items} spot="trash" />
      <path d="M842,814 L918,814 L908,896 L852,896 Z" fill="#2a2d30" stroke="#111" strokeWidth="2" />
      {[860, 880, 900].map((x) => (
        <line key={x} x1={x} y1="822" x2={x - (x - 880) * 0.15} y2="888" stroke="#1d1f22" strokeWidth="3" />
      ))}
      <rect x="838" y="810" width="84" height="8" rx="3" fill="#3a3d41" />

      {/* Superficie */}
      <polygon points="760,662 1640,662 1690,702 710,702" fill="url(#desk)" />
      <rect x="710" y="702" width="980" height="20" fill="#1c1a17" />
      <rect x="756" y="668" width="70" height="24" fill="#d9d4c6" opacity="0.65" transform="rotate(-6 790 680)" />
      <rect x="770" y="676" width="60" height="18" fill="#c9c3b2" opacity="0.6" transform="rotate(5 800 685)" />
      <rect x="1608" y="636" width="22" height="30" rx="3" fill="#7a1a1a" />
      <line x1="1622" y1="636" x2="1630" y2="612" stroke="#ddd" strokeWidth="3" />

      {/* Radio */}
      <Ctl id="radio" label="Radio: botón TALK">
        <rect x="822" y="512" width="170" height="156" fill="transparent" />
        <line x1="955" y1="594" x2="985" y2="520" stroke="#444" strokeWidth="4" />
        <circle cx="985" cy="520" r="5" fill="#666" />
        <rect x="830" y="592" width="140" height="70" rx="8" fill="#1f221f" stroke="#0b0b0b" strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((c) =>
          [0, 1, 2, 3].map((r) => <circle key={`${c}-${r}`} cx={848 + c * 10} cy={606 + r * 12} r="3" fill="#0b0b0b" />),
        )}
        <rect x="902" y="602" width="58" height="22" rx="2" fill="#0a1a0a" />
        <rect x="902" y="632" width="58" height="22" rx="4" fill="#7a1414" stroke="#000" strokeWidth="2" />
        <text x="931" y="648" fontSize="15" textAnchor="middle" fill="#eee" fontFamily="VT323, monospace">
          TALK
        </text>
      </Ctl>

      <Items items={items} spot="onDesk" />

      {/* Monitor de cámaras */}
      <Ctl id="camera" label="Monitor de cámaras">
        <rect x="1045" y="425" width="310" height="245" fill="transparent" />
        <polygon points="1170,648 1230,648 1252,668 1148,668" fill="#222" />
        <rect x="1050" y="430" width="300" height="220" rx="18" fill="#2b2c2f" stroke="#111" strokeWidth="3" />
        <rect x="1066" y="444" width="268" height="186" rx="12" fill="#121314" />
        <rect x="1076" y="454" width="248" height="166" rx="10" fill="#030604" />
        <circle cx="1330" cy="638" r="4" fill="#3a0d0d" />
        <rect x="1070" y="634" width="46" height="10" rx="2" fill="#c9a227" opacity="0.6" />
      </Ctl>

      {/* Caja de música */}
      <Ctl id="musicBox" label="Caja de música">
        <rect x="1370" y="580" width="104" height="90" fill="transparent" />
        <circle cx="1415" cy="594" r="9" fill="#6b4626" />
        <circle cx="1408" cy="586" r="4" fill="#6b4626" />
        <circle cx="1422" cy="586" r="4" fill="#6b4626" />
        <rect x="1376" y="602" width="78" height="12" rx="3" fill="#6e2a4e" stroke="#c9a227" strokeWidth="2" />
        <rect x="1380" y="612" width="70" height="50" rx="4" fill="#5b2240" stroke="#c9a227" strokeWidth="3" />
        <path d="M1395,630 h40 M1395,644 h40" stroke="#c9a227" strokeWidth="1.5" opacity="0.6" />
        <line x1="1450" y1="634" x2="1466" y2="626" stroke="#c9a227" strokeWidth="4" />
        <circle cx="1468" cy="624" r="5" fill="#c9a227" />
      </Ctl>

      <Fan on={fanOn} />
    </g>
  );
}

function Plant({ items }: { items: WorldItem[] }) {
  return (
    <g>
      <rect x="634" y="812" width="102" height="14" fill="#6e3d26" />
      <polygon points="640,824 730,824 718,892 652,892" fill="#5c3320" />
      <Items items={items} spot="plant" />
      {[
        [690, 760, 18, 62, -25, '#1d3520'],
        [722, 752, 16, 64, 12, '#27442a'],
        [664, 784, 14, 48, -55, '#22381f'],
        [744, 784, 13, 48, 50, '#1d3520'],
        [700, 726, 11, 50, -4, '#2c4a2b'],
        [676, 806, 10, 30, -78, '#4a3a1c'],
      ].map(([cx, cy, rx, ry, rot, fill], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill as string} transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
    </g>
  );
}

function PartsBox({ items }: { items: WorldItem[] }) {
  return (
    <g>
      <polygon points="1650,820 1800,820 1786,790 1664,790" fill="#3d2d18" />
      <Items items={items} spot="box" />
      <rect x="1650" y="820" width="150" height="80" fill="#8a6a3e" stroke="#5c4426" strokeWidth="2" />
      <polygon points="1650,820 1690,820 1676,846 1636,838" fill="#9c7a4a" stroke="#5c4426" strokeWidth="2" />
      <rect x="1714" y="820" width="22" height="80" fill="#b3925c" opacity="0.55" />
      <text x="1725" y="878" fontSize="22" textAnchor="middle" fill="#4a3520" fontFamily="'Special Elite', monospace">
        PARTS
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Escena principal (capa base, debajo de la oscuridad)               */
/* ------------------------------------------------------------------ */

export function Office() {
  const doors = useGame((s) => s.doors);
  const fanOn = useGame((s) => s.fanOn);
  const alarmOn = useGame((s) => s.alarmOn);
  const pos = useGame((s) => s.monster.pos);
  const side = useGame((s) => s.monster.side);
  const items = useGame((s) => s.items);
  const leverDown = useGame((s) => s.fx.lever > 0);
  const face = useGame((s) => s.fx.windowFace > 0);

  const hallL = side === 'L' && (pos === 2 || pos === 3) ? pos : 0;
  const hallR = side === 'R' && (pos === 2 || pos === 3) ? pos : 0;

  return (
    <svg className="scene-svg" viewBox="0 0 2400 1000" preserveAspectRatio="xMidYMid slice">
      <SceneDefs />
      <Backdrop />
      <Window pos={pos} face={face} />
      <Doorway side="L" closed={doors.L > 0} monsterHere={hallL} />
      <Doorway side="R" closed={doors.R > 0} monsterHere={hallR} />
      <DoorPanel side="L" closed={doors.L > 0} />
      <DoorPanel side="R" closed={doors.R > 0} />
      <LightSwitch />
      <Alarm on={alarmOn} />
      <Lever down={leverDown} />
      <Items items={items} spot="shelf" />
      <Plant items={items} />
      <PartsBox items={items} />
      <Desk items={items} fanOn={fanOn} />
      <Items items={items} spot="leftDoor" />
      <Items items={items} spot="rightDoor" />
      <Items items={items} spot="floor" />
    </svg>
  );
}
