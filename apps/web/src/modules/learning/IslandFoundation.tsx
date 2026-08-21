import type { IslandDetail } from '@codelife/contracts/learning';
export function IslandFoundation({ island }: { island: IslandDetail }) {
  return <section className="panel" aria-labelledby="island-title">
    <p className="eyebrow">Fixture experimental</p>
    <h2 id="island-title">{island.title}</h2>
    <p>{island.levelCount} níveis · 9 slides controlados</p>
    <ol className="level-list">{island.levels.map((level) => <li key={level.id}><span>Fase {level.position}</span><strong>{level.title}</strong><small>Disponibilidade a ser consolidada no TCC-15</small></li>)}</ol>
  </section>;
}
