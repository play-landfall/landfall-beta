/* Landfall — Barrens: who holds Barrens (the `barrens` branch; STORY-ARCS.md 3.4 and 3.5; BUILD-PLAN.md stage 6e). Rules only,
   no DOM, runs under Node. Loaded after the Part 3 threads (js/thread-newcomers.js, js/thread-mimics.js, js/thread-fallen.js).

   The last card of the run. It comes BETWEEN after the third ship, the Hush and the Fallen have all ended, or at LATEST years
   into Part 3 whatever is open. It reads what Part 3 left: whether the newcomers came and what the charter is, whether a
   Mocker is going to Earth (s.flags.b_mocker_earth), how the Hush ended (b_hush; loose means one walked out wearing
   someone), what became of the Fallen, how far the colony leaned to Earth (b_earth), and who of the six is left.
   Three sides answer: the Commission (Earth's charter), the born-here (the silence kept, the ship sent off), the old crew
   (Earth answered on the colony's terms; only while one of the six is at the council table). Whichever is chosen, the story
   ends: s.over = { kind: 'held', by, day }, and the epilogue opens with how it ended (LF.epilogue).
   - Sending a Mocker to Earth is the worst ending, and it can look like a win (the Commission's side, with b_mocker_earth).
   - If the Hush is loose, the Mocker plays every side in every side's voice: whoever the colony chooses, the last line is
     the same (by 'mocker'). */
(function () {
'use strict';
if (!LF.BARRENS) return;
const MONTH = LF.MONTH, YEAR = LF.YEAR, BETWEEN = [2, 4], LATEST = 9;
const OUT = ['third', 'mimic', 'fallen'];
const para = (...a) => a.filter(Boolean).join('\n\n');
const done = s => { const T = s.threads || {}; return OUT.every(id => T[id] && T[id].end); };
const six = s => LF.SEAT_ORDER.map(k => LF.officer(s, k)).filter(p => p && p.alive && !p.orbit && !p.left);

{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s), J = s.flags.b_jump;
  if (J && !s.flags.b_holds && !s.over && s.day % MONTH === 0 && (done(s) || s.day >= J.to + LATEST * YEAR)) {
    s.flags.b_holds = s.day; LF.cue(s, 'brn.holds', done(s) ? BETWEEN[0] * MONTH : 0, done(s) ? BETWEEN[1] * MONTH : 20); }
  return r; }; }

const STAND = s => {
  const nc = !!s.flags.b_newcomers, ch = s.flags.b_charter;
  return [
    nc ? (ch === 'signed' ? 'The Commission holds the charter, and the colony signed it.' : ch === 'terms' ? 'The Commission holds the pad and the flats beside it, and the colony holds its council, on a paper nobody quite believes.' : 'The Commission\'s camp is still out on the flats by the pad, with its floodlights and its own wire, and the colony never signed.')
      : 'The new star went on past, or never came down. Nobody from Earth has set foot on Barrens.',
    s.flags.b_mocker_earth ? 'There is a sealed crate in the Provident\'s hold, kept colder than anything else aboard.' : '',
    s.flags.b_hush === 'loose' ? 'And somewhere inside the wire, or in the Commission\'s camp, or out in the hills, is someone who is not who they were.' : s.flags.b_hush === 'frenzy' ? 'The east rows are still half empty from the night the Hush came in.' : '',
    s.flags.b_fallen === 'led' ? 'There are lamps out on the flats some nights, a long way off, and singing.' : '',
  ].filter(Boolean).join(' ');
};
LF.add({ id: 'brn.holds', arc: 'setup', view: 'colony', tone: 'crisis', kicker: 'Barrens', title: 'Who Holds Barrens', play: true, max: 1, w: 0, scene: ['brn_holds', 'plan_year'],
  when: s => !!s.flags.b_jump && !s.over,
  setup: s => ({ crew: six(s).map(p => p.first), loose: s.flags.b_hush === 'loose', nc: !!s.flags.b_newcomers }),
  text: (s, c) => para(STAND(s),
    'The council table has three sides now. The born-here want Barrens kept quiet and kept theirs. ' + (c.nc ? 'The Commission wants its charter honoured, and its ship home. ' : '') + (c.crew.length ? `The old crew, ${andList(c.crew)}, remember Earth, and know what lives out on the flats.` : 'None of the old crew is left at the table to speak for Earth.'),
    'It has gone on long enough. Somebody has to hold Barrens.'),
  choices: [
    { show: (s, c) => c.nc, label: 'The Commission: Earth\'s charter, and Earth\'s ship', note: 'Earth\'s law, Earth\'s medicine, and the Provident goes home with what it came for.', info: [['yield', 'Earth, at last'], ['later', 'What goes home with them']],
      out: { text: (s, c) => endText(s, 'earth', c), fx: (s, c) => ({ do: s2 => end(s2, c.loose ? 'mocker' : 'earth', endText(s2, 'earth', c), 'earth') }) } },
    { label: 'The born-here: keep the silence, and keep Barrens', note: (s, c) => c.nc ? 'The Provident is told to leave, and the colony keeps its lamps low and its own counsel.' : 'No mast, no calling, and no one from Earth.', info: [['yield', 'Barrens, theirs'], ['later', 'Earth, never answered']],
      out: { text: (s, c) => endText(s, 'born', c), fx: (s, c) => ({ do: s2 => end(s2, c.loose ? 'mocker' : 'born', endText(s2, 'born', c), 'born') }) } },
    { show: (s, c) => c.crew.length > 0, label: 'The old crew: answer Earth, on the colony\'s terms', note: 'Tell Earth all of it, and tell it no.', info: [['yield', 'Earth answered, and told the truth'], ['later', 'What Earth does with it']],
      out: { text: (s, c) => endText(s, 'crew', c), fx: (s, c) => ({ do: s2 => end(s2, c.loose ? 'mocker' : 'crew', endText(s2, 'crew', c), 'crew') }) } },
  ] });
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
// the end card takes over as soon as s.over is set, so the outcome's own words go into the epilogue (s.over.txt)
const end = (s, by, txt, side) => { s.over = { kind: 'held', by, day: s.day, txt, side }; LF.chron(s, `Barrens was held by ${HELD[by]}.`); };
const HELD = { earth: 'the Commission', born: 'the ones born here', crew: 'the old crew', mocker: 'nobody' };
function endText(s, side, c) {
  if (c.loose) return para(`The vote is taken, and the side that wins it stands up to speak. It speaks in ${c.nc ? 'the Commissioner\'s voice, and then in ' : ''}the voice of the eldest of the born-here, and then in yours. Every side at the table has been talking to the same thing for a year, and it has been telling each of them what they wanted to hear.`, LOOSE[side]);
  if (side === 'earth') return s.flags.b_mocker_earth
    ? 'The charter is honoured. The Provident goes up with Earth\'s flag on the council hall and the colony\'s thanks, and a sealed crate in its hold that is kept colder than anything else aboard. It is the best year Barrens has had. Twelve years from now, Earth will hear the first of it, in the colony\'s own voices.'
    : 'The charter is honoured, and Barrens becomes a line in a ledger on Earth. The Provident goes home empty of what it came for, and the next ship is already being fitted.';
  if (side === 'born') return c.nc
    ? 'The Provident is told to leave, and after a long month it goes, its floodlights going out one by one on the flats. The mast comes down. The colony keeps its lamps low and its voices lower, the way the hill people always have.'
    : 'The mast comes down for good. The colony keeps its lamps low and its voices lower, the way the hill people always have, and Barrens is nobody\'s but theirs.';
  return 'The mast goes up one more time, and the old crew read Earth all of it, from the first voice at the wire to the thing in the dark, every name. Then they tell Earth not to come. It will be twelve years before anyone knows whether Earth listened.';
}
/* With the Hush loose, the side the colony chose is the one it goes with (second pass, 2026-11-27: the three were one text,
   so the last choice of most runs changed nothing). */
const LOOSE = {
  earth: 'The charter is honoured. At the ramp the Commission counts its people aboard the Provident, and the count comes out right, and nobody thinks to count again. Twelve years from now Earth will hear the Provident make orbit, in the Commissioner\'s own voice.',
  born: 'The born-here take the table, and the colony goes quiet the way the hill people are quiet. Every dry season one of them speaks for leaving a little more at the end of the hill track, and every year the others agree. Nobody can remember afterwards whose idea it was first.',
  crew: 'The mast goes up one more time, and the old crew read Earth all of it, every name. When the operators play the recording back, there is a second voice reading with them, a word ahead of theirs, and the last line on the tape is not one they wrote. It says: come.',
};
/* how it ended, first in the epilogue */
const EPI = { earth: s => s.flags.b_mocker_earth ? 'Barrens was held by the Commission, and a Mocker went home to Earth.' : 'Barrens was held by the Commission, under Earth\'s charter.',
  born: () => 'Barrens was held by the ones born there, and the silence was kept.', crew: () => 'Barrens was held by the old crew, and Earth was told the truth, and told no.',
  mocker: s => ({ earth: 'Nobody held Barrens. The Mocker spoke for every side, and went home with the Commission.', born: 'Nobody held Barrens. The Mocker spoke for every side, and stayed with the ones born there.',
    crew: 'Nobody held Barrens. The Mocker spoke for every side, and answered Earth in the old crew\'s voices.' })[s.over.side] || 'Nobody held Barrens. The Mocker spoke for every side.' };
{ const epi0 = LF.epilogue; LF.epilogue = function (s) { const e = epi0(s); return s.over && s.over.kind === 'held' && EPI[s.over.by] ? [EPI[s.over.by](s)].concat(s.over.txt ? [s.over.txt] : [], e) : e; }; }

if (LF.ASK) LF.ASK['brn.holds'] = 'Who holds Barrens?';
LF.TAGS['brn.holds'] = ['order', 'closed', 'open'];
})();
