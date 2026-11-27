/* Landfall — Barrens: the arrival's two boards (the `barrens` branch; Lachlan, 2026-11-26: "it is boring just hitting card
   after card in arrival... you just click all the points and it's done"). Rules only, no DOM, runs under Node. Loaded after
   js/barrens-arrival.js, whose two look cards it turns into boards (pzHTML in js/ui.js draws them, as the Quiet Ship's walk).

   1. Aboard the Persephone (brn.aboard, board `hulk`): looking costs air, and something moves while you look.
      Two in suits, an hour of air. Every move costs minutes, more with a load. What they carry back to the collar is the
      salvage (the old card's three answers folded into the board): the stores, the fuel by hose, her shuttle, or the crates
      from cargo hold two. The hold's door is welded and cutting it is loud. Something in the hold wakes (cutting it, going
      in, or the clock) and follows, never seen: a crate where there was none, breathing in time on the channel. Load the
      hold's crates, or load anything with it next door, or undock with a load while it is in the spine, and it comes across
      unseen (s.flags.b_rider: Route A). Clues found go into the crossing's count (s.pro.p1.clues: s.flags.b_clues).
   2. The old settlement (brn.empty, board `survey`): send people, not clicks.
      Three weeks before the fields need every hand. Each week every officer on the ground is sent to one place (tap a name,
      tap a place; or tap a place and the next unsent officer goes). What they find comes back in the log, and each place
      has more the second time. The gullies and the hill track get more dangerous each week, as the nights draw in, and an
      officer can come back hurt. The finds are paid as they come (materials, the wells, clues, the small tracks into the
      hills: s.flags.b_tracks). After the third week the old card's answers come up: move in, strip it, or leave it. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const SR = s => LF.srand(s);
const nm = (s, seat) => { const p = LF.officer(s, seat); return p ? p.first : (LF.CAST[seat][LF.castPick(s, seat)] || LF.CAST[seat][0]).first; };
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const clue = (s, n) => { if (s.pro && s.pro.p1 && !s.world.zone) s.pro.p1.clues = (s.pro.p1.clues || 0) + n; else s.flags.b_clues = (s.flags.b_clues || 0) + n; };
const strip = st => { delete st.look; };

/* =================== 1. aboard the Persephone =================== */
/* Her rooms on the plan of her class (2026-11-27): the same pixel plan the Ariadne's walk is drawn on (art/walk/plan.webp,
   greyed: she is twenty years dead), each room where it is in a ship of her build. How they join is as it was. */
const H = {
  collar: { name: 'the docking collar', x: 261, y: 92, adj: ['spine'], ly: -10 },
  spine: { name: 'the spine', x: 215, y: 101, adj: ['collar', 'bridge', 'tanks', 'relay'], ly: 16 },
  bridge: { name: 'the bridge', x: 295, y: 101, adj: ['spine', 'cabin'], ly: 16 },
  cabin: { name: 'a cabin', x: 238, y: 50, adj: ['bridge'], ly: -9 },
  tanks: { name: 'the fuel tanks', x: 118, y: 122, adj: ['spine', 'stores'], ly: 15 },
  relay: { name: 'the relay room', x: 200, y: 76, adj: ['spine', 'stores', 'hold'], ly: -9 },
  stores: { name: 'the stores', x: 180, y: 113, adj: ['tanks', 'relay', 'bay'], ly: 15 },
  bay: { name: 'the shuttle bay', x: 118, y: 80, adj: ['stores', 'hold'], ly: -9 },
  hold: { name: 'cargo hold two', x: 140, y: 101, adj: ['relay', 'bay'], ly: 16 },
};
const AIR = 60, STEP = 5, HEAVY = 2, CUT = 10, CARRY = 2, WAKE_TURN = 8, FOLLOW = 0.5;
const SEAL = 'hold|relay', edge = (a, b) => [a, b].sort().join('|');
const SEEN = {
  collar: 'The collar: a hard seal, her lights dead, frost on the inside of the hatch.',
  spine: 'The spine is dark from end to end. Frost has grown over every handrail in long feathers.',
  bridge: 'Four of her crew at their stations, long dead and dried out in the cold, still strapped in. The captain\'s log is open on the console: Relay off by order. Do not restore it. Then the same line again, and again, down the page and onto the next.',
  cabin: 'The cabin door is welded shut from the inside. Through the port: three people sitting together on the bunk, holding hands.',
  tanks: 'Her tanks read a third full. A hose across the collar and an hour would bring a flight\'s fuel over.',
  relay: 'The relay console is torn apart, the panels off and the boards pulled out by the handful. There isn\'t a tool mark on any of it.',
  stores: 'Sealed stores, spares racked to the ceiling, plate in stacks. Most of it is good, after twenty years.',
  bay: 'Her shuttle sits cold in its cradle with the canopy frosted over. It might still fly.',
  hold: 'The lamp doesn\'t seem to reach the back of it. The crates in here are the colour of the deck, and there are more of them than her manifest lists.',
};
const CLUE = ['bridge', 'cabin', 'relay', 'hold'];
const NEAR = [(s, pz) => `There is breathing on the suit channel, slow, in time with ${pz.sec}'s.`,
  () => 'There is a crate in the corridor behind them that was not there on the way in.',
  (s, pz) => `${pz.eng} says the frost on the far wall just moved, and then says it didn't.`,
  () => 'Something taps on the hull from the inside, twice, a long way off, and stops when they stop.'];
const path = (a, b) => { const prev = { [a]: null }, q = [a]; while (q.length) { const r = q.shift(); if (r === b) break; for (const n of H[r].adj) if (!(n in prev)) { prev[n] = r; q.push(n); } }
  const out = []; for (let r = b; r && r !== a; r = prev[r]) out.unshift(r); return out; };
const loads = pz => pz.load.reduce((a, x) => a + (x === 'shuttle' ? 2 : 1), 0);
const cost = (pz, a, b) => STEP + HEAVY * loads(pz) + (edge(a, b) === SEAL && !pz.cut ? CUT : 0);
const back = pz => { let m = 0, at = pz.at; for (const r of path(pz.at, 'collar')) { m += cost(pz, at, r); at = r; } return m; };
LF.newHulk = s => ({ greedy: SR(s) < 0.35, kind: 'hulk', at: 'collar', air: AIR, air0: AIR, seen: ['collar'], load: [], pumped: false, cut: false, thing: 'hold', awake: false, rider: false, turns: 0, clues: 0, done: false,
  eng: nm(s, 'engineer'), sec: nm(s, 'security'), log: [SEEN.collar], heard: '' });
LF.PUZZLES.hulk = {
  rooms: H,
  moves(s, pz) {
    if (pz.done) return [];
    const out = H[pz.at].adj.map(r => { const m = cost(pz, pz.at, r); return { id: r, label: `Into ${H[r].name}`, sub: `${m} minutes${edge(pz.at, r) === SEAL && !pz.cut ? ': a welded door to cut, and loud' : ''}`, mins: m, map: true }; });
    const room = pz.at, free = CARRY - loads(pz);
    if (room === 'stores' && free >= 1 && pz.load.filter(x => x === 'stores').length < 2) out.push({ id: 'take:stores', label: 'Load a crate from the stores', sub: '5 minutes. Spares and plate, and heavier to walk with' });
    if (room === 'hold' && free >= 1 && !pz.load.includes('crates')) out.push({ id: 'take:crates', label: 'Load the crates from the hold', sub: '5 minutes. Sealed stores, more than the manifest says' });
    if (room === 'bay' && free >= 2) out.push({ id: 'take:shuttle', label: 'Fly her shuttle across', sub: `10 minutes, and both of them to do it` });
    if (room === 'tanks' && !pz.pumped) out.push({ id: 'pump', label: 'Run a hose and pump her tanks across', sub: '10 minutes. A flight\'s fuel' });
    if (room === 'collar' && pz.turns) out.push({ id: 'home', label: 'Undock, and bring them home', sub: pz.load.length || pz.pumped ? 'With what they carried' : 'With nothing', home: true });
    return out;
  },
  move(s, pz, id) {
    if (pz.done) return null;
    const say = []; let snd = 'footsteps';
    const near = () => pz.awake && pz.thing !== pz.at && H[pz.thing].adj.includes(pz.at);
    if (id === 'home') { if (pz.at !== 'collar') return null; if (pz.awake && pz.load.length && (pz.thing === 'spine' || near())) pz.rider = true;
      pz.done = true; pz.log = ['The collar seals behind them, and the Ariadne backs off from her.']; pz.heard = ''; return 'door'; }
    if (id === 'pump') { if (pz.at !== 'tanks' || pz.pumped) return null; pz.pumped = true; pz.air -= 10; say.push('The hose goes across the collar and the pumps run. A flight\'s fuel, near enough.'); snd = 'machine_wake'; }
    else if (/^take:/.test(id)) { const k = id.slice(5), need = k === 'shuttle' ? 2 : 1; if (CARRY - loads(pz) < need) return null;
      if (k === 'stores' && pz.at !== 'stores') return null; if (k === 'crates' && pz.at !== 'hold') return null; if (k === 'shuttle' && pz.at !== 'bay') return null;
      pz.load.push(k); pz.air -= k === 'shuttle' ? 10 : 5;
      say.push(k === 'stores' ? 'A crate from the stores goes on the sled.' : k === 'crates' ? 'They load the crates from the hold. One of them is heavier than its label says.' : `${pz.eng} gets the shuttle's canopy clear and the cradle open. They will fly her across on the way out.`);
      if (k === 'crates' || near()) pz.rider = true; snd = 'drag_marks'; }
    else { if (!H[pz.at].adj.includes(id)) return null;
      const m = cost(pz, pz.at, id);
      if (edge(pz.at, id) === SEAL && !pz.cut) { pz.cut = true; pz.awake = true; say.push('The hold door is welded. The cutter takes ten minutes, and it is very loud.'); snd = 'weld_seam'; }
      pz.air -= m; pz.at = id; pz.turns++;
      if (!pz.seen.includes(id)) { pz.seen.push(id); say.push(SEEN[id]); if (CLUE.includes(id)) pz.clues++; } else say.push(`${cap(H[id].name)} again.`);
      if (id === 'hold') pz.awake = true; }
    if (!pz.awake && pz.turns >= WAKE_TURN) pz.awake = true;
    // it follows: a room nearer, never into theirs, never seen
    if (pz.awake && SR(s) < FOLLOW) { const p = path(pz.thing, pz.at); if (p.length > 1) pz.thing = p[0]; }
    pz.heard = near() ? NEAR[(pz.turns + pz.air) % NEAR.length](s, pz) : '';
    if (pz.air <= 0) { pz.done = true; pz.out = true; pz.load = []; say.push(`The suit alarms go together. They drop everything and go hand over hand for the collar, and ${pz.sec} gets there with ${pz.eng} on a line, grey and not speaking.`); snd = 'hiss'; pz.heard = ''; }
    pz.log = say; return snd;
  },
  back,
  draw(s, pz) {
    const done = new Set(), lines = [];
    for (const id in H) for (const n of H[id].adj) { const k = edge(id, n); if (done.has(k)) continue; done.add(k); const a = H[id], b = H[n];
      lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${pz.seen.includes(id) || pz.seen.includes(n) ? 'on' : ''}${k === SEAL && !pz.cut ? ' seal' : ''}"/>`); }
    const go = pz.done ? [] : H[pz.at].adj, here = H[pz.at];
    const costs = go.map(id => { const r = H[id], m = cost(pz, pz.at, id), dx = r.x - here.x, dy = r.y - here.y, l = Math.hypot(dx, dy) || 1;
      return `<text class="cost" x="${Math.round((here.x + r.x) / 2 - dy / l * 8)}" y="${Math.round((here.y + r.y) / 2 + dx / l * 8 + 3)}">${m}m${edge(pz.at, id) === SEAL && !pz.cut ? ' cut' : ''}</text>`; }).join('');
    const nodes = Object.entries(H).map(([id, r]) => { const can = go.includes(id), cls = [id === pz.at ? 'at' : '', pz.seen.includes(id) ? 'seen' : '', can ? 'go' : ''].filter(Boolean).join(' ');
      return `<g class="${cls}"${can ? ` data-act="pz" data-v="${id}" role="button" aria-label="Go to ${r.name}"` : ''}>${can ? `<circle class="hit" cx="${r.x}" cy="${r.y}" r="11"/><circle class="ring" cx="${r.x}" cy="${r.y}" r="9"/>` : ''}<circle cx="${r.x}" cy="${r.y}" r="${id === pz.at ? 7 : 5}"/>${can || id === pz.at ? `<text x="${r.x + (r.lx || 0)}" y="${r.y + (r.ly || 18) + ((r.ly || 18) > 0 ? 3 : 0)}">${r.name.replace(/^the /, '')}</text>` : ''}</g>`; }).join('');   // named only where they are and can go, as on the walk
    const air = Math.max(0, pz.air), b = back(pz), carry = pz.load.length ? pz.load.map(x => ({ stores: 'a crate of stores', crates: 'the hold\'s crates', shuttle: 'her shuttle' })[x]).join(', ') : 'nothing';
    return { svg: `<svg viewBox="0 34 320 138" role="img" aria-label="The Persephone, compartment by compartment"><image href="art/walk/plan.webp" x="0" y="0" width="320" height="213" class="plan dead"/>${lines.join('')}${costs}${nodes}</svg>`, pic: `art/walk/persephone/${pz.at}.webp`, picAlt: H[pz.at].name,
      stats: [['time', `${air} minutes of air${pz.done ? '' : ` · ${b} back to the collar`}`], ['parts', `Carrying ${carry}${pz.pumped ? ', and her fuel' : ''}`], ['unknown', `${pz.clues} found`]],
      bar: [air, pz.air0, air - b < 10], log: pz.log, heard: pz.heard };
  },
  bot(s, pz) {
    const mv = LF.PUZZLES.hulk.moves(s, pz), has = id => mv.some(m => m.id === id);
    if (pz.air - back(pz) < 14 || (pz.load.length >= 1 && pz.pumped) || pz.load.includes('crates')) return pz.at === 'collar' ? 'home' : path(pz.at, 'collar')[0];
    if (has('pump')) return 'pump'; if (has('take:stores') && !pz.load.length) return 'take:stores';
    if (pz.greedy && has('take:crates')) return 'take:crates';   // a third of the time the bot is greedy, and Route A gets played
    if (pz.greedy && !pz.load.includes('crates') && pz.air - back(pz) > 25) return pz.at === 'hold' ? 'take:crates' : path(pz.at, 'hold')[0];
    const want = !pz.pumped ? 'tanks' : 'stores'; return pz.at === want ? (pz.at === 'collar' ? 'home' : path(pz.at, 'collar')[0]) : path(pz.at, want)[0];
  },
};
{ const st = LF.byId['brn.aboard'], SITE = s => s.world.siteOpen ? 'setup.site' : 'setup.wake1'; strip(st); st.puzzle = 'hulk';
  st.setup = s => ({ pz: LF.newHulk(s) });
  st.text = s => `${nm(s, 'security')} and ${nm(s, 'engineer')} cross in suits with an hour of air each, a sled for whatever they bring back, and a camera feed you watch from the flight deck. Her air is gone, her lights are out, and frost has grown over everything inside her.`;
  const outText = (s, c) => { const pz = c.pz, L = pz.load, got = [];
    if (pz.pumped) got.push('a flight\'s fuel'); if (L.includes('stores')) got.push(L.filter(x => x === 'stores').length > 1 ? 'two crates from the stores' : 'a crate from the stores'); if (L.includes('crates')) got.push('the crates from cargo hold two'); if (L.includes('shuttle')) got.push('her shuttle, flown across on its own engines');
    return `${pz.out ? 'They make it back to the collar with nothing in their hands.' : got.length ? `They come back with ${got.join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : 'They come back with nothing but the camera record.'} The collar closes, and the Persephone goes on turning behind you.`; };
  st.choices = [
    { show: (s, c) => !(c && c.pz && c.pz.turns), label: 'Bring them straight back', note: 'Nobody goes past the collar. Whatever is on her stays on her.',
      out: { then: SITE, text: 'They come back through the collar without going in. The Persephone goes on turning behind you.', fx: { flags: { b_salvage: 'none' } } } },
    { show: (s, c) => !!(c && c.pz && c.pz.done), label: 'They are back aboard', note: 'What they carried, and what they saw.', hint: 'unknown',
      out: { then: SITE, text: (s, c) => outText(s, c),
        fx: (s, c) => { const pz = c.pz, L = pz.load, st = L.filter(x => x === 'stores').length;
          return { parts: st * 6 + (L.includes('crates') ? 4 : 0) + (L.includes('shuttle') ? 4 : 0), mat: st * 30 + (L.includes('crates') ? 40 : 0), food: L.includes('crates') ? 600 : 0,
            flags: { b_salvage: L.includes('crates') || L.includes('shuttle') ? 'all' : L.length || pz.pumped ? 'parts' : 'none', b_rider: pz.rider ? 1 : 0, b_shuttle: L.includes('shuttle') ? 1 : 0 },
            do: s2 => { if (pz.pumped) s2.fuel = (s2.fuel || 0) + 1; if (pz.clues) clue(s2, Math.min(2, pz.clues >> 1)); if (pz.out) { const p = LF.officer(s2, 'engineer'); if (p && LF.shift) LF.shift(s2, p.id, 'body', -15); } } }; } } },
  ]; }

/* =================== 2. the old settlement =================== */
const PL = {
  domes: { name: 'The domes', x: 150, y: 70 }, radio: { name: 'The radio room', x: 215, y: 40 }, school: { name: 'The school dome', x: 85, y: 40 },
  graves: { name: 'The graves', x: 40, y: 92 }, wells: { name: 'The wells', x: 150, y: 122 }, stores: { name: 'The stores', x: 225, y: 104 },
  gullies: { name: 'The gullies', x: 60, y: 136, risk: 0.2 }, track: { name: 'The hill track', x: 262, y: 136, risk: 0.2 },
};
const ROUNDS = 3, DUSK = 0.1, HURT = -15;
const FIND = {
  domes: [(s, w) => `${w} went through the domes. A door barred from the inside. The mess table laid for supper: forty bowls, a spoon in each, a fine red dust in all of them.`, (s, w) => `${w} went back through the bunk rooms. Every bed made. Every pair of boots lined up underneath, laces tucked in. All of the boots.`],
  radio: [(s, w) => `${w} found the radio room. The floor round the operator's chair is worn in a ring, as if somebody had walked round it for years. The windows are scratched at head height, from the outside.`, (s, w) => `${w} read the radio log. It ends twenty years ago, in the operator's hand. The recordings go on for years after that, in the same voice.`],
  school: [(s, w) => `${w} found the school dome. The children's drawings are still on the wall: a tall thin figure, over and over, with an open mouth full of other people's words.`, (s, w) => `${w} found a map on the school's back wall, drawn by a child: a long line of small figures walking up into the hills, and the domes behind them crossed out.`],
  graves: [(s, w) => `${w} counted the graves on the slope. Eleven, for a colony of two hundred.`],
  wells: [(s, w) => `${w} sounded the old wells. Dry at the top, and wet further down. With a pump on them they would water the near fields.`],
  stores: [(s, w) => `${w} went through the stores and brought back what would carry: plate, cable, a pump, tools.`, (s, w) => `${w} went back for the heavy things: a stove, sheet plate, a second pump.`],
  gullies: [(s, w) => `${w} went down into the shellrock gullies. In a cleft out of the sun there is a hollow lined with something like mud and spit, dried hard, the size and shape of a person. It is empty.`, (s, w) => `${w} went deeper into the gullies, and found three more of the hollows. One of them is not dry.`],
  track: [(s, w) => `${w} walked the old track toward the hills. There are footprints in the dust, small and bare, going up. They are fresh.`, (s, w) => `${w} went further up the track, to a cairn with a bowl on top. There is something in the bowl, left there on purpose, and ${w} did not touch it.`],
};
const GOT = { radio: [0, 1], school: [1, 0], graves: [1], gullies: [1, 1], track: [0, 0] };
const tokens = s => { const out = LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(p => p && p.alive && !p.orbit && !p.left && (!LF.seatState || LF.seatState(s, p.seat) === 'here')).slice(0, 4).map(p => ({ id: p.id, seat: p.seat, first: p.first }));
  return out.length ? out : [{ id: null, seat: 'party', first: 'A party' }]; };
LF.newSurvey = s => ({ kind: 'survey', week: 1, plan: {}, sel: null, visits: {}, tk: tokens(s), log: ['Tap a name, then a place. Or tap a place, and the next one not yet sent goes there.'], done: false, turns: 0, found: 0, hurt: [] });
const unsent = pz => pz.tk.find(t => !pz.plan[t.seat]);
LF.PUZZLES.survey = {
  moves(s, pz) {
    if (pz.done) return [];
    const out = pz.tk.map(t => ({ id: 'sel:' + t.seat, chip: true, label: t.first + (pz.sel === t.seat ? ' (chosen)' : ''), sub: pz.plan[t.seat] ? 'to ' + PL[pz.plan[t.seat]].name.toLowerCase() : 'not sent yet' }));
    for (const id in PL) out.push({ id: 'to:' + id, map: true, label: PL[id].name, sub: '' });
    if (Object.keys(pz.plan).length) out.push({ id: 'go', label: pz.week < ROUNDS ? `Send them: week ${pz.week} of ${ROUNDS}` : 'Send them: the last week', sub: unsent(pz) ? `${unsent(pz).first} stays behind this week` : 'Everyone has somewhere to be', home: true });
    return out;
  },
  move(s, pz, id) {
    if (pz.done) return null;
    if (/^sel:/.test(id)) { const k = id.slice(4); if (!pz.tk.some(t => t.seat === k)) return null; pz.sel = pz.sel === k ? null : k; return 'tool_switch'; }
    if (/^to:/.test(id)) { const p = id.slice(3); if (!PL[p]) return null; const t = pz.sel ? pz.tk.find(x => x.seat === pz.sel) : unsent(pz) || pz.tk[0]; if (!t) return null; pz.plan[t.seat] = p; pz.sel = null; return 'footsteps'; }
    if (id !== 'go' || !Object.keys(pz.plan).length) return null;
    const say = [`Week ${pz.week}.`];
    for (const t of pz.tk) { const p = pz.plan[t.seat]; if (!p) continue;
      const n = pz.visits[p] || 0, F = FIND[p], who = t.first;
      if (n >= F.length) say.push(`${who} went back to ${PL[p].name.toLowerCase()} and found nothing new.`);
      else { say.push(F[n](s, who)); const g = (GOT[p] || [])[n];
        if (g || (t.seat === 'scientist' && (p === 'radio' || p === 'school'))) { clue(s, 1); pz.found++; }
        if (p === 'stores') { s.res.mat += t.seat === 'engineer' ? 50 : 25; if (n === 1) s.res.parts += 3; }
        if (p === 'wells' && !s.flags.b_wells) { s.flags.b_wells = s.day; s.yieldBonus = (s.yieldBonus || 0) + 0.02; }
        if (p === 'track') s.flags.b_tracks = (s.flags.b_tracks || 0) + 1; }
      pz.visits[p] = n + 1;
      const risk = (PL[p].risk || 0) ? (PL[p].risk + DUSK * (pz.week - 1)) * (t.seat === 'security' ? 0.5 : 1) : 0;
      if (risk && SR(s) < risk) { pz.hurt.push(who); if (t.id && LF.shift) LF.shift(s, t.id, 'body', HURT);
        say.push(`${who} came back after dark with a gash down one arm from the shellrock, and will not say what started the running.`); } }
    pz.week++; pz.turns++; pz.plan = {}; pz.sel = null; pz.log = say;
    if (pz.week > ROUNDS) { pz.done = true; pz.log.push('Three weeks. The fields need every hand now.'); }
    return 'wind';
  },
  draw(s, pz) {
    const by = {}; for (const t of pz.tk) { const p = pz.plan[t.seat]; if (p) (by[p] = by[p] || []).push(t); }
    const nodes = Object.entries(PL).map(([id, r]) => { const v = pz.visits[id] || 0, cls = [v ? 'seen' : '', r.risk ? 'risk' : '', pz.done ? '' : 'go'].filter(Boolean).join(' ');
      const who = (by[id] || []).map((t, i) => `<g class="tok"><circle cx="${r.x + 12 + i * 13}" cy="${r.y - 11}" r="6.5"/><text x="${r.x + 12 + i * 13}" y="${r.y - 8.5}">${t.first[0]}</text></g>`).join('');
      return `<g class="${cls}"${pz.done ? '' : ` data-act="pz" data-v="to:${id}" role="button" aria-label="Send to ${r.name}"`}>${pz.done ? '' : `<circle class="hit" cx="${r.x}" cy="${r.y}" r="18"/>`}<circle cx="${r.x}" cy="${r.y}" r="8"/><text x="${r.x}" y="${r.y + 21}">${r.name.replace(/^The /, '').toLowerCase()}${v ? ` ·${v}` : ''}</text>${who}</g>`; }).join('');
    const lines = Object.keys(PL).filter(k => k !== 'domes').map(k => `<line x1="${PL.domes.x}" y1="${PL.domes.y}" x2="${PL[k].x}" y2="${PL[k].y}" class="${pz.visits[k] ? 'on' : ''}"/>`).join('');
    return { svg: `<svg viewBox="0 0 300 168" role="img" aria-label="The old settlement and the ground round it">${lines}${nodes}</svg>`,
      stats: [['time', pz.done ? 'Three weeks spent' : `Week ${pz.week} of ${ROUNDS}`], ['people', `${pz.tk.length} to send`], ['unknown', `${pz.found} found`]].concat(pz.hurt.length ? [['hurt', `${pz.hurt.length} hurt`]] : []),
      hint: 'Tap a name, then a place on the map. Then send them.', bar: [ROUNDS - pz.week + 1, ROUNDS, pz.week === ROUNDS], log: pz.log, heard: pz.week > 1 && !pz.done ? 'The nights are drawing in. The gullies and the track get worse each week.' : '' };
  },
  bot(s, pz) {
    const t = unsent(pz); if (!t) return 'go';
    const left = Object.keys(PL).filter(p => !(pz.visits[p] || 0) && !Object.values(pz.plan).includes(p));
    const pick = left.length ? left[Math.floor(SR(s) * left.length)] : 'stores'; pz.sel = t.seat; return 'to:' + pick;
  },
};
{ const st = LF.byId['brn.empty']; strip(st); st.puzzle = 'survey';
  const text0 = st.text;
  st.setup = s => ({ pz: LF.newSurvey(s) });
  st.text = (s, c) => `${s.flags.b_site === 'far' ? 'The Persephone colony is three days\' walk from the landing, and the first party there has come back to say it is standing.' : 'The Persephone colony is standing on the rise, half a kilometre from the landing.'} There was no fire there and no fight, and there is nobody there at all, alive or dead.\n\nYou have three weeks before the fields need every hand. Send who you have, one place each a week.`;
  for (const ch of st.choices) { const sh = ch.show; ch.show = (s, c) => !!(c && c.pz && c.pz.done) && (!sh || sh(s, c)); }
  st.choices.push({ show: (s, c) => !(c && c.pz && c.pz.turns), label: 'Leave it for now', note: 'The fields first. Nobody goes up there yet.',
    out: { text: 'Nobody goes up to the Persephone colony. The domes sit on the rise in the evenings, and people look at them.', fx: { flags: { b_domes: 'left' } } } });
  if (LF.TAGS['brn.empty']) LF.TAGS['brn.empty'].push('cautious');
}
})();
