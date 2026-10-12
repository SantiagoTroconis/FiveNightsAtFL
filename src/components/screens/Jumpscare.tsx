import { useEffect } from 'react';
import { game, useGame } from '../../game/store';
import { MonsterDefs, MonsterHead } from '../scene/Monster';

export function Jumpscare() {
  const reduced = useGame((s) => s.settings.reducedScares);
  useEffect(() => {
    const id = window.setTimeout(() => game.go('gameover'), reduced ? 1300 : 1750);
    return () => window.clearTimeout(id);
  }, [reduced]);
  return (
    <div className={`jumpscare ${reduced ? 'soft' : ''}`}>
      <svg viewBox="-10 20 420 420" preserveAspectRatio="xMidYMid meet" className="js-head">
        <MonsterDefs prefix="js" />
        <MonsterHead prefix="js" jaw={1} eyeColor="#fff" />
        <circle cx="148" cy="208" r="14" fill="#fff" opacity="0.9" />
        <circle cx="252" cy="208" r="14" fill="#fff" opacity="0.9" />
      </svg>
    </div>
  );
}
