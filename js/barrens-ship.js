/* Landfall — Barrens: the Quiet Ship's reveal (the `barrens` branch; STORY-ARCS.md 2.3, dread 3; BUILD-PLAN.md stage 5).
   Rules only, no DOM, runs under Node. Loaded after js/barrens.js and js/barrens-arrival.js.

   On Barrens the Quiet Ship's truth is always `double` (js/barrens.js, LF.qsTick), and the one aboard is a Mocker, never a
   second officer. In Part 2 a Mocker cannot pass for a person (Lachlan, 2026-11-26: that is Part 3's reveal, only hinted at
   here). It has the officer's voice exactly, and some of the timing. The shape and the face are a rough draft that only
   works in the dark: in lamplight it is too long, folded to fit, with a face pressed in like a face in wet sand.

   It came across in the Persephone's crates (Route A, s.flags.b_route 'A') or rode the lander up (Route B). This file swaps
   the double's text where it is told (the radio, the walk aboard, the infirmary, the salvage card) and gives the infirmary
   card three answers of its own: vent it (it folds up and sleeps: Part 3's seed, s.flags.b_orbit_asleep), kill it with the
   lamps on (a body comes down: s.flags.b_body), or lock it in with the banks and stop flying (dark). The old game's
   second-officer path (qs.two, qs.tell) never comes on Barrens. s.flags.b_ship holds how it ended, for Part 3: folded,
   killed, left or lost. */
(function () {
'use strict';
if (!LF.BARRENS || !LF.QS || !LF.QS.TXT) return;
const Q = LF.QS, { ID, T, home, ROOMS } = Q, X = Q.TXT, h = LF.h;
const route = s => s.flags.b_route === 'A'
  ? ' On the chair by the bed is a Persephone jumpsuit, folded, with the name tape cut off it.'
  : ' Under the bed is a lander cargo seal, cut round from the inside, with red plains dust in the groove.';

/* ---------- the radio, while she is dark: the voice it has exactly, and some of the timing ---------- */
X.HEARD.double = [
  (s, c) => `Last night a voice came on.\n\n[[unknown:A voice on the ship's channel]] "This is ${c.dbl}. Why hasn't anyone come?"\n\n${c.dblFirst} was standing next to you in the radio room when it said it, and has not sat down since.`,
  (s, c) => `The voice is on every pass now, and it is getting better. Last month it was ${c.dblFirst}'s voice. This month it has ${c.dblFirst}'s pauses too: the breath before a hard word, the cough at the end of a long sentence. The radio room plays the two tapes side by side and cannot find the join.`,
  () => 'The voice says things now that were said in the radio room on the pass before, in the operators\' own voices, with the room\'s echo still on them.\n\n[[unknown:A voice on the ship\'s channel]] "Why are you whispering?" "Who\'s that with you?"',
];

/* ---------- the walk aboard: what it has been practising ---------- */
X.WALK_LINE.double = {
  spine: 'Forward, past the crew deck, one light is on: the infirmary\'s. There are handprints on the spine\'s ceiling going toward it, too long in the finger, as if something had walked there upside down.',
  bridge: c => `The watch log has an entry for every day since the flight, copied letter by letter from one of ${c.dblFirst}'s old ones, badly at first and then better. It is the same entry every day.`,
  crew: c => `One bunk on the crew deck has ${c.dblFirst}'s name on the locker. The mattress is pressed down in a shape nobody would sleep in: long, and bent in two places.`,
  galley: 'The galley bin is full of ration packs, a meal\'s worth a day for months, each one opened and put in the bin untouched.',
  bankB: c => `${c.dblFirst}'s own pod in bank B is open, and dry, and logged as opened on the day of the flight.`,
};
X.NEAR.double = () => 'The intercom clicks on, and somebody breathes into it, slowly, in time with the party leader\'s own breathing.';
X.TARGET.double = r => `Someone is talking quietly in ${ROOMS[r].name}: one voice, taking both sides of the conversation the party had in the lander on the way up.`;
X.ARRIVE.double = c => `The infirmary is dark, and something in the bed sits up as the party comes in, the way ${c.dblFirst} sits up. It asks who sent them and why they are whispering. For the first few words it asks in the party leader's own voice, before it finds ${c.dblFirst}'s. Nobody puts a lamp on it. One of the four has served under ${c.dblFirst} for years, sits down on the deck, and will not get up. It takes ten minutes to get them on their feet.`;
if (X.FOUND) X.FOUND.double = 'The infirmary bed is made up with the blanket turned back, and the mattress is pressed down in a shape too long for it, bent in two places.';
if (X.WHY) X.WHY.double = 'The autodoc logged one patient in the infirmary on the day of the flight, under the officer\'s name. The scan could not place a single bone.';

/* ---------- the infirmary (qs.board) ---------- */
X.TOLD.double = (s, c) => `[[x19]] "There's someone in the infirmary. It sounds like ${c.dblFirst}."\n\nThe lamps are off in there. From the door, in the dark, something sits up in the bed the way ${c.dblFirst} sits up, with the blanket to the waist.\n\n[[unknown:The voice from the bed]] "I never came down. Why are you whispering?"\n\nThen the party leader puts a lamp on it. It is too long for the bed, and folded to fit. Where the face should be is something pressed into the shape of one, like a face in wet sand, with the eyes about where eyes go. It holds still in the light, as if it does not know the light has found it.${route(s)}`;
const board = LF.byId['qs.board'];
const lab = ch => String(typeof ch.label === 'function' ? ch.label.toString() : ch.label);
const down = board.choices.find(ch => lab(ch).includes('Bring this')), left = board.choices.find(ch => lab(ch).includes('Leave this one up there'));
if (down) down.show = () => false;   // nobody brings that down the ramp: the Two Chairs path is the old game's
if (left) { const f0 = left.out.fx;
  left.label = 'Lock the infirmary from outside, and fly no more to the ship';
  left.note = 'The party comes home. Whatever is in the bed has the ship, and the sleepers in her banks.';
  left.info = [['yield', 'Nothing brought home'], ['danger', 'The sleepers, left with it']];
  left.out.text = (s, c) => `The infirmary door is locked from outside and the party comes home. The voice asks why, every pass, for a month. Then it stops asking and starts reading the cryo roll instead, bank by bank, in ${c.dblFirst}'s voice, and each month the roll is a little shorter.`;
  left.out.fx = (s, c) => { const r = f0(s, c), d0 = r.do; r.do = s2 => { T(s2).mLeft = 1; s2.flags.b_aboard = s2.day; d0(s2); }; return r; }; }
const clues = [h.If(s => !!s.flags.b_clues && s.flags.b_clues >= 3, 10, 'What the colony learned at the old settlement'), h.If(s => Q.ev(s) >= 3, 10, 'What the walk turned up')];
const lost = (s, c) => ({ flags: { qs_lander_up: 0, qs_dark: 0, lander_grounded: s.day, sleepers_abandoned: true }, do: s2 => { s2.flags.b_aboard = s2.day; LF.endThread(s2, ID, 'shiplost'); } });
board.choices.push({ show: (s, c) => c.is === 'double', label: 'Seal the infirmary and open it to vacuum',
  note: 'The party falls back to the spine and seals the door behind them. The lamp stays on it through the glass.', hint: 'unknown',
  test: { base: 45, mods: [h.R('security', 10), h.R('engineer', 5)].concat(clues) }, risky: true,
  info: [['yield', 'It goes out of the lock'], ['danger', 'The party, if it is quicker than the door']],
  ok: { text: (s, c) => `The door seals and the infirmary opens to vacuum. Through the glass the party watches it keep ${c.dblFirst}'s way of sitting for a moment longer, and then give it up. The face smooths away like sand under water, and the whole shape folds down small and still, the way a sleeper folds. They push it out of the lock in a cargo net. The ship's cameras follow it for an orbit, and it is not tumbling.`,
    fx: (s, c) => ({ flags: Object.assign({}, home, { b_orbit_asleep: s.day }), do: s2 => LF.endThread(s2, ID, 'folded') }) },
  bad: { text: 'The door seals a second too late. The bed is empty. Over the intercom, from the spine behind them, the party leader\'s own voice says the party leader\'s name. Two of the four come back to the collar, and they undock without waiting for the others.',
    fx: (s, c) => Object.assign({ pop: -2, morale: -6 }, lost(s, c)) } });
board.choices.push({ show: (s, c) => c.is === 'double', label: 'Keep the lamps on it and kill it where it lies',
  note: 'Rifles, cutters and every lamp the party carries. It has not moved yet.', hint: 'unknown',
  test: { base: 35, mods: [h.R('security', 10)].concat(clues) }, risky: true,
  info: [['yield', 'It dies, and the body comes home'], ['danger', 'The party, in a small room with it']],
  ok: { text: (s, c) => `It takes most of what the party carried. It does not fight so much as try to leave, along the ceiling, toward the dark of the vent, and the lamps keep finding it. When it stops moving it is still saying something, quietly, in ${c.dblFirst}'s voice. They bring it down sealed in a cargo pod, and the clinic will not open the pod.`,
    fx: (s, c) => ({ pop: -1, flags: Object.assign({}, home, { b_body: s.day }), do: s2 => LF.endThread(s2, ID, 'killed') }) },
  bad: { text: 'The first lamp that goes out is the one it goes for. Then it is in the vent, and then it is in the walls, calling the party by name, one at a time, in each other\'s voices. Two of the four come back to the collar.',
    fx: (s, c) => Object.assign({ pop: -2, morale: -6 }, lost(s, c)) } });
if (LF.TAGS['qs.board']) { const n = board.choices.length; LF.TAGS['qs.board'][n - 2] = 'cautious severe'; LF.TAGS['qs.board'][n - 1] = 'bold severe'; }

/* The old game's second officer at the table never comes on Barrens. */
{ const out0 = LF.barrensOut; LF.barrensOut = st => (out0 && out0(st)) || st.id === 'qs.two' || st.id === 'qs.tell'; }

/* ---------- how it is remembered ---------- */
Object.assign(LF.THREADS[ID].chap, {
  one: t => `Something was found in the ship's infirmary, speaking in ${t.dblName}'s voice. The colony locked it in with the banks and stopped flying.`,
  folded: t => `Something was found in the ship's infirmary, speaking in ${t.dblName}'s voice. The colony opened the room to vacuum and put it out of the lock, folded up asleep.`,
  killed: t => `Something was found in the ship's infirmary, speaking in ${t.dblName}'s voice. The boarding party killed it with the lamps on, and brought it home in a sealed pod.`,
  shiplost: t => `Something was found in the ship's infirmary, speaking in ${t.dblName}'s voice. It got behind the boarding party, and the ship is its own now.`,
});
{ const end0 = LF.endThread; LF.endThread = function (s, id, end, chron) { const t = LF.T(s, id), was = t && !t.end; end0(s, id, end, chron);
  if (id !== ID || !was || !t || t.truth.is !== 'double') return;
  s.flags.b_ship = end === 'one' ? 'left' : end === 'shiplost' ? 'lost' : end; }; }

/* The silence would turn the double into `changed` with no officer on the ground. On Barrens the voice it copies was settled
   when she opened (js/barrens.js), and anyone the colony knows will do, so it is put back. */
{ const sil0 = LF.qsSilent; LF.qsSilent = function (s, t) { const was = t.truth.is, d = t.dbl, n = t.dblName; sil0(s, t);
  if (was === 'double' && t.truth.is === 'changed' && d) { t.truth.is = 'double'; t.dbl = d; t.dblName = n; } }; }

/* Left aboard with the banks, it works through them: one sleeper a month. */
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.flags.b_aboard && s.sleepers > 0 && s.day % LF.MONTH === 0) s.sleepers -= 1;
  return r; }; }
})();
