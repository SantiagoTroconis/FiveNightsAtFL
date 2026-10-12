import { useEffect, useState } from 'react';
import { cancelSpeech, speak } from '../../audio/tts';
import { NIGHT_CALLS } from '../../game/content';
import { game, getCfg, useGame } from '../../game/store';

/** Pantalla negra "12:00 AM — Noche N" + llamada del gerente. */
export function NightIntro() {
  const night = useGame((s) => s.night);
  const settings = useGame((s) => s.settings);
  const cfg = getCfg(night);
  const lines = NIGHT_CALLS[night] ?? [];
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= lines.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 1400 : 2600);
    return () => window.clearTimeout(id);
  }, [shown, lines.length]);

  useEffect(() => {
    if (!settings.radioVoice) return;
    const id = window.setTimeout(() => {
      lines.forEach((l) => speak(l.en, { lang: settings.accent, rate: 0.93, pitch: 0.8, volume: Math.min(1, settings.volume + 0.15) }));
    }, 1300);
    return () => {
      window.clearTimeout(id);
      cancelSpeech();
    };
    // Solo al entrar a la pantalla: no se repite si cambian los ajustes.
  }, [night]);

  const start = () => {
    cancelSpeech();
    game.startNight();
  };

  return (
    <div className="intro" onKeyDown={(e) => e.key === 'Enter' && start()}>
      <div className="intro-time">12:00 AM</div>
      <div className="intro-night">
        NOCHE {night} <span>· {cfg.title.es}</span>
      </div>
      <div className="intro-call">
        <div className="call-head">📞 Llamada entrante…</div>
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className="call-line">
            <div className="en">{l.en}</div>
            <div className="es">{l.es}</div>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn primary big" onClick={start} autoFocus>
          Comenzar turno ▶
        </button>
      </div>
      <p className="dim small">🎧 Usa audífonos para que el micrófono no escuche a la radio.</p>
    </div>
  );
}
