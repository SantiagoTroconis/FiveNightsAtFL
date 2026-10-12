import type { ReactNode } from 'react';
import { ACTIONS, CONTROLS, ITEMS, hourLabel } from '../../game/content';
import { HELP_KINDS, HELP_PHRASES, MAX_HELPS } from '../../game/dialogues';
import { correctReply, game, useGame } from '../../game/store';
import type { Order, ReplyOption } from '../../game/types';
import { SpeakButton } from './HUD';

export const maskText = (t: string) =>
  t
    .split(' ')
    .map((w) => '▒'.repeat(Math.max(2, w.replace(/[^a-zA-Z']/g, '').length)))
    .join(' ');

const KEEP = new Set(['the', 'and', 'you', "i'll", "i'm", "it's", "he's", "there's", "don't", "can't", 'for', 'are']);

/** "Sure, I'll turn it off." → "Sure, I'll t___ it o__." */
export function gapText(t: string): string {
  return t
    .split(' ')
    .map((w, i) => {
      const m = w.match(/^([^a-zA-Z']*)([a-zA-Z']+)([^a-zA-Z']*)$/);
      if (!m || i === 0) return w;
      const [, pre, core, post] = m;
      if (core.length < 3 || KEEP.has(core.toLowerCase())) return w;
      return pre + core[0] + '_'.repeat(core.length - 1) + post;
    })
    .join(' ');
}

const BADGE: Record<Order['kind'], string> = {
  action: '📻 PEDIDO',
  talk: '💬 PREGUNTA',
  check: '🔦 ¿QUÉ VES?',
  find: '🔎 BUSCA',
  door: '⚠ ¡PELIGRO!',
};

function Model({ r, label }: { r: ReplyOption; label?: string }) {
  const speakable = r.model.en.replace('...', '').trim();
  return (
    <div className="answer-model">
      {label && <span className="answer-when">{label}:</span>}
      <span className="phrase">«{r.model.en}»</span> {speakable && <SpeakButton text={speakable} />}
      <div className="phrase-es">{r.model.es}</div>
    </div>
  );
}

function AnswerHelp({ o, correct }: { o: Order; correct: ReplyOption | null }) {
  switch (o.help) {
    case 'full':
      if (o.kind === 'check') return <>{o.replies.map((r) => <Model key={r.model.en} r={r} label={r.when} />)}</>;
      return <Model r={o.kind === 'door' && correct ? correct : o.replies[0]} />;
    case 'choices':
      return (
        <div className="choices">
          {(o.choices ?? []).map((c) => (
            <span key={c} className="choice">
              «{c}»
            </span>
          ))}
          <div className="phrase-es">Elige la respuesta que tiene sentido y dila en voz alta.</div>
        </div>
      );
    case 'gaps':
      return (
        <>
          {(o.kind === 'action' || o.kind === 'talk' || o.kind === 'find' ? o.replies.slice(0, 1) : o.replies).map((r) => (
            <div key={r.model.en} className="phrase gaps">
              «{gapText(r.model.en)}»
            </div>
          ))}
        </>
      );
    case 'hint':
      return <div className="answer-hint">💬 {o.hint}</div>;
    default:
      return <div className="answer-hint">💬 Responde con tus propias palabras.</div>;
  }
}

function Step({ n, active, done, children }: { n: number; active: boolean; done: boolean; children: ReactNode }) {
  return (
    <div className={`step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <span className="step-n">{done ? '✓' : n}</span>
      <div className="step-body">{children}</div>
    </div>
  );
}

function SecondStep({ o }: { o: Order }) {
  if (o.kind === 'find') {
    const kind = (Object.keys(ITEMS) as (keyof typeof ITEMS)[]).find((k) => o.line.en.includes(ITEMS[k].en));
    return (
      <>
        <div className="step-label">BUSCA CON LA LINTERNA, HAZ CLIC Y DI SU NOMBRE</div>
        {kind && o.stage === 'find' && (
          <div className="press-target">
            «{ITEMS[kind].en}» <SpeakButton text={ITEMS[kind].en} />
          </div>
        )}
      </>
    );
  }
  const ctl = o.pressAction ? CONTROLS[ACTIONS[o.pressAction].control] : null;
  return (
    <>
      <div className="step-label">PRESIONA</div>
      <div className="press-target">
        {ctl ? (
          <>
            {ctl.icon} {ctl.label.es} <small>({ctl.label.en})</small>
          </>
        ) : o.kind === 'door' || o.kind === 'check' ? (
          <>🚪 el botón de la puerta (si hace falta)</>
        ) : (
          <>el control que brille en verde</>
        )}
      </div>
    </>
  );
}

export function RadioPanel() {
  const o = useGame((s) => s.order);
  const correct = useGame((s) => (s.order ? correctReply(s, s.order) : null));
  const hour = useGame((s) => s.hour);
  const nextIn = useGame((s) => s.nextOrderIn);

  if (!o) {
    return (
      <div className="radio idle">
        <div className="radio-head">
          <span className="badge">📻 RADIO</span>
          <span className="radio-clock">{hourLabel(hour)}</span>
        </div>
        <p className="static-text">· · · estática · · ·</p>
        <p className="radio-tip">
          {nextIn < 3 ? 'Alguien llama por la radio...' : 'Explora con la linterna. Puedes usar comandos de voz en cualquier momento (TAB).'}
        </p>
      </div>
    );
  }

  const pct = Math.max(0, o.timeLeft / o.timeTotal);
  const finished = o.stage === 'done' || o.stage === 'failed';
  const hidden = o.masked && !o.revealed;
  const hasSecond = o.kind !== 'talk' && !(o.kind === 'check' && o.stage === 'speak' && o.checkKind !== 'door');
  const helpsLeft = MAX_HELPS - o.helpsUsed;

  return (
    <div className={`radio ${o.kind === 'door' ? 'urgent' : ''} stage-${o.stage}`}>
      <div className="radio-head">
        <span className="badge">{BADGE[o.kind]}</span>
        <span className="radio-clock">{hourLabel(hour)}</span>
        {!finished && (
          <button className="mini" onClick={() => game.replay()} title="Pedir que repita (R) — cuenta como ayuda" disabled={helpsLeft <= 0}>
            🔁 {helpsLeft}
          </button>
        )}
      </div>

      <div className="chat">
        {o.log.slice(-3).map((l, i) => (
          <div key={`${o.id}-${o.log.length}-${i}`} className={`bubble from-${l.who} ${l.ok === false ? 'wrong' : ''}`}>
            <span className="who">{l.who === 'radio' ? '📻' : '🎙'}</span>
            <div>
              <div className="bubble-en">{l.who === 'radio' && l.question && hidden ? maskText(l.en) : l.en}</div>
              {l.who === 'radio' && l.es && o.showTranslation && !(l.question && hidden) && <div className="bubble-es">{l.es}</div>}
            </div>
          </div>
        ))}
      </div>

      {!finished && (
        <div className="steps">
          <Step n={1} active={o.stage === 'speak'} done={o.stage !== 'speak'}>
            <div className="step-label">TU RESPUESTA</div>
            {o.stage === 'speak' ? <AnswerHelp o={o} correct={correct} /> : <div className="phrase-es">¡Bien dicho!</div>}
          </Step>
          {hasSecond && (
            <Step n={2} active={o.stage === 'press' || o.stage === 'find'} done={false}>
              <SecondStep o={o} />
            </Step>
          )}
        </div>
      )}

      {o.stage === 'speak' && (
        <div className="help-phrases">
          ¿Ayuda? Di:{' '}
          {HELP_KINDS.map((h) => (
            <span key={h} className="help-chip" title={HELP_PHRASES[h].info}>
              «{HELP_PHRASES[h].model.en}»
            </span>
          ))}
          <span className="help-left">({helpsLeft})</span>
        </div>
      )}

      {!finished && (
        <div className={`timer ${pct < 0.3 ? 'hurry' : ''}`}>
          <div style={{ width: `${pct * 100}%` }} />
          <span>{Math.ceil(o.timeLeft)} s</span>
        </div>
      )}

      {o.stage === 'done' && <div className="result ok">✔ ¡BIEN HECHO!</div>}
      {o.stage === 'failed' && (
        <div className="result fail">
          ✖ {o.kind === 'door' ? '¡Freddy se escapó!' : 'Se acabó el tiempo.'}
          {o.failAnswer && !o.failAnswer.en.includes('...') && (
            <div className="answer">
              Podías decir: «{o.failAnswer.en}» <SpeakButton text={o.failAnswer.en} />
              <span className="phrase-es"> — {o.failAnswer.es}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
