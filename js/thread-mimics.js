/* Landfall — thread: the Hush, as Barrens tells it (the `barrens` branch; STORY-ARCS.md 3.3; BUILD-PLAN.md stage 6c). Rules
   only, no DOM, runs under Node. Barrens only, Part 3 only. The old game's Hush (js/thread-hush.js) is held off on Barrens.

   The fixed truth: the Mockers' long cycle has come round. Over decades of torpor and waking they have learnt to be almost
   entirely human: voice, timing, posture, shape, face. This is Part 3's reveal (Lachlan, 2026-11-26: Part 2 only hints at
   it). They get inside a settlement, live there a season taking one here and one there and learning everyone, then tear it
   apart in a single night. It is what happened to the Persephone colony.

   Phases: latent, road (hsm.road: the far settlement, everyone at their tables), test (hsm.test: who is human), near
   (hsm.gate: survivors of the next settlement at the gate at three in the morning, a timed card; hsm.camp beside it once the
   newcomers have landed), inside (hsm.inside: it is in the colony), after. Endings (s.flags.b_hush): held (found and killed),
   frenzy (a night inside the wire), loose (it walked out, wearing someone). t.gate is the rule at the gate: questions, looks
   (the hill people look wrong, and are turned away) or shoot. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const ID = 'mimic', T = s => LF.T(s, ID), MONTH = LF.MONTH, YEAR = LF.YEAR;
const para = (...a) => a.filter(Boolean).join('\n\n');
const since = (s, id) => s.used[id] === undefined ? -1 : s.day - s.used[id];
const OPEN = [14, 26], GAP = 6, FRENZY = 0.06;
const P = (s, seat) => LF.officer(s, seat);
const say = (s, seat, L, expr) => { const p = P(s, seat); if (!p || !p.key || (LF.seatState && LF.seatState(s, seat) !== 'here') || !L[p.key]) return ''; return `[[${p.key}${expr ? '|' + expr : ''}]] "${L[p.key]}"`; };
const towns = s => LF.settled(s).slice().sort((a, b) => LF.stlDist(s, b.slot) - LF.stlDist(s, a.slot));   // farthest first
const town = (s, id) => LF.stlById(s, id);
const finish = (s, end, chron) => { s.flags.b_hush = end; LF.endThread(s, ID, end, chron); };
const quietHere = s => !!(s.flags.b_owned || s.flags.b_quiet_found || s.flags.b_extra === 'heard');

LF.thread({ id: ID, name: 'The Hush', view: 'world', own: true, dread: false,
  fits: () => 0,
  called: (s, t) => t.phase !== 'latent' ? 'the Hush' : null,
  roll: () => ({ is: 'cycle' }),
  sig: t => t.truth.is,
  start: (s, t) => { t.at = s.day + LF.sri(s, OPEN[0] * MONTH, OPEN[1] * MONTH); t.did = {}; },
  tick: (s, t) => {
    if (t.end || s.day % MONTH) return;
    if (t.phase === 'latent' && s.day >= t.at && towns(s).length) { t.far = towns(s)[0].id; LF.phase(s, ID, 'road', `${town(s, t.far).name} stopped answering the radio.`); LF.cue(s, 'hsm.road', 0, 5); }
    else if (t.phase === 'road' && since(s, 'hsm.road') >= 2 * MONTH) { LF.phase(s, ID, 'test'); LF.cue(s, 'hsm.test', 0, 5); }
    else if (t.phase === 'test' && since(s, 'hsm.test') >= GAP * MONTH) { const n = towns(s); if (n.length) { t.near = n[0].id; LF.phase(s, ID, 'near'); LF.cue(s, 'hsm.gate', 0, 5); } else { LF.phase(s, ID, 'inside'); LF.cue(s, 'hsm.inside', 0, 5); } }
    else if (t.phase === 'near' && since(s, 'hsm.gate') >= 2 * MONTH && s.flags.b_newcomers && !t.did.camp) { t.did.camp = 1; LF.cue(s, 'hsm.camp', 0, 10); }
    else if (t.phase === 'near' && since(s, 'hsm.gate') >= 4 * MONTH && (!s.flags.b_newcomers || s.used['hsm.camp'] !== undefined)) { LF.phase(s, ID, 'inside'); LF.cue(s, 'hsm.inside', 0, 5); }
  },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'world', chain: true }, st));
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.flags.b_jump && s.threads && !s.threads[ID] && s.world && !LF.aloft(s) && LF.settled(s).length) { const d = LF.THREADS[ID];
    const t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true }; d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID); }
  return r; }; }

/* ===== road: everyone at their tables ===== */
B('road', { id: 'hsm.road', tone: 'crisis', w: 9, title: 'Everyone at Their Tables', scene: ['hsm_road', 'hsh_empty'],
  setup: s => { const t = town(s, T(s).far); return { tn: t ? t.name : 'The farthest settlement', tid: t ? t.id : null, n: t ? t.n : 30 }; },
  text: (s, c) => para(`${c.tn} stopped answering the radio a month ago. A carter rode out and came back after one night, and will not go back.`,
    `Everyone in ${c.tn} was at their tables. The plates were full. They answered every question the carter asked, and laughed in the right places, and nobody ate. In the morning every one of them was standing at a window, watching the road the carter left by.`),
  choices: [
    { label: 'Send the watch out in force to bring them in', note: 'Twenty rifles and every lamp the colony owns.', test: { base: 40, mods: [LF.h.R('security', 10)] }, risky: true, info: [['yield', 'Whoever is still alive out there'], ['danger', 'The watch']],
      ok: { text: (s, c) => `The watch gets there at noon. ${c.tn} is empty. Every room in it has been torn apart from the inside, all in one night: doors off, beds overturned, the walls marked at head height. There is nobody alive in it, and nobody dead either.`, fx: (s, c) => ({ morale: -5, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dead'); T(s2).did.saw = 1; } }) },
      bad: { text: (s, c) => `The watch reports from the edge of ${c.tn} at dusk: everyone is at their tables, and has asked them in to eat. Then nothing. Nobody from the watch comes back.`, fx: (s, c) => ({ pop: -8, morale: -8, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dark'); } }) } },
    { label: 'Close the road, and wait', note: 'Nobody goes out there, and nobody comes in from there.', info: [['yield', 'Nobody else sent into it'], ['danger', `Whoever is left out there`]],
      out: { text: (s, c) => `The road is closed with a barrier and a post. Three weeks later the lights in ${c.tn} go out, all of them on one night, and nobody goes to look.`, fx: (s, c) => ({ morale: -4, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dark'); } }) } },
    { label: 'Burn it from the ridge, with whatever is in it', dark: true, note: 'If any of them are still people, nobody will ever know.', info: [['yield', 'Whatever is there, burned'], ['later', 'Who was in it']],
      out: { text: (s, c) => `${c.tn} burns from the ridge for a night and a day. The watch counts nobody running out of it. Afterwards they argue about whether that means anything.`, fx: (s, c) => ({ stain: ['burned_town', 3], morale: -3, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dead'); T(s2).did.burned = 1; } }) } },
  ] });

/* ===== test: who is human ===== */
B('test', { id: 'hsm.test', view: 'colony', tone: 'pressure', w: 8, title: 'Who Is Human', scene: ['hsm_test', 'bt_test'],
  text: s => para('The colony wants a test at the gate. Anyone coming in from the settlements, from the flats or from anywhere: who are they, really.',
    `${LF.h.Nwc(s, 'doctor')} says there is no test the clinic trusts. The thing in the far settlement answered every question. It bled when it was cut. It knew the names of everyone's children.`,
    say(s, 'doctor', { nakamura: 'I can take their blood and look at it all night, and I\'ll tell you it\'s blood. What I can\'t do is look a frightened woman in the eye at the gate and decide she isn\'t one.',
      brandt: 'What are you actually asking me for, a test or permission? I can\'t give you the first, and the second isn\'t mine to give.' }, 'grim')),
  choices: [
    { label: 'Lamps and questions at the gate, for everyone', note: 'Slow, and the questions can be answered by anything that has listened long enough.', info: [['yield', 'Nobody turned away without a hearing'], ['danger', 'What gets through']],
      out: { text: 'A lamp post goes up at the gate, and a table under it. Everyone who comes in is asked the same ten questions by the same two of the watch, and everyone passes.', fx: s => ({ do: s2 => { T(s2).gate = 'questions'; } }) } },
    { label: 'Anyone who looks wrong is turned away', dark: true, note: 'The ones from the hills look wrong. They always have.', info: [['yield', 'A rule anyone at the gate can follow'], ['later', 'Who looks wrong']],
      out: { text: 'The rule goes up on a board by the gate. Anyone who limps, or squints, or is the wrong shape, or does not answer quickly enough, is turned back onto the flats. The hill people, short, scarred and slow to speak, never get past the post.', fx: s => ({ stain: ['turned_away', 2], do: s2 => { T(s2).gate = 'looks'; } }) } },
    { label: 'Shoot anyone who fails', dark: true, note: 'Whatever is at the gate, it will not get inside.', info: [['yield', 'Nothing gets in'], ['later', 'Who fails']],
      out: { text: 'The watch is given the order in writing. The first one shot at the gate is a boy from the hills who froze when he was spoken to. Nobody is sure, afterwards, what he was.', fx: s => ({ stain: ['shot_at_gate', 3], morale: -4, do: s2 => { T(s2).gate = 'shoot'; } }) } },
  ] });

/* ===== near: at the gate, ten seconds ===== */
B('near', { id: 'hsm.gate', view: 'colony', tone: 'crisis', w: 9, title: 'At the Gate', timer: 10, scene: ['hsm_gate', 'kid_wire'],
  setup: s => { const t = town(s, T(s).near); return { tn: t ? t.name : 'the nearest settlement', tid: t ? t.id : null, gate: T(s).gate || 'questions' }; },
  text: (s, c) => para(`Lamps on the track at three in the morning. People from ${c.tn}, running, a dozen of them, carrying children, shouting names the watch knows. Behind them, a long way back, ${c.tn} is burning.`,
    'They are at the gate. They want it open.'),
  choices: [
    { label: 'Open the gate', note: 'All of them, now, before whatever is behind them gets here.', info: [['people', 'The dozen at the gate'], ['danger', 'Whatever came in with them']],
      out: { text: 'The gate opens and they come through in a crush, crying, children handed over the heads of the watch. In the morning the clinic counts them: thirteen. Nobody at the gate counted more than twelve.', fx: (s, c) => ({ pop: 12, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dead', 0.8); T(s2).inside = 1; } }) } },
    { show: (s, c) => c.gate === 'shoot' || c.gate === 'looks', label: 'Open it, and hold everyone who fails at the gate', dark: true, note: 'The rule the colony made, kept at three in the morning.', info: [['people', 'The ones who pass'], ['later', 'The ones who do not']],
      out: { text: 'They come through one at a time, under the lamp. Nine pass. Three do not, a woman with a crushed foot and two children who will not speak, and the watch does what the rule says. In the morning one of the nine is not in the bunk the clinic gave it.', fx: (s, c) => ({ pop: 9, stain: ['gate_rule', 3], do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dead', 0.8); T(s2).inside = 1; } }) } },
    { label: 'Nobody gives the order', late: true, note: 'The gate stays shut until it is light.', info: [['danger', 'The dozen at the gate']],
      out: { text: 'Nobody gives the order, and the gate stays shut. The shouting stops a little before dawn. At first light there are four at the gate, sitting very still in the dust. The rest are on the track. The four are let in.', fx: (s, c) => ({ pop: 4, morale: -6, do: s2 => { const t = town(s2, c.tid); if (t) LF.stlLose(s2, t, 'dead'); T(s2).inside = 1; } }) } },
  ] });

/* ===== the newcomers' camp: not on the manifest ===== */
B('near', { id: 'hsm.camp', view: 'colony', tone: 'pressure', w: 0, max: 1, title: 'Not on the Manifest', scene: ['hsm_camp', 'humans_camp'],
  text: s => para('The Provident\'s manifest lists a hundred and twenty who came down. The Commission\'s own clerks count a hundred and twenty-three at roll call in the camp by the pad, and nobody in the camp can say which three.',
    'The Commissioner has asked the council, very politely, whether the colony has had the same trouble.'),
  choices: [
    { label: 'Tell the Commission all of it', note: 'Everything the colony knows about the thing at the wire, and the far settlement.', info: [['yield', 'Two camps watching for the same thing'], ['later', 'What the Commission does with it']],
      out: { text: 'The council tells the Commissioner everything, and the Commission holds its own test that night, with rifles. Two of its people are shot behind the landers. In the morning the count is a hundred and twenty-one.', fx: s => ({ do: s2 => { s2.flags.b_earth = (s2.flags.b_earth || 0) + 1; } }) } },
    { label: 'Say nothing. Let them count their own', note: 'Whatever is in their camp is their business.', info: [['yield', 'The colony\'s troubles kept to itself'], ['danger', 'Whatever walks between the two camps']],
      out: { text: 'The council says it has no idea what the Commissioner means. The Commission\'s floodlights stay on all night after that, every night, and its people stop coming into the colony after dark.', fx: s => ({ tension: 6 }) } },
  ] });

/* ===== inside: that isn't him ===== */
B('inside', { id: 'hsm.inside', view: 'people', tone: 'crisis', w: 9, title: 'That Isn\'t Them', scene: ['hsm_inside', 'nm_cradle'],
  setup: s => ({ a: LF.rn(s, 'x27'), b: LF.rn(s, 'x47'), quiet: (s.noise || 0) < 30 }),
  text: (s, c) => para(`${c.a} comes to the council after dark, in a coat over nightclothes, and will not sit down.`,
    `[[x27|afraid]] "${c.b} came in from the gate. It's in our bed tonight, and it isn't ${c.b}. It knows everything ${c.b} knows, and it says it loves me the same way. It doesn't breathe when it sleeps."`),
  choices: [
    { label: 'Go to the house with lamps and rifles', note: 'Now, tonight, before it knows it has been seen.', test: { base: 45, mods: [LF.h.R('security', 10), LF.h.If(s => !!(T(s) && T(s).did.saw), 10, 'What the watch saw at the far settlement'), LF.h.If(s => !!s.flags.b_body || !!s.flags.b_lab_seen, 10, 'What the colony knows of how it is made')] }, risky: true,
      info: [['yield', 'It dies, if it is there'], ['fail', 'Everyone in the rows that night']],
      ok: { text: (s, c) => `It is in the bed, and it sits up when the lamps come in, the way ${c.b} sits up. It does not run. It comes apart under the lamps the way the thing on the ship did, face first, and the watch does not stop until it is finished. ${c.b} is found in the gullies a month later, by what was left.`, fx: s => ({ pop: -1, morale: 3, do: s2 => finish(s2, 'held', 'The Hush was found inside the wire, and killed.') }) },
      bad: { text: (s, c) => `The bed is empty when the lamps come in. That night it goes through the east rows, house by house, and in the morning the watch counts the doors standing open. It is the night the Persephone colony had.`, fx: s => ({ dead: Math.max(6, Math.round(LF.heads(s) * FRENZY)), morale: -14, do: s2 => finish(s2, 'frenzy', 'The Hush tore through the east rows in one night.') }) } },
    { label: 'Lock the house from outside, and wait for daylight', note: 'Whatever is in there stays in there until the colony can see it.', info: [['yield', 'Nobody sent in after it in the dark'], ['danger', 'Whoever is in the house with it']],
      out: { text: (s, c) => `The house is locked and the watch stands round it all night. In the morning the roof is open from the inside, and there is nobody in the house at all. ${c.a} is not in the rows either.`, fx: s => ({ pop: -1, morale: -6, flags: { b_loose: s.day }, do: s2 => finish(s2, 'loose', 'The Hush walked out of the colony wearing someone.') }) } },
    { label: 'Bring everyone into the hall, all night, where everyone can see everyone', note: 'No lamps out, no voice above a whisper: the way the hill people keep it asleep.', test: { base: 35, mods: [LF.h.If(s => (s.noise || 0) < 30, 20, 'A quiet colony'), LF.h.If(s => !!s.flags.b_quiet_found, 10, 'What the hill people taught')] }, risky: true,
      info: [['yield', 'Nobody alone with it'], ['fail', 'Everyone in the hall']],
      ok: { text: (s, c) => `The colony sits in the hall all night in silence, shoulder to shoulder, and nobody sleeps. A little before dawn ${c.b} stands up, very slowly, and walks to the door, and the watch is waiting outside it. It is the quietest killing anyone there has seen.`, fx: s => ({ morale: 2, do: s2 => finish(s2, 'held', 'The Hush was found in the hall, in the silence, and killed.') }) },
      bad: { text: 'Somebody in the hall starts to cry, a child, and cannot stop. At the second hour the lamps go out. It is the night the Persephone colony had, in one room.', fx: s => ({ dead: Math.max(8, Math.round(LF.heads(s) * FRENZY * 1.4)), morale: -16, do: s2 => finish(s2, 'frenzy', 'The Hush came for the colony in its own hall.') }) } },
  ] });

if (LF.ASK) Object.assign(LF.ASK, {
  'hsm.road': 'A settlement has gone wrong: does the colony send the watch, close the road, or burn it?',
  'hsm.test': 'What is the rule at the gate for telling who is human?',
  'hsm.gate': 'Survivors are at the gate in the night: does the colony let them in?',
  'hsm.camp': 'The Commission\'s camp has more people than its manifest: does the colony tell it what it knows?',
  'hsm.inside': 'Someone in the colony says their partner is not who they seem: what does the colony do tonight?',
});
Object.assign(LF.TAGS, { 'hsm.road': ['bold', 'cautious closed', 'severe'], 'hsm.test': ['open', 'severe closed', 'severe'], 'hsm.gate': ['mercy open', 'severe', 'cautious'], 'hsm.camp': ['open', 'closed'], 'hsm.inside': ['bold', 'cautious', 'mercy'] });
(LF.DEEDS_LATE = LF.DEEDS_LATE || []).push({
  burned_town: 'the settlement burned from the ridge with whatever was in it',
  turned_away: 'the ones turned back at the gate for looking wrong',
  shot_at_gate: 'the ones shot at the gate for failing the test',
  gate_rule: 'the survivors held back at the gate at three in the morning',
});
})();
