/* Landfall — the Ariadne's schematic, for the Ship view (Lachlan, 2026-11-16: the ship card should show what is
   still on board and what is damaged). Since 2026-11-27 drawn on her own pixel plan (below, LF.shipPlan). It was a side elevation drawn as a blueprint, fore to aft: the bridge, the crew deck
   with whoever is awake aboard, cryo banks B to D with a cell per pod (lit, amber or dark), the hold with a cradle per
   system (its condition, or empty once it is down), the lander dock, and the drive with the empty reactor bay. Damage
   comes from what has happened (a tumble, a jettisoned bank, failing pods, a dry tank) and from anything a thread
   says about the ship (LF.shipMarks: a section can be dark, sealed, unknown or overgrown). A pure function of s that
   returns an SVG string; colours are the theme's variables, so it recolours with the rest. No DOM. */
(function () {
'use strict';
const BANKS = ['B', 'C', 'D'], SYS = ['hydroponics', 'reclaimer', 'medbay', 'fabricator'];
const SHORT = { hydroponics: 'HYDRO', reclaimer: 'RECLAIM', medbay: 'AUTODOC', fabricator: 'FAB' };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const col = v => `style="fill:var(--${v})"`, str = (v, w) => `style="stroke:var(--${v});stroke-width:${w || 1};fill:none"`;

/* What threads and events have done to each section: { bridge, crew, banks, hold, dock, drive } -> mark. Threads add
   their own through LF.SHIP_MARKS (functions of s returning { section: 'dark'|'sealed'|'unknown'|'growth'|'breach' }). */
LF.SHIP_MARKS = LF.SHIP_MARKS || [];
LF.shipMarks = function (s) {
  const m = {}, f = s.flags || {}, mo = s.memo && s.memo['ship.orbit'];
  if (mo && mo.i === 1 && mo.ok === false) { m.banks = 'breach'; m.hold = 'breach'; }
  for (const fn of LF.SHIP_MARKS) { try { Object.assign(m, fn(s) || {}); } catch (e) {} }
  return m;
};
/* One line under the schematic, the worst thing about the ship right now, or nothing. */
LF.shipDamage = function (s) {
  const m = LF.shipMarks(s), f = s.flags || {}, out = [];
  if (m.bridge === 'dark' || m.crew === 'dark') out.push('No answer from the bridge');
  if (m.hold === 'growth') out.push('Something growing in the hold');
  if (Object.values(m).includes('sealed')) out.push('Sections sealed');
  if (m.banks === 'breach') out.push('Hull scarred where she tumbled');
  if (f.lim_jettisoned) out.push('Bank D let go');
  if (f.lim_amber_cut || (s.memo && s.memo['ship.pods'])) out.push('Bank B patched');
  const worn = LF.aboard(s).filter(id => s.machines[id].hp < 30); if (worn.length) out.push(`${worn.length === 1 ? LF.MACHINES[worn[0]].name : worn.length + ' systems'} failing in the cradles`);
  return out;
};
/* The Ariadne as she is built (2026-11-27, docs/ariadne-plan.md): the same pixel plan the walk aboard is drawn on
   (art/walk/plan.webp), with what is aboard marked on her own rooms, at the walk's positions (LF.WALK_ROOMS). A thread's mark
   (dark, sealed, unknown, growth, breach) is drawn on the rooms of its section. */
const AT = { bridge: ['bridge'], crew: ['crew', 'galley', 'infirm'], banks: ['bankB', 'bankC', 'bankD'], hold: ['hold'], dock: ['collar'], drive: ['drive'] };
LF.shipPlan = function (s) {
  const R = LF.WALK_ROOMS, mk = LF.shipMarks(s), f = s.flags || {}, up = LF.inOrbit(s), L = s.machines.lander, parts = [];
  const lbl = (x, y, t, c, size) => parts.push(`<text x="${x}" y="${y}" text-anchor="middle" font-size="${(size || 6.5) * 1.3}" font-weight="800" class="sp-l" ${col(c || 'ink')}>${esc(t)}</text>`);
  const hidden = key => ['dark', 'unknown', 'sealed'].includes(mk[key]);
  // the plan, then the marks of each section
  parts.push(`<image href="art/walk/plan.webp" x="0" y="0" width="320" height="213" class="sp-plan"/>`);
  for (const key in AT) { const m = mk[key]; if (!m) continue;
    for (const r of AT[key]) { const p = R[r];
      if (m === 'growth') parts.push(`<path d="M${p.x - 12} ${p.y + 6} q 6 -14 12 -4 t 12 -6" ${str('bad', 1.6)}/><path d="M${p.x - 10} ${p.y - 6} q 8 8 20 2" ${str('bad', 1.2)}/>`);
      else if (m === 'breach') parts.push(`<circle cx="${p.x}" cy="${p.y}" r="11" ${str('bad', 1.4)} stroke-dasharray="3 2"/>`);
      else parts.push(`<circle cx="${p.x}" cy="${p.y}" r="10" style="fill:var(--bg);opacity:.8"/>`); }
    if (['dark', 'unknown', 'sealed'].includes(m)) { const p = R[AT[key][0]]; lbl(p.x, p.y - 13, m.toUpperCase(), m === 'sealed' ? 'rust' : 'bad', 6); } }
  // the bridge: lit while anyone is aboard to keep her
  if (!hidden('bridge')) parts.push(`<circle cx="${R.bridge.x}" cy="${R.bridge.y}" r="3.5" ${col(up.length ? 'good' : 'dim')}/>`);
  // the crew deck: the officers aboard, by initials, round the fore ring
  if (!hidden('crew')) up.slice(0, 4).forEach((p, i) => { const x = R.crew.x - 18 + i * 12, y = R.crew.y - 16;
    parts.push(`<circle cx="${x}" cy="${y}" r="5" ${col(p.stranded ? 'bad' : 'raise')}/>`); lbl(x, y + 2.3, p.first[0] + p.last[0], 'ink', 5.5); });
  // the banks: a cell per twelfth of the bank, lit while it holds sleepers (B, C, then D)
  const cap = Math.max(150, s.sleepers + (s.flags.woken || 0) * 20), per = Math.ceil(cap / 3); let left = s.sleepers;
  BANKS.forEach(b => { const r = R['bank' + b], gone = b === 'D' && f.lim_jettisoned;
    if (gone) { lbl(r.x, r.y + 2, 'GONE', 'bad', 6); return; }
    if (hidden('banks')) return;
    const n = Math.min(per, left); left -= n; const cells = 12, on = Math.round(cells * n / per), amber = b === 'B' && s.memo && !s.memo['ship.pods'] && s.day >= 240 && s.sleepers >= 30 ? 2 : 0;
    const below = b === 'C', y0 = below ? r.y + 15 : r.y - 25;   // just clear of the painted pods: B and D above the spine, C below
    parts.push(`<rect x="${r.x - 12}" y="${y0 - 2}" width="24" height="12" rx="2" style="fill:var(--card);opacity:.85"/>`);
    for (let k = 0; k < cells; k++) { const x = r.x - 10 + (k % 6) * 3.4, y = y0 + Math.floor(k / 6) * 4;
      parts.push(`<rect x="${x.toFixed(1)}" y="${y}" width="2.6" height="3" ${col(k < on ? (k >= on - amber ? 'rust' : 'good') : 'line')}/>`); }
    lbl(r.x - 17, y0 + 6, b, 'dim', 5.5); });
  // the hold: a cradle per system, full while it is still aboard
  if (!hidden('hold')) SYS.forEach((id, i) => { const m = s.machines[id], x = R.hold.x - 18 + i * 9.5, y = R.hold.y + 8, here = m && m.up && !m.lost;
    parts.push(`<rect x="${x}" y="${y}" width="8" height="8" rx="1" ${here ? col(m.hp < 30 ? 'bad' : m.hp < 55 ? 'rust' : 'raise') : str('line', 0.8)}/>`); });
  if (!hidden('hold')) { const aboard = SYS.filter(id => s.machines[id] && s.machines[id].up && !s.machines[id].lost); lbl(R.hold.x, R.hold.y + 24, aboard.length ? aboard.map(id => SHORT[id]).join(' ') : 'HOLD EMPTY', aboard.length ? 'ink' : 'dim', 5); }
  // the collar: the lander docked, or below
  lbl(R.collar.x, R.collar.y - 13, L.lost ? 'NO LANDER' : s.flags.qs_lander_up ? 'LANDER DOCKED' : 'LANDER BELOW', L.lost ? 'bad' : 'dim', 5.5);
  // the drive: the reactor's cradle, empty once it went down with the first flight
  lbl(R.drive.x + 26, R.drive.y - 16, s.machines.reactor && s.machines.reactor.up ? 'REACTOR' : 'CRADLE EMPTY', 'dim', 5.5);
  // name, and the state of her along the bottom
  const fuel = L.lost ? 'no lander' : s.flags.lander_grounded ? 'lander grounded' : `fuel ${s.fuel || 0} flight${s.fuel === 1 ? '' : 's'}${!s.fuel && s.flags.digester ? ' (digester)' : ''}`;
  const orb = s.memo && s.memo['ship.orbit'] ? (s.memo['ship.orbit'].ok === false ? 'orbit held, hull scarred' : 'orbit held') : s.day >= 130 ? 'orbit decaying' : 'orbit stable';
  parts.push(`<text x="8" y="30" font-size="9" font-weight="800" letter-spacing=".14em" class="sp-l" ${col('ink')}>${esc(String(s.world.ship || 'ARIADNE').toUpperCase())}</text>`);
  parts.push(`<text x="8" y="176" font-size="7" font-weight="700" class="sp-l" ${col('dim')}>${s.sleepers} ASLEEP · ${esc(fuel.toUpperCase())} · ${esc(orb.toUpperCase())}</text>`);
  return `<svg class="shipplan" viewBox="0 18 320 164" role="img" aria-label="Plan of the ship, with what is aboard" font-family="var(--sans, inherit)">${parts.join('')}</svg>`;
};
})();
