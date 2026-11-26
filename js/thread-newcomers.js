/* Landfall — thread: the Third Ship (the `barrens` branch; STORY-ARCS.md 3.1, 3.2 and 6; BUILD-PLAN.md stages 6b and 6f).
   Rules only, no DOM, runs under Node. Barrens only, and only in Part 3 (after LF.barrensJump, js/barrens-years.js).

   A new star in the west, braking: the Provident, for the Settlement Commission, a government the colony has never heard of.
   Who it is depends on what Earth heard (t.truth.is, fixed when it opens):
     relief   the colony called Earth every landing day (s.flags.b_uplink): Earth heard a colony alive, and under it another
              voice saying the same words. It comes sure there is a working colony to take over.
     hunt     the colony reported honestly on the crossing (s.flags.b_reported): Earth read the warnings and understood one
              thing, that there is an animal on Barrens that sleeps for years and wakes whole. It comes for exactly that.
     why      nothing for forty years. It comes to find out why, with the same sealed annex the Ariadne carried.
   Whatever it says, it wants the same thing, hidden for a while: a live Mocker, for Earth.

   Phases: latent, flare (tsh.flare), voice (tsh.voice), landed (tsh.land, then tsh.papers if the colony knows the hill
   people), want (tsh.want), after (tsh.dome). Endings: given (a Mocker goes home on the Provident: s.flags.b_mocker_earth),
   lied, refused. Carried: s.flags.b_newcomers (the day they landed), b_charter (signed, refused, terms), b_earth (how far the
   colony leans to Earth: a running number the ending reads), b_owned, b_lab_seen. Their camp is loud (LF.noiseWhy). */
(function () {
'use strict';
if (!LF.BARRENS) return;
const ID = 'third', T = s => LF.T(s, ID), MONTH = LF.MONTH, clamp = LF.clamp;
const SHIP = 'the Provident', BODY = 'the Settlement Commission';
const P = (s, seat) => LF.officer(s, seat);
const say = (s, seat, L, expr) => { const p = P(s, seat); if (!p || !p.key || (LF.seatState && LF.seatState(s, seat) !== 'here') || !L[p.key]) return ''; return `[[${p.key}${expr ? '|' + expr : ''}]] "${L[p.key]}"`; };
const para = (...a) => a.filter(Boolean).join('\n\n');
const earth = (s, n) => { s.flags.b_earth = (s.flags.b_earth || 0) + n; };
const since = (s, id) => s.used[id] === undefined ? -1 : s.day - s.used[id];
const quietKnown = s => !!(s.flags.b_quiet_found || s.flags.b_quiet_known || s.flags.b_extra === 'heard');
const finish = (s, end, chron) => { s.flags.b_third = end; LF.endThread(s, ID, end, chron); };
const FLARE_AFTER = [1, 3], VOICE_AFTER = 4, LAND_AFTER = 8,   // were 3-8, 10 and 12 months: Part 3 opened on most of a year of recaps (second pass, 2026-11-27)
      PAPERS_AFTER = 3, WANT_AFTER = 5, DOME_AFTER = 4, CAMP_NOISE = 20;

LF.thread({ id: ID, name: 'The Third Ship', view: 'world', own: true,
  fits: () => 0,
  called: (s, t) => t.phase === 'flare' ? 'the new star' : t.phase !== 'latent' ? 'the newcomers' : null,
  roll: s => ({ is: s.flags.b_uplink ? 'relief' : s.flags.b_reported ? 'hunt' : 'why' }),
  sig: t => t.truth.is,
  start: (s, t) => { t.at = s.day + LF.sri(s, FLARE_AFTER[0] * MONTH, FLARE_AFTER[1] * MONTH); t.did = {}; },
  tick: (s, t) => {
    if (t.end) { if (!s.flags.b_dome && s.flags.b_newcomers && s.day >= (t.endDay || 0) + DOME_AFTER * MONTH) { s.flags.b_dome = s.day; LF.cue(s, 'tsh.dome', 0, 20); } return; }
    if (s.day % MONTH) return;
    if (t.phase === 'latent' && s.day >= t.at) { LF.phase(s, ID, 'flare', 'A new star came up in the west, braking toward Barrens.'); LF.cue(s, 'tsh.flare', 0, 5); }
    else if (t.phase === 'flare' && since(s, 'tsh.flare') >= VOICE_AFTER * MONTH) { LF.phase(s, ID, 'voice'); LF.cue(s, 'tsh.voice', 0, 5); }
    else if (t.phase === 'voice' && since(s, 'tsh.voice') >= LAND_AFTER * MONTH) { LF.phase(s, ID, 'landed', `${cap(SHIP)} landed beside the colony.`); s.flags.b_newcomers = s.day; LF.cue(s, 'tsh.land', 0, 3); }
    else if (t.phase === 'landed' && !t.did.papers && quietKnown(s) && since(s, 'tsh.land') >= PAPERS_AFTER * MONTH) { t.did.papers = 1; LF.cue(s, 'tsh.papers', 0, 10); }
    else if (t.phase === 'landed' && since(s, 'tsh.land') >= WANT_AFTER * MONTH && (!quietKnown(s) || s.used['tsh.papers'] !== undefined)) { LF.phase(s, ID, 'want'); LF.cue(s, 'tsh.want', 0, 10); }
  },
});
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* Part 3 opens it: a few months after the years between. */
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (s.flags.b_jump && s.threads && !s.threads[ID] && s.world && !LF.aloft(s)) { const d = LF.THREADS[ID];
    const t = s.threads[ID] = { on: true, phase: 'latent', since: s.day, path: ['latent'], truth: d.roll(s), end: null, own: true }; d.start(s, t); if (s.plot && s.plot.threads) s.plot.threads.push(ID); }
  return r; }; }
// the camp is loud: floodlights, generators, landers coming and going
{ const why0 = LF.noiseWhy; LF.noiseWhy = s => { const w = why0(s); if (s.flags.b_newcomers && s.flags.b_third !== 'gone') w.newcomers = CAMP_NOISE; return w; }; }

/* ===== the flare ===== */
B('flare', { id: 'tsh.flare', view: 'world', tone: 'pressure', w: 8, title: 'A New Star', scene: ['tsh_flare', 'intro_orbit'],
  text: s => para('There is a new star in the west at dusk, low over the flats. It was not there last year. It is a little brighter every night, and it does not move with the others.',
    `${LF.h.Nwc(s, 'scientist')} has had the long lens on it for a month. It is a drive, burning hard to slow down, and it is pointed at 82 Eridani.`),
  choices: [
    { label: 'Hail it from the mast, every night until it answers', note: 'Whoever it is will know someone is here, and how loud they are.', info: [['yield', 'An answer, sooner'], ['later', 'What it hears']],
      out: { text: 'The mast calls on every band, every night, and the new star says nothing back. It goes on getting brighter.', fx: s => ({ do: s2 => { T(s2).did.hailed = 1; earth(s2, 1); } }) } },
    { label: 'Say nothing, and watch it come', note: 'It will find the colony anyway. It will not find it talking.', info: [['yield', 'The silence kept'], ['later', 'Whoever it is']],
      out: { text: 'The mast stays dark. The long lens is kept on the new star every clear night, and the watch learns to look for it before they look for anything else.', fx: s => ({ do: s2 => { T(s2).did.quiet = 1; } }) } },
    { label: 'Count the rifles and the stores, and get ready', note: 'Months of work that could have gone into the fields.', info: [['cost', 'Materials, and the fields'], ['yield', 'Whatever it is, the colony is ready']],
      out: { text: 'The rifles are counted, cleaned and counted again. The stores are moved into the old domes, under lock. Nobody says what they are getting ready for.', fx: s => ({ mat: -60, morale: -1, do: s2 => { T(s2).did.ready = 1; } }) } },
  ] });

/* ===== the voice ===== */
const HELLO = {
  relief: (s, J) => `The new star answers on the old Earth band, in an accent nobody under forty has heard.\n\n[[unknown:A voice from the new star]] "Colony of 82 Eridani, this is the Provident, for the Settlement Commission. We have your reports. Prepare to receive the relief."\n\nNobody here has heard of the Settlement Commission. It has the landing-day calls of the last ${J} years, every one, and it plays one back to prove it. On Earth's copy there is another voice under the operator's, saying the same words.`,
  hunt: () => `The new star answers on the old Earth band, in an accent nobody under forty has heard.\n\n[[unknown:A voice from the new star]] "Colony of 82 Eridani, this is the Provident, for the Settlement Commission. We have your warnings, and we've read them carefully."\n\nBefore anything else it asks how many of the colony have been taken, and how long ago, and whether any were found again.`,
  why: () => `The new star answers on the old Earth band, in an accent nobody under forty has heard.\n\n[[unknown:A voice from the new star]] "Ariadne, this is the Provident, for the Settlement Commission. You were ordered to Tau Ceti, and you are not at Tau Ceti. Explain."\n\nEarth has not had a word from here in forty years. It sounds as if it expected to find nobody.`,
};
B('voice', { id: 'tsh.voice', view: 'colony', tone: 'crisis', w: 8, title: 'The Provident', scene: ['tsh_voice', 'built_comms'],
  setup: s => ({ is: T(s).truth.is, J: (s.flags.b_jump && s.flags.b_jump.years) || 14 }),
  text: (s, c) => para(HELLO[c.is](s, c.J),
    say(s, 'command', { solheim: 'They\'re eight months out and they\'ve already told us what they think we are, which is theirs. I want the pad cleared and the stores counted before they\'re close enough to ask for either.',
      achebe: 'All right, before anybody answers them, I want the council in one room. Folks hear about this from us tonight, not off the radio.' }, 'grim')),
  choices: [
    { label: 'Give them the landing ground by the pad', note: 'They come down where the colony can see them.', info: [['yield', 'A welcome'], ['later', 'What they do with it']],
      out: { text: 'The landing ground is marked out on the flats beside the pad, with lamps at the corners. The Provident says thank you, and says it will be eight months.', fx: s => ({ do: s2 => { T(s2).did.welcome = 1; earth(s2, 1); } }) } },
    { label: 'Tell them what is out there, all of it', note: 'The voices, the taking, the thing in the dark. They should know what they are landing on.', info: [['yield', 'They are warned'], ['later', 'What they make of it']],
      out: { text: 'It takes the whole of one pass to tell it, and the operator\'s voice goes at the end. The reply comes back within the hour, quick and polite.\n\n[[unknown:The Provident]] "Understood, and thank you. Please preserve any specimens."\n\nNobody in the radio room says anything for a while.', fx: s => ({ do: s2 => { T(s2).did.warned = 1; } }) } },
    { label: 'Tell them to stay in orbit', note: 'Whatever they have come for, they can ask for it from up there.', info: [['yield', 'Distance, for now'], ['danger', 'Their temper']],
      out: { text: 'The answer takes three days.\n\n[[unknown:The Provident]] "Noted. That isn\'t one of the options."', fx: s => ({ tension: 6, do: s2 => { T(s2).did.refused = 1; earth(s2, -1); } }) } },
  ] });

/* ===== the landing ===== */
B('landed', { id: 'tsh.land', view: 'colony', tone: 'crisis', w: 9, title: 'The Charter', scene: ['tsh_land', 'lander_pad'],
  when: (s, t) => s.used['tsh.land'] === undefined,
  text: s => para('The Provident\'s landers come down on the flats beside the pad, three of them, and a hundred and twenty people walk out: armed, polite, in clean grey. The Commissioner reads the charter out at the foot of the ramp. Under it the colony\'s land, its stores and its people are the Commission\'s to administer, on Earth\'s behalf, from today.',
    '[[unknown:The Commissioner]] "You\'ve done remarkably well out here. We\'re here to take the weight off you."',
    say(s, 'security', { dahl: 'A hundred and twenty of them, and every one carries a rifle like they were told they\'d need it. I\'d love to know who briefed them on us, and what they were told.',
      zulu: 'With respect, I counted them off the ramp: a hundred and twenty, all armed. They were careful to look as though they weren\'t counting us back.' }, 'grim')),
  choices: [
    { label: 'Sign the charter', note: 'Earth\'s law, Earth\'s medicine, and Earth deciding.', info: [['yield', 'Medicine and spares from the Provident'], ['later', 'Whose colony it is']],
      out: { text: 'The charter is signed at the council table, in front of everyone. The Provident\'s crates come off the landers that afternoon, and the clinic has more medicine by nightfall than it has had in twenty years.', fx: s => ({ parts: 20, morale: -3, flags: { b_charter: 'signed' }, do: s2 => earth(s2, 2) }) } },
    { label: 'Refuse it: this colony governs itself', note: 'They are armed, and they have come a long way to be told no.', info: [['yield', 'The colony stays its own'], ['danger', 'A camp of armed strangers who were told no']],
      out: { text: 'The Commissioner hears the answer, thanks the council for its time, and goes back up the ramp. By morning the Provident\'s people have a camp on the flats by the pad, with floodlights and a wire of their own.', fx: s => ({ tension: 15, morale: 2, flags: { b_charter: 'refused' }, do: s2 => earth(s2, -2) }) } },
    { label: 'Talk terms: the pad is theirs, the council is ours', note: 'A long night at the table, and they may not take it.', test: { base: 45, mods: [LF.h.R('command', 10), LF.h.R('security', 5)] }, info: [['yield', 'Both, on paper'], ['fail', 'The charter, signed anyway']],
      ok: { text: 'It takes the night. By dawn there is a paper with two signatures on it: the pad and the flats beside it are the Commission\'s, and the council is the colony\'s. Nobody is sure the Commissioner meant a word of it.', fx: s => ({ flags: { b_charter: 'terms' } }) },
      bad: { text: 'By midnight the Commissioner has stopped pretending to negotiate. The charter is signed at the council table with the Provident\'s people standing round the walls.', fx: s => ({ morale: -6, tension: 8, flags: { b_charter: 'signed' }, do: s2 => earth(s2, 1) }) } },
  ] });

/* ===== papers: the hill people, as nobody's (STORY-ARCS 6, what Earth does) ===== */
B('landed', { id: 'tsh.papers', view: 'people', tone: 'crisis', w: 0, title: 'Papers', scene: ['tsh_papers', 'lim_coffle'], max: 1,
  text: s => para('The Commission\'s clerks have been out to the hills. They came back with a list. The people out there have no papers, no charter and no names Earth holds, and under the Commission\'s law that makes them nobody\'s. Twelve of them are already working the Provident\'s landers, and are chained at the ankle at night.',
    'The clerks are offering the colony a share: hands for the fields, at a price. The list has two columns of prices. Nobody on the council asks out loud what the second column is for.'),
  choices: [
    { label: 'Take a share of the hands, at the first price', dark: true, note: 'Twenty workers for the fields, owned, and the Commission\'s goodwill.', info: [['yield', 'Twenty more hands in the fields'], ['later', 'What the colony has become']],
      out: { text: 'Twenty come in from the Provident\'s camp at the end of a rope. They are put in the old domes at the edge of the fields. They work, and they do not speak, and at night the colony locks the door on them.', fx: s => ({ food: 1500, morale: -2, stain: ['bought_quiet', 3], flags: { b_owned: s.day }, do: s2 => earth(s2, 2) }) } },
    { label: 'Refuse, and say why in front of everyone', note: 'The Commission will hear what the colony thinks of its law.', info: [['yield', 'The colony\'s hands clean'], ['danger', 'The Commission\'s temper']],
      out: { text: 'The answer is given at the gate, loudly, with the Provident\'s clerks there to hear it. The chained twelve go on working the landers.', fx: s => ({ tension: 10, morale: 2, do: s2 => earth(s2, -1) }) } },
    { label: 'Go out to the hills, and warn them', note: 'The Commission will know who did it.', info: [['yield', 'The hill people warned'], ['danger', 'The Commission, when it finds out']],
      out: { text: 'Two of the watch go out at night with no lamps, the way the hill people taught the colony to walk. The next time the clerks go out to the hills, the camps are empty and the fires are cold.', fx: s => ({ tension: 15, flags: { b_quiet_warned: s.day }, do: s2 => earth(s2, -2) }) } },
  ] });

/* ===== the want: what they came for ===== */
const WHERE = s => s.flags.b_orbit_asleep ? 'Vasko already knows where one is. The Provident\'s cameras found the small dark shape in orbit on the way in, folded up and not tumbling.'
  : s.flags.b_body ? 'Vasko has heard about the sealed pod in the clinic\'s cold store, and wants it opened, and then wants it.'
  : s.flags.b_aboard ? 'Vasko wants the Ariadne, and whatever has been living in her infirmary all these years.'
  : 'Vasko wants a guide into the gullies, and to whoever lives in the hills.';
B('want', { id: 'tsh.want', view: 'people', tone: 'crisis', w: 9, title: 'What They Came For', scene: ['tsh_want', 'built_lab'],
  setup: s => ({ is: T(s).truth.is }),
  text: (s, c) => para(`Dr Imre Vasko runs the Provident's survey staff. Vasko comes to the council with a folder and asks for the room to be cleared. It isn't the land the Commission wants, or the colony. It is the animal: a thing that sleeps for years with no pod to fail, and wakes whole. ${c.is === 'hunt' ? 'Earth read about it in the colony\'s own warnings.' : c.is === 'relief' ? 'Earth heard it on the colony\'s own calls, under the operator\'s voice.' : 'Earth knew about it before the Ariadne ever left, and the order in Vasko\'s folder is older than anyone at the table.'} The order is to take one home, alive.`, WHERE(s)),
  choices: [
    { label: 'Give them what they came for', dark: true, note: 'Earth\'s medicine, Earth\'s tools and the Commission\'s thanks. A Mocker goes home on the Provident.', info: [['yield', 'Medicine, tools and spares'], ['later', 'Earth']],
      out: { text: 'It takes a month, and the Commission does the work. When it is done, there is a sealed crate in the Provident\'s hold that is kept colder than anything else aboard, and Vasko comes to the council to say thank you, and means it. The clinic\'s shelves are full.', fx: s => ({ parts: 40, food: 2000, morale: 3, stain: ['gave_mocker', 3], flags: { b_mocker_earth: s.day }, do: s2 => { earth(s2, 2); finish(s2, 'given', 'The colony helped the Commission take a Mocker for Earth.'); } }) } },
    { label: 'Lie: there is nothing, and the stories are stories', note: 'Vasko has read the reports. It has to be told well.', test: { base: 40, mods: [LF.h.R('command', 10), LF.h.R('scientist', 5)] }, info: [['yield', 'They go looking somewhere else'], ['fail', 'Vasko knows the colony lied']],
      ok: { text: 'The story is told well: an animal that took a few people in the first hard years and was killed, and the bones burned. Vasko writes it all down and does not believe a word, and goes looking in the wrong places.', fx: s => ({ do: s2 => finish(s2, 'lied', 'The colony lied to the Commission about the Mocker.') }) },
      bad: { text: 'Vasko listens to all of it, then opens the folder and reads the colony\'s own records back to the council, date by date. Nobody at the table says anything. From that day the Commission\'s people go armed inside the colony too.', fx: s => ({ tension: 12, do: s2 => { earth(s2, -1); finish(s2, 'lied', 'The colony lied to the Commission about the Mocker, and was found out.'); } }) } },
    { label: 'Tell them everything, and tell them no', note: 'They will know what it is, and that the colony will not help. They will go after it themselves.', info: [['yield', 'The truth, and the colony\'s hands kept out of it'], ['danger', 'What they do on their own']],
      out: { text: 'The council tells Vasko all of it, from the first voice at the wire, and then says no. Vasko thanks them, closes the folder, and that week the Provident\'s people start going out past the wire at night, with lamps.', fx: s => ({ tension: 8, flags: { b_mocker_hunt: s.day }, do: s2 => { earth(s2, -1); finish(s2, 'refused', 'The colony told the Commission the truth about the Mocker, and would not help it.'); } }) } },
  ] });

/* ===== after: the dome ===== */
LF.add({ id: 'tsh.dome', arc: 'th.' + ID, view: 'people', tone: 'crisis', title: 'Adapted Stock', scene: ['tsh_dome', 'built_lab'], max: 1, w: 0,
  when: s => !!s.flags.b_dome && !!s.flags.b_newcomers,
  text: s => para('Vasko\'s people have set up in the old laboratory dome. They want twenty of the colony\'s born-here young for tests: adapted stock, the folder calls them, the first generation grown on Barrens. Blood, sleep, how long they can hold their breath.',
    'They are also asking for anyone from the hills, for something the folder calls exposure work, and does not explain.'),
  choices: [
    { label: 'Let them have volunteers, and pay the families', dark: true, note: 'The Commission pays in medicine. Nobody is made to go.', info: [['yield', 'Medicine, and the Commission\'s goodwill'], ['later', 'What the tests are for']],
      out: { text: 'Twenty volunteer, most of them for the pay. They go into the dome in the morning and come out at night, tired and quiet. After a month, some of them stop coming out at night.', fx: s => ({ parts: 30, morale: -2, stain: ['adapted_stock', 2], do: s2 => earth(s2, 1) }) } },
    { label: 'No one goes into that dome', note: 'The Commission can test its own people.', info: [['yield', 'The young kept out of it'], ['danger', 'The Commission\'s temper']],
      out: { text: 'The answer goes to Vasko in writing. The dome stays lit all night, every night, and nobody from the colony goes near it.', fx: s => ({ tension: 6, do: s2 => earth(s2, -1) }) } },
    { label: 'Send someone in to see what exposure work is', note: 'One of the watch, at night, alone.', test: { base: 40, mods: [LF.h.R('security', 10)] }, risky: true, info: [['yield', 'What they are doing in there'], ['danger', 'Whoever goes']],
      ok: { text: 'In the back room of the dome there are four people from the hills, chained to the wall in the dark. A speaker on the ceiling plays a recording of a woman\'s voice saying the same sentence, over and over. The cage at the other end of the room has a cover over it, and something under the cover is learning the sentence.', fx: s => ({ tension: 10, flags: { b_lab_seen: s.day } }) },
      bad: { text: 'The one sent in does not come back. In the morning the Commission reports a trespasser in its laboratory, shot by its guard, and returns the body.', fx: s => ({ pop: -1, tension: 15, do: s2 => earth(s2, -1) }) } },
  ] });

if (LF.ASK) Object.assign(LF.ASK, {
  'tsh.flare': 'Something is braking toward Barrens: does the colony hail it, watch in silence, or get ready?',
  'tsh.voice': 'How does the colony answer the ship from Earth?',
  'tsh.land': 'Does the colony sign the Commission\'s charter, refuse it, or try to talk terms?',
  'tsh.papers': 'The Commission counts the hill people as nobody\'s: does the colony take a share of them, refuse, or warn them?',
  'tsh.want': 'The Commission has come for a live Mocker: does the colony help, lie, or tell the truth and refuse?',
  'tsh.dome': 'The Commission wants the colony\'s young for its tests: does the colony allow it, refuse, or find out what the tests are?',
});
Object.assign(LF.TAGS, { 'tsh.flare': ['open bold', 'closed cautious', 'cautious'], 'tsh.voice': ['open', 'open mercy', 'closed'], 'tsh.land': ['order', 'bold closed', 'cautious'],
  'tsh.papers': ['severe', 'mercy open', 'mercy bold'], 'tsh.want': ['severe', 'cautious closed', 'open'], 'tsh.dome': ['severe', 'closed mercy', 'bold'] });
(LF.DEEDS_LATE = LF.DEEDS_LATE || []).push({
  bought_quiet: 'the hill people bought from the Commission and locked in the old domes at night',
  gave_mocker: 'the Mocker handed to the Commission and sent to Earth',
  adapted_stock: 'the young sent into the Commission\'s dome for its tests',
});
})();
