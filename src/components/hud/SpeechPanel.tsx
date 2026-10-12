import { useState } from 'react';
import { game, useGame } from '../../game/store';
import type { SpeechStatus } from '../../speech/useSpeechRecognition';
import { SpeakButton } from './HUD';

const STATUS: Record<SpeechStatus, { label: string; cls: string }> = {
  listening: { label: 'ESCUCHANDO', cls: 'live' },
  paused: { label: 'LA RADIO HABLA…', cls: 'wait' },
  idle: { label: 'MICRÓFONO EN ESPERA', cls: 'off' },
  unsupported: { label: 'SIN RECONOCIMIENTO DE VOZ', cls: 'warn' },
  denied: { label: 'MICRÓFONO BLOQUEADO', cls: 'warn' },
  error: { label: 'ERROR DE MICRÓFONO', cls: 'warn' },
};

interface Props {
  status: SpeechStatus;
  error: string | null;
  micOn: boolean;
  onRetry: () => void;
  onToggleMic: () => void;
}

export function SpeechPanel({ status, error, micOn, onRetry, onToggleMic }: Props) {
  const heard = useGame((s) => s.heard);
  const fb = useGame((s) => s.feedback);
  const inputMode = useGame((s) => s.settings.inputMode);
  const [text, setText] = useState('');

  const textMode = inputMode === 'text' || status === 'unsupported' || status === 'denied';
  const st = !micOn && inputMode === 'voice' ? { label: 'MICRÓFONO APAGADO (M)', cls: 'off' } : STATUS[status];
  const fresh = fb && fb.age < 7;

  return (
    <div className="speech-panel">
      {!textMode || inputMode === 'voice' ? (
        <div className={`mic-status ${st.cls}`}>
          <span className="mic-dot" />
          {st.label}
          {inputMode === 'voice' && status !== 'unsupported' && (
            <button className="mini" onClick={onToggleMic}>
              {micOn ? 'Apagar' : 'Encender'}
            </button>
          )}
        </div>
      ) : null}

      {status === 'denied' && inputMode === 'voice' && (
        <div className="mic-help">
          Permite el micrófono en el candado 🔒 de la barra de direcciones y luego{' '}
          <button className="mini" onClick={onRetry}>
            reintentar
          </button>
          . Mientras tanto puedes escribir.
        </div>
      )}
      {status === 'error' && error === 'network' && (
        <div className="mic-help">El reconocimiento de voz de Chrome necesita internet. Revisa tu conexión.</div>
      )}
      {status === 'unsupported' && inputMode === 'voice' && (
        <div className="mic-help">Tu navegador no reconoce voz (usa Chrome o Edge). Por ahora, escribe tus respuestas.</div>
      )}

      {heard && <div className="heard">🎙 «{heard}»…</div>}

      {fresh && fb && (
        <div className={`feedback ${fb.ok ? 'ok' : 'bad'}`} style={{ opacity: fb.age > 5 ? Math.max(0, 1 - (fb.age - 5) / 2) : 1 }}>
          <div className="fb-top">
            <span>{fb.ok ? '✔' : '✖'} «{fb.heard}»</span>
            <span className="fb-score">{Math.round(fb.score * 100)}%</span>
          </div>
          {fb.target && (
            <div className="fb-words">
              {fb.words.map((w, i) => (
                <span key={i} className={w.hit ? 'hit' : 'miss'}>
                  {fb.masked ? '▒'.repeat(Math.max(2, w.w.length)) : w.w}
                </span>
              ))}
              {!fb.masked && <SpeakButton text={fb.target.en.replace('...', '')} />}
            </div>
          )}
          {fb.note && <div className="fb-note">{fb.note}</div>}
        </div>
      )}

      {textMode && (
        <form
          className="type-box"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            game.submitTyped(text);
            setText('');
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe en inglés y presiona Enter…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Respuesta en inglés"
          />
        </form>
      )}
    </div>
  );
}
