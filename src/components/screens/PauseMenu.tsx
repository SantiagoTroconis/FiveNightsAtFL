import { game, useGame } from '../../game/store';
import type { Strictness } from '../../game/types';

export function PauseMenu() {
  const settings = useGame((s) => s.settings);
  const night = useGame((s) => s.night);
  return (
    <div className="overlay">
      <div className="panel pause">
        <h2>PAUSA</h2>
        <button className="btn primary" onClick={() => game.resume()} autoFocus>
          ▶ Continuar
        </button>
        <button
          className="btn"
          onClick={() => {
            game.quitToMenu();
            game.startFlow(night);
          }}
        >
          ↻ Reiniciar noche
        </button>
        <div className="quick-settings">
          <label>
            Volumen
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => game.setSettings({ volume: parseFloat(e.target.value) })}
            />
          </label>
          <label>
            Exigencia de pronunciación
            <select value={settings.strictness} onChange={(e) => game.setSettings({ strictness: e.target.value as Strictness })}>
              <option value="easy">Fácil</option>
              <option value="normal">Normal</option>
              <option value="hard">Estricta</option>
            </select>
          </label>
          <label>
            Responder con
            <select
              value={settings.inputMode}
              onChange={(e) => game.setSettings({ inputMode: e.target.value as 'voice' | 'text' })}
            >
              <option value="voice">🎙 Voz</option>
              <option value="text">⌨ Teclado</option>
            </select>
          </label>
        </div>
        <button className="btn ghost" onClick={() => game.quitToMenu()}>
          Salir al menú
        </button>
      </div>
    </div>
  );
}
