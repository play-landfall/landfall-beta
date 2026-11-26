/* Landfall — Barrens, Part 2 begins: arrival (the barrens branch; STORY-ARCS.md section 2.1, BUILD-PLAN.md stage 3). Rules and
   cards; no DOM, runs under Node. Nothing here is random.

   In orbit, after brn.arrive:
     brn.board    board the Persephone, or go straight down.
     brn.aboard   (a look) what the boarding party sees: her dead crew, a cabin welded shut, the relay torn out by hand, the
                  captain's last line written over and over, and a hold the lamp doesn't reach. Nothing alive is seen. Then the
                  salvage: nothing, fuel and spares, or strip her. Stripping her brings the hold's crates across, and with them,
                  unseen, the Mocker that has slept in her hold for years (s.flags.b_rider: Route A for the Quiet Ship, stage 5).
     then the landing site (setup.site) and the lander, as before.
   On the ground:
     brn.empty    (a look) the old settlement: intact, empty, tables laid for supper, doors barred from the inside. Beside it, in
                  the first months; from the plains, when a party walks the three days to it (cued at the choice of site).
                  Nothing in it says what happened. The radio room, the log and the graves are found later (the Wake).
   Flags: b_boarded, b_salvage (none / parts / all), b_rider (hidden), b_domes (moved in / stripped / left). */
(function () {
'use strict';
if (!LF.BARRENS) return;
const { add } = LF;
const off = (s, seat) => { const p = LF.officer && s.people ? LF.officer(s, seat) : null; return p && p.key ? p.key : (LF.CAST[seat][LF.castPick(s, seat)] || LF.CAST[seat][0]).key; };
const nm = (s, seat) => { const p = LF.officer && s.people ? LF.officer(s, seat) : null; return p ? p.first : (LF.CAST[seat][LF.castPick(s, seat)] || LF.CAST[seat][0]).first; };
const LINES = {};
const say = (s, card, seat, expr) => { const k = off(s, seat), l = LINES[card][seat][k]; return l ? `[[${k}${expr ? '|' + expr : ''}]] "${l}"` : ''; };
const SITE = s => s.world.siteOpen ? 'setup.site' : 'setup.wake1';

/* ---------- in orbit: the Persephone ---------- */
LINES['brn.board'] = { command: {
  solheim: 'She has fuel and parts we can\'t make, and a shuttle if it still flies. Send two across, and have them back inside six hours whatever they find.',
  achebe: 'Here\'s what I want. Two of our people go across, they look, and they come back, and if anything over there feels wrong to them they leave it, and nobody will ask them why.' } };
add({ id: 'brn.board', arc: 'setup', view: 'world', tone: 'pressure', chain: true, kicker: 'In orbit over Barrens', title: 'The Persephone',
  scene: ['brn_board', 'qs_board', 'intro_orbit'],
  text: s => `The Persephone hangs two hundred kilometres ahead, turning slowly, her running light still blinking. She is a ship of the Ariadne's class, a generation older, and her docking collar is the same make.\n\nWhatever she still carries is twenty years cold: fuel, spares, stores, and a shuttle in her bay. Nobody has answered a single hail.\n\n${say(s, 'brn.board', 'command', 'grim')}`,
  choices: [
    { label: s => `Send ${nm(s, 'security')} and ${nm(s, 'engineer')} across`, note: 'Six hours aboard her, and back.',
      out: { then: 'brn.aboard', text: s => `The Ariadne closes to a hundred metres and puts out the collar. ${nm(s, 'security')} and ${nm(s, 'engineer')} cross in suits, with lamps, and a camera feed that you watch from the flight deck.`,
        fx: { flags: { b_boarded: 1 } } } },
    { label: 'Leave her, and go straight down', note: 'Whatever is on her stays on her.',
      out: { then: SITE, text: 'The Ariadne stands off from the Persephone and leaves her turning. The survey turns to the ground.',
        fx: { flags: { b_salvage: 'none' } } } },
  ] });

const ABOARD = [
  { id: 'bridge', x: 28, y: 38, label: 'The bridge', text: 'Four of her crew at their stations, long dead and dried out in the cold, still strapped in. Nobody came to move them.' },
  { id: 'cabin', x: 70, y: 32, label: 'A cabin door', text: 'Welded shut, from the inside. Through the port: three people sitting together on the bunk, holding hands.' },
  { id: 'relay', x: 50, y: 62, label: 'The relay console', text: 'Torn apart. The panels are off and the boards have been pulled out by the handful. It was the last thing on the ship still working.' },
  { id: 'log', x: 15, y: 76, label: 'The captain\'s log', text: 'The last entry reads: Relay off by order. Do not restore it. Under it, in the same hand, the same line again, and again, down the page and onto the next.' },
  { id: 'hold', x: 86, y: 74, label: 'Cargo hold two', text: 'The lamp doesn\'t seem to reach the back of it. The crates in there are the colour of the deck, and there are more of them than the manifest lists.' },
];
LINES['brn.aboard'] = { engineer: {
  kovacs: 'Somebody tore that console out by hand, and I mean tore it, there isn\'t a tool mark on any of it. And the old girl\'s been running on her own for twenty years with nobody aboard to tell her to stop.',
  halloran: 'Boss, that relay wasn\'t cut, it was ripped out, panels and all, and there\'s not a tool mark on the fucking thing! What does that? Who does that with their hands?' } };
add({ id: 'brn.aboard', arc: 'setup', view: 'world', tone: 'crisis', chain: true, kicker: 'Aboard the Persephone', title: 'Twenty Years Cold',
  scene: ['brn_aboard', 'qs_silent', 'intro_bridge'],
  look: { pic: ['brn_aboard', 'qs_silent', 'qs_board'], need: 3, prompt: 'The Persephone, by suit lamp', intro: 'You see what their helmet cameras see. Tap what you want them to look at.', done: 'Bring them home', sound: 'cold_room', spots: ABOARD },
  text: (s, c) => `Six hours aboard the Persephone. Her air is gone, her lights are out, and frost has grown over everything inside her in long feathers.${(c.found || []).includes('hold') ? `\n\n${nm(s, 'security')} won't go into cargo hold two, and says so, and can't say why.` : ''}\n\n${say(s, 'brn.aboard', 'engineer', 'afraid')}\n\nWhatever comes across has to come now, before the Ariadne goes into her landing orbit.`,
  choices: [
    { label: 'Take her fuel and spares', note: 'A flight\'s fuel and a crate of parts. Quick, and nothing else.',
      out: { then: SITE, text: s => `${nm(s, 'engineer')} pumps her tanks across and fills one crate from her stores. The collar closes, and the Persephone goes on turning behind you.`,
        fx: { parts: 8, flags: { b_salvage: 'parts' }, do: s2 => { s2.fuel = (s2.fuel || 0) + 1; } } } },
    { label: 'Strip her: fuel, spares, her stores and her shuttle', note: 'Everything worth having. A day of loading, crates from every hold.',
      out: { then: SITE, text: s => `It takes a day. Fuel, spares, plate, sealed stores, and her shuttle, flown across on its own engines and docked to the Ariadne's spare collar. The crates from cargo hold two come over last, on the loader, and nobody has to go in there to fetch them.`,
        fx: { parts: 14, mat: 60, food: 600, flags: { b_salvage: 'all', b_rider: 1 }, do: s2 => { s2.fuel = (s2.fuel || 0) + 2; } } } },
    { label: 'Take nothing, and seal her', note: 'Leave the dead where they are.',
      out: { then: SITE, text: 'The boarding party comes back with nothing but the camera record. The collar is sealed, and the Persephone goes on turning with her crew aboard.',
        fx: { flags: { b_salvage: 'none' } } } },
  ] });

/* ---------- on the ground: the old settlement ---------- */
const EMPTY = [
  { id: 'door', x: 22, y: 50, label: 'A dome door', text: 'Barred, from the inside. The bar is on your side of the door now, because you came in through the roof hatch, and there is nobody in the dome.' },
  { id: 'table', x: 52, y: 66, label: 'The mess table', text: 'Laid for supper: forty bowls, a spoon in each, a fine red dust in all of them. The pot is still on the stove.' },
  { id: 'bunks', x: 78, y: 42, label: 'The bunk room', text: 'Every bed made. Every pair of boots lined up underneath, laces tucked in. All of the boots.' },
  { id: 'fields', x: 88, y: 80, label: 'The fields', text: 'Gone to wiregrass, waist high. The irrigation lines run out into it in straight rows, and stop.' },
];
LINES['brn.empty'] = { crew: {
  estrada: 'They laid the tables for supper and never sat down to it. I\'d like us to clear them before anybody eats near here, and say something over them while we do.',
  waititi: 'Forty bowls, my friend, forty, and the spoons still in them. Somebody cooked for all those people and nobody came to eat it, and I can\'t, no. I\'m not making a joke about this one.' } };
add({ id: 'brn.empty', view: 'world', arc: 'episode', tone: 'pressure', title: 'The Old Settlement', kicker: 'The Persephone colony',
  scene: ['brn_empty', 'landfall_site'], max: 1,
  when: s => !!s.world && !!s.world.zone && s.flags.b_site && !s.flags.b_domes,
  look: { pic: ['brn_empty', 'built_housing', 'landfall_site'], need: 3, prompt: 'The Persephone colony', intro: 'Tap what you want to look at.', done: 'Go back', sound: 'wind', spots: EMPTY },
  text: s => `${s.flags.b_site === 'far' ? `The party that walked three days to the Persephone colony has come back` : `The first party to go up the rise to the Persephone colony has come back`}. It is standing. There was no fire there and no fight. There is nobody there at all, alive or dead.\n\n${say(s, 'brn.empty', 'crew', 'grieving')}`,
  choices: [
    { label: 'Move into the domes', note: 'Roofs, beds and wells for everyone, now. Whatever emptied them knows the way in.', show: s => s.flags.b_site !== 'far',
      out: { text: 'The tables are cleared and the bowls washed and stacked. People move into the domes in families, and keep their voices down in them for no reason anybody can give.',
        fx: { mat: 40, flags: { b_domes: 'moved' }, morale: -3 } } },
    { label: 'Strip it for what you can carry', note: 'Plate, pumps and tools for the colony. A month of cutting and hauling on the rise, loud, and after dark too.',
      out: { text: 'The parties strip it over a month: plate, cable, pumps, tools, a stove. Nobody takes anything from the bunk room.',
        fx: s => ({ mat: 30, parts: 5, flags: { b_domes: 'stripped', b_loud: s.day } }) } },
    { label: 'Leave it as it is', note: 'Nothing from it, and nobody up there. Whatever is in it stays out of reach, and so does everything it could have given.',
      out: { text: 'The parties come away and shut the roof hatch behind them. Nobody goes back up the rise for a while.',
        fx: { morale: 2, flags: { b_domes: 'left' } } } },
  ] });


/* ---------- the way up: Route A's fuse and Route B's signs (STORY-ARCS 2.3; the Quiet Ship opens after both dreads, js/barrens.js) ----------
   Route A: the crates from the Persephone's hold two are aboard the Ariadne (s.flags.b_rider). Once a month the ship's log
   notes a small thermal anomaly in hold three, and nobody needs to read it; around the second year the ship's mind reports
   it (brn.hold). Venting the hold loses the salvage and takes the rider with it (b_rider 0): the ship can still be reached the
   other way. Route B: with no rider, once the lander has flown up since the Wake began, a pod comes back with its seal cut
   from the inside (brn.pod). Neither card can stop the Quiet Ship: it only decides how much the colony saw coming. */
const tick0 = LF.threadTick;
LF.threadTick = function (s) {
  const r = tick0(s);
  if (s.world && s.world.zone && s.flags.b_rider && !(s.threads && s.threads.quiet) && s.day % LF.MONTH === 3 && s.day > 30)
    LF.log(s, 'Ship\'s log, read out on the evening call: a minor thermal anomaly in hold three, within limits.');
  // the two cards come when their time does, not when the deck happens to deal them
  if (s.world && s.world.zone && !(s.threads && s.threads.quiet)) {
    if (s.flags.b_rider && s.day >= 2 * LF.YEAR && !s.flags.b_holdc) { s.flags.b_holdc = s.day; LF.cue(s, 'brn.hold', 0, 10); }
    const w = s.threads && s.threads.wake;
    if (!s.flags.b_rider && w && w.phase !== 'latent' && s.flags.noise_fly && s.day - s.flags.noise_fly < 40 && !s.flags.b_podc) { s.flags.b_podc = s.day; LF.cue(s, 'brn.pod', 0, 8); } }
  return r;
};
LINES['brn.hold'] = { engineer: {
  kovacs: 'Hold three is where we put the Persephone\'s crates, and hold three is the one that keeps running warm. I don\'t like a coincidence I can\'t put a spanner on.',
  halloran: 'It\'s hold three, boss, every bloody month, and hold three is where the Persephone\'s crates went! I want somebody up there with a lamp, or I want that hold opened to space.' } };
add({ id: 'brn.hold', view: 'ship', arc: 'episode', tone: 'pressure', title: 'Hold Three', scene: ['brn_hold', 'ship_cargo'], max: 1,
  when: s => !!s.flags.b_rider && s.day >= 2 * LF.YEAR && !(s.threads && s.threads.quiet),
  text: s => `The ship's mind has flagged it at last, in its monthly report: hold three has run a quarter of a degree warm for every month since landfall. It is still within limits. The hold holds the crates that came across from the Persephone.

${say(s, 'brn.hold', 'engineer', 'grim')}`,
  choices: [
    { label: 'Send someone up to search the hold', note: 'A flight, and an officer in hold three with a lamp.', fly: 1,
      out: { text: 'The search takes a day. Hold three is cold where the crates are and warm where they aren\'t, and the crates are the colour of the deck, and there are more of them than were loaded. Nothing moves in the lamp. The officer who searched it asks to come straight back down, and does.',
        fx: { fly: 1, morale: -1, flags: { b_hold_seen: 1 } } } },
    { label: 'Vent hold three to space', note: 'Everything from the Persephone goes with it.',
      out: { text: 'Hold three is opened to vacuum for an hour and closed again. The crates from the Persephone tumble out into the dark behind the Ariadne. The anomaly is gone from the next month\'s report.',
        fx: { mat: -40, parts: -8, flags: { b_rider: 0, b_vented: 1 } } } },
    { label: 'Log it, and leave it', note: 'It is within limits.',
      out: { text: 'The note goes into the log. The next month\'s report has it again, a quarter of a degree warm, within limits.', fx: {} } },
  ] });
add({ id: 'brn.pod', view: 'ship', arc: 'episode', tone: 'pressure', title: 'The Seal', scene: ['brn_pod', 'ship_cargo'], max: 1,
  when: s => !s.flags.b_rider && !!(s.threads && s.threads.wake && s.threads.wake.phase !== 'latent') && s.flags.noise_fly && s.day - s.flags.noise_fly < 40 && !(s.threads && s.threads.quiet),
  text: s => `A cargo pod came back down from the Ariadne on the last run with its inner seal cut. The cut runs round the inside of the lid, neat, the way you'd open a tin from inside it. The lander's mass log for the run up says it carried sixty kilos more than its manifest.

Something went up with the last load, and the pod came back empty.`,
  choices: [
    { req: s => LF.canFly(s), reqText: s => (LF.flyWhy && LF.flyWhy(s)) || 'The lander cannot fly', label: 'Send four up to search the Ariadne\'s cargo decks', note: 'A flight now, and four of the watch in the dark between the racks. If it is up there, they may find it first.', info: [['yield', 'Knowing what went up'], ['danger', 'The four, in the dark']],
      out: { text: 'The four go up with lamps and search the cargo decks rack by rack for two days. In the lee of a coolant pipe they find a nest of packing foam, pressed into a long shape and still warm. Nothing else. They come down and nobody asks them to go back.', fx: s => ({ fly: 1, morale: -2, flags: { b_inspect: 1 }, do: s2 => { s2.flags.b_clues = (s2.flags.b_clues || 0) + 1; } }) } },
    { label: 'Ground the lander until the colony knows more', note: 'Whatever went up has nowhere further to go. The ship and everyone asleep on her are on their own.', info: [['yield', 'Nothing more goes up or comes down'], ['danger', 'The ship, and the sleepers']],
      out: { text: 'The lander is pulled into the shed and the fuel lines are capped. Up on the Ariadne the banks are left to the ship, and the radio room listens to her every pass for anything wrong.', fx: { flags: { b_flyless: 1 } } } },
    { label: 'Say nothing, and watch who goes near the lander', note: 'It came from the ground. Somebody here opened that pod, or helped it.', info: [['yield', 'Whoever did it, watched'], ['later', 'Who the colony decides it was']],
      out: { text: 'The pad is watched at night by two people nobody is told about. They see a lot of people go near the lander, for a lot of reasons. By the month\'s end half the colony has been seen there, and the other half has heard who.', fx: { tension: 8, flags: { b_podblame: 1 } } } },
  ] });
if (LF.ASK) Object.assign(LF.ASK, {
  'brn.hold': 'What is done about the warm hold on the Ariadne?',
  'brn.pod': 'What is done about the pod that came back cut open from the inside?',
});

/* ---------- wiring ---------- */
// brn.arrive goes on to the boarding question, not straight to the site
{ const st = LF.byId['brn.arrive']; if (st) for (const ch of st.choices) ch.out.then = 'brn.board'; }
// the old settlement is cued once the site is chosen: in the first months beside it, later from the plains
const pick0 = LF.pickSite;
LF.pickSite = function (s, si) { const open = s.world && s.world.siteOpen; pick0(s, si); if (open) LF.cue(s, 'brn.empty', si ? 60 : 12, si ? 90 : 25); };

if (LF.ASK) Object.assign(LF.ASK, {
  'brn.board': 'Does a party board the Persephone, or does the ship go straight down?',
  'brn.aboard': 'What comes across from the Persephone before the landing?',
  'brn.empty': 'What does the colony do with the old settlement?',
});
})();
