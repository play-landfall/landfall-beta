/* Landfall — Barrens: the one-world story (the `barrens` branch; STORY-ARCS.md, BUILD-PLAN.md stage 1). Rules only, no DOM,
   runs under Node. Loaded after every thread file, so it can bend what they set up without editing each one.

   Stage 1, the frame:
   - One world, Barrens, with two sites, both the barren world: beside the old Persephone settlement (site 0) or far out on the
     plains (`barren`). Its life is its own: fauna, flora and sickness, with no alien ruins and no alien natives. The people
     in the hills are a thread, not a factor.
   - The dreads are fixed, not dealt (REWRITE-PLAN Q11): two that open together in the first months and run in parallel
     (LF.BARRENS_DREADS; stand-ins until stages 2 and 3 replace them), then the Quiet Ship, strictly after both have ended.
     Every other dread is out of the run, the storm's wide catalogue included.
   - Noise (STORY-ARCS 2.2): `s.noise`, 0 to 100, hidden and never shown. It drifts each day toward what the colony is doing:
     how many live there, the signals room, flights, the machines running on the ground, double shifts. The dreads of stages
     2 and 3 read it. `LF.noiseWhy(s)` says what makes it, for the sim and for debugging.

   BARRENS=0 in the sim's environment switches all of it off, to compare against the three-world game. */
(function () {
'use strict';
const on = !(typeof process !== 'undefined' && process.env && process.env.BARRENS === '0');
LF.BARRENS = on;
if (!on) return;
const DEFS = LF.THREADS, clamp = LF.clamp;

/* ---------- the world ---------- */
LF.WORLDS = {
  barren: { name: 'Barrens', scope: 'scope_barren', sites: ['barren', 'barren'],
    blurb: 'Dun and red, old and worn flat, dry from pole to pole. Once in a year or two its air blinks: oxygen and methane up for a few weeks, then gone again.' },
};
LF.DEALT = ['barren'];
/* Both sites are the barren world (Lachlan, 2026-11-26: the Barrens world's films and pictures, never the graveyard world's), so
   s.world.type is 'barren' either way and what differs is the site: s.world.site 0 beside the old settlement, 1 out on the plains
   (s.flags.b_site 'near' or 'far'). The near site gets the old colony's broken ground and salvage (LF.pickSite below). What orbit
   shows of each, before the choice, is LF.BARRENS_SITES (drawn on the site card by js/ui.js). */
LF.BARRENS_SITES = [
  { key: 'near', label: 'Beside the old settlement', pic: 'site_near', crop: '34% 62%', zoom: 2.3,
    gives: 'The Persephone colony\'s fields, wells and stores within a walk.', costs: 'Close to whatever emptied it.',
    seen: 'Long lens, at dawn, from three hundred kilometres. A low rise above a dry creek bed, and on it the Persephone colony: twelve domes, a landing pad, a radio mast and field strips gone pale. Nothing moves there. Nothing is warm at night.',
    rows: [['Walk to the old settlement', 'Half a kilometre'], ['Ground', 'Broken, and farmed once'], ['Salvage', 'Domes, stores, power'], ['Water', 'The old colony\'s wells']] },
  { key: 'far', label: 'The open plains, days off', pic: 'site_far', crop: '72% 28%', zoom: 1.9,
    gives: 'Clean ground and nobody\'s old fields.', costs: 'Little to salvage, poor soil, and a long way from anything.',
    seen: 'A wide plain three days north-east, between two worn ranges: red ground over pale sand, a creek line of lone trees, and outcrops of shellrock that cut like soft stone. Nothing made by people within a hundred kilometres.',
    rows: [['Walk to the old settlement', 'Three days'], ['Ground', 'Unbroken, and poor'], ['Salvage', 'None'], ['Water', 'A creek that runs in the Wet']] },
];
LF.ARCHETYPES.barren.kinds = { fauna: 1.6, flora: 1, plague: 0.8 };
LF.ARCHETYPES.barren.subs = { fauna: ['pack', 'giant', 'delver'], flora: ['mat', 'choir'], plague: ['wasting', 'fever', 'rot'] };
delete LF.ARCHETYPES.barren.multi;
LF.ARCHETYPES.barren.yield = 0.07;   // spent soil, leached sand; the near site adds the old fields back (below)
const NEAR = { yield: 0.07, wreck: 260, mat: 30 };
const pick0 = LF.pickSite;
LF.pickSite = function (s, si) {
  const open = s.world && s.world.siteOpen; pick0(s, si); if (!open) return;
  s.flags.b_site = si ? 'far' : 'near';
  if (!si) { s.yieldBonus += NEAR.yield; s.wreck = (s.wreck || 0) + NEAR.wreck; s.res.mat += NEAR.mat; }
};
// the site card speaks of the two Barrens sites, not of two kinds of world
{ const st = LF.byId['setup.site'];
  if (st) st.choices.forEach((ch, k) => { const S = LF.BARRENS_SITES[k];
    ch.label = S.label; ch.note = `${S.gives} ${S.costs}`;
    ch.out.text = `The lander's course is laid in for ${S.label.charAt(0).toLowerCase() + S.label.slice(1)}, and the ship's survey is turned on it for the last orbits before the drop.`; }); }

/* ---------- the dreads ---------- */
LF.BARRENS_DREADS = ['extra', 'wake'];   // One Too Many (js/thread-extra.js) and the Wake (js/thread-wake.js)
const QS = 'quiet';
for (const id in DEFS) { const d = DEFS[id];
  if (d.dread && !LF.BARRENS_DREADS.includes(id)) d.fits = () => 0;   // out of the run, and out of the storm
  if (LF.BARRENS_DREADS.includes(id)) d.fits = () => 1; }

const plot0 = LF.plot;
LF.plot = function (s) {
  plot0(s);
  // both open in the first months, together: the second one's clock is set again as if it were the first
  for (const id of LF.BARRENS_DREADS) { const t = s.threads[id]; if (!t || !t.on || !t.nth) continue;
    t.nth = 0; t.at = s.day + LF.sri(s, 12, 35); }
};

// The Quiet Ship: only once both have ended, a month or three after the second, and by year four at the latest if one never does.
const qs0 = LF.qsTick;
LF.qsTick = function (s, force) {
  if (force) return qs0(s, force);
  if (!s.threads || s.threads[QS] || !s.world || LF.aloft(s)) return;
  const ts = LF.BARRENS_DREADS.map(id => s.threads[id]).filter(t => t && t.on);
  const done = ts.length && ts.every(t => t.end);
  if (done && !s.flags.bq_ready) s.flags.bq_ready = s.day + LF.sri(s, 30, 90);
  const due = (done && s.day >= s.flags.bq_ready) || s.day >= 4 * LF.YEAR;
  if (!due || s.day % LF.MONTH) return;
  // The Mocker aboard (STORY-ARCS 2.3, dread 3): the Quiet Ship's 'double', and the one aboard is never the real one (truth.real
  // 'ground'). It came across in the Persephone's crates (Route A, s.flags.b_rider) or rode a lander up (Route B).
  qs0(s, 'double'); const q = s.threads[QS];
  if (q) { q.truth.real = 'ground'; q.route = s.flags.b_rider ? 'A' : 'B'; s.flags.b_route = q.route;
    // whose voice it copies is settled now: the early boarding from the warnings (qs.answer) goes straight aboard without the
    // silence, which is where the old game picked one. An officer on the ground, else anyone the colony knows by name.
    const H = LF.QS && LF.QS.here, seats = ['command', 'scientist', 'doctor', 'engineer', 'works', 'security'];
    const p = (H && seats.map(k => H(s, k)).find(Boolean)) || s.people.find(x => x.alive && !x.left && !x.orbit && !x.away && x.name);
    if (p) { q.dbl = p.id; q.dblName = p.name; } }
};

// Not Mine is a next-generation dread for another planet's story: Barrens' Part 3 (stage 6) has its own. Held out until then.
if (LF.nmTick) LF.nmTick = () => {};

// Once it has opened, the ship goes dark on Barrens whoever is left aboard: the Quiet Ship's own tick waits for sleepers or an
// officer in orbit, and a late Barrens colony may have neither.
const tickQ = LF.threadTick;
LF.threadTick = function (s) { const r = tickQ(s), q = s.threads && s.threads[QS];
  if (q && q.on && q.phase === 'latent' && typeof q.wake === 'number' && s.day >= q.wake + 5 && LF.qsSilent) { if (LF.qsHush && s.machines.lander && !s.machines.lander.lost) LF.qsHush(s, q); else LF.qsSilent(s, q); }
  return r; };

/* ---------- noise ---------- */
const NOISE_DRIFT = 0.05;   // a twentieth of the way each day: a habit takes a season to show
LF.noiseWhy = function (s) {
  const w = {};
  w.people = clamp(Math.round(LF.heads(s) / 8), 0, 25);
  if (LF.has && LF.has(s, 'signals')) w.radio = 15;
  const flew = s.flags.noise_fly || -999; if (s.day - flew < 30) w.flights = 20;
  const mach = Object.keys(s.machines || {}).filter(k => { const m = s.machines[k]; return m && !m.lost && !m.off && LF.down(s, k); }).length;
  if (mach) w.machines = mach * 4;
  if (s.flags.push_on) w.shifts = 10;
  if (s.flags.b_loud && s.day - s.flags.b_loud < 30) w.salvage = 20;   // a month of cutting and hauling on the rise (brn.empty, stripped)
  return w;
};
LF.noiseTarget = s => clamp(Object.values(LF.noiseWhy(s)).reduce((a, b) => a + b, 0), 0, 100);
const fly0 = LF.fly;
LF.fly = function (s, n, chips) { s.flags.noise_fly = s.day; return fly0(s, n, chips); };
const tick0 = LF.threadTick;
LF.threadTick = function (s) {
  if (s.world && !LF.aloft(s)) { const n = typeof s.noise === 'number' ? s.noise : 0; s.noise = Math.round((n + (LF.noiseTarget(s) - n) * NOISE_DRIFT) * 10) / 10; }
  return tick0(s);
};
LF.barrensOut = st => !!(st.thread && DEFS[st.thread] && DEFS[st.thread].dread && !LF.BARRENS_DREADS.includes(st.thread) && st.thread !== QS);
})();

/* ---------- build times (Lachlan, 2026-11-26: "3-4 months for things, max; we'll adjust difficulty later") ----------
   A founding build was BUILD (4.0, js/core.js) times its listed labour, which ran domes to over a year and the school and clinic
   to a year and a half. On Barrens it is half its listed labour (BARRENS_BUILD of the 4.0), which puts the longest at about
   four months and the small ones at one or two. Repeating jobs are as they were. */
if (LF.BARRENS) { const cost0 = LF.cost, BARRENS_BUILD = 0.125;
  LF.cost = function (s, id) { const c = cost0(s, id), p = LF.PROJECTS[id]; if (p && !p.repeat) c.labor = Math.max(1, Math.round(c.labor * BARRENS_BUILD)); return c; }; }

/* ---------- no win (Lachlan, 2026-11-26: "there's no win condition now. we are telling a story and there is a lose condition") ----------
   js/core.js skips the win when LF.BARRENS is set: cutting every cord no longer ends the game. The colony dying out still does. */

/* ---------- what orbit says of the site once it is chosen (setup.site's outcome) ---------- */
if (LF.BARRENS) LF.siteReport = function (s) {
  return s.world.site
    ? 'The last orbits over the plain: spent red soil over sand, shellrock in the outcrops, and a creek line that will run in the Wet and not before. Nothing moves out there in daylight.\n\nThe lander will set down on the flat beside the creek line.'
    : 'The last orbits over the old settlement: the Persephone colony\'s domes are standing, and none of them shows any heat. The fields are pale with wiregrass. The wells read dry at the top and wet further down.\n\nThe lander will set down on flat ground below the rise, half a kilometre from the nearest dome.';
};

/* The Wake comes to the wire at night, as the Guest and the Warrens do: once people are being taken it counts as 50 on the
   wire's threat (LF.wireThreat, js/core.js), which the watch and the wire cards read. */
if (LF.BARRENS && LF.wireThreat) { const wt0 = LF.wireThreat;
  LF.wireThreat = s => { const w = wt0(s), t = s.threads && s.threads.wake; return t && t.on && !t.end && ['taken', 'shape', 'turn', 'bill'].includes(t.phase) ? Math.max(w, 50) : w; }; }
