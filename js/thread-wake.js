/* Landfall — thread: the Wake (the barrens branch; STORY-ARCS.md sections 2.3 and 4, dread 2; BUILD-PLAN.md stage 4). A dread
   that opens in the first months beside One Too Many (js/thread-extra.js), and runs with it. Dealt only on Barrens. Built from
   the Voices (mimic) and the Guest (learns), merged.

   The truth is fixed: one Mocker on the ground, woken in a dry year by the colony's warmth, lights and noise (s.noise, never
   shown). It climbs the ladder of mimicry in front of the player (t.step): 1 the voice, 2 the timing (it learns the watch and
   the names), 3 the posture and the shape (a figure at the end of the rows, upright, almost right), 4 the face (somebody sees
   their own face at the window). It takes people at night, more the louder the colony is.
   The turn (wk.log) is the colony going back to the old settlement and finding what was not there on arrival: the radio room
   with a ring worn round the chair and the windows scratched at head height on the outside, the log that ends twenty years
   before the transmissions did, too few graves, and the children's drawings of the thing. With One Too Many heard, the colony
   knows it already. With high clues from the crossing (s.flags.b_clues), the log only confirms it.

   Phases: latent, voices, names, taken, shape, turn, bill, after. Endings (t.end, s.flags.b_wake): held (the wire held, and it
   was driven off), silent (the colony learned silence), moved (the colony pulled up and left), taken (heavy losses). */
(function () {
'use strict';
const ID = 'wake', T = s => LF.T(s, ID);
const P = (s, seat) => LF.officer(s, seat);
const nm = (s, seat) => { const p = P(s, seat); return p ? p.first : LF.seatWord ? LF.seatWord(s, seat) : 'the watch'; };
const Nm = (s, seat) => { const n = nm(s, seat); return n.charAt(0).toUpperCase() + n.slice(1); };
const say = (s, seat, L, expr) => { const p = P(s, seat); if (!p || !p.key || (LF.seatState && LF.seatState(s, seat) !== 'here') || !L[p.key]) return ''; return `[[${p.key}${expr ? '|' + expr : ''}]] "${L[p.key]}"`; };
const para = (...a) => a.filter(Boolean).join('\n\n');
const noise = s => s.noise || 0;
const quiet = s => !!(s.flags.b_dark || s.flags.b_radio_off);
function take(s, t, n, line) { LF.deaths(s, n); t.taken += n; t.toll += n; LF.log(s, line, 'bad'); }
function finish(s, t, end, chron) { s.flags.b_wake = end; LF.endThread(s, ID, end, chron); }

LF.thread({ id: ID, name: 'The Wake', view: 'people', dread: true,
  fits: () => (LF.BARRENS ? 1 : 0),
  called: (s, t) => t.phase !== 'latent' ? 'the voices at the wire' : null,
  roll: () => ({ is: 'one' }),   // fixed: one Mocker on the ground (see the header)
  sig: t => t.truth.is,
  start: (s, t) => { Object.assign(t, { at: t.at || LF.sri(s, 28, 45), did: {}, step: 0, taken: 0, toll: 0 }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'voices'); t.step = 1; LF.cue(s, 'wak.first', 0, 3); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since;
    const next = (from, ph, id, gap, chron) => { if (t.phase === from && (since(id0[from]) >= gap || age >= gap + 40)) { LF.phase(s, ID, ph, chron); LF.cue(s, id, 0, 3); return true; } return false; };
    next('voices', 'names', 'wak.names', 22, 'The voices at the wire began to say the colonists\' names, in their own voices.')
      || next('names', 'taken', 'wak.taken', 22, 'The first of the colony was taken in the night, walking out to a voice.')
      || next('taken', 'shape', 'wak.shape', 25)
      || next('shape', 'turn', 'wak.log', 20, 'The colony went back to the old settlement, and found what had happened there.')
      || next('turn', 'bill', 'wak.face', 25);
    // the taking: from the first taken on, at night, more the louder the colony is
    if (s.day % 10 === 0 && s.pop > 12 && ['taken', 'shape', 'turn', 'bill'].includes(t.phase)) {
      const p = ({ taken: 0.35, shape: 0.45, turn: 0.4, bill: 0.55 }[t.phase]) * (0.5 + noise(s) / 40) * (quiet(s) ? 0.5 : 1) * (t.did.curfew ? 0.65 : 1) * (t.did.rota ? 0.8 : 1) * (t.did.wall ? 0.75 : 1) * (s.flags.b_site === 'far' ? 0.85 : 1) * (t.did.tape ? 1.1 : 1) * (t.did.lights ? 1.15 : 1) * (t.did.watch ? 0.8 : 1) * (s.flags.b_domes === 'moved' ? 1.15 : 1);   // what the first answers cost later (Lachlan, 2026-11-26: every card a hard choice)
      if (LF.srand(s) < p) take(s, t, t.phase === 'bill' && LF.srand(s) < 0.4 ? 2 : 1, LF.spick(s, [
        'Somebody walked out past the wire last night to answer a voice. It was somebody they loved, calling from the pump. The search found the lamp.',
        'A bunk was empty at the morning count, with the door barred from the inside, and the window open.',
        'The night watch on the east post heard their relief call them in early. They went. Their relief was asleep in the bunkhouse, and the post was empty in the morning.',
        'A child woke the row at three in the morning, saying their mother had been calling them from the yard. Their mother was beside them. In the morning the pump hand from the next pod was gone.']));
    }
    if (s.day % 5 === 0) {
      if (t.phase === 'voices') LF.emit(s, 'unexplained', 'th.wake', 35, 8, 'something past the wire talks at night in voices nobody here has');
      else LF.emit(s, 'fear', 'th.wake', ({ names: 30, taken: 45, shape: 55, turn: 50, bill: 60 }[t.phase] || 30) - (quiet(s) ? 10 : 0), 8, 'something past the wire calls people out by name, in voices they love');
    }
  },
  press: (s, t, Pr) => { if (t.end || t.phase === 'latent') return; if (t.did.watch) Pr.labor -= 0.02; Pr.labor -= t.phase === 'voices' ? 0.01 : 0.05; if (t.did.curfew) Pr.labor -= 0.04; if (['shape', 'turn', 'bill'].includes(t.phase)) Pr.morale -= 0.015; },
});
// the card each phase waits on before the next one comes
const id0 = { voices: 'wak.first', names: 'wak.names', taken: 'wak.taken', shape: 'wak.shape', turn: 'wak.log' };
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people' }, st));

/* ===== voices: the first step, the voice ===== */
B('voices', { id: 'wak.first', view: 'world', tone: 'pressure', w: 5, title: 'Past the Wire', scene: ['wak_first', 'natives_sign'],
  text: s => para(`The night watch has it in the log: voices past the wire after lamp-down, people talking, the rise and fall of a conversation. The accent is old-fashioned, the way people talked on Earth fifty years ago, and nobody in the colony talks like that.`,
    '[[unknown]] "Persephone Ground, day four-twelve. Second harvest in."',
    say(s, 'scientist', { yurbin: 'That\'s the tape, that\'s the harvest report off the year-one tape, word for word, in the same voice, and it\'s coming from out there, from the dark, not from a speaker, not from anything we brought down. What says it? What on this plain says it?',
      iyer: 'The phrase is from the first year of the Persephone archive, Administrator, delivered in the original speaker\'s voice, and it is not coming from any equipment of ours. I would very much like a recording, and I would like it before anyone decides to go out and look.' }, 'shocked')),
  choices: [
    { label: 'Put a recorder on the wire', note: 'Somebody sits up with it out by the wire every night. The colony will learn what it says, and it will learn who sits there.',
      out: { text: 'A month of nights goes onto tape. The voices say the same dozen things over and over, in the same few voices, all of them from the Persephone archive, and once, very quietly, something that sounds like a supper call.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.tape = true; s2.flags.b_clues = (s2.flags.b_clues || 0) + 1; s2.flags.b_clues = (s2.flags.b_clues || 0) + 1; } }) } },
    { label: 'Lights out on the wire at night', note: 'A quieter, darker colony, and less to draw it. The watch will be blind out there.',
      out: { text: 'The wire lamps go dark at lamp-down. The watch sits in the dark and listens, and the voices come no closer, and go no further away.', fx: s => ({ do: s2 => { T(s2).did.lights = true; s2.flags.b_wirelights = 0; } }) } },
    { label: 'Double the watch on the wire', note: 'Fewer gaps for it to walk through. A dozen people lose their nights, and the work loses them by day.',
      out: { text: 'The wire is walked in pairs from lamp-down to first light, and the pairs come off it grey. They report the same thing every morning: talk, close by, in voices nobody knows.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.watch = true; } }) } },
  ] });

/* ===== names: the second step, the timing ===== */
B('names', { id: 'wak.names', tone: 'pressure', w: 5, title: 'Who\'s on Watch', scene: ['wak_names', 'natives_sign'],
  text: s => { const w = s.people.find(p => p.alive && !p.role && p.rk) || null, who = w ? w.first : 'the night rigger';
    return para(`The voices have changed. They say the colony's names now, in the colony's own voices, and they say them at the right times: the relief called by name at the change of watch, a mother called to the pump at the hour she goes there.\n\nLast night the voice at the east post called ${who} in early from the watch, in the voice of ${who}'s relief. It knew the rota.`,
      say(s, 'security', { dahl: 'It knows the bloody rota. It knows who\'s on, when they change and what their relief sounds like, which means it\'s been sitting out there listening to us for weeks, taking notes, and I\'d dearly like to know who it\'s going to call next.',
        zulu: 'With respect, it knows my watch list better than some of my people do. I\'d like to change the rota every night, and I\'d ask that nobody on the wire answers any voice, not even mine, until they can see my face.' }, 'afraid')); },
  choices: [
    { label: 'Nobody outside after lamp-down, and the doors barred', note: 'The evening shift is lost, and everyone sleeps behind a bolt.',
      out: { text: 'The bell goes at dusk and the bars go across. Inside, people lie awake and listen to their own names being called through the wall.', fx: s => ({ morale: -2, do: s2 => { T(s2).did.curfew = true; } }) } },
    { label: 'Change the watch rota every night, by lot', note: 'Nobody knows who\'s on until they\'re on, including whatever is listening.',
      out: { text: 'The rota is drawn by lot at dusk. The watch hates it, and twice the wire is left a post short, but the voice at the east post gets the relief\'s name wrong for the first time.', fx: s => ({ do: s2 => { T(s2).did.rota = true; T(s2).step = 2; } }) } },
    { label: 'Send six of the watch out to find where it lies up', note: 'The wire is six short for a month.', send: { n: 6, days: [24, 36], danger: 3, to: 'the ground the voices come from' },
      out: { text: 'Six go out at first light with the two good rifles and orders to find where it lies up by day, and to come home before they do anything about it.', fx: s => ({ do: s2 => { T(s2).did.party = true; } }) } },
  ] });

/* ===== taken: the first ===== */
// the one taken is gone, not dead (LF.depart): nobody found a body
const gone = c => c.pid ? { depart: [{ who: c.pid, cause: 'taken in the night, answering a voice at the pump' }] } : { pop: -1 };
B('taken', { id: 'wak.taken', tone: 'crisis', w: 6, title: 'The Pump', scene: ['wak_taken', 'built_wells'],
  setup: s => { const p = s.people.find(x => x.alive && !x.role && x.rk && !x.away) || null; return { who: p ? p.name : 'one of the pump hands', first: p ? p.first : 'the pump hand', pid: p ? p.id : null }; },
  text: (s, c) => para(`${c.who} walked out through the gate last night. The gate watch says it was a voice at the pump, a man's voice, calling ${c.first} by the name only family used, and ${c.first} said a name back and went. The watch could not stop it in time.\n\nThe search at first light found the lamp at the pump, set down upright and still burning, and nothing else.`,
    say(s, 'doctor', { nakamura: 'I knew who that voice was supposed to be. It was the husband, and he died in the cryo banks on the way out, and somebody has to go and tell the children that their mother walked out to their father.',
      brandt: 'The voice belonged to a man who died on the crossing. I signed the certificate. So either the dead are calling from the pump, which I would find professionally embarrassing, or something out there has been listening to us grieve.' }, 'grieving')),
  choices: [
    { label: 'Search past the wire, all day', note: 'Twenty people off the work, and some of them past the lamps.',
      out: { text: 'Twenty go out in lines at first light and walk the plain until dusk. They find drag marks in the dry creek, going north, and lose them on the shellrock. They come back in before the lamps are lit, all twenty.', fx: (s, c) => Object.assign(gone(c), { morale: -1, do: s2 => { s2.flags.b_clues = (s2.flags.b_clues || 0) + 1; } }) } },
    { label: 'Stake out the pump with rifles', note: 'If it comes back for another, the rifles will be waiting.',
      out: { text: 'Four rifles sit up at the pump for a week. On the fifth night a voice calls from the dark past it, the same man\'s voice, saying the same name, and the rifles fire at it. In the morning there is blood on the shellrock, and it is not red.', fx: (s, c) => Object.assign(gone(c), { do: s2 => { T(s2).did.shot = true; } }) } },
    { label: 'Bar the doors, and stop answering', note: 'Whoever calls, nobody goes.',
      out: { text: 'The rule goes up on every door in plain letters: nobody answers a voice after dark, whoever it sounds like. People keep the rule, mostly, and lie awake hearing their own dead call them in.', fx: (s, c) => Object.assign(gone(c), { morale: -2, do: s2 => { T(s2).did.curfew = true; } }) } },
  ] });

/* ===== shape: the third step, a figure at the end of the row (timed) ===== */
B('shape', { id: 'wak.shape', tone: 'crisis', w: 7, timer: 10, title: 'At the End of the Row', scene: ['wak_shape', 'built_fields'],
  text: s => para(`Dusk. ${Nm(s, 'security')} is on the east post when somebody at the far end of the bean rows stands up out of the crop.\n\nIt is the right height, and it is standing the way a person stands, in what could be a coat. It isn't moving. It is facing the post.`,
    say(s, 'security', { dahl: 'That\'s not one of ours, look at the arms, look how long the arms are. Somebody give me a reason not to shoot it, and do it quickly.',
      zulu: 'That isn\'t one of mine. I need someone to tell me what to do, please, and I need it now.' }, 'afraid')),
  choices: [
    { label: 'Fire',
      out: { text: 'The rifle goes off. The thing drops onto all six legs at once, and goes away through the beans faster than anything that size should move. At first light there is a smear on the leaves that is not red, and a trail that goes straight to the creek.', fx: s => ({ do: s2 => { const t = T(s2); t.did.shot = true; t.step = 3; } }) } },
    { label: 'Call out to it',
      out: { text: s => `${Nm(s, 'security')} calls out, and it answers in ${Nm(s, 'security')}\'s own voice, saying the same words back, the same way. Then it turns and walks away down the row, upright, unhurried. One of the watch walks after it before anyone can stop them, and does not come back.`, fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.taken++; t.toll++; t.step = 3; } }) } },
    { label: 'Nobody moves', late: true,
      out: { text: 'Nobody moves, and nobody shoots. It stands there for a long time, watching the post, and then it turns and walks away down the row, upright, unhurried, the way a person walks home. In the morning the north post is empty, and the rifle is leaning against the wire.', fx: s => ({ pop: -1, morale: -3, do: s2 => { const t = T(s2); t.taken++; t.toll++; t.step = 3; } }) } },
  ] });

/* ===== turn: back to the old settlement (a look) ===== */
const ROOM = [
  { id: 'ring', x: 46, y: 70, label: 'The floor round the radio chair', text: 'Worn in a ring, down through the paint and into the plate, as if something sat in that chair and turned in it for years.' },
  { id: 'windows', x: 78, y: 30, label: 'The windows', text: 'Scratched, all of them, at head height, from the outside. Long scratches, in sets of three.' },
  { id: 'log', x: 24, y: 58, label: 'The colony log', text: 'Handwritten. It ends twenty years before the Persephone stopped transmitting. The last entries are about voices at the wire. The last line reads: They sound like us. Do not answer them.' },
  { id: 'drawings', x: 60, y: 22, label: 'Drawings on the wall', text: 'Children\'s drawings, pinned up in a row. The same thing in all of them: tall, thin, standing up, with its mouth open and full of little people\'s words.' },
  { id: 'graves', x: 88, y: 78, label: 'The burial ground, through the window', text: 'Thirty-one graves. The Persephone brought down a hundred and eighty people.' },
];
B('turn', { id: 'wak.log', tone: 'crisis', w: 7, title: 'The Radio Room', scene: ['wak_log', 'built_soillab'],
  look: { pic: ['wak_log', 'built_soillab'], need: 3, prompt: 'The old settlement\'s radio room', intro: 'A party goes back to the old settlement, to the one room nobody went into the first time. Tap what you want to look at.', done: 'Come away', sound: 'cold_room', spots: ROOM },
  text: (s, c) => para(s.flags.b_extra === 'heard' ? 'The two from the hills told you what lives on the plain. The radio room in the old settlement shows you how long it has been listening.'
      : (s.flags.b_clues || 0) >= 4 ? 'The tapes told you most of it, on the way out. The radio room only says it plainly.'
      : 'Every voice you heard on the way out, after the log\'s last page, came from something that was not a person.',
    say(s, 'scientist', { yurbin: 'It sat in that chair, it sat at the radio for twenty years, every report we heard, every tape, the roll call and the supper call and Earth\'s own voice, it was this, it was all this, and it\'s out there now, and it\'s been listening to us the same way!',
      iyer: 'Every transmission in the archive after the log\'s last entry was produced by the animal, Administrator, sitting at that set, for twenty years. I would describe it as the most significant finding of the mission, and I would recommend that nobody in the colony speaks above a whisper until we have decided what to do about it.' }, 'afraid')),
  choices: [
    { label: 'Go dark: lights out at night, radios off, machines by day', note: 'A slow, quiet colony, and much less of what draws it.',
      out: { text: 'The lamps go out at dusk. The radio is shut. The generators run in daylight only, and the colony learns to work in the light and sleep in the dark, and to talk in low voices.', fx: s => ({ morale: -3, do: s2 => { s2.flags.b_dark = 1; T(s2).did.dark = true; } }) } },
    { label: 'Build a wall: plate, wire and lamps, all the way round', note: 'Materials and two months of hands. Loud, and bright.', cost: { mat: 60 },
      out: { text: 'A wall goes up round the domes in two months: plate on posts, wire on the plate, and lamps on the wire every ten metres. It is the brightest thing on the plain at night.', fx: s => ({ do: s2 => { T(s2).did.wall = true; } }) } },
    { label: 'Bring everyone in close, and change the watch every night', note: 'Nobody sleeps alone, and nobody knows who\'s on.',
      out: { text: 'The outlying pods are emptied and everybody sleeps in the domes, four to a bunk space. The watch is drawn by lot at dusk.', fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.did.rota = true; t.did.curfew = true; } }) } },
  ] });

/* ===== bill: the fourth step, the face ===== */
B('bill', { id: 'wak.face', tone: 'crisis', w: 8, title: 'At the Window', scene: ['wak_face', 'natives_sign'],
  text: s => para(`Three in the morning. A woman in the second row wakes to a tapping at the window by her bunk, and looks up, and sees her own face looking in at her from the dark. It is almost right. The eyes are too far apart, and the mouth is moving, and it is saying her name in her own voice.\n\nShe is not the first. Over the month, eleven people have seen a face at a window, and every one of them saw their own, or their child's.`,
    say(s, 'command', { solheim: 'It\'s learned our faces now. We end this, one way or the other, before it learns anything else, and I don\'t much care which way.',
      achebe: 'Listen to me, all of you. Whatever we do now, we do together, and we do it tonight, because I\'m not going to ask anybody to sleep next to that window again.' }, 'grim')),
  choices: [
    { label: 'Hunt it: every rifle, every lamp, until it\'s dead', note: 'It has the colony\'s faces. The colony has guns.',
      out: { text: s => { const t = T(s), ok = noise(s) < 30 || (s.flags.b_clues || 0) >= 3 || t.did.shot;
        return ok ? 'The hunt goes out at dusk and doesn\'t come back until noon. They find it in the creek bank, in a hollow under the shellrock, curled round what it kept. It takes nine rounds. It is longer than a person and thinner, and it has a face on the front of its head that is nearly a face.'
          : 'The hunt goes out at dusk with every lamp the colony has, and it is the loudest night Barrens has heard. It doesn\'t come back until noon, and it doesn\'t come back whole. The thing in the creek bank is never found. The hunt loses four, and it calls out to the rest of them, all the way home, in the four voices.'; },
        fx: s => { const t = T(s), ok = noise(s) < 30 || (s.flags.b_clues || 0) >= 3 || t.did.shot; return { pop: ok ? -1 : -4, morale: ok ? 6 : -6, do: s2 => finish(s2, T(s2), ok ? 'held' : 'taken', ok ? 'The colony hunted the thing that took people at night, and killed it in the creek bank.' : 'The colony hunted the thing that took people at night, and lost the hunt.') }; } } },
    { label: 'Go silent, and stay silent', note: 'No light, no machine and no voice after dark, ever. It hunts by sound.',
      out: { text: 'The colony goes silent at dusk and stays silent until the light. People learn hand signs. Children are taught to cry into a pillow. The faces stop coming to the windows in the second month, and the voices at the wire go further away, and stay there, talking to each other.', fx: s => ({ morale: -4, do: s2 => { s2.flags.b_dark = 1; finish(s2, T(s2), 'silent', 'The colony learned silence, and the thing at the wire went away to talk to itself.'); } }) } },
    { label: 'Leave: pull up and move the colony', note: 'Everything that can be carried, a long way from here. Most of what was built stays behind.',
      out: { text: 'It takes a month to pack the colony onto carts and a week to walk it north, to a creek nobody has camped on. They leave the domes standing and the wire up and the lamps burning, to keep it busy. It works, for a while.', fx: s => ({ mat: -Math.round((s.res.mat || 0) * 0.5), morale: -3, do: s2 => { s2.flags.b_moved = 1; finish(s2, T(s2), 'moved', 'The colony pulled up and moved north, and left the thing at the wire the empty domes to talk to.'); } }) } },
  ] });

if (LF.ASK) Object.assign(LF.ASK, {
  'wak.first': 'What does the colony do about the voices past the wire?',
  'wak.names': 'How does the watch answer a voice that knows the rota?',
  'wak.taken': 'What is done after the first one is taken at the pump?',
  'wak.shape': 'What does the east post do about the figure at the end of the row?',
  'wak.log': 'What does the colony do now that it knows what was at the radio?',
  'wak.face': 'How does the colony end it?',
});
})();
