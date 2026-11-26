/* Landfall — Barrens: the story deck (the `barrens` branch). Rules only, no DOM, runs under Node. Loaded last of the Barrens
   files.

   Lachlan, 2026-11-26: "fuck off all that stuff about harvests and grain and what to build. If a player gets a dilemma card
   it needs to be IMPORTANT. It needs to have MEANING... they should ALL be about that now." So on Barrens:
   - Only the story is dealt (LF.dealOK, read by the director in js/core.js): the crossing, the arrival, the two at the
     table, the Wake, the Quiet Ship, the years between and Part 3 (STORY). Nothing else comes as a card: no harvest, no
     build questions, no generated dilemmas, no council, no officers' health, no other world's threads or the Limits' own
     cards. The year's recap still comes (it asks nothing). A party the player sent out can still come back with a card.
   - What those cards used to ask is done for the colony:
     the harvest goes straight into the store with a line (LF.harvestCard);
     the yard starts the next build itself when it is idle (AUTO_BUILD; the player can still give yard orders);
     a finished build is a line, not a card (LF.fireDone);
     every officer and every system still aboard comes down at landfall, on the lander's first runs.
   With nothing else in the deck, a month with no story card in it passes without one. */
(function () {
'use strict';
if (!LF.BARRENS) return;
const MONTH = LF.MONTH;
const STORY = /^(brn|ext|wak|qs|tsh|hsm|fal)\./;
const KEEP = new Set(['recap', 'setup.site', 'setup.wake1', 'setup.load', 'soc.door', 'soc.mould', 'land.eulogy']);
LF.dealOK = (s, st) => STORY.test(st.id) || KEEP.has(st.id) || (st.away && s.away && s.away.length > 0) || /^away\./.test(st.id);
LF.storyDeck = st => STORY.test(st.id) || KEEP.has(st.id);
// the sim's never-fired line leaves out everything Barrens no longer deals
const NEVER = new Set(['land.eulogy', 'qs.lights', 'qs.air', 'qs.glass', 'qs.second', 'qs.guests', 'qs.cups', 'qs.answer', 'qs.kettle', 'qs.collar', 'qs.nest', 'qs.tune', 'qs.keeper', 'qs.two', 'qs.tell']);   // the Quiet Ship's other truths, and nobody lost on a crossing that has no incidents
{ const out0 = LF.barrensOut; LF.barrensOut = st => (out0 && out0(st)) || !LF.storyDeck(st) || NEVER.has(st.id) || !!st.f; }
// no generated dilemmas: the frames are another game's
if (LF.genCandidates) LF.genCandidates = () => [];
// the harvest goes in with a line
LF.harvestCard = () => false;
// no build questions; a finished build is a line
LF.planDue = () => false; LF.firePlan = () => false;
// no seat-on-the-lander or cradle questions on a flight: everyone and everything comes down at landfall (below)
LF.holdForFlight = () => false;
LF.fireDone = function (s) { const id = s.pend; s.pend = null; if (!id || !LF.PROJECTS[id]) return; s.lastBuilt = { id, d: s.day }; LF.log(s, `${LF.projName(s, id)}: finished.`, 'event'); };
// the yard starts its own next build when it is idle
const AUTO_BUILD = true;
{ const tick0 = LF.threadTick; LF.threadTick = function (s) { const r = tick0(s);
  if (AUTO_BUILD && s.world && !LF.aloft(s) && s.day % MONTH === 0 && !s.project && !(s.bq && s.bq.length) && LF.yardList && LF.yardStart) {
    const id = LF.yardList(s).find(k => !LF.yardWhy(s, k, 'build')); if (id) LF.yardStart(s, id, 'order'); }
  return r; }; }
// The officers left aboard at the first flight come down one a run, in seat order, as the first-flight card promises (second
// pass, 2026-11-27: with the seat question off they never came down at all, and were still aboard twenty years on). Not
// while she is dark: a flight to a dark ship is the Quiet Ship's own.
{ const run0 = LF.flyRun; LF.flyRun = function (s, chips) { const n = run0(s, chips);
  if (!s.flags.qs_dark) { const p = LF.SEAT_ORDER.map(k => LF.inOrbit(s).find(x => x.seat === k)).find(Boolean);
    if (p) { LF.bringDown(s, p); if (chips) chips.push({ t: `${p.first} down from the ship`, good: true }); } }
  return n; }; }
// everyone and everything aboard comes down on the lander's first runs
{ const land0 = LF.land; LF.land = function (s) { const r = land0(s);
  for (const p of s.people) if (p.alive && p.orbit && p.seat && LF.bringDown) LF.bringDown(s, p);
  for (const k in s.machines || {}) { const m = s.machines[k]; if (m && m.up && !m.lost) m.up = false; }
  return r; }; }
})();
