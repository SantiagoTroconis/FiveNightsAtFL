import { useGame } from '../../game/store';

/** Grano de película, viñeta, estática y destellos rojos de alarma. */
export function FxOverlays() {
  const alarmOn = useGame((s) => s.alarmOn);
  const staticFx = useGame((s) => s.fx.staticFx);
  const pos = useGame((s) => s.monster.pos);
  return (
    <>
      <div className="fx-vignette" />
      <div className="fx-grain" />
      <div className="fx-scan" />
      {alarmOn && <div className="fx-alarm" />}
      {pos === 3 && <div className="fx-danger" />}
      {staticFx > 0 && <div className="fx-static" style={{ opacity: Math.min(0.85, staticFx) }} />}
    </>
  );
}
