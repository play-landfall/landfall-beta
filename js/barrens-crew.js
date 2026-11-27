/* Landfall — Barrens: the key crew die where they are sent (the `barrens` branch; Lachlan, 2026-11-27: "I want people to die",
   meaning the officers; "yes, continue"). Rules only, no DOM, runs under Node. Loaded after the Barrens cards it changes and
   before js/barrens-deck.js.

   Before this most runs lost no officer in Part 2, and the deaths came off screen in the years between. Now the cards that
   send an officer into danger can kill them, and the years between kill fewer (js/barrens-years.js: OFFICER_DIES 0.15, two
   at most). Every death follows from what the player chose, and the card says who:
   - The Persephone (brn.aboard, the hulk board): out of air, the engineer dies on the line, not just hurt. Once the thing
     in her hold is awake, every move next to it can cost the one at the back, the security officer (TAKE).
   - The old settlement (brn.empty, the survey board): a bad week in the gullies or on the hill track kills the officer
     sent there one time in three (SURVEY_DIES), and they are not sent again.
   - The Wake: calling out to the figure at the end of the row draws out the security officer who called (CALL); a hunt
     that fails takes them with the four (HUNT).
   - The Quiet Ship (qs.board): the security officer goes up with the boarding party; a vent or a kill that fails costs
     them (BOARD).
   - The Hush: the watch sent out in force, or the lamps and rifles at the house, cost the security officer when they fail
     (HUSH).
   A deputy takes an empty chair in the years between (js/barrens-years.js), as before. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const TAKE = 0.3, SURVEY_DIES = 0.5, CALL = 0.7, HUNT = 0.7, BOARD = 0.6, HUSH = 0.6, SEARCH = 0.35, STAKE = 0.3, RADIO = 0.4, TAPE = 0.4;
const para = (...a) => a.filter(Boolean).join('\n\n');
const onGround = (s, seat) => { const p = LF.officer(s, seat); return p && p.alive && !p.left && !p.orbit && !p.away ? p : null; };
const kill = (s, id, cause) => { const p = s.people.find(x => x.id === id); if (p && p.alive) LF.killPerson(s, p, cause); };
// a roll made when the card is dealt, so the outcome's words and its effects agree
const roll = (st, key, seat, odds) => { if (!st) return; const set0 = st.setup;
  st.setup = s => { const c = (set0 && set0(s)) || {}, p = onGround(s, seat); c[key] = p && LF.srand(s) < odds ? { id: p.id, name: p.name, first: p.first } : null; return c; }; };
const wrap = (o, txt, fx) => { if (!o) return; const t0 = o.text, f0 = o.fx;
  o.text = (s, c) => txt(s, c, typeof t0 === 'function' ? t0(s, c) : t0);
  o.fx = (s, c) => { const r = Object.assign({}, typeof f0 === 'function' ? f0(s, c) : f0 || {}); return fx(s, c, r) || r; }; };
const chain = (r, f) => { const d0 = r.do; r.do = s2 => { if (d0) d0(s2); f(s2); }; return r; };
const by = (st, needle) => st && st.choices.find(ch => String(typeof ch.label === 'function' ? ch.label.toString() : ch.label).includes(needle));

/* ---------- the Persephone ---------- */
{ const H = LF.PUZZLES.hulk, mv0 = H.move;
  H.move = function (s, pz, id) { const was = pz.done, r = mv0.call(this, s, pz, id); if (!r || was) return r;
    const near = pz.awake && pz.thing !== pz.at && LF.PUZZLES.hulk.rooms[pz.thing].adj.includes(pz.at);
    if (!pz.done && !pz.taken && near && LF.srand(s) < TAKE) { pz.taken = true;
      pz.log = (pz.log || []).concat([`The camera on ${pz.sec}'s shoulder turns to the dark behind them, and goes out. When ${pz.eng} looks round, the corridor is empty, and a voice on the suit channel, ${pz.sec}'s voice, says to go on without them.`]); pz.heard = ''; return 'creep'; }
    if (pz.done && pz.out) pz.log = [`The suit alarms go together. They drop everything and go hand over hand for the collar, and ${pz.taken ? `${pz.eng} gets there alone` : `${pz.sec} gets there with ${pz.eng} on a line`}, and ${pz.eng} is not breathing.`];
    return r; };
  const st = LF.byId['brn.aboard'], back = st && st.choices.find(ch => ch.out && typeof ch.out.text === 'function');
  if (back) { const t0 = back.out.text, f0 = back.out.fx;
    back.out.text = (s, c) => { const pz = c.pz, lost = [pz.taken ? pz.sec : '', pz.out ? pz.eng : ''].filter(Boolean);
      return para(t0(s, c), lost.length ? `${lost.join(' and ')} did not come home. ${lost.length > 1 ? 'Two of the six are gone before the lander has touched the ground.' : 'One of the six is gone before the lander has touched the ground.'}` : ''); };
    back.out.fx = (s, c) => { const pz = c.pz, r = f0(s, c), d0 = r.do;
      r.do = s2 => { const sh0 = LF.shift; if (pz.out) LF.shift = () => {}; try { d0(s2); } finally { LF.shift = sh0; }   // the old hurt is a death now
        if (pz.out) { const p = onGround(s2, 'engineer') || LF.officer(s2, 'engineer'); if (p) kill(s2, p.id, 'out of air aboard the Persephone'); }
        if (pz.taken) { const p = LF.officer(s2, 'security'); if (p) kill(s2, p.id, 'taken in the dark aboard the Persephone'); } };
      return r; }; } }

/* ---------- the old settlement ---------- */
{ const S = LF.PUZZLES.survey, mv0 = S.move;
  S.move = function (s, pz, id) { const plan = Object.assign({}, pz.plan), h0 = pz.hurt.length, r = mv0.call(this, s, pz, id);
    if (!r || pz.hurt.length === h0) return r;
    for (const who of pz.hurt.slice(h0)) { const t = pz.tk.find(x => x.first === who); if (!t || !t.id || LF.srand(s) >= SURVEY_DIES) continue;
      const where = plan[t.seat] === 'track' ? 'the hill track' : 'the gullies', at = plan[t.seat] === 'track' ? 'on' : 'in';
      const i = pz.log.findIndex(l => l.startsWith(`${who} came back after dark`));
      const line = `${who} did not come back from ${where}. The search at first light found a lamp set down upright and still burning, and the shellrock scored where something had run.`;
      if (i >= 0) pz.log[i] = line; else pz.log.push(line);
      kill(s, t.id, `lost ${at} ${where} by the old settlement`); pz.tk = pz.tk.filter(x => x !== t); (pz.dead = pz.dead || []).push(who); }
    return r; }; }

/* ---------- the radio, rebuilt at night: whoever smashes it does not want to be seen ---------- */
{ const st = LF.byId['ext.radio'], ch = by(st, 'Rebuild the set');
  roll(st, 'gone', 'engineer', RADIO);
  if (ch) wrap(ch.out, (s, c, t) => c.gone ? para(t, `${c.gone.name} had been sleeping in the hut beside the bench to guard it. ${c.gone.first} is found on the floor in the morning, under the broken valves, and nobody heard a thing.`) : t,
    (s, c, r) => { if (!c.gone) return; return chain(r, s2 => kill(s2, c.gone.id, 'killed in the signals hut, guarding the radio')); }); }

/* ---------- the Wake ---------- */
// the recorder on the wire: the scientist sits up with it, and the voices are very interesting
{ const st = LF.byId['wak.first'], ch = by(st, 'Put a recorder on the wire');
  roll(st, 'gone', 'scientist', TAPE);
  if (ch) wrap(ch.out, (s, c, t) => c.gone ? para(t, `${c.gone.name} sat up with the recorder most nights. On the last one the tape has ${c.gone.first} answering the voices, quietly, by name, and then the wire gate's latch, and then nothing.`) : t,
    (s, c, r) => { if (!c.gone) return; return chain(r, s2 => kill(s2, c.gone.id, 'walked out to the voices at the wire')); }); }
// the first taken: the security officer leads the search past the wire, or sits up at the pump with the rifles
{ const st = LF.byId['wak.taken'], search = by(st, 'Search past the wire'), stake = by(st, 'Stake out the pump');
  if (st) { const set0 = st.setup; st.setup = s => { const c = (set0 && set0(s)) || {}, p = onGround(s, 'security'), r = LF.srand(s);
    c.search = p && r < SEARCH ? { id: p.id, name: p.name, first: p.first } : null; c.stake = p && r < STAKE ? { id: p.id, name: p.name, first: p.first } : null; return c; }; }
  if (search) wrap(search.out, (s, c, t) => c.search ? para(t, `${c.search.name} took the last line out past the creek, to where the drag marks went, and the line came back without ${c.search.first}.`) : t,
    (s, c, r) => { if (!c.search) return; return chain(r, s2 => kill(s2, c.search.id, 'lost leading the search past the wire')); });
  if (stake) wrap(stake.out, (s, c, t) => c.stake ? para(t, `On the sixth night the voice at the pump was ${c.stake.name}'s own, calling the watch in to eat. ${c.stake.first} was sitting up with them at the time, and got up to look, and walked into the dark past the lamp.`) : t,
    (s, c, r) => { if (!c.stake) return; return chain(r, s2 => kill(s2, c.stake.id, 'walked out from the stakeout at the pump')); }); }
{ const st = LF.byId['wak.shape'], call = by(st, 'Call out');
  roll(st, 'gone', 'security', CALL);
  if (call) wrap(call.out, (s, c, t) => c.gone ? t.replace('One of the watch walks after it before anyone can stop them, and does not come back.', `${c.gone.first} walks after it before anyone can stop them, still calling back to it, and does not come back. In the morning the rifle is on the post, and the bean rows are flattened in a line that goes to the creek.`) : t,
    (s, c, r) => { if (!c.gone) return; if (r.pop) r.pop += 1; return chain(r, s2 => kill(s2, c.gone.id, 'walked out after the thing at the end of the row')); }); }
{ const st = LF.byId['wak.face'], hunt = by(st, 'Hunt it');
  roll(st, 'gone', 'security', HUNT);
  const fails = s => { const t = LF.T(s, 'wake'); return !((s.noise || 0) < 30 || (s.flags.b_clues || 0) >= 3 || (t && t.did && t.did.shot)); };
  if (hunt) wrap(hunt.out, (s, c, t) => c.gone && fails(s) ? para(t, `${c.gone.name} led the hunt, and was one of the four.`) : t,
    (s, c, r) => { if (!c.gone || !fails(s)) return; if (r.pop) r.pop += 1; return chain(r, s2 => kill(s2, c.gone.id, 'lost leading the hunt in the creek bank')); }); }

/* ---------- the Quiet Ship's infirmary ---------- */
{ const st = LF.byId['qs.board'];
  roll(st, 'gone', 'security', BOARD);
  for (const needle of ['Seal the infirmary and open it to vacuum', 'Keep the lamps on it and kill it where it lies']) { const ch = by(st, needle); if (!ch || !ch.bad) continue;
    wrap(ch.bad, (s, c, t) => c.gone ? para(t, `${c.gone.name} went up with the party, held the spine door so the others could get past, and was not one of the two who came back.`) : t,
      (s, c, r) => { if (!c.gone) return; return chain(r, s2 => kill(s2, c.gone.id, 'lost aboard the Ariadne, holding the spine door')); }); } }

/* ---------- the Hush ---------- */
{ const st = LF.byId['hsm.road'], ch = by(st, 'Send the watch out');
  roll(st, 'gone', 'security', HUSH);
  if (ch && ch.bad) wrap(ch.bad, (s, c, t) => c.gone ? para(t, `${c.gone.name} went out with them.`) : t,
    (s, c, r) => { if (!c.gone) return; return chain(r, s2 => kill(s2, c.gone.id, 'lost with the watch at the far settlement')); }); }
{ const st = LF.byId['hsm.inside'], ch = by(st, 'Go to the house with lamps and rifles');
  roll(st, 'gone', 'security', HUSH);
  if (ch && ch.bad) wrap(ch.bad, (s, c, t) => c.gone ? para(t, `${c.gone.name} was first through the door of the house, and was found at the end of the east rows in the morning.`) : t,
    (s, c, r) => { if (!c.gone) return; return chain(r, s2 => kill(s2, c.gone.id, 'killed the night the Hush came through the east rows')); }); }

/* ---------- the deputy takes an empty chair ----------
   The Empty Chair card (off.promote) is not dealt on Barrens, so without this a seat lost in Part 2 stayed empty until the years
   between, and nothing could happen to whoever should have been in it. The deputy steps up after the usual wait (LF.altDue: a
   year after a death), with a line, and the card that names them names the right person. */
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.world && !LF.aloft(s) && s.day % LF.MONTH === 0) for (const k of LF.SEAT_ORDER)
    if (LF.altOpen(s, k) && s.flags['empty_' + k] !== undefined && s.day >= LF.altDue(s, k)) LF.seatAlt(s, k);
  return r; }; }
})();
