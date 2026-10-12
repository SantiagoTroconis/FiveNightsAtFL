import { useState } from 'react';
import { audio } from '../../audio/audio';
import { score } from '../../game/matching';
import { game, useGame } from '../../game/store';
import { useSpeechRecognition } from '../../speech/useSpeechRecognition';
import { SpeakButton } from '../hud/HUD';
import { MenuShell } from './Menus';

const TEST_PHRASE = 'Hello Freddy';

export function MicCheck() {
  const accent = useGame((s) => s.settings.accent);
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<{ text: string; pct: number } | null>(null);

  const speech = useSpeechRecognition({
    lang: accent,
    active: true,
    onResult: (alts, isFinal) => {
      setHeard(alts[0] ?? '');
      if (!isFinal) return false;
      const best = Math.max(...alts.map((a) => score(TEST_PHRASE, a)));
      setResult({ text: alts[0], pct: Math.round(best * 100) });
      if (best >= 0.5) audio.success();
      else audio.miss();
      return true;
    },
  });

  const ok = !!result && result.pct >= 50;

  return (
    <MenuShell className="scroll">
      <div className="panel">
        <h2>🎙 Prueba de micrófono</h2>
        <p>
          Cuando el navegador lo pida, <b>permite el uso del micrófono</b>. Luego di:
        </p>
        <div className="mic-test-phrase">
          «{TEST_PHRASE}» <SpeakButton text={TEST_PHRASE} />
        </div>
        <div className={`mic-status big ${speech.status === 'listening' ? 'live' : speech.status === 'denied' || speech.status === 'error' ? 'warn' : 'off'}`}>
          <span className="mic-dot" />
          {speech.status === 'listening' && 'Escuchando… habla ahora'}
          {speech.status === 'paused' && 'Espera…'}
          {speech.status === 'idle' && 'Iniciando micrófono…'}
          {speech.status === 'denied' && 'El micrófono está bloqueado'}
          {speech.status === 'error' && `Error: ${speech.error ?? 'desconocido'}`}
          {speech.status === 'unsupported' && 'Este navegador no reconoce voz'}
        </div>
        {heard && !result && <p className="heard">«{heard}»…</p>}
        {result && (
          <div className={`feedback ${ok ? 'ok' : 'bad'}`}>
            Te escuché: «{result.text}» — {result.pct}%
            <div className="fb-note">{ok ? '¡Perfecto! Tu micrófono funciona.' : 'Casi. Intenta otra vez, despacio y claro.'}</div>
          </div>
        )}
        {speech.status === 'denied' && (
          <p className="mic-help">
            Haz clic en el candado 🔒 junto a la dirección web, permite el micrófono y{' '}
            <button className="mini" onClick={speech.retry}>
              reintenta
            </button>
            .
          </p>
        )}
        {speech.error === 'network' && <p className="mic-help">Chrome necesita conexión a internet para reconocer la voz.</p>}
        <div className="row">
          <button className="btn primary" disabled={!result} onClick={() => game.micDone()}>
            {ok ? 'Continuar ▶' : 'Continuar de todos modos ▶'}
          </button>
          <button className="btn ghost" onClick={() => game.micDone(true)}>
            ⌨ Prefiero escribir
          </button>
        </div>
        <button className="btn ghost small" onClick={() => game.go('menu')}>
          ← Menú
        </button>
      </div>
    </MenuShell>
  );
}
