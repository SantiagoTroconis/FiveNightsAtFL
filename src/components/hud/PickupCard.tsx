import { PICKUP_SECONDS, SCENE_H, SCENE_W } from '../../game/config';
import { ITEMS, SPOTS } from '../../game/content';
import { game, getCfg, useGame } from '../../game/store';
import { SpeakButton } from './HUD';

/** Tarjeta que aparece junto al objeto que inspeccionas con la linterna. */
export function PickupCard() {
  const inspecting = useGame((s) => s.inspecting);
  const items = useGame((s) => s.items);
  const night = useGame((s) => s.night);
  const book = useGame((s) => s.bookCharges);
  if (!inspecting) return null;
  const it = items.find((i) => i.uid === inspecting.uid);
  if (!it) return null;
  const def = ITEMS[it.kind];
  const spot = SPOTS[it.spot];
  const showWord = getCfg(night).hints || book > 0;
  const left = (spot.x / SCENE_W) * 100;
  const top = (spot.y / SCENE_H) * 100;
  const flip = spot.y > 700;

  return (
    <div className={`pickup-card ${flip ? 'above' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={(e) => e.stopPropagation()}>
      <button className="close" onClick={() => game.cancelInspect()} aria-label="Cerrar">
        ×
      </button>
      <div className="pc-q">What is it? · ¿Qué es esto?</div>
      {showWord ? (
        <div className="pc-word">
          Di: «{def.en}» <SpeakButton text={def.en} />
          <div className="pc-es">({def.es})</div>
        </div>
      ) : (
        <div className="pc-word">
          ¿Cómo se dice «{def.es}» en inglés?
        </div>
      )}
      <div className="pc-effect">{def.effect.es}</div>
      <div className="pc-timer">
        <div style={{ width: `${(inspecting.timeLeft / PICKUP_SECONDS) * 100}%` }} />
      </div>
    </div>
  );
}
