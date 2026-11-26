/* Landfall — Barrens: the years between (the `barrens` branch; STORY-ARCS.md 3, BUILD-PLAN.md stage 6a). Rules only, no DOM,
   runs under Node. Loaded after js/barrens-ship.js.

   Part 2 ends with the Quiet Ship settled. A season or so later (BETWEEN), brn.years plays: what the first years left, told
   from the flags they set, and one choice for the years ahead (the radio: dark, or calling Earth once a year,
   s.flags.b_uplink, which decides who Earth sends in Part 3). Its answer runs LF.barrensJump: the clock goes on to local
   year TO_YEAR (at least MIN_JUMP years), and the years are paid in one go, without cards:
   - the children: each year's births at today's rate, growing a little; those who reach LF.AGE join the grown; the small
     ones' losses as the generations tick has them;
   - the grown: a death rate a year;
   - the six: each one on the ground may have died in the years between (OFFICER_DIES, three at most), chosen when the card
     is dealt so the card can name them;
   - three settlements raised on the nearest slots (js/settlements.js), lived in for years already;
   - every thread still open is closed (it faded), parties out come home over the next weeks, and nothing scheduled is kept.
   s.flags.b_jump = { from, to, years } marks Part 3. Until Part 3's own threads are built (the Hush reworked, the Fallen, the
   third ship), the late game's calamities, the Friend and the old Hush do not run on Barrens. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const YEAR = LF.YEAR, MONTH = LF.MONTH, clamp = LF.clamp;
const TO_YEAR = 20, MIN_JUMP = 12, BETWEEN = [60, 150], LATEST = 8 * YEAR;
const ADULT_DIES = 0.012, KID_DIES = 0.02, BIRTH_GROWTH = 0, OFFICER_DIES = 0.3, OFFICER_MOST = 3, SETTLE = 3;
const OUT = ['extra', 'wake', 'quiet'];

// Part 3 brings its own: until it is built, nothing of the late game's own runs on Barrens
for (const k of ['lateTick', 'friendTick', 'hushTick']) if (LF[k]) LF[k] = () => {};

/* ---------- when ---------- */
const settled = s => { const T = s.threads || {}; return OUT.every(id => !T[id] || T[id].end) && !!T.quiet && !!T.quiet.end; };
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.world && !LF.aloft(s) && !s.flags.b_jump && !s.flags.b_years && s.day % MONTH === 0 && (settled(s) || s.day >= LATEST)) {
    s.flags.b_years = s.day; LF.cue(s, 'brn.years', settled(s) ? BETWEEN[0] : 0, settled(s) ? BETWEEN[1] : 30); }
  return r; }; }

/* ---------- the years, paid in one go ---------- */
const onGround = s => LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(p => p && p.alive && !p.orbit && !p.left);
const CAUSE = ['died in the years between, of a fever in the third dry season', 'died in the years between, in a fall at the pit', 'died in the years between, in the clinic, of something the autodoc had no name for', 'died in the years between, in their sleep'];
LF.barrensJump = function (s, c) {
  if (s.flags.b_jump) return;
  const y0 = LF.date(s.day).year, J = Math.max(MIN_JUMP, TO_YEAR - y0), G = LF.gen(s);
  // the six who did not see it through, chosen when the card was dealt
  (c && c.dies || []).forEach((id, i) => { const p = s.people.find(x => x.id === id); if (p && p.alive) LF.killPerson(s, p, CAUSE[i % CAUSE.length]); });
  // what was still open closes, and what was waiting is let go
  // quietly: LF.endThread would deal each one's after cards, with nothing written for a thread that just faded
  for (const id of Object.keys(s.threads || {})) { const t = s.threads[id]; if (t && t.on && !t.end) { t.end = 'faded'; t.endDay = s.day; t.phase = 'faded'; (t.path || []).push('faded'); } }
  s.sched = []; s.flags.qs_dark = 0;
  // the people, year by year: births at today's rate, growing; the young come of age; the grown and the small die at a rate
  let rate = LF.birthRate(s);   // today's rate, held: a town of hundreds by year twenty, as js/generations.js has it
  for (let k = 1; k <= J; k++) { const y = y0 + k;
    for (const key of Object.keys(G.co)) if (y - +key >= LF.AGE) { const n = G.co[key]; delete G.co[key]; G.kids -= n; s.pop += n; G.born += n; if (!G.ofAge) G.ofAge = s.day + k * YEAR; }
    const born = Math.round(rate); if (born > 0) { G.co[y] = (G.co[y] || 0) + born; G.kids += born; G.n += born; if (!G.first) G.first = s.day + k * YEAR; }
    s.pop = Math.max(12, Math.round(s.pop * (1 - ADULT_DIES))); LF.loseYoung(s, Math.round(G.kids * KID_DIES));
    rate *= 1 + BIRTH_GROWTH; }
  G.yb = 0; G.acc = 0; G.cm = 0; G.last = s.day + J * YEAR;
  // the clock
  const from = s.day; s.day += J * YEAR; G.y = LF.date(s.day).year;
  for (const a of s.away || []) if (a.fate !== 'searching') a.due = s.day + LF.sri(s, 5, 40);
  // three settlements, lived in for years
  const S = LF.stl(s), slots = [0, 1, 2, 3, 4, 5].filter(i => !S.list.some(t => t.slot === i && !t.gone)).sort((a, b) => LF.stlDist(s, a) - LF.stlDist(s, b));
  slots.slice(0, SETTLE).forEach((slot, i) => { const t = LF.stlFound(s, slot, LF.stlName(s, slot, LF.stlKind(s, slot)), false);
    t.d = s.day - (J - 3 - 3 * i) * YEAR; t.up = t.d + 4 * MONTH; t.raised = t.up; t.n = Math.round(clamp(LF.heads(s) * 0.08, 15, 60)); });
  S.ask = s.day;
  // stores for the size the colony is now, and its temper reset to a new generation's
  s.res.food = Math.max(s.res.food, Math.round(LF.heads(s) * 1.2 * 120)); s.res.mat = Math.max(s.res.mat, 400); s.res.parts = Math.max(s.res.parts, 30);
  s.morale = 55; s.tension = 20; s.grief = 0;
  s.flags.b_jump = { from, to: s.day, years: J };
  LF.chron(s, `${J} years went by.`); LF.storyPoint && LF.storyPoint(s);
};

/* ---------- what the first years left ---------- */
const SHIP = { folded: 'The thing from the infirmary is still up there, out of the lock and asleep in orbit: a small dark shape the ship\'s cameras find on every pass.',
  killed: 'The pod with the thing from the infirmary in it is in the clinic\'s cold store, and nobody has opened it.',
  left: 'The Ariadne is still up there, and something in her infirmary still reads out the cryo roll every pass, a little shorter every year.',
  lost: 'The Ariadne is still up there, and nobody goes up to her any more.' };
const EXTRA = { silenced: 'Nobody talks about the two who sat at the table. Their graves are outside the wire, and unmarked.',
  stayed: 'The colony went dark the way the two at the table wanted, and the habit stuck: no fires after dark, and voices kept low.',
  fled: 'The two who sat at the table were never found.',
  heard: 'The two who sat at the table went back into the hills, and the colony knows now that there are people out there.' };
const WAKE = { held: 'The thing at the wire was killed and burned, and for a while the nights were only nights.',
  silent: 'The thing at the wire stopped coming once the colony learned to be quiet, and the colony stayed quiet.',
  moved: 'The colony brought its people in close and built the walls high, and the thing at the wire stopped coming.',
  taken: 'The thing at the wire took what it wanted, and then it was gone. Nobody knows where.' };
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const yearsWord = n => WORDS[n] || String(n);
LF.add({ id: 'brn.years', arc: 'setup', view: 'colony', tone: 'quiet', kicker: 'Barrens', title: 'The Years Between', play: true, max: 1, w: 0, scene: ['brn_years', 'plan_year'],
  when: s => !s.flags.b_jump && !s.flight,
  setup: s => { const y0 = LF.date(s.day).year, J = Math.max(MIN_JUMP, TO_YEAR - y0), six = onGround(s), dies = [];
    for (const p of six) if (dies.length < OFFICER_MOST && LF.srand(s) < OFFICER_DIES) dies.push(p.id);
    return { J, dies, names: dies.map(id => s.people.find(p => p.id === id).name), left: six.length - dies.length }; },
  text: (s, c) => {
    const lines = [EXTRA[s.flags.b_extra], WAKE[s.flags.b_wake], SHIP[s.flags.b_ship] || 'The Ariadne is still up there, dark.', s.flags.b_quiet_found ? 'There is a track into the hills now. Twice a year something is left at the end of it, and twice a year it is gone.' : ''].filter(Boolean);
    return `${lines.join(' ')}\n\nThe colony is past its first hard years. The children born here are starting to come of age, and most of them will never see Earth or want to. Before the years go by, there is one more thing to settle: the radio mast on the rise, and whether it says anything.`; },
  choices: [
    { label: 'Keep the mast dark', note: 'Nothing goes out. Whatever Earth thinks happened at 82 Eridani, nothing from here will change its mind.', info: [['yield', 'The silence kept'], ['later', 'What Earth makes of it']],
      out: { text: (s, c) => `The mast stays dark. ${cap(yearsWord(c.J))} years go by.${died(c)}`, fx: (s, c) => ({ flags: { b_uplink: 0 }, do: s2 => LF.barrensJump(s2, c) }) } },
    { label: 'Call Earth once a year, on landing day', note: 'A report read slowly, on the loudest band the colony has. It takes years to get there.', info: [['yield', 'Earth hears from you'], ['later', 'What else it hears']],
      out: { text: (s, c) => `Once a year, on landing day, a report goes out from the mast, read slowly. Some years, when the operators play the recording back afterwards, there is another voice under theirs, saying the same words. ${cap(yearsWord(c.J))} years go by.${died(c)}`,
        fx: (s, c) => ({ flags: { b_uplink: 1 }, do: s2 => LF.barrensJump(s2, c) }) } },
  ] });
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const died = c => c.names.length ? `\n\n${andList(c.names)} did not see them through. ${c.left ? `Of the six who came down, ${c.left === 1 ? 'one is' : `${yearsWord(c.left)} are`} still at the council table.` : 'None of the six who came down is left at the council table.'}` : c.left ? `\n\nThose of the six who came down are still at the council table, older.` : `\n\nNone of the six who came down sits at the council table any more.`;
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
if (LF.ASK) LF.ASK['brn.years'] = 'Through the years ahead, does the colony keep its radio mast dark, or call Earth once a year?';
LF.TAGS['brn.years'] = ['closed cautious', 'open'];
})();
