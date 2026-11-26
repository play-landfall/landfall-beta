/* Landfall — thread: One Too Many (the barrens branch; STORY-ARCS.md section 2.3, dread 1; BUILD-PLAN.md stage 4). A dread
   that opens in the first months, at the same time as the Wake (js/thread-wake.js), and runs beside it. Dealt only on Barrens.

   What the colony sees: the rations come out two short, then two bunks that should be cold are warm in the morning. Then the
   radio is smashed, carefully, so the ground cannot reach the Ariadne until the next lander goes up. Floodlights are cut and a
   generator is fouled. Somebody is inside the wire who should not be, and at the same time people are being taken in the night
   (the Wake). The obvious suspects are the two at the table, and that is the trap.

   The truth is fixed (Lachlan, 2026-11-26): two Persephone survivors, the hill people's best, the two whole and well enough to
   pass for colonists, sent down to make the newcomers shut up. Their parents' stories say the radio, the lights and the machines
   wake the Wirrakanya, the demon of the plains. The stories are right.

   Phases: latent, count (the rations and the bunks), radio (the sabotage), hunt (the faces at the mess, a look), then after.
   Endings (t.end, s.flags.b_extra): heard (caught alive and listened to; they lead the colony towards the Quiet), silenced
   (hunted down; the only people who knew are gone, and the colony blames them for the taking), fled (they get away), stayed
   (never found; the colony went dark anyway, and the sabotage stopped).
   The offering (ext.offer): once, at the turn of the dry season, a colonist is found staked out on the plain. It is a human act,
   the Quiet's, and the clue that the two at the table are not the only people out there. */
(function () {
'use strict';
const ID = 'extra', T = s => LF.T(s, ID);
const P = (s, seat) => LF.officer(s, seat);
const nm = (s, seat) => { const p = P(s, seat); return p ? p.first : LF.seatWord ? LF.seatWord(s, seat) : 'the watch'; };
const Nm = (s, seat) => { const n = nm(s, seat); return n.charAt(0).toUpperCase() + n.slice(1); };
const say = (s, seat, L, expr) => { const p = P(s, seat); if (!p || !p.key || (LF.seatState && LF.seatState(s, seat) !== 'here') || !L[p.key]) return ''; return `[[${p.key}${expr ? '|' + expr : ''}]] "${L[p.key]}"`; };
const para = (...a) => a.filter(Boolean).join('\n\n');
const noise = s => s.noise || 0;
const finish = (s, t, end, chron) => { s.flags.b_extra = end; LF.endThread(s, ID, end, chron); };

LF.thread({ id: ID, name: 'One Too Many', view: 'colony', dread: true,
  fits: () => (LF.BARRENS ? 1 : 0),
  called: (s, t) => t.phase !== 'latent' ? 'the two at the table' : null,
  roll: () => ({ is: 'two' }),   // fixed: two Persephone survivors (see the header)
  sig: t => t.truth.is,
  start: (s, t) => { Object.assign(t, { at: t.at || LF.sri(s, 10, 25), did: {}, smash: 0, short: 0 }); },
  tick: (s, t) => {
    // the offering comes once, at the turn of the dry season, whether or not the two have been dealt with
    if (!s.flags.b_offer && !t.offerCued && s.day >= t.at + 150) { t.offerCued = s.day; LF.cue(s, 'ext.offer', 0, 20); }
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'count'); LF.cue(s, 'ext.count', 0, 3); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id];
    if (t.phase === 'count' && since('ext.count') >= 20) { LF.phase(s, ID, 'radio', 'The colony\'s radio was found smashed, carefully, by someone inside the wire.'); LF.cue(s, 'ext.radio', 0, 3); }
    else if (t.phase === 'radio' && since('ext.radio') >= 25) { LF.phase(s, ID, 'hunt'); LF.cue(s, 'ext.faces', 0, 4); }
    // two more mouths, every day, until they are found or the colony goes quiet
    if (s.day % 10 === 0 && !t.dark) { const f = t.did.lock ? 4 : 12; s.res.food = Math.max(0, s.res.food - f); t.short += f; }
    // the sabotage: what is loud gets broken
    if ((t.phase === 'radio' || t.phase === 'hunt') && s.day % 10 === 5 && !t.dark && LF.srand(s) < Math.min(0.8, 0.25 + noise(s) / 60) * (t.did.search ? 0.7 : 1)) {
      t.smash++; s.res.parts = Math.max(0, s.res.parts - 1);
      LF.log(s, LF.spick(s, ['A floodlight on the north wire was found this morning with its cable cut, neatly, and the cut end taped so nobody would be hurt.',
        'The generator on the east row was fouled in the night: sand in the intake, a cupful, poured carefully.',
        'Somebody took the speaker out of the mess hall\'s wall in the night, and left the screws in a neat row on the table.',
        'The work lamps at the pumps have had their bulbs taken out, every one, and the bulbs left in a box by the door.']));
    }
    if (s.day % 5 === 0) {
      LF.emit(s, 'suspicion', 'th.extra', t.phase === 'count' ? 25 : 40, 8, 'somebody inside the wire is eating at the table and breaking what makes a noise');
      if (t.phase !== 'count') LF.emit(s, 'unexplained', 'th.extra', 30, 8, 'the radio and the lights are being broken by someone nobody can name');
    }
  },
  press: (s, t, Pr) => { if (t.end || t.phase === 'latent') return; Pr.labor -= t.did.muster ? 0.03 : 0.01; if (t.dark) { Pr.labor -= 0.05; Pr.morale -= 0.01; } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony' }, st));

/* ===== count: one too many ===== */
B('count', { id: 'ext.count', tone: 'pressure', w: 5, title: 'One Too Many', scene: ['ext_count', 'built_housing'],
  text: s => para(`${Nm(s, 'crew')} keeps the ration book, and it has come out wrong three days running: two portions more taken from the pot than there are people to eat them. Then a hauler on the night rota finds two bunks in the second row warm at dawn, bunks that belong to two colonists still asleep up on the Ariadne.`,
    say(s, 'crew', { estrada: 'Two portions, every day, and nobody\'s owned up to them, which isn\'t like our people. I don\'t mind the food. I mind that somebody\'s at our table and won\'t say who.',
      waititi: 'Two extra bowls, my friend, every night, scraped clean, and I know everybody who eats at my pot, I know their faces, I know who wants seconds. I don\'t know these two. That\'s what\'s keeping me up.' }, 'grim')),
  choices: [
    { label: 'Count everyone at lamp-down, by name', note: 'A muster every night. Slow, and everybody hates it.',
      out: { text: 'The muster is called at lamp-down and every name is read and answered. The count comes out right every night, which nobody can explain, and the pot still comes out two short.', fx: s => ({ morale: -2, do: s2 => { T(s2).did.muster = true; } }) } },
    { label: 'Lock the stores, and set a guard on them', note: 'Whoever it is goes hungrier.',
      out: { text: 'The stores are locked and the key is kept on a cord round one neck. The pot still comes out a little short, but less, and on the third night the guard hears somebody try the store door, gently, and go away.', fx: s => ({ do: s2 => { T(s2).did.lock = true; } }) } },
    { label: 'Turn out every bunk and bag tonight', note: 'Everyone\'s things on the floor in front of everyone. Whoever it is will know they have been noticed.',
      out: { text: 'Every bunk is stripped and every bag emptied onto the floor, row by row, with its owner watching. Nothing turns up but old grudges, and, in the bottom of a bag that nobody will own, a Persephone shoulder patch with the stitches picked out. The pot comes out right for a week. Then it is two short again.', fx: s => ({ morale: -4, do: s2 => { T(s2).did.search = true; s2.flags.b_clues = (s2.flags.b_clues || 0) + 1; } }) } },
  ] });

/* ===== radio: the sabotage ===== */
B('radio', { id: 'ext.radio', tone: 'crisis', w: 6, title: 'The Radio', scene: ['ext_radio', 'built_soillab'],
  text: s => para(`The radio set in the signals hut was smashed in the night. It was not done in a temper: the valves were crushed one at a time, the board was lifted out and snapped across, and the handset cord was cut and the cut end taped. Nothing else in the hut was touched.\n\nUntil it is mended the ground cannot talk to the Ariadne. The only way to reach the ship is to send the lander up.`,
    say(s, 'engineer', { kovacs: 'Whoever did this knew exactly what they were looking at, because they broke the four parts I can\'t make and left the rest. That\'s not a vandal, that\'s somebody who\'s done it before.',
      halloran: 'Boss, they crushed the valves one at a fucking time! Who does that? You don\'t smash a set like that because you\'re angry, you do it because you want it to stay smashed!' }, 'angry')),
  choices: [
    { label: 'Send the lander up to tell the ship', note: 'A flight now. The loudest thing on Barrens.', fly: 1,
      out: { text: 'The lander goes up on a column of fire that lights the whole plain, and comes down again the next day with a spare set from the ship\'s stores. It is the loudest thing that has happened on Barrens for twenty years.', fx: s => ({ fly: 1, flags: { b_lander_up: 1 } }) } },
    { label: 'Rebuild the set from what is left', note: 'Spares, and a week of the engineer\'s time. It may not last.', cost: { parts: 3 },
      out: { text: s => `${Nm(s, 'engineer')} has a set working again in a week. On the tenth night it is smashed again, the same way, and the new valves are crushed in a row on the bench.`, fx: s => ({ do: s2 => { T(s2).did.rebuilt = true; T(s2).smash++; } }) } },
    { label: 'Leave it off for now', note: 'No word to the ship. The colony goes quieter.',
      out: { text: 'The signals hut is shut. For the first time since landfall the colony has no voice at all beyond the wire, and some people sleep better for it, and say so, and can\'t say why.', fx: s => ({ do: s2 => { T(s2).did.off = true; s2.flags.b_radio_off = 1; } }) } },
  ] });

/* ===== hunt: the faces at the mess (a look) ===== */
const FACES = [
  { id: 'bench', x: 70, y: 46, label: 'The end of the far bench', text: 'Two people eating fast with their heads down, in jumpsuits of a cut nobody else in the hall is wearing, worn soft and patched at the knees.' },
  { id: 'patch', x: 82, y: 34, label: 'A shoulder patch', text: 'It has been unpicked, but the stitch holes are still there in the cloth, and they spell a name. PERSEPHONE.' },
  { id: 'hands', x: 62, y: 62, label: 'Their hands', text: 'Cracked, burned, and on one of them two fingers are gone at the knuckle and long healed. Nobody at the table has hands like that.' },
  { id: 'door', x: 18, y: 40, label: 'The yard door', text: 'When you look back at the far bench it is empty, two bowls scraped clean, and the door to the yard is swinging.' },
];
B('hunt', { id: 'ext.faces', tone: 'crisis', w: 7, title: 'Faces at Supper', scene: ['ext_faces', 'soc_jar'],
  look: { pic: ['ext_faces', 'soc_jar'], need: 3, prompt: 'The mess hall, at supper', intro: 'Somebody at supper is not one of yours. Tap what you want to look at.', done: 'Get up', sound: 'mess_floor', spots: FACES },
  text: (s, c) => para(`Supper in the mess hall, two hundred at the long tables.${(c.found || []).includes('patch') ? ' The two at the end of the far bench came off a ship that went quiet twenty years ago.' : ' Two at the end of the far bench are not anybody you know.'}`,
    say(s, 'security', { dahl: 'Two of them, and they\'ve been eating our bread for months, and they walked out of the door with me looking straight at them. I want them tonight, before they decide to stop being polite.',
      zulu: 'I\'d ask for the watch and an hour, and nobody hurt, please. They had every chance to hurt someone in here and they didn\'t, and I would like to know why before anybody raises a rifle.' }, 'angry'),
    'People are being taken past the wire at night, and half the colony already has a name for who is doing it.'),
  choices: [
    { label: 'Hunt them down tonight', note: 'Every rifle and every lamp. Whatever it takes.', dark: true,
      out: { text: 'The watch and forty volunteers turn out with lamps and rifles, and run them down in the dry creek before midnight. One of them is shot running and dies in the creek bed. The other is brought in with a broken arm and does not say a word, not one, and is dead in the lock-up by the end of the week of a fever nobody treated. Nobody has been taken past the wire since, people say, and in a month it isn\'t true.',
        fx: s => ({ stain: ['ex_hunt', 2], morale: 3, do: s2 => finish(s2, T(s2), 'silenced', 'The two strangers at the colony\'s table were hunted down. Neither of them said a word.') }) } },
    { label: 'Close the gates at lamp-down, and count everyone in', note: 'Catch them alive, if they come back for supper.',
      test: { base: 50, mods: [LF.h.R('security', 10), LF.h.If(s => { const t = T(s); return !!(t && t.did.muster); }, 10, 'The muster already runs every night'), LF.h.If(s => { const t = T(s); return !!(t && t.did.search); }, -10, 'They know they were looked for')] },
      ok: { text: 'They come back for supper two days later, and the gates are shut behind them. They don\'t fight. They sit down on the floor of the yard together, a man and a younger woman, in Persephone jumpsuits worn soft, and wait for whatever happens next.',
        fx: s => ({ do: s2 => { finish(s2, T(s2), 'heard', 'Two Persephone survivors were taken alive at the gate, and talked.'); LF.cue(s2, 'ext.speak', 2, 6); } }) },
      bad: { text: 'They don\'t come back. Two bowls stay clean on the far bench, and the radio stops being broken, and somebody finds the jumpsuits folded on a rock a kilometre past the wire.',
        fx: s => ({ do: s2 => finish(s2, T(s2), 'fled', 'The two strangers got away into the hills.') }) } },
    { label: 'Leave them be, and go dark the way they want it', note: 'Lights out at night, radios off, machines on the day shift only. A slow, quiet colony.',
      out: { text: 'The lamps go out at dusk and stay out. The radio stays off. The generators run on the day shift only, and the colony learns to work in the light and sleep in the dark. Nobody catches the two at the far bench. After a month nobody sees them at all, and the ration book comes out right.',
        fx: s => ({ morale: -3, do: s2 => { const t = T(s2); t.dark = true; s2.flags.b_dark = 1; finish(s2, t, 'stayed', 'The colony went dark, the way the strangers at its table wanted, and the strangers were never seen again.'); } }) } },
  ] });

/* ===== heard: what they say (after, when caught alive) ===== */
add0();
function add0() {
  LF.add({ id: 'ext.speak', view: 'colony', arc: 'th.extra', tone: 'crisis', chain: true, title: 'What They Say', scene: ['ext_speak', 'soc_jar'],
    when: s => s.flags.b_extra === 'heard' && !s.flags.b_heard,
    text: s => para('The two are kept in the clinic\'s back room, fed and watched. The man does the talking, slowly, in an accent a generation old.',
      '[[unknown:The older one]] "Turn it off. All of it, the lights and the engines and the radios. You\'re calling it, you\'ve been calling it since the day you came down, and it\'s started to answer."',
      '[[unknown:The older one]] "Our mothers called it the Wirrakanya. It sleeps when the plain is quiet, and you are not quiet. You were never quiet, any of you, and they weren\'t either, and we were children, and we watched."',
      say(s, 'doctor', { nakamura: 'He\'s not mad and he\'s not lying, I\'ve sat with enough frightened people to know the difference. Whatever took their families, they believe every word of this, and they walked into our camp knowing we might shoot them.',
        brandt: 'Oh, he\'s quite sane. That\'s rather the problem. A madman I could treat, and a liar I could ignore, but a frightened man who has been right about something for twenty years is a much harder case.' }, 'grim')),
    choices: [
      { label: 'Believe them: go dark', note: 'Lights out at night, radios off, machines on the day shift only.',
        out: { text: 'The lamps go out at dusk. The radio stays off. The two watch it happen from the clinic window, and the younger one cries, once, and then asks to be let go home.', fx: s => ({ morale: -3, do: s2 => { s2.flags.b_heard = 'dark'; s2.flags.b_dark = 1; } }) } },
      { label: 'Let them go home, and follow them', note: 'Three days into the hills, to wherever they came from.', send: { n: 4, days: [24, 36], danger: 2, to: 'the hills the strangers came from' },
        out: { text: 'The two are walked to the gate at first light and let go. Four of the watch follow at a distance, with water for a week. The two never once look back to see if they are being followed.', fx: s => ({ do: s2 => { s2.flags.b_heard = 'followed'; s2.flags.b_quiet_found = 1; } }) } },
      { label: 'Keep them, and make them say everything', note: 'Where the rest of them are, and how many, and what they want.', dark: true,
        out: { text: 'It takes four days. The man tells everything in the end: the hills, the caves, how many, who rules them and how. The younger one says nothing at all, the whole four days, and when it stops she still won\'t look at anyone.', fx: s => ({ stain: ['ex_press', 2], do: s2 => { s2.flags.b_heard = 'pressed'; s2.flags.b_quiet_found = 1; } }) } },
    ] });
}

/* ===== the offering, at the turn of the dry season (once) ===== */
B(['radio', 'hunt', 'after'], { id: 'ext.offer', tone: 'crisis', w: 4, max: 1, title: 'Staked Out', scene: ['ext_offer', 'aft_carcass'],
  when: (s, t) => !!t.offerCued && !s.flags.b_offer,
  text: s => para(`A field hand went missing from the far rows a week ago, and everyone took it for the night that takes people. A party found her this morning, six kilometres out on the plain, staked down on her back with her face to the sky. She had been given water, and a blanket had been laid over her against the cold.\n\nShe died of the night, not of anything with teeth. Whoever put her there did it carefully, and walked away on human feet.`,
    say(s, 'security', { dahl: 'Rope, stakes and a blanket, and every knot tied properly, so it wasn\'t the thing that sings at the wire, it was people. Somebody out there thinks we owed them one of ours, and they came and took her.',
      zulu: 'I\'d like it noted that she was tied by someone who didn\'t want her to suffer, which is the most frightening thing I\'ve ever had to write. It was people who did this. I\'d ask to be the one who tells her family.' }, 'grieving')),
  choices: [
    { label: 'Bury her, and say she was taken in the night', note: 'The colony is frightened enough.',
      out: { text: 'She is buried with the others, and the story is the one everyone already believed. The party that found her keeps the stakes in a sack under a bunk and says nothing.', fx: s => ({ flags: { b_offer: 'hidden' }, pop: -1 }) } },
    { label: 'Tell the colony what was found', note: 'They have a right to know. They will be afraid of the hills now, too.',
      out: { text: 'The party tells the hall what they found, the stakes and the blanket and the knots. For the first time the colony understands that it is not the only people on Barrens, and it does not sleep better for knowing it.', fx: s => ({ morale: -4, flags: { b_offer: 'told', b_quiet_known: 1 }, pop: -1 }) } },
  ] });

if (LF.DEEDS) Object.assign(LF.DEEDS, {
  ex_hunt: 'the two Persephone survivors run down in the dry creek, and the one taken alive left to die of a fever in the lock-up',
  ex_press: 'four days spent making a frightened man tell everything about his people',
});
if (LF.ASK) Object.assign(LF.ASK, {
  'ext.count': 'What is done about the two extra portions and the warm bunks?',
  'ext.radio': 'With the radio smashed, how does the colony reach the ship?',
  'ext.faces': 'How are the two strangers at supper dealt with?',
  'ext.speak': 'What does the colony do with what the two strangers say?',
  'ext.offer': 'Is the colony told how the missing field hand was found?',
});
})();
