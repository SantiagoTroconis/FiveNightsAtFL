import { ITEMS, hourLabel } from '../../game/content';
import { game, getCfg, sayModel, useGame } from '../../game/store';
import { ItemBadge } from '../scene/ItemIcon';

export function SpeakButton({ text, title = 'Escuchar pronunciación' }: { text: string; title?: string }) {
  return (
    <button
      className="speak-btn"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        sayModel(text);
      }}
    >
      🔊
    </button>
  );
}

export function HUD({ micOn, onToggleMic }: { micOn: boolean; onToggleMic: () => void }) {
  const night = useGame((s) => s.night);
  const t = useGame((s) => s.t);
  const battery = useGame((s) => s.battery);
  const flashlight = useGame((s) => s.flashlight);
  const score = useGame((s) => s.stats.score);
  const streak = useGame((s) => s.stats.streak);
  const inventory = useGame((s) => s.inventory);
  const bookCharges = useGame((s) => s.bookCharges);
  const calm = useGame((s) => s.monster.calm);
  const cfg = getCfg(night);
  const hour = Math.min(6, Math.floor(t / cfg.hourSeconds));
  const progress = Math.min(1, t / (cfg.hourSeconds * 6));
  const batClass = battery < 15 ? 'crit' : battery < 35 ? 'low' : '';

  return (
    <>
      <div className="hud-clock">
        <div className="hud-time">{hourLabel(hour)}</div>
        <div className="hud-night">
          Noche {night} · {cfg.title.es}
        </div>
        <div className="hud-night-bar">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="hud-right">
        <div className={`battery ${batClass}`} title="Batería de la linterna">
          <span className="battery-icon">{flashlight ? '🔦' : '⚫'}</span>
          <div className="battery-bar">
            <div style={{ width: `${Math.max(0, battery)}%` }} />
          </div>
          <span className="battery-pct">{Math.ceil(battery)}%</span>
        </div>
        <div className="score">
          <span>⭐ {score}</span>
          {streak >= 2 && <span className="streak">🔥 x{streak}</span>}
        </div>
        <div className="inventory">
          {inventory.map((k, i) => (
            <button
              key={`${k}-${i}`}
              className={`inv-slot ${k === 'bell' ? 'usable' : ''}`}
              title={`${ITEMS[k].en} (${ITEMS[k].es}) — ${ITEMS[k].effect.es}`}
              onClick={() => game.useItem(k)}
            >
              <ItemBadge kind={k} size={34} />
              {k === 'bell' && <small>B</small>}
            </button>
          ))}
          {bookCharges > 0 && (
            <div className="inv-slot" title="Traducciones activas">
              <ItemBadge kind="book" size={34} />
              <small>{bookCharges}</small>
            </div>
          )}
          {calm > 0 && (
            <div className="inv-slot" title="Freddy está calmado por la música">
              <span style={{ fontSize: 24 }}>🎵</span>
              <small>{Math.ceil(calm)}</small>
            </div>
          )}
        </div>
        <div className="hud-buttons">
          <button className={flashlight ? 'on' : ''} onClick={() => game.toggleFlashlight()} title="Linterna (F o clic derecho)">
            🔦<kbd>F</kbd>
          </button>
          <button className={micOn ? 'on' : ''} onClick={onToggleMic} title="Micrófono (M)">
            🎙<kbd>M</kbd>
          </button>
          <button onClick={() => game.toggleCommands()} title="Comandos de voz (TAB)">
            📖<kbd>TAB</kbd>
          </button>
          <button onClick={() => game.pause()} title="Pausa (ESC)">
            ⏸<kbd>ESC</kbd>
          </button>
        </div>
      </div>
    </>
  );
}
