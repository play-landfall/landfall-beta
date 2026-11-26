/* Landfall — thread: the Fallen (the `barrens` branch; STORY-ARCS.md 3.3; BUILD-PLAN.md stage 6d). Rules only, no DOM, runs
   under Node. Barrens only, Part 3 only.

   A pod comes down out of orbit from the dark Ariadne. Inside, alive, is Ines Kalnins: a cryo technician the old crew woke for
   the watch years ago and left aboard when the ship went quiet. Burned, starved, and decades older than they should be.
   The truth is fixed and human (Lachlan, 2026-11-26): Ines was awake aboard when it came. On Route A (s.flags.b_route 'A')
   Ines read the hold-three log and hid it, to study the thing and sell it to Earth; on Route B Ines opened the hold the lander
   came up in, because something in it was knocking with a human hand. When it woke, Ines lived by feeding it the others, a
   cradle at a time. Decades alone with it broke Ines's mind: it is god, to be woken and loved, not the hill people's god to be
   kept asleep. Ines has come down to prepare the colony for it.

   Why now: once the newcomers have landed, they boarded the Ariadne looking for a Mocker, and Ines fled them (OPEN_AFTER the
   landing); otherwise a few years into Part 3 (OPEN_LATEST).
   Phases: latent, pod (fal.pod), talk (fal.talk), preach (fal.preach), after. Endings (s.flags.b_fallen): hanged, exiled,
   given (to the hill people's priests), handed (to the Commission), led (Ines led whoever wanted to go to where it sleeps).
   s.flags.b_where: the colony knows where it sleeps. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const ID = 'fallen', T = s => LF.T(s, ID), MONTH = LF.MONTH, YEAR = LF.YEAR;
const para = (...a) => a.filter(Boolean).join('\n\n');
const since = (s, id) => s.used[id] === undefined ? -1 : s.day - s.used[id];
const OPEN_AFTER = [6, 10], OPEN_LATEST = 4, TALK_AFTER = 2, PREACH_AFTER = 4, LAMPS_NOISE = 10;
const NAME = 'Ines Kalnins', FIRST = 'Ines';
const finish = (s, end, chron) => { s.flags.b_fallen = end; LF.endThread(s, ID, end, chron); };

LF.thread({ id: ID, name: 'The Fallen', view: 'world', own: true,
  fits: () => 0,
  called: (s, t) => t.phase !== 'latent' ? 'the one from the pod' : null,
  roll: s => ({ is: s.flags.b_route === 'A' ? 'hid' : 'opened' }),
  sig: t => t.truth.is,
  start: (s, t) => { t.did = {}; },
  tick: (s, t) => {
    if (t.end || s.day % MONTH) return;
    const J = s.flags.b_jump ? s.flags.b_jump.to : s.day;
    if (t.phase === 'latent') { const nl = s.flags.b_newcomers;
      if (nl && !t.due) t.due = nl + LF.sri(s, OPEN_AFTER[0] * MONTH, OPEN_AFTER[1] * MONTH);
      if (s.day >= (t.due || J + OPEN_LATEST * YEAR)) { LF.phase(s, ID, 'pod', 'A pod came down out of orbit from the Ariadne, with someone alive in it.'); LF.cue(s, 'fal.pod', 0, 5); } }
    else if (t.phase === 'pod' && since(s, 'fal.pod') >= TALK_AFTER * MONTH) { LF.phase(s, ID, 'talk'); LF.cue(s, 'fal.talk', 0, 5); }
    else if (t.phase === 'talk' && since(s, 'fal.talk') >= PREACH_AFTER * MONTH) { LF.phase(s, ID, 'preach'); LF.cue(s, 'fal.preach', 0, 5); }
  },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.flags.b_jump && s.threads && !s.threads[ID] && s.world && !LF.aloft(s)) { const d = LF.THREADS[ID];
    const t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true }; d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID); }
  return r; }; }
// the young who follow Ines leave their lamps lit after dark, on purpose
{ const why0 = LF.noiseWhy; LF.noiseWhy = s => { const w = why0(s); if (s.flags.b_lamps) w.lamps = LAMPS_NOISE; return w; }; }

/* ===== the pod ===== */
B('pod', { id: 'fal.pod', view: 'world', tone: 'crisis', w: 9, title: 'Out of the Sky', scene: ['fal_pod', 'voy_cryo'],
  setup: s => ({ nc: !!s.flags.b_newcomers }),
  text: (s, c) => para(`A pod came down on the flats at dawn, from the Ariadne, burning. The one inside is alive: ${NAME}, a cryo technician the old crew woke for the watch years ago and left aboard when the ship went quiet.`,
    `${FIRST} should be thirty-five and looks sixty, burned down one side and so thin that one of the watch carries the stretcher alone. ${FIRST} keeps saying the same thing.`,
    `[[unknown:${NAME}]] "It's awake now. I came down to tell you that it loves you."`,
    c.nc ? `[[unknown:${NAME}]] "They came aboard. They were looking for it with their lamps, and I couldn't let them find it before you did."` : ''),
  choices: [
    { label: `Bring ${FIRST} into the clinic`, note: 'Whatever happened up there, this is one of the colony\'s own.', info: [['yield', `${FIRST} kept alive`], ['later', `What ${FIRST} brought down`]],
      out: { text: `${FIRST} is washed, fed and put in the end bed of the clinic. ${FIRST} sleeps for two days and wakes up smiling, and asks for the radio.`, fx: s => ({ do: s2 => { T(s2).did.clinic = 1; } }) } },
    { label: `Keep ${FIRST} at the pad, under guard`, note: 'Nobody from that ship has come down right yet.', info: [['yield', 'Whatever this is, it stays at the pad'], ['danger', `${FIRST}, in a shed on the flats`]],
      out: { text: `${FIRST} is kept in the lander shed with a guard on the door and a lamp that is never put out. ${FIRST} talks to the guard all night, kindly, about how lonely it gets in the dark.`, fx: s => ({ do: s2 => { T(s2).did.shed = 1; } }) } },
    { show: (s, c) => c.nc, label: `Hand ${FIRST} to the Commission`, note: 'They came aboard looking for something, and they want whoever ran from them.', info: [['yield', 'The Commission\'s goodwill'], ['later', `What ${FIRST} tells them`]],
      out: { text: `The Commission's people take ${FIRST} away on a stretcher, very gently, and the lamps in Vasko's dome burn all night. A week later the Provident's lander goes up to the Ariadne with a full crew and a cage.`, fx: s => ({ flags: { b_mocker_earth: s.flags.b_mocker_earth || s.day }, do: s2 => { s2.flags.b_earth = (s2.flags.b_earth || 0) + 2; finish(s2, 'handed', `${NAME} was handed to the Commission, and led it to what it wanted.`); } }) } },
  ] });

/* ===== what Ines did ===== */
const DID = { hid: `In the first year aboard, ${FIRST} read the ship's log about hold three running warm, and hid it. A thing like that would be worth more on Earth than everyone in the banks.`,
  opened: `${FIRST} opened the hold the lander had come up in, because something inside it was knocking with a human hand, and calling ${FIRST} by name.` };
B('talk', { id: 'fal.talk', view: 'people', tone: 'crisis', w: 9, title: 'Every Empty Cradle', scene: ['fal_talk', 'sleep_cryo'],
  setup: s => ({ is: T(s).truth.is }),
  text: (s, c) => para(DID[c.is], `When it woke, ${FIRST} lived by feeding it the others: a cradle at a time, pulled out of the banks and wheeled down to the hold, so it would leave ${FIRST} alone.`,
    `[[unknown:${NAME}]] "Every empty cradle up there is mine. I'm not sorry. It needed them, and after that it was so kind to me."`,
    `${FIRST} knows where it sleeps. ${FIRST} wants to take the colony to it, and wake it, and love it.`),
  choices: [
    { label: 'Ask where it sleeps, and write all of it down', note: `Every word, however mad, because ${FIRST} is the only one who has lived beside it.`, info: [['yield', 'Where it sleeps'], ['later', `${FIRST}, still talking`]],
      out: { text: `It takes three nights. ${FIRST} draws it on the clinic wall in charcoal: the gullies, the shellrock, a hollow under the third ridge where the ground is warm in the dry season. ${FIRST} cries when they are done, from happiness.`, fx: s => ({ flags: { b_where: s.day } }) } },
    { label: `Hang ${FIRST} for the sleepers`, dark: true, note: `For every empty cradle. ${FIRST} confessed to all of them.`, info: [['yield', 'Justice, of a kind'], ['later', 'What dies with it']],
      out: { text: `${FIRST} is hanged from the lander shed at dawn, and goes up the ladder without being helped, smiling at the crowd. The last thing ${FIRST} says is that it will forgive them.`, fx: s => ({ stain: ['hanged_fallen', 1], morale: -2, do: s2 => finish(s2, 'hanged', `${NAME} was hanged for the sleepers.`) }) } },
    { show: s => !!(s.flags.b_quiet_found || s.flags.b_extra === 'heard' || s.flags.b_owned), label: `Give ${FIRST} to the hill people`, dark: true, note: 'Their priests have their own word for anyone who wants to wake it.', info: [['yield', `${FIRST} out of the colony`], ['later', 'What the priests do']],
      out: { text: `Two of the watch walk ${FIRST} up the track into the hills, and leave ${FIRST} at the place where the offerings are left. Nobody goes back to look. At the dry season's turn there is nobody staked out on the plain, the first year in twenty.`, fx: s => ({ stain: ['gave_fallen', 2], do: s2 => finish(s2, 'given', `${NAME} was given to the hill people's priests.`) }) } },
  ] });

/* ===== the other sermon ===== */
B('preach', { id: 'fal.preach', view: 'colony', tone: 'crisis', w: 9, title: 'The Other Sermon', scene: ['fal_preach', 'cong_first'],
  setup: s => ({ nc: !!s.flags.b_newcomers, n: Math.max(6, Math.round(LF.heads(s) * 0.03)) }),
  text: (s, c) => para(`${FIRST} has been talking to the young at night, by the cistern: about a god that is lonely, that listens, that loves a loud and lamp-lit house. ${FIRST} says the hill people have it wrong. It doesn't want to sleep. It wants to be woken, and held.`,
    `Some of the born-here young have started leaving their lamps lit after dark, on purpose. ${cap(word(c.n))} of them walk out to the wire with ${FIRST} every evening, and stand there listening to the flats.`),
  choices: [
    { label: `Hang ${FIRST}`, dark: true, note: 'In front of the ones who listened.', info: [['yield', 'It stops'], ['later', 'The young who listened']],
      out: { text: `${FIRST} is hanged from the lander shed with the young made to watch. The lamps go out, mostly. Some of the young still go out to the wire in the evenings, and stand there.`, fx: s => ({ stain: ['hanged_fallen', 2], morale: -4, do: s2 => finish(s2, 'hanged', `${NAME} was hanged for preaching to the young.`) }) } },
    { label: `Send ${FIRST} out past the wire, for good`, note: 'Out to the flats, alone, with water and a blanket.', info: [['yield', `${FIRST} gone`], ['danger', `Whoever follows ${FIRST} out`]],
      out: { text: (s, c) => `${FIRST} goes out of the gate at dusk, waving. In the morning ${word(Math.max(2, Math.round(c.n / 3)))} of the young are gone from their beds too.`, fx: (s, c) => ({ gone: Math.max(2, Math.round(c.n / 3)), morale: -5, do: s2 => finish(s2, 'exiled', `${NAME} was sent out past the wire, and some of the young went too.`) }) } },
    { label: `Let ${FIRST} lead whoever wants to go to it`, dark: true, note: (s, c) => c.nc ? 'The Commission will follow, with its lamps and its cage.' : 'Let them see what they want to see.', info: [['yield', 'Where it sleeps, shown'], ['danger', 'Everyone who goes']],
      out: { text: (s, c) => `${FIRST} leads them out at night with every lamp they own: ${word(c.n)} of the young${c.nc ? ', and behind them, at a distance, the Commission with its cage' : ''}. They do not come back. In the morning there is singing out on the flats, a long way off, in voices the colony knows.`, fx: (s, c) => ({ gone: c.n, morale: -10, stain: ['led_young', 3], flags: Object.assign({ b_where: s.day, b_lamps: 0 }, c.nc ? { b_mocker_earth: s.flags.b_mocker_earth || s.day } : {}), do: s2 => finish(s2, 'led', `${NAME} led the young out to where it sleeps.`) }) } },
  ] });
/* the young leave their lamps lit while Ines preaches */
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s), t = s.threads && s.threads[ID];
  if (t && t.on && !t.end && t.phase === 'preach') s.flags.b_lamps = 1; else if (s.flags.b_lamps && (!t || t.end)) s.flags.b_lamps = 0;
  return r; }; }
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const word = n => WORDS[n] || LF.num(n);

if (LF.ASK) Object.assign(LF.ASK, {
  'fal.pod': 'Someone alive has come down from the dark Ariadne: where does the colony keep them?',
  'fal.talk': 'The one from the pod has confessed: does the colony learn what it can, or have them killed?',
  'fal.preach': 'The one from the pod is preaching to the young: does the colony hang them, send them out, or let them lead?',
});
Object.assign(LF.TAGS, { 'fal.pod': ['mercy', 'cautious closed', 'order'], 'fal.talk': ['open', 'severe', 'severe'], 'fal.preach': ['severe', 'cautious', 'open'] });
(LF.DEEDS_LATE = LF.DEEDS_LATE || []).push({
  hanged_fallen: 'the one from the pod, hanged from the lander shed',
  gave_fallen: 'the one from the pod, given to the hill people\'s priests',
  led_young: 'the young let go out to the flats at night to wake it',
});
})();
