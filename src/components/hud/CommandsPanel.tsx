import { ACTIONS, ACTION_IDS, ITEMS, ITEM_KINDS } from '../../game/content';
import { HELP_KINDS, HELP_PHRASES } from '../../game/dialogues';
import { game, getCfg, useGame } from '../../game/store';
import { ItemBadge } from '../scene/ItemIcon';
import { SpeakButton } from './HUD';

/** Libro de comandos de voz (TAB). El juego sigue corriendo mientras lo miras. */
export function CommandsPanel() {
  const night = useGame((s) => s.night);
  const cooldowns = useGame((s) => s.cooldowns);
  const level = getCfg(night).level;

  return (
    <div className="commands" onClick={() => game.toggleCommands(false)}>
      <div className="commands-book" onClick={(e) => e.stopPropagation()}>
        <div className="commands-head">
          <h2>📖 Comandos de voz</h2>
          <button className="close" onClick={() => game.toggleCommands(false)} aria-label="Cerrar">
            ×
          </button>
        </div>
        <p className="commands-sub">
          Puedes decirlos en cualquier momento. El control se ilumina en verde: luego haz clic en él. ¡El reloj sigue
          corriendo!
        </p>
        <div className="commands-grid">
          {ACTION_IDS.map((id) => {
            const a = ACTIONS[id];
            const cd = cooldowns[id] ?? 0;
            return (
              <div key={id} className={`cmd ${cd > 0 ? 'cooling' : ''}`}>
                <div className="cmd-icon">{a.icon}</div>
                <div className="cmd-body">
                  {a.phrases
                    .filter((p) => p.level <= level)
                    .map((p) => (
                      <div key={p.en} className="cmd-phrase">
                        «{p.en}» <SpeakButton text={p.en} />
                        <span className="cmd-es">{p.es}</span>
                      </div>
                    ))}
                  {cd > 0 && <div className="cmd-cd">⏳ {Math.ceil(cd)} s</div>}
                </div>
              </div>
            );
          })}
        </div>
        <h3>Frases de ayuda (durante una conversación)</h3>
        <div className="commands-grid">
          {HELP_KINDS.map((h) => (
            <div key={h} className="cmd">
              <div className="cmd-icon">🆘</div>
              <div className="cmd-body">
                <div className="cmd-phrase">
                  «{HELP_PHRASES[h].model.en}» <SpeakButton text={HELP_PHRASES[h].model.en} />
                  <span className="cmd-es">
                    {HELP_PHRASES[h].model.es} — {HELP_PHRASES[h].info}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <h3>Objetos que puedes encontrar</h3>
        <div className="items-grid">
          {ITEM_KINDS.map((k) => (
            <div key={k} className="item-ref">
              <ItemBadge kind={k} size={36} />
              <div>
                <b>{ITEMS[k].en}</b> <SpeakButton text={ITEMS[k].en} /> <span className="cmd-es">{ITEMS[k].es}</span>
                <div className="cmd-es">{ITEMS[k].effect.es}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
