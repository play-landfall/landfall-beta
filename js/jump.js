/* Landfall — test jumps (UI only; Lachlan, 2026-11-27: "I want to test the new parts"). Loaded just before js/ui.js.
   index.html?jump=<where> plays a fresh game forward on its first choices until the named card is up, saves it as the
   current game and opens it, so a part deep in the run can be tried without playing to it. It replaces the saved colony.
     ?jump=persephone   boarding the Persephone in orbit (brn.aboard, the hulk board)
     ?jump=settlement   the old settlement on the ground (brn.empty, the survey board)
     ?jump=walk         the walk aboard the dark Ariadne (qs.walk), a few months down, the Mocker aboard (Barrens' truth)
   The parameter is taken off the address afterwards, so a reload plays on from there. */
(function () {
'use strict';
const q = new URLSearchParams(location.search), where = q.get('jump');
if (!where || typeof LF === 'undefined') return;
const TARGET = { persephone: 'brn.aboard', settlement: 'brn.empty', walk: 'qs.walk' };
const target = TARGET[where]; if (!target) return;
const step = s => {   // one move forward: the first open option, every pick card's first few, results dismissed
  if (!s.cur) { LF.advance(s); return; }
  if (s.cur.phase === 'result') { LF.dismiss(s); return; }
  const st = LF.byId[s.cur.id], o = LF.choices(s).filter(x => !x.lock);
  if (st && st.pick) { o.slice(0, st.pick).forEach(x => LF.pickToggle(s, x.i)); LF.pickConfirm(s); return; }
  const pz = s.cur.ctx && s.cur.ctx.pz, P = pz && LF.PUZZLES[pz.kind];
  if (pz && !pz.done && P && P.bot) { const m = P.bot(s, pz); if (m && LF.pzMove(s, m)) return; }   // a board: its own walker plays it
  if (pz && !o.length) { const m = LF.pzMoves(s); if (m.length) { LF.pzMove(s, m[0].id); return; } }
  if (o.length) LF.choose(s, o[0].i); else LF.dismiss(s);
};
try {
  const s = LF.newGame((Math.random() * 1e9) | 0);
  while (LF.proNext && LF.proNext(s)) step(s);
  LF.embark(s, 0, 0, true);   // as the UI does on Barrens: the site card open
  if (where === 'walk') {
    for (let i = 0; i < 600 && (!s.world || LF.aloft(s) || s.day < 60); i++) step(s);
    if (s.threads) delete s.threads.quiet; s.cur = null;
    LF.qsTick(s, 'double'); const t = s.threads.quiet; t.wake = s.day; LF.THREADS.quiet.tick(s, t);
    t.truth.real = 'ground';   // as Barrens has it: the one aboard is never the real one
    const p = s.people.find(x => x.alive && !x.left && !x.orbit && x.seat) || s.people.find(x => x.alive && x.name);
    if (p) { t.dbl = p.id; t.dblName = p.name; }
    LF.phase(s, 'quiet', 'boarding'); LF.fire(s, 'qs.walk');
  } else {
    for (let i = 0; i < 600 && !(s.cur && s.cur.id === target && s.cur.phase === 'choose'); i++) step(s);
  }
  if (!s.cur || s.cur.id !== target) throw new Error('never reached ' + target);
  localStorage.setItem('landfall.save.v' + LF.VERSION, JSON.stringify(s));
} catch (e) { console.error('jump failed:', e); }
q.delete('jump'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
})();
