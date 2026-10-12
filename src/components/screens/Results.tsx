import { NIGHTS } from '../../game/config';
import { accuracy, game, getCfg, useGame } from '../../game/store';
import { SpeakButton } from '../hud/HUD';

function StatsGrid() {
  const st = useGame((s) => s.stats);
  const acc = accuracy(st);
  return (
    <div className="stats-grid">
      <div>
        <b>{st.score}</b>
        <span>puntos</span>
      </div>
      <div>
        <b>
          {st.ordersOk}/{st.ordersOk + st.ordersFail}
        </b>
        <span>órdenes cumplidas</span>
      </div>
      <div>
        <b>{Math.round(acc * 100)}%</b>
        <span>precisión al hablar</span>
      </div>
      <div>
        <b>{st.bestStreak}</b>
        <span>mejor racha</span>
      </div>
      <div>
        <b>{st.items}</b>
        <span>objetos encontrados</span>
      </div>
    </div>
  );
}

function Practiced() {
  const practiced = useGame((s) => s.stats.practiced);
  const list = Object.values(practiced).sort((a, b) => b.tries - a.tries).slice(0, 10);
  if (!list.length) return null;
  return (
    <div className="practiced">
      <h3>Frases de esta noche</h3>
      <ul>
        {list.map((p) => (
          <li key={p.en} className={p.ok === p.tries ? 'good' : p.ok === 0 ? 'bad' : 'mid'}>
            <span className="p-en">{p.en}</span>
            <span className="p-es">{p.es}</span>
            <span className="p-acc">
              {p.ok}/{p.tries}
            </span>
            <SpeakButton text={p.en} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GameOver() {
  const death = useGame((s) => s.death);
  const night = useGame((s) => s.night);
  return (
    <div className="results gameover">
      <div className="fx-static on" />
      <h1 className="glitch" data-text="FREDDY TE ATRAPÓ">
        FREDDY TE ATRAPÓ
      </h1>
      {death && (
        <>
          <p className="death-time">
            Noche {death.night} · {death.hourLabel}
          </p>
          <p>
            {death.reason.es} <span className="dim">({death.reason.en})</span>
          </p>
          {death.phrase && (
            <div className="learn">
              Para la próxima, di: <b>«{death.phrase.en}»</b> <SpeakButton text={death.phrase.en} />
              <div className="dim">{death.phrase.es} — y luego presiona el botón rojo de la puerta.</div>
            </div>
          )}
        </>
      )}
      <StatsGrid />
      <Practiced />
      <div className="row">
        <button className="btn primary big" onClick={() => game.startFlow(night)} autoFocus>
          ↻ Reintentar noche {night}
        </button>
        <button className="btn ghost" onClick={() => game.go('menu')}>
          Menú
        </button>
      </div>
    </div>
  );
}

export function NightComplete() {
  const night = useGame((s) => s.night);
  const result = useGame((s) => s.lastResult);
  const cfg = getCfg(night);
  const last = night >= NIGHTS.length;
  const stars = result?.stars ?? 1;
  return (
    <div className={`results complete ${last ? 'victory' : ''}`}>
      <div className="six-am">
        <span className="digit roll">
          <span>5</span>
          <span>6</span>
        </span>
        <span className="ampm">AM</span>
      </div>
      <h1>{last ? '¡SOBREVIVISTE LAS 5 NOCHES!' : '¡SOBREVIVISTE!'}</h1>
      <p className="dim">
        Noche {night} · {cfg.title.es}
      </p>
      <div className="stars-big">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= stars ? 'on' : ''} style={{ animationDelay: `${0.6 + i * 0.25}s` }}>
            ★
          </span>
        ))}
      </div>
      {result?.newBest && <p className="new-best">¡Nuevo récord!</p>}
      {last && (
        <div className="certificate">
          <div className="cert-title">CERTIFICADO DE VALENTÍA</div>
          <p>
            Sobreviviste a Freddy hablando en inglés. You are a <b>brave night guard</b>!
          </p>
        </div>
      )}
      <StatsGrid />
      <Practiced />
      <div className="row">
        {!last && (
          <button className="btn primary big" onClick={() => game.startFlow(night + 1)} autoFocus>
            Noche {night + 1} ▶
          </button>
        )}
        <button className="btn" onClick={() => game.startFlow(night)}>
          ↻ Repetir noche
        </button>
        <button className="btn ghost" onClick={() => game.go('menu')}>
          Menú
        </button>
      </div>
    </div>
  );
}
