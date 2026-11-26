/* Landfall — Barrens, Part 1: the Crossing (the barrens branch; STORY-ARCS.md section 1, BUILD-PLAN.md stage 2). Rules and
   cards; no DOM, runs under Node. Nothing in it is dealt at random (Lachlan, 2026-11-26: "no more randomizing").

   The run, in order:
     year 1 and year 2   two voyage-out cards, fixed (soc.door, soc.mould): all six awake, running the ship in.
     year 2              everyone goes into the cold (a film, js/intro.js LFIntro.part1 'sleep').
     year 7              the order from Earth (brn.order, a story scene, after the 'order' film): the ship wakes you, the Flight
                         Commander and the Lead Scientist. Divert to 82 Eridani; Tau Ceti is shown and locked.
     years 9 to 33       the tapes, the roster, and the long shifts, two awake at a time (brn.tapes, roster, answer, alike,
                         supper, company, earth).
     year 38             the last tape, then nothing (brn.chorus, a story scene).
     year 41             82 Eridani (the 'arrive' film), the planet is Barrens, and the Persephone is dark in orbit
                         (brn.arrive, a story scene). Then the landing site (setup.site) and the lander, as before.
   Gone from a Barrens run: the adrift screen and its three stars (the one candidate is fixed and embarked by the UI), the
   premise (s.premise is 'diverted'), the two random crossing incidents (LF.crossing deals brn.arrive) and the naming card.

   What the crossing decides is kept in s.pro.p1 and copied into s.flags at landfall (b_told, b_clues, b_roster, b_reported,
   b_woke), with the officers' regard, nerve and health in s.pro.fx as the voyage out keeps them (content-social.js):
     b_told      all / seniors: who heard the order when it came (trust on arrival)
     b_clues     0 up: how much the crew have pieced together from the tapes (the log's reveal, better choices later)
     b_roster    friends / work / rotate: how the long shifts were paired
     b_reported  all / short / none: what Earth has been told (what Earth heard, Part 3)
     b_woke      1 if a sleeper was woken for company
     b_hailed    1 if the ship kept hailing the Persephone in orbit (it is loud in the sky)
   Officer lines: every quote is written for both officers of its seat (VOICES.md, voices/<key>.md), and the one who holds the
   chair speaks it (say). Lines are kept in LINES by card and seat. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const { add } = LF;

/* ---------- the officers, by seat, as the player picked them (LF.castPick) ---------- */
const MAIN = {}; for (const seat in LF.CAST) MAIN[seat] = LF.CAST[seat][0].key;   // effects are keyed by the seat's first officer, as on the voyage out
const off = (s, seat) => LF.CAST[seat][LF.castPick(s, seat)] || LF.CAST[seat][0];
const nm = (s, seat) => off(s, seat).first;
const say = (s, card, seat, expr) => { const o = off(s, seat), l = LINES[card][seat][o.key]; return `[[${o.key}${expr ? '|' + expr : ''}]] "${typeof l === 'function' ? l(s) : l}"`; };

/* ---------- what a choice does: chips now, the rest kept for landfall ---------- */
const KIT = { food: 'food', parts: 'spare parts', sleepers: 'sleepers' };
const FX = o => s => {
  const chips = [], who = k => nm(s, Object.keys(MAIN).find(seat => MAIN[seat] === k));
  for (const k in o.reg || {}) { const d = o.reg[k]; if (d >= 3) chips.push([`${who(k)} warms to you`, true]); else if (d <= -3) chips.push([`${who(k)} is put out`, false]); }
  for (const k in o.nerve || {}) { const d = o.nerve[k]; if (d <= -3) chips.push([`${who(k)} is worn down`, false]); else if (d >= 3) chips.push([`${who(k)} steadies`, true]); }
  for (const k in o.body || {}) if (o.body[k] < 0) chips.push([`${who(k)} is run down`, false]);
  if (o.all) chips.push([o.all < 0 ? 'The crew are worn down' : 'The crew steady', o.all > 0]);
  if (o.clues > 0) chips.push(['The crew learn something from the tapes', true]);
  if (o.clues < 0) chips.push(['Something in the tapes goes unheard', false]);
  if (o.bond) chips.push([o.bond[2] === 'friend' ? `${who(o.bond[0])} and ${who(o.bond[1])} are friends now` : `${who(o.bond[0])} and ${who(o.bond[1])} are at odds`, o.bond[2] === 'friend']);
  for (const k in o.kit || {}) chips.push([`${o.kit[k] > 0 ? '+' : '−'}${Math.abs(o.kit[k])} ${KIT[k]} in the ship's stores`, o.kit[k] > 0]);
  return { chips, do: s2 => { const P = s2.pro; if (!P) return; const X = P.fx, Q = P.p1 = P.p1 || { clues: 0 };
    for (const k in o.reg || {}) X.reg[k] = (X.reg[k] || 0) + o.reg[k];
    const mind = Object.assign({}, o.nerve || {}); if (o.all) for (const seat in MAIN) mind[MAIN[seat]] = (mind[MAIN[seat]] || 0) + o.all;
    for (const [stat, m] of [['mind', mind], ['body', o.body]]) for (const k in m || {}) X[stat][k] = (X[stat][k] || 0) + m[k];
    if (o.bond) X.bonds.push(o.bond);
    for (const k in o.kit || {}) if (s2.adrift && s2.adrift.kit) s2.adrift.kit[k] = Math.max(0, s2.adrift.kit[k] + o.kit[k]);
    if (o.clues) Q.clues = Math.max(0, Q.clues + o.clues);
    for (const k in o.p1 || {}) Q[k] = o.p1[k];
  } };
};

/* ---------- the cards ---------- */
const YEAR = {}, LINES = {};
LF.P1_DECK = [];
// A crossing card: one of the voyage's own (arc voyage, aboard, alone), with the year it happens in and the picture it wants first.
const card = (id, year, st) => { YEAR[id] = year; LF.P1_DECK.push(id);
  return add(Object.assign({ id, view: 'colony', arc: 'voyage', tone: 'pressure', chain: true, alone: true, kicker: `Year ${year} out from Earth`, year,
    scene: [id.replace('.', '_')].concat(st.pic || []) }, st)); };
const MED = s => nm(s, 'doctor'), SCI = s => nm(s, 'scientist'), ENG = s => nm(s, 'engineer'), CMD = s => nm(s, 'command'), SEC = s => nm(s, 'security'), CREW = s => nm(s, 'crew');


/* ===== year 7: the order ===== */
LINES['brn.order'] = {
  command: {
    solheim: 'Thirty-four years instead of sixteen, and two hundred people who signed on for Tau Ceti will wake somewhere they never agreed to. Earth knows that, and it sent the order anyway, so it reckons whatever is on those tapes is worth more than our mission.',
    achebe: 'Listen, before anybody decides anything, I want us to be straight about what this is. Two hundred of our people went to sleep bound for Tau Ceti, and if we turn, they wake thirty-four years from home somewhere nobody asked them about, so whatever we do, we tell them why.' },
  scientist: {
    yurbin: 'There\'s a roll call on the year-fourteen tape, names and then present, present, each one in the right voice, and three of those people were reported dead six years before. I\'ve played it eleven times, there\'s no splice, no edit, nothing, and listen, no, wait, listen to the breath before each one, it\'s the same breath every time!',
    iyer: 'I would draw your attention to the roll call on the fourteenth-year recording, Administrator, in which three colonists reported dead six years earlier answer to their names in their own voices. Earth has noted the anomaly and not explained it, which I would suggest is the real content of the order: they would like someone to go and find out, and they have chosen the one ship that cannot refuse.' },
};
card('brn.order', 7, { title: 'The Order', tone: 'crisis', play: true, film: 'order', pic: ['intro_bridge'],
  text: s => `Year seven out from Earth, and nobody was meant to be awake for fourteen more. The ship wakes you first, then ${CMD(s)} and ${SCI(s)}, and while your eyes clear it gives each of you the same thing: an order from Earth, sent three years and nine months ago.\n\nIt is short. Divert to 82 Eridani. Find out what has happened to the Persephone colony. Report.\n\nWith it comes an archive: twenty years of the Persephone colony's radio, as Earth heard it. The early years are harvest tallies and weather. The later ones are correct in every field, sent under the right station codes, and wrong in ways nobody at Earth can name.\n\n${say(s, 'brn.order', 'command', 'grim')}\n\n${say(s, 'brn.order', 'scientist', 'shocked')}\n\nTau Ceti is sixteen years ahead, and it is the world you were sent for. 82 Eridani is thirty-four years away, and nothing is promised there. The ship has laid in both courses and will fly whichever one you give it.`,
  choices: [
    { label: 'Turn for 82 Eridani, and wake the other four to hear why', note: 'Everyone hears it from you. Four more mouths awake for a month.',
      out: { text: 'The Ariadne turns through thirty-four degrees over most of a day, and nobody aboard feels it. The other four are woken into the wardroom and hear the order and three of the tapes. Nobody argues. By supper Tau Ceti is a star off to one side, and nobody mentions it.',
        fx: FX({ reg: { dahl: 3, kovacs: 3, nakamura: 3, estrada: 3 }, kit: { food: -40 }, p1: { told: 'all' } }) } },
    { label: 'Turn for 82 Eridani, and let the other four sleep', note: 'They\'ll each find the order waiting when their shift comes.',
      out: { text: 'The Ariadne turns through thirty-four degrees over most of a day, and nobody aboard feels it. The other four sleep through it. When each of them wakes for a shift, the order is the first thing waiting on the console, with a note from you, and the course has been laid in for years.',
        fx: FX({ reg: { dahl: -2, kovacs: -2, nakamura: -2, estrada: -2 }, p1: { told: 'seniors' } }) } },
    { label: 'Hold course for Tau Ceti', req: () => false, reqText: 'Not in this version',
      out: { text: 'The Ariadne holds her course.' } },
  ] });

/* ===== year 9: the tapes ===== */
LINES['brn.tapes'] = {
  scientist: {
    yurbin: 'Everything, we keep everything, because if there\'s a pattern in the wrongness it\'s going to be in the boring parts, in the harvest tallies and the weather, not the dramatic ones, and I can\'t find a pattern in tapes nobody\'s listening to!',
    iyer: 'I would recommend that every transmission be played in full and logged against the archive, Administrator, since the useful anomaly is generally the one buried in routine, and I would ask that the cost to the listeners be entered as a cost rather than as a reason.' },
  doctor: {
    nakamura: 'I\'ve read the shift logs, and the two on watch are sleeping four hours a night and playing the same tape over and over. You\'re asking two of ours to sit alone in the dark with dead people\'s voices for years, so if you want it all logged, let the ship log it, and let a person hear it when a person needs to.',
    brandt: 'Oh, good, more data. The prognosis for two people shut in a can with twenty years of a dead colony\'s radio is not complicated, and I would rather not wait thirty years for the post-mortem to agree with me.' },
};
card('brn.tapes', 9, { title: 'The Tapes', tone: 'pressure', pic: ['intro_array'],
  text: s => `Year nine. The array has found the Persephone's relay beam, and the ship can hear Barrens for itself now, a decade sooner than Earth does. It comes in at all hours: weather, harvest tallies, children on an open channel, a man reading out a list of seed lots.\n\n${SCI(s)} wants every word of it played and logged.\n\n${say(s, 'brn.tapes', 'scientist')}\n\n${MED(s)} has been reading the shift logs.\n\n${say(s, 'brn.tapes', 'doctor', 'grim')}`,
  choices: [
    { label: 'Play all of it, and log every voice', note: 'Whatever is wrong in there, the crew will find it. It wears on whoever is awake.',
      out: { text: 'Every transmission is played through on the flight deck as it arrives and logged against the archive by voice, by station and by date. The log runs to thousands of entries in the first year. The people on shift take to wearing one earpiece, so they can sleep with the other ear.',
        fx: FX({ clues: 3, all: -2, reg: { yurbin: 3, nakamura: -2 } }) } },
    { label: 'Ration it: the ship flags anything new, and nobody hears the rest', note: 'Most of it goes unheard. The crew keep their sleep.',
      out: { text: 'The ship listens to all of it and plays the crew only what it has not heard before, a few minutes a day. Most of Barrens goes into the log unheard.',
        fx: FX({ clues: 2, all: -1 }) } },
    { label: 'The ship logs it, and nobody listens', note: 'The crew are spared it. Whatever is in there waits.',
      out: { text: 'The Barrens channel is routed straight to storage. Nobody on shift hears it unless they go looking, and the log shows that one or two of them do, late, a few times a year.',
        fx: FX({ reg: { yurbin: -4, nakamura: 3 }, p1: { deaf: 1 } }) } },
  ] });

/* ===== year 10: the roster ===== */
LINES['brn.roster'] = {
  engineer: {
    kovacs: 'I don\'t care who\'s friends with who, I care that there\'s somebody awake who knows what a coolant loop sounds like before it goes, so put an engineer on every shift you can and I\'ll sleep less than I\'d like.',
    halloran: 'Pair them however you like, boss, but when some pump seizes at year twenty and there\'s nobody awake who can strip the bastard, you\'ll be waking me with a goddamn alarm anyway! Put a pair of hands on every shift!' },
};
card('brn.roster', 10, { title: 'Two at a Time', tone: 'quiet', pic: ['sleep_manifest'],
  text: s => `Year ten. The ship can keep two people awake for thirty years, but not six. Stores, air and the wear on the cryo banks all come out the same: two at a time, five years to a shift, everyone else in the cold.\n\nWho shares a shift with whom is for you to set. ${ENG(s)} has an opinion, and it isn't about people.\n\n${say(s, 'brn.roster', 'engineer')}`,
  choices: [
    { label: 'Let them choose who they\'re awake with', note: 'Easier years for the pairs. Nobody minds the machines as closely.',
      out: { text: 'The six sort it out over two evenings in the wardroom, and nobody falls out over it. The pairs that come out of it have sat at the same end of the table since the first year.',
        fx: FX({ all: 2, kit: { parts: -3 }, bond: ['dahl', 'estrada', 'friend'], p1: { roster: 'friends' } }) } },
    { label: 'An engineer awake on every shift', note: s => `The ship is kept well. ${ENG(s)} spends more years awake than anyone.`,
      out: { text: s => `${ENG(s)} takes the long end of the roster: on for most of every shift, and out of the cold more years than in it. The machines have never been kept better.`,
        fx: FX({ kit: { parts: 4 }, nerve: { kovacs: -4 }, body: { kovacs: -2 }, reg: { kovacs: 2 }, p1: { roster: 'work' } }) } },
    { label: 'Everyone through everyone, a new pair each shift', note: 'Nobody gets too used to anybody.',
      out: { text: 'Each shift is a new pair, and the roster is written so that by year forty-one every officer has spent a shift awake with every other.',
        fx: FX({ all: -1, p1: { roster: 'rotate' } }) } },
  ] });

/* ===== year 14: talking back ===== */
LINES['brn.answer'] = {
  engineer: {
    kovacs: 'Copy that, Ground, we\'ve got you, wind from the west and clear tonight, and you hang on down there, because we\'re coming as fast as the old girl will go.',
    halloran: 'Copy, Ground. We hear you. It\'s twenty-seven years, love, that\'s all, and I\'ll fix whatever\'s broken down there properly when I get there, I swear it, so just keep talking to me.' },
  doctor: {
    nakamura: 'I\'m not reporting this so you\'ll write it up. I\'m reporting it because I sat and listened to it for an hour last night, and I caught myself waiting for her to answer.',
    brandt: 'Oh, it\'s perfectly harmless, I\'m sure. I would only point out that the patient is a little more cheerful after these conversations than after any of ours, which is either a good sign or a symptom.' },
};
card('brn.answer', 14, { title: 'Talking Back', tone: 'pressure', pic: ['intro_bridge'],
  text: s => `Year fourteen. ${MED(s)} wakes you for an hour to show you something from the flight deck, recorded at three in the morning, ship's time.\n\nIt is ${ENG(s)} at the console, alone, with the Barrens channel open. A woman on the tape is reading out a weather report. When she stops, ${ENG(s)} answers her.\n\n${say(s, 'brn.answer', 'engineer', 'exhausted')}\n\nIt has been every night for a month.\n\n${say(s, 'brn.answer', 'doctor', 'grim')}`,
  choices: [
    { label: s => `Take ${ENG(s)} off the night console`, note: 'The nights stop. So does the one thing that has been keeping them going.',
      out: { text: s => `${ENG(s)} takes the day shift without arguing and doesn't speak to you for the rest of your hour. The console is shut down at night.`,
        fx: FX({ reg: { kovacs: -4 }, nerve: { kovacs: 1 } }) } },
    { label: 'Leave it. Somebody ought to answer them', note: 'It costs the Chief Engineer, a little at a time.',
      out: { text: s => `You don't say anything about it, and neither does ${MED(s)}. The recordings go on, a few minutes every night, for the rest of the shift.`,
        fx: FX({ reg: { kovacs: 2 }, nerve: { kovacs: -5 }, clues: 1 }) } },
    { label: 'Wake a third officer to sit the nights with them', note: 'Three awake for a year on stores meant for two.',
      out: { text: s => `${SEC(s)} is woken a year early and takes the night console. Nobody answers the tapes after that, and the two of them play cards through the night instead.`,
        fx: FX({ kit: { food: -40 }, nerve: { kovacs: 2 }, bond: ['kovacs', 'dahl', 'friend'] }) } },
  ] });

/* ===== year 19: bank C (a look, then a timed card) =====
   Lachlan, 2026-11-26: "a little more horror ... quick time ones, like you only get 10 seconds to pick something, or it's from the
   character's POV and you need to click something on the screen to investigate". This replaces "The Same Words". A pod opens itself,
   the Chief of Security goes down with a lamp, and the player sees what they see (look). The truth is human, and on the theme: a
   sleeper woken by a fault months ago, living in the ducts on stolen rations and listening to the Barrens channel on a cut handset
   until she talks like it. If the player waits for whoever it is, the next card is timed (brn.three). */
const SPOTS = [
  { id: 'pod', x: 80, y: 58, label: 'Pod C-31', text: 'The readout says OCCUPIED and NOMINAL. Under the frost on the lid there is a handprint, and it was made from the inside.' },
  { id: 'floor', x: 36, y: 88, label: 'The floor', text: 'Footprints, bare and small, from C-31 to the wall and back again. The water in them has frozen at the edges.' },
  { id: 'vent', x: 87, y: 18, label: 'The vent grille', text: 'The screws are lying on the deck. In the duct behind the grille: ration wrappers, a blanket from the infirmary, and a handset from the flight deck with its cord cut.' },
  { id: 'dark', x: 50, y: 30, label: 'The far end of the bank', text: 'The lamp does not reach the far end of the bank. Something down there stops breathing when the lamp turns towards it.' },
];
LINES['brn.bank'] = {
  security: {
    dahl: 'Somebody\'s been living down here, in the bloody walls, and climbing back into that pod to sleep. So I\'d like to know how long, and I\'d very much like to know what they\'ve been listening to on that handset.',
    zulu: 'With respect, I\'d ask you not to send anyone else down yet. Someone is living in the ducts, I can hear them breathing at the far end of the bank, and I\'d rather it was me they met first.' },
};
card('brn.bank', 19, { title: 'Bank C', tone: 'crisis', pic: ['sleep_manifest'],
  look: { pic: ['brn_bank', 'sleep_manifest'], need: 3, prompt: 'Bank C, by lamplight', intro: 'You see what the handheld camera sees. Tap what you want to look at.', done: 'Call them back up', sound: 'cryo', spots: SPOTS },
  text: (s, c) => `Year nineteen. Pod C-31 in bank C has opened and closed itself four times in a month, and each time the ship has logged it as a fault and cleared it. ${SEC(s)} goes down to bank C with a lamp at three in the morning, ship's time, and you watch from the flight deck through the handheld camera.${(c.found || []).length ? '' : '\n\nThe bank is cold and very quiet.'}\n\n${say(s, 'brn.bank', 'security', 'afraid')}`,
  choices: [
    { label: 'Open C-31', note: 'Now, with the lamp on it.',
      out: { text: s => `${SEC(s)} breaks the seal on C-31. There is a woman in it, a hydroponics tech, awake, with her eyes open, thin as wire. She has been out of the cold since the spring. She doesn't look at the lamp. She is saying the day four-twelve harvest report under her breath, in a voice that isn't hers, and she doesn't stop when they lift her out.`,
        fx: (s, c) => FX({ nerve: { dahl: -3 }, clues: (c && (c.found || []).includes('vent')) ? 2 : 1, kit: { food: -40 } })(s) } },
    { label: 'Seal bank C, and wait on the flight deck for whoever it is', note: 'They have to come up for food sooner or later.',
      out: { text: s => `${SEC(s)} comes back up, and the hatch to the cryo decks is sealed behind them. The two of you sit on the flight deck with the lights down and wait.`,
        fx: FX({ p1: { waited: 1 } }) } },
  ] });

LINES['brn.three'] = {
  security: {
    dahl: 'Don\'t you touch that wheel. Whoever that is, they\'ve had months in the walls to think about this, and we\'ve had about five seconds.',
    zulu: 'Stay behind me, please. I don\'t know who that is, and I would like to be the one who finds out.' },
};
card('brn.three', 19, { title: 'Three in the Morning', tone: 'crisis', timer: 10, pic: ['intro_bridge'], when: s => !!(s.pro && s.pro.p1 && s.pro.p1.waited),
  text: s => `The intercom clicks on. Somebody breathes into it.\n\n[[unknown]] "Persephone Ground, day four-twelve. Second harvest in."\n\n[[unknown]] "Open the door."\n\nThe wheel on the cryo deck hatch turns a quarter, from the other side, and stops.\n\n${say(s, 'brn.three', 'security', 'afraid')}`,
  choices: [
    { label: 'Open the hatch',
      out: { text: 'The hatch swings in and a woman falls through it onto the deck: a hydroponics tech from bank C, thin as wire, in an infirmary blanket. She has been out of the cold since the spring, living in the ducts and listening to the Barrens channel on a stolen handset. She is still saying the harvest report when they carry her to the infirmary, and she says it in the voice from the tape.',
        fx: FX({ nerve: { dahl: -2 }, clues: 1, kit: { food: -40 } }) } },
    { label: 'Hold it shut, and call the ship',
      out: { text: 'The wheel turns again, hard, and stops against the lock. Then nothing, for the rest of the night. In the morning the ship finds her in the duct behind the grille in bank C: a hydroponics tech who woke from a fault in the spring and never told anyone. She is cold, with the handset in her hand and the Barrens channel still open on it.',
        fx: FX({ nerve: { dahl: -6 }, all: -1, kit: { sleepers: -1 } }) } },
    { label: 'You don\'t move', late: true,
      out: { text: 'Nobody moves. The wheel turns the rest of the way on its own and the hatch swings open on an empty corridor. Then the intercom clicks on behind you, from the flight deck\'s own handset, three metres away, and something breathes into it. It is a hydroponics tech from bank C, crouched under the console, thin as wire. She has been out of the cold since the spring, and she is saying the harvest report in the voice from the tape.',
        fx: FX({ nerve: { dahl: -5 }, all: -2, clues: 1, kit: { food: -40 } }) } },
  ] });

/* ===== year 24: supper ===== */
LINES['brn.supper'] = {
  crew: {
    estrada: 'I don\'t mind skipping the meal, I\'ve kept fasts before, but I can\'t eat while she\'s calling him. He never comes, not once in all the evenings I\'ve heard her, and I find I\'m praying he\'s somewhere he can\'t hear it.',
    waititi: 'I can\'t do it, my friend. I sit down with the pot and she starts calling him, Ruben, Ruben, come in now, and I put the spoon down, because Dalia\'s thirty metres from me in the cold and I\'d want somebody to come in if it were her calling.' },
};
card('brn.supper', 24, { title: 'Supper Time', tone: 'quiet', pic: ['intro_window'],
  text: s => `Year twenty-four. One of the Barrens tapes is a woman calling a child in for supper. She calls at the same hour every evening, on an open channel, and the relay's timing has drifted until it lines up with supper on the Ariadne, ship's time.\n\n${CREW(s)} has stopped eating at that hour.\n\n${say(s, 'brn.supper', 'crew', 'grieving')}`,
  choices: [
    { label: 'Cut that voice from the ship\'s playback', note: 'The crew stop hearing her. So does the log.',
      out: { text: 'The ship filters her out. Supper on the Ariadne is quiet after that, and nobody says anything about it, and the log of Barrens has a hole in it at the same hour every day.',
        fx: FX({ nerve: { estrada: 3 }, clues: -1, reg: { yurbin: -2 } }) } },
    { label: 'Move supper, and leave the tape alone', note: 'She goes on calling, to an empty wardroom.',
      out: { text: s => `Supper moves two hours later. ${CREW(s)} eats again, and some evenings is found on the flight deck at the earlier hour anyway, sitting with the channel open.`,
        fx: FX({ nerve: { estrada: -1 } }) } },
  ] });

/* ===== year 29: company ===== */
LINES['brn.company'] = {
  doctor: {
    nakamura: 'Yes, I woke her, and I\'d do it again, because the person I\'m on shift with hasn\'t said a whole sentence to me since spring and I was starting to talk to the walls. She\'s healthy, she eats less than I do, and you can put it on my record, but you\'re not putting her back in that pod tonight.',
    brandt: 'Oh, good, an inspection. I woke her because the alternative was two people on this shift slowly going the way of the tapes, and I would have had to write myself up for it, which I\'m told is a conflict of interest. She stays awake to the end of the shift, and her rations come out of mine, which is a treatment, not a sacrifice.' },
};
card('brn.company', 29, { title: 'Company', tone: 'pressure', pic: ['lib_tech_05'],
  text: s => `Year twenty-nine. The shift log says two people awake. The air log says three.\n\n${MED(s)} has woken a sleeper from bank C, a hydroponics tech, without asking anyone, and has had company for two months.\n\n${say(s, 'brn.company', 'doctor', 'exhausted')}`,
  choices: [
    { label: 'She stays awake to the end of the shift', note: 'Three awake on stores meant for two.',
      out: { text: s => `The tech stays. By the end of the shift she has learned the flight deck, and ${MED(s)} is sleeping six hours a night again.`,
        fx: FX({ kit: { food: -50 }, nerve: { nakamura: 3 }, reg: { nakamura: 3 }, p1: { woke: 1 } }) } },
    { label: 'Put her back in the cold tonight', note: 'A second freeze in old banks. The shift goes back to two.',
      out: { text: s => `The tech goes back into bank C that night, and the pod takes her a second time without complaint. ${MED(s)} does it, and does it properly, and doesn't speak to anyone about it.`,
        fx: FX({ nerve: { nakamura: -4 }, reg: { nakamura: -5 } }) } },
  ] });

/* ===== year 33: the report ===== */
LINES['brn.earth'] = {
  command: {
    solheim: 'I\'ve drafted it short. Course, stores and the crew fit for duty, and nothing about the tapes, because a guess in a report becomes a fact by the time it\'s thirty years old.',
    achebe: 'Here\'s what I think. We tell them all of it, the tapes and what the tapes have done to our people too, because whoever reads this in thirty years is deciding whether to send somebody after us, and they\'ve a right to know what they\'d be sending them into.' },
};
card('brn.earth', 33, { title: 'The Yearly Report', tone: 'quiet', pic: ['intro_array'],
  text: s => `Year thirty-three. A report goes to Earth every year: course, stores, crew, and anything learned. Earth will read this one in about thirty years, long after it can matter to anyone aboard, and it will be most of what anyone at home ever knows about the Ariadne.\n\nIt is ${CMD(s)}'s to draft and yours to send.\n\n${say(s, 'brn.earth', 'command')}`,
  choices: [
    { label: 'Send all of it: the tapes, the shifts, what it has cost', note: 'Earth will know what you know, thirty years late.',
      out: { text: 'The report runs to forty pages and three of the tapes. It goes out on the long dish, and the log notes that it has been sent and that nobody will answer it for sixty years.', fx: FX({ reg: { solheim: -1 }, p1: { reported: 'all' } }) } },
    { label: 'Course and stores, and nothing else', note: 'A clean report. Earth learns nothing it did not already have.',
      out: { text: 'The report is three lines long. It goes out on the long dish like every one before it.', fx: FX({ p1: { reported: 'short' } }) } },
    { label: 'Send nothing more, from here on', note: 'The Ariadne goes quiet. Earth stops hearing from her.',
      out: { text: 'The long dish is turned off for the first time since the Ariadne left Earth. Whatever is said aboard her from now on stays aboard her.', fx: FX({ all: -1, p1: { reported: 'none' } }) } },
  ] });

/* ===== year 38: the last tape ===== */
LINES['brn.chorus'] = {
  scientist: {
    yurbin: 'It\'s a chorus, it\'s every animal on that plain calling the same thing, come up, come up, the rain\'s here, and, no, wait, the ship says it\'s a dry year, there\'s no rain on that whole continent, so who\'s calling them up, what\'s calling them up out of the ground when there\'s nothing to come up to?',
    iyer: 'It is a waking call, Administrator, of the kind the planet\'s fauna appear to make when the rain arrives, and I would note that the ship\'s weather model shows no rain on that continent at the time of recording. Something on Barrens is issuing the call in a dry season, and I would very much like to know what answers it.' },
};
card('brn.chorus', 38, { title: 'The Last Tape', tone: 'crisis', play: true, pic: ['intro_array'],
  text: s => `Year thirty-eight. For a year the tapes have come further apart, weeks between them and then months, and the voices on them are fewer and stranger. One of them is the mission controller's, from Earth, reading back an order Earth sent eleven years ago.\n\nThen the last one. It isn't a voice. It is a plain full of animals calling, thousands of them, one call taken up and passed along, and ${SCI(s)} reads the ship's analysis of it twice.\n\n${say(s, 'brn.chorus', 'scientist', 'afraid')}\n\nThen nothing. The channel stays open, and Barrens says nothing at all.`,
  choices: [
    { label: 'Keep someone on the channel, every hour, to the end', note: 'Three years of listening to nothing.',
      out: { text: 'Somebody is on the channel every hour of every day for three years. Nothing comes. The log of those years is one line, written once a day: channel open, nothing heard.', fx: FX({ all: -2, clues: 1 }) } },
    { label: 'Close the channel. You\'ll be there soon enough', note: 'Three quiet years.',
      out: { text: 'The channel is closed. The last three years of the crossing are the quietest of all, and the people on shift sleep through the nights.', fx: FX({ all: 1 }) } },
  ] });

/* ===== year 41: 82 Eridani (dealt by LF.crossing, after the burn: the world exists now) ===== */
LINES['brn.arrive'] = {
  command: {
    solheim: 'Hail her once an hour until we\'re down, and log every one. I want it on the record that we asked.',
    achebe: 'All right. Keep calling her, every hour, every channel, and if anybody\'s alive aboard that ship I want them to hear a friendly voice before they hear anything else.' },
  engineer: {
    kovacs: 'She\'s not tumbling hard, she\'s settled, so somebody trimmed her before she went quiet. That light isn\'t a beacon, though, it\'s a fault, or it\'s, I don\'t know what it is, it isn\'t her code and it isn\'t anybody\'s.',
    halloran: 'Look at that light, boss. That\'s not a beacon and it\'s not a fault, I\'ve seen plenty of both. Something is switching it.' },
};
add({ id: 'brn.arrive', arc: 'setup', view: 'world', tone: 'crisis', chain: true, play: true, kicker: 'Year 41 out from Earth', title: 'Eighty-Two Eridani',
  scene: ['brn_arrive', 'intro_orbit'],
  setup: s => { const w = s.world; w.planet = 'Barrens'; return {}; },
  text: s => `Year forty-one. The ship wakes all six of you, and then the first of the sleepers, a bank at a time.\n\n82 Eridani is an old orange star, and its fourth world turns below the ship: dun and red, worn flat, dry from pole to pole. Earth's astronomers called it the Blinking World. The colony that went down to it called it Barrens.\n\nThere is something else in orbit. The Persephone, the ship that brought that colony, is two hundred kilometres ahead of you and a little higher, dark from end to end, turning slowly. One running light blinks on her hull, in no pattern the ship knows.\n\n[[machine]] "Hailing the Persephone on every channel. No reply."\n\n${say(s, 'brn.arrive', 'command', 'grim')}\n\n${say(s, 'brn.arrive', 'engineer', 'afraid')}`,
  choices: [
    { label: 'Keep hailing her', note: 'If anyone is alive aboard her, they will hear you.',
      out: { then: s => s.world.siteOpen ? 'setup.site' : 'setup.wake1', text: 'The Ariadne calls the Persephone once an hour, on every channel, and logs each call. The Persephone does not answer. The light on her hull goes on blinking.',
        fx: () => ({ flags: { b_hailed: 1 }, do: s2 => arrived(s2) }) } },
    { label: 'Stop calling. Watch her, and say nothing', note: 'Whatever is aboard her, the Ariadne stays quiet.',
      out: { then: s => s.world.siteOpen ? 'setup.site' : 'setup.wake1', text: 'The radio goes quiet. The Ariadne takes up an orbit a little below the Persephone and watches her, and the light on her hull goes on blinking.',
        fx: () => ({ do: s2 => arrived(s2) }) } },
  ] });
// in orbit and named: what arrive.name used to do
function arrived(s) { const w = s.world; w.catalogue = '82 Eridani e'; w.planet = 'Barrens'; s.arrival = false; LF.orbitChron(s); }

/* ---------- the run: a fixed voyage, a fixed star ---------- */
LF.PREMISES.diverted = { name: 'Diverted', intro: 'Earth sent the Ariadne to 82 Eridani.',
  text: s => `The ${s} was diverted on Earth's order.`, chron: 'Earth diverted the Ariadne from Tau Ceti to 82 Eridani, to find out what had happened to the Persephone colony.',
  report: 'Somebody has pinned the order from Earth in the mess hall, the whole of it, with the station codes. Nobody has written anything under it.' };
const VOYAGE = ['soc.door', 'soc.mould'];   // year 1 and year 2, all six awake: fixed (Lachlan: no more randomizing)
LF.proDeal = function (s) {
  s.pro = { deck: VOYAGE.concat(LF.P1_DECK), i: 0, done: false, fx: { reg: {}, mind: {}, body: {}, native: {}, bonds: [] }, p1: { clues: 0 } };
  return s.pro;
};
// the voyage skips a card whose own when() is false (brn.three comes only after waiting)
LF.proNext = function (s) {
  const P = s.pro; if (!P || P.done || !s.adrift || s.cur) return false;
  while (P.i < P.deck.length) { const id = P.deck[P.i++], st = LF.byId[id]; if (st && st.when && !st.when(s)) continue; LF.fire(s, id); return true; }
  P.done = true; return false;
};
const proYear0 = LF.proYear;
LF.proYear = s => { const id = s.cur && s.cur.id; return YEAR[id] || (proYear0 ? proYear0(s) : null); };
// one star, fixed: 82 Eridani, forty-one years out (the burn has a mid distance's costs)
const adrift0 = LF.makeAdrift;
LF.makeAdrift = function (s) {
  adrift0(s);
  const c = s.adrift.cands[0]; Object.assign(c, { name: 'Barrens', star: '82 Eridani', desig: '82 Eridani e', ly: 19.7, years: 34, j: 0.5, adj: 0 });
};
const ng0 = LF.newGame;
LF.newGame = function (seed) { const s = ng0(seed); s.premise = 'diverted'; LF.proDeal(s); return s; };
// After the burn: no incidents on the way. The ship is in orbit over Barrens.
LF.crossing = function (s) { s.arrival = true; LF.fire(s, 'brn.arrive'); };
// What the crossing decided, kept where the rest of the game can read it.
const land0 = LF.land;
LF.land = function (s) { const r = land0(s); const Q = s.pro && s.pro.p1;
  if (Q) { s.flags.b_told = Q.told || 'seniors'; s.flags.b_clues = Q.clues || 0; s.flags.b_roster = Q.roster || 'rotate'; s.flags.b_reported = Q.reported || 'short'; if (Q.woke) s.flags.b_woke = 1; if (Q.deaf) s.flags.b_deaf = 1; }
  return r; };
})();

/* What each card asks (js/asks.js, DESIGN.md "What the card asks"). */
if (LF.BARRENS) Object.assign(LF.ASK, {
  'brn.order': 'Does the ship turn for 82 Eridani with all six told now, or with the other four left asleep?',
  'brn.tapes': 'How much of the traffic from Barrens do the officers on shift hear?',
  'brn.roster': 'How are the officers paired for the long shifts?',
  'brn.answer': 'What is done about the officer who answers the tapes at night?',
  'brn.bank': 'Is pod C-31 opened now, or is bank C sealed while you wait for whoever it is?',
  'brn.three': 'Is the hatch opened, or held shut?',
  'brn.supper': 'Is the supper tape cut, or is supper moved?',
  'brn.company': 'Does the woken sleeper stay awake, or go back into the cold?',
  'brn.earth': 'What goes in the reports to Earth from now on?',
  'brn.chorus': 'Does someone keep listening on the silent channel?',
  'brn.arrive': 'Does the ship keep hailing the Persephone?',
});

/* For the sim: the voyage-out cards Barrens does not deal, the random crossing incidents and the naming card can never come. */
if (LF.BARRENS && LF.barrensOut) { const out0 = LF.barrensOut, keep = new Set(['soc.door', 'soc.mould']);
  LF.barrensOut = st => out0(st) || (/^soc\./.test(st.id) && !keep.has(st.id)) || /^voy\./.test(st.id) || st.id === 'arrive.name'; }
