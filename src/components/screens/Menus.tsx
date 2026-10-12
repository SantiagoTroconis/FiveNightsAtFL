import { useEffect, useRef, useState, type ReactNode } from 'react';
import { audio } from '../../audio/audio';
import { GAME_SUBTITLE, GAME_TITLE, NIGHTS } from '../../game/config';
import { ACTIONS, ACTION_IDS, ITEMS, ITEM_KINDS } from '../../game/content';
import { ACTION_DIALOGUES, CHECKS, HELP_KINDS, HELP_PHRASES, TALKS, doorReply } from '../../game/dialogues';
import { game, useGame } from '../../game/store';
import type { Settings, Strictness } from '../../game/types';
import { speechSupported } from '../../speech/useSpeechRecognition';
import { SpeakButton } from '../hud/HUD';
import { ItemBadge } from '../scene/ItemIcon';
import { MonsterDefs, MonsterHead } from '../scene/Monster';

/** Linterna que sigue al cursor en los menús. */
function useMenuLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current?.style.setProperty('--x', `${e.clientX}px`);
      ref.current?.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return ref;
}

function MenuShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  const light = useMenuLight();
  return (
    <div className={`menu-screen ${className}`}>
      <div className="menu-freddy" aria-hidden>
        <svg viewBox="-10 20 420 420">
          <MonsterDefs prefix="menu" />
          <MonsterHead prefix="menu" jaw={0.15} eyeColor="#2a0808" />
        </svg>
        <span className="menu-eye l" />
        <span className="menu-eye r" />
      </div>
      <div className="menu-light" ref={light} />
      <div className="fx-grain" />
      <div className="fx-vignette" />
      <div className="menu-content">{children}</div>
    </div>
  );
}

export function Splash() {
  return (
    <div
      className="splash"
      onClick={() => {
        audio.init();
        audio.startAmbience();
        audio.click();
        game.go('menu');
      }}
    >
      <div className="splash-inner">
        <div className="splash-icons">🎧 🎙</div>
        <p>Usa audífonos. Este juego escucha tu voz.</p>
        <p className="dim">Funciona mejor en Google Chrome o Microsoft Edge.</p>
        <div className="splash-cta">HAZ CLIC PARA ENTRAR</div>
      </div>
    </div>
  );
}

export function MainMenu() {
  const progress = useGame((s) => s.progress);
  const [choose, setChoose] = useState(false);
  const cont = Math.min(progress.unlocked, NIGHTS.length);
  const allDone = progress.unlocked > NIGHTS.length;

  return (
    <MenuShell>
      <h1 className="title" data-text={GAME_TITLE}>
        {GAME_TITLE}
      </h1>
      <p className="subtitle">{GAME_SUBTITLE}</p>

      {!choose ? (
        <nav className="menu-buttons">
          <button className="btn primary big" onMouseEnter={() => audio.hover()} onClick={() => game.startFlow(cont)}>
            ▶ {cont === 1 && !progress.stars[1] ? 'Empezar' : 'Continuar'} — Noche {cont}
          </button>
          <button className="btn" onMouseEnter={() => audio.hover()} onClick={() => setChoose(true)}>
            🌙 Elegir noche
          </button>
          <button className="btn" onMouseEnter={() => audio.hover()} onClick={() => game.go('howto')}>
            ❔ Cómo jugar
          </button>
          <button className="btn" onMouseEnter={() => audio.hover()} onClick={() => game.go('words')}>
            📖 Mis frases
          </button>
          <button className="btn" onMouseEnter={() => audio.hover()} onClick={() => game.go('settings')}>
            ⚙ Ajustes
          </button>
        </nav>
      ) : (
        <div className="night-select">
          {NIGHTS.map((n) => {
            const locked = n.night > progress.unlocked;
            const stars = progress.stars[n.night] ?? 0;
            return (
              <button
                key={n.night}
                className={`night-card ${locked ? 'locked' : ''}`}
                disabled={locked}
                onMouseEnter={() => !locked && audio.hover()}
                onClick={() => game.startFlow(n.night)}
              >
                <div className="nc-num">{locked ? '🔒' : n.night}</div>
                <div className="nc-title">{n.title.es}</div>
                <div className="nc-stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                {progress.best[n.night] ? <div className="nc-best">⭐ {progress.best[n.night]}</div> : null}
              </button>
            );
          })}
          <button className="btn ghost" onClick={() => setChoose(false)}>
            ← Volver
          </button>
        </div>
      )}

      {allDone && <p className="menu-note">🏆 Completaste las 5 noches. ¡Intenta conseguir 3 estrellas en todas!</p>}
      {!speechSupported && (
        <p className="menu-note warn">
          ⚠ Tu navegador no tiene reconocimiento de voz. Puedes jugar escribiendo, o abrir el juego en Chrome/Edge para hablar.
        </p>
      )}
    </MenuShell>
  );
}

export function HowToPlay() {
  return (
    <MenuShell className="scroll">
      <div className="panel wide">
        <h2>Cómo jugar</h2>
        <div className="howto-grid">
          <div className="howto">
            <div className="howto-icon">🌙</div>
            <h3>Sobrevive hasta las 6 AM</h3>
            <p>Eres el guardia nocturno de Freddy’s Family Diner. Cada noche dura de 12 AM a 6 AM (unos 4 minutos).</p>
          </div>
          <div className="howto">
            <div className="howto-icon">📻</div>
            <h3>Conversa con la radio</h3>
            <p>
              El gerente te habla en inglés y <b>espera tu respuesta</b>. Si te pide algo (<i>«Can you turn off the fan?»</i>),
              respóndele (<i>«Sure, I'll turn it off»</i>) y, cuando el control brille en verde, <b>haz clic en él</b>. Si no le
              respondes a tiempo, Freddy se acerca.
            </p>
          </div>
          <div className="howto">
            <div className="howto-icon">👁</div>
            <h3>Dile la verdad</h3>
            <p>
              A veces pregunta lo que ves: <i>«Is anyone at the left door?»</i>. Mira con la linterna y responde la verdad. Si
              mientes, la radio no te cree y pierdes tiempo.
            </p>
          </div>
          <div className="howto">
            <div className="howto-icon">🆘</div>
            <h3>Frases de ayuda</h3>
            <p>
              Si no entiendes, dile: <i>«Can you repeat that?»</i>, <i>«Slower, please»</i> o <i>«What does it mean?»</i> (muestra
              la traducción). Tienes 2 ayudas por conversación.
            </p>
          </div>
          <div className="howto">
            <div className="howto-icon">🔦</div>
            <h3>Usa la linterna</h3>
            <p>
              Mueve el mouse para alumbrar. <kbd>F</kbd> o clic derecho la apaga/enciende. La batería se gasta: busca pilas
              (battery) escondidas.
            </p>
          </div>
          <div className="howto">
            <div className="howto-icon">🔎</div>
            <h3>Encuentra objetos</h3>
            <p>Haz clic en un objeto iluminado y di su nombre en inglés para recogerlo: pila, campana, máscara, libro, reloj.</p>
          </div>
          <div className="howto">
            <div className="howto-icon">🐻</div>
            <h3>Freddy</h3>
            <p>
              Camina del escenario al comedor, al pasillo y a una puerta. Escucha sus pasos (izquierda/derecha) y busca sus
              ojos. Cuando llegue, la radio te pregunta por qué puerta: di <i>«He's at the left door!»</i> y presiona el
              botón de esa puerta.
            </p>
          </div>
          <div className="howto">
            <div className="howto-icon">🗣</div>
            <h3>Comandos libres</h3>
            <p>
              Puedes hablar cuando quieras: <i>«Turn on the light»</i> espanta a Freddy del pasillo, <i>«Check the camera»</i>{' '}
              te dice dónde está, <i>«Play the music box»</i> lo calma. <kbd>TAB</kbd> abre la lista.
            </p>
          </div>
        </div>
        <h3>Las 5 noches</h3>
        <ol className="nights-list">
          <li>
            <b>Primer turno:</b> ves la respuesta completa y su traducción, con tutorial.
          </li>
          <li>
            <b>Elige bien:</b> eliges entre varias respuestas la que tiene sentido.
          </li>
          <li>
            <b>Sin traducciones:</b> la respuesta aparece con huecos (<i>«Sure, I'll t___ it o__»</i>).
          </li>
          <li>
            <b>Tus propias palabras:</b> solo una pista en español; Freddy es más rápido.
          </li>
          <li>
            <b>La última noche:</b> la pantalla de la radio está rota: solo escuchas y respondes. ¿Sobrevivirás?
          </li>
        </ol>
        <p className="dim">
          Teclas: <kbd>F</kbd> linterna · <kbd>M</kbd> micrófono · <kbd>R</kbd> pedir que repita · <kbd>B</kbd> campana ·{' '}
          <kbd>TAB</kbd> comandos · <kbd>ESC</kbd> pausa
        </p>
        <button className="btn primary" onClick={() => game.go('menu')}>
          ← Volver
        </button>
      </div>
    </MenuShell>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SettingsScreen() {
  const s = useGame((st) => st.settings);
  const set = (p: Partial<Settings>) => game.setSettings(p);
  const [confirm, setConfirm] = useState(false);
  return (
    <MenuShell className="scroll">
      <div className="panel">
        <h2>Ajustes</h2>
        <div className="settings">
          <label>
            Volumen: {Math.round(s.volume * 100)}%
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set({ volume: parseFloat(e.target.value) })} />
          </label>
          <label>
            Responder con
            <select value={s.inputMode} onChange={(e) => set({ inputMode: e.target.value as Settings['inputMode'] })}>
              <option value="voice">🎙 Voz (recomendado)</option>
              <option value="text">⌨ Teclado</option>
            </select>
          </label>
          <label>
            Exigencia de pronunciación
            <select value={s.strictness} onChange={(e) => set({ strictness: e.target.value as Strictness })}>
              <option value="easy">Fácil — acepta errores grandes</option>
              <option value="normal">Normal</option>
              <option value="hard">Estricta — casi perfecto</option>
            </select>
          </label>
          <label>
            Acento del inglés
            <select value={s.accent} onChange={(e) => set({ accent: e.target.value as Settings['accent'] })}>
              <option value="en-US">Estados Unidos (en-US)</option>
              <option value="en-GB">Reino Unido (en-GB)</option>
            </select>
          </label>
          <label>
            Traducciones al español
            <select value={s.translations} onChange={(e) => set({ translations: e.target.value as Settings['translations'] })}>
              <option value="auto">Según la noche</option>
              <option value="always">Siempre</option>
              <option value="never">Nunca (modo experto)</option>
            </select>
          </label>
          <Toggle value={s.radioVoice} onChange={(v) => set({ radioVoice: v })} label="La radio lee los mensajes en voz alta" />
          <Toggle value={s.reducedScares} onChange={(v) => set({ reducedScares: v })} label="Sustos suaves (sin grito ni cara en la ventana)" />
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => game.go('menu')}>
            ← Volver
          </button>
          {!confirm ? (
            <button className="btn ghost" onClick={() => setConfirm(true)}>
              Borrar progreso
            </button>
          ) : (
            <button
              className="btn danger"
              onClick={() => {
                game.resetProgress();
                setConfirm(false);
              }}
            >
              ¿Seguro? Sí, borrar todo
            </button>
          )}
        </div>
      </div>
    </MenuShell>
  );
}

export function WordBank() {
  const words = useGame((s) => s.progress.words);
  const list = Object.values(words).sort((a, b) => b.tries - a.tries);
  const practiced = new Set(list.map((w) => w.en.toLowerCase()));
  const curriculum: { level: number; items: { en: string; es: string }[] }[] = [1, 2, 3].map((level) => {
    const all = [
      ...Object.values(ACTION_DIALOGUES).flatMap((a) => a.dialogues.filter((d) => d.level === level).map((d) => d.model)),
      ...TALKS.filter((t) => t.level === level && !t.dynamic && !t.model.en.includes('...')).map((t) => t.model),
      ...(level === 1
        ? [
            ...Object.values(CHECKS).flatMap((c) => [c.yes.model, c.no.model]),
            doorReply('L').model,
            doorReply('R').model,
            ...HELP_KINDS.map((h) => HELP_PHRASES[h].model),
          ]
        : []),
      ...ACTION_IDS.flatMap((id) => ACTIONS[id].phrases.filter((p) => p.level === level)),
      ...(level === 1 ? ITEM_KINDS.map((k) => ({ en: ITEMS[k].en, es: ITEMS[k].es })) : []),
    ];
    const seen = new Set<string>();
    return { level, items: all.filter((p) => !seen.has(p.en) && seen.add(p.en)) };
  });

  return (
    <MenuShell className="scroll">
      <div className="panel wide">
        <h2>📖 Mis frases</h2>
        {list.length === 0 ? (
          <p className="dim">Todavía no has practicado. ¡Juega una noche y tus frases aparecerán aquí!</p>
        ) : (
          <table className="words">
            <thead>
              <tr>
                <th>Inglés</th>
                <th>Español</th>
                <th>Aciertos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((w) => {
                const acc = w.tries ? w.ok / w.tries : 0;
                return (
                  <tr key={w.en}>
                    <td>{w.en}</td>
                    <td className="dim">{w.es}</td>
                    <td>
                      <span className={`acc ${acc >= 0.8 ? 'good' : acc >= 0.5 ? 'mid' : 'bad'}`}>
                        {w.ok}/{w.tries}
                      </span>
                    </td>
                    <td>
                      <SpeakButton text={w.en} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <h3>Todo lo que aprenderás</h3>
        {curriculum.map((c) => (
          <div key={c.level} className="curriculum">
            <h4>Nivel {c.level}</h4>
            <div className="chips">
              {c.items.map((p) => (
                <span key={p.en} className={`chip ${practiced.has(p.en.toLowerCase()) ? 'done' : ''}`} title={p.es}>
                  {practiced.has(p.en.toLowerCase()) ? '✓ ' : ''}
                  {p.en}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="items-grid small">
          {ITEM_KINDS.map((k) => (
            <div key={k} className="item-ref">
              <ItemBadge kind={k} size={30} /> {ITEMS[k].en} <SpeakButton text={ITEMS[k].en} />
            </div>
          ))}
        </div>
        <button className="btn primary" onClick={() => game.go('menu')}>
          ← Volver
        </button>
      </div>
    </MenuShell>
  );
}

export { MenuShell };
