// Review writer for "One Star for Monday" (make.fun).
// Writes a single one-star review of Monday, as if Monday were a
// restaurant, to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered
// iteration. Node 22, zero dependencies, erasable TypeScript only.
//
// The brief: one line, max 25 words, reading like a real one-star
// review — a complaint, a specific detail, the voice of a disappointed
// customer — and funny. A one-star review lands on three things, in
// this order:
//   1. it is unmistakably a restaurant review of Monday (reservation,
//      waiter, table, menu, served, bill — not generic Monday hate);
//   2. it names a specific grievance, a concrete Monday pain
//      translated into restaurant language (cold coffee, the alarm
//      clock at the next table, a side of meetings);
//   3. it turns in the last few words, so the punchline arrives after
//      the complaint has been read straight;
//   4. it holds the deadpan: one star, no winking, no explaining the
//      joke, no exclamation marks doing the work;
//   5. it is tight, one joke told cleanly, with no filler and no
//      second joke crowding the first.
// The scorer below mirrors that brief in the same order. Each candidate
// carries its rubric sub-scores (fit /20, grievance /20, deadpan /20,
// turn /15, tight /15), scored by hand against the brief; the program
// adds the length bonus (+3 at 120 chars or fewer, +1 at 140 or fewer)
// and picks the winner by deterministic argmax: highest score, then
// shortest, then lexicographic.
//
// The winner reviews Monday as a restaurant that loses the booking,
// seats you next to the alarm clock, and serves cold coffee with a
// side of meetings. Every element is a real review trope, every
// detail is a specific Monday pain, and the turn is the side dish.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one line of at most 25 words, deadpan, one joke,
// ending on its sting. No exclamation marks anywhere.

interface Rubric {
  fit: number; // /20 — one-star restaurant review of Monday, not generic hate
  grievance: number; // /20 — specific Monday pain in restaurant language
  deadpan: number; // /20 — holds the deadpan, no wink, no explaining
  turn: number; // /15 — punchline arrives in the last few words
  tight: number; // /15 — one joke, tight, specific, no filler
}

interface Scored {
  text: string;
  rubric: Rubric;
}

const CANDIDATES: Scored[] = [
  // Winner: lost reservation, the alarm clock at the next table, cold
  // coffee with a side of meetings. Three review tropes, three Monday
  // pains, turn on the side dish. 21 words, 116 chars.
  {
    text: "One star. Monday lost my reservation, sat me beside the alarm clock, and served cold coffee with a side of meetings.",
    rubric: { fit: 20, grievance: 19, deadpan: 19, turn: 14, tight: 15 },
  },
  // The waiter takes the weekend, brings the bill early, forgets the
  // rest. The turn is the missing rest.
  {
    text: "One star. The waiter took my weekend away, brought the bill early, and forgot the part where I get to rest.",
    rubric: { fit: 19, grievance: 18, deadpan: 19, turn: 13, tight: 14 },
  },
  // Seated at 7 a.m., lukewarm coffee, charged a full day for half a
  // weekend. The turn is the price.
  {
    text: "One star. Monday seated me at 7 a.m., served lukewarm coffee, and charged me a full day for half a weekend.",
    rubric: { fit: 20, grievance: 18, deadpan: 19, turn: 13, tight: 14 },
  },
  // Ordered a slow morning, delivered rush hour, cold eggs, and an
  // inbox that refills itself. The turn is the refilling.
  {
    text: "One star. I ordered a slow morning and Monday delivered rush hour, cold eggs, and an inbox that never stops refilling.",
    rubric: { fit: 19, grievance: 18, deadpan: 18, turn: 13, tight: 13 },
  },
  // Menu promised a fresh start; the kitchen sent yesterday's worries
  // reheated and a meeting at nine.
  {
    text: "One star. The menu promised a fresh start; the kitchen sent yesterday's worries reheated and a meeting at nine.",
    rubric: { fit: 19, grievance: 17, deadpan: 19, turn: 13, tight: 14 },
  },
  // Monday's special: cold coffee, stale emails, a waiter asking if
  // you are ready to work.
  {
    text: "One star. Monday's special is cold coffee, stale emails, and a waiter who keeps asking if I'm ready to work.",
    rubric: { fit: 19, grievance: 17, deadpan: 18, turn: 12, tight: 14 },
  },
  // Arrived rested, left exhausted; the weekend's fun comes back as a
  // bill you cannot pay.
  {
    text: "One star. Arrived rested, left exhausted; Monday serves the weekend's fun back to you as a bill you cannot pay.",
    rubric: { fit: 18, grievance: 17, deadpan: 18, turn: 13, tight: 13 },
  },
  // Window table taken, seated next to the printer, and the printer
  // is called atmosphere.
  {
    text: "One star. The table by the window was taken, so Monday sat me next to the printer and called it atmosphere.",
    rubric: { fit: 19, grievance: 16, deadpan: 19, turn: 14, tight: 13 },
  },
  // Forgot the order, remembered the deadlines, brought the check
  // before I had sat down.
  {
    text: "One star. Monday forgot my order, remembered my deadlines, and brought the check before I had even sat down.",
    rubric: { fit: 19, grievance: 17, deadpan: 19, turn: 13, tight: 14 },
  },
  // Cold coffee, the toast was Monday, and the manager's special was
  // a meeting nobody ordered.
  {
    text: "One star. The coffee was cold, the toast was Monday, and the manager's special was a meeting nobody ordered.",
    rubric: { fit: 18, grievance: 16, deadpan: 18, turn: 13, tight: 13 },
  },
  // Kitchen closes Friday, opens at dawn, still serves last week's
  // leftovers.
  {
    text: "One star. Monday's kitchen closes at Friday, opens at dawn, and somehow still serves leftovers from last week.",
    rubric: { fit: 18, grievance: 16, deadpan: 18, turn: 12, tight: 13 },
  },
  // Asked for one quiet morning; got a full house, a broken alarm,
  // and no refunds.
  {
    text: "One star. I asked for one quiet morning; Monday brought a full house, a broken alarm, and no refunds.",
    rubric: { fit: 19, grievance: 16, deadpan: 19, turn: 12, tight: 14 },
  },
  // The waiter woke me at six, spilled my weekend on the floor, and
  // blamed the traffic.
  {
    text: "One star. The waiter woke me at six, spilled my weekend on the floor, and blamed the traffic.",
    rubric: { fit: 18, grievance: 16, deadpan: 18, turn: 12, tight: 14 },
  },
  // Motivation served cold, inbox overflowing, the weekend as a dish
  // already sold out.
  {
    text: "One star. Monday served my motivation cold, my inbox overflowing, and the weekend as a dish already sold out.",
    rubric: { fit: 19, grievance: 16, deadpan: 18, turn: 12, tight: 13 },
  },
  // The special is the same every Monday: early alarm, cold coffee,
  // and a meeting about meetings.
  {
    text: "One star. The special today is the same as every Monday: early alarm, cold coffee, and a meeting about meetings.",
    rubric: { fit: 19, grievance: 17, deadpan: 18, turn: 13, tight: 14 },
  },
  // One table, no windows, a speaker playing the alarm on repeat.
  {
    text: "One star. Monday's dining room has one table, no windows, and a speaker playing my alarm on repeat.",
    rubric: { fit: 18, grievance: 15, deadpan: 19, turn: 12, tight: 13 },
  },
  // Booked Sunday, got Monday instead; the host blamed the calendar
  // and kept the deposit.
  {
    text: "One star. I booked Sunday and got Monday instead; the host blamed the calendar and kept my deposit.",
    rubric: { fit: 19, grievance: 16, deadpan: 18, turn: 13, tight: 13 },
  },
  // Chef's special is a cold start, the bread is stale emails, and
  // dessert is Tuesday, maybe.
  {
    text: "One star. The chef's special is a cold start, the bread is stale emails, and dessert is Tuesday, maybe.",
    rubric: { fit: 19, grievance: 16, deadpan: 18, turn: 13, tight: 13 },
  },
  // Ran out of everything except Mondays, then charged extra for the
  // privilege of waiting.
  {
    text: "One star. Monday ran out of everything except Mondays, then charged extra for the privilege of waiting.",
    rubric: { fit: 17, grievance: 15, deadpan: 18, turn: 12, tight: 13 },
  },
  // Soup was the to-do list, main course was traffic, and the waiter
  // never came back.
  {
    text: "One star. The soup was my to-do list, the main course was traffic, and the waiter never came back.",
    rubric: { fit: 19, grievance: 16, deadpan: 18, turn: 12, tight: 14 },
  },
  // Slow service, coffee colder than the welcome, bill before food.
  {
    text: "One star. Monday's service was slow, the coffee was colder than the welcome, and the bill arrived before the food.",
    rubric: { fit: 19, grievance: 15, deadpan: 18, turn: 12, tight: 13 },
  },
  // Opens before dawn, seats you beside your inbox, closes the moment
  // you relax.
  {
    text: "One star. The restaurant opens before dawn, seats you beside your inbox, and closes the moment you relax.",
    rubric: { fit: 18, grievance: 16, deadpan: 18, turn: 13, tight: 13 },
  },
  // Order taken at midnight, served at dawn, every item wrong.
  {
    text: "One star. Monday took my order at midnight, served it at dawn, and got every single item wrong.",
    rubric: { fit: 18, grievance: 15, deadpan: 18, turn: 11, tight: 13 },
  },
  // Appetizer was an alarm, entree was a commute, and the tip was
  // mandatory.
  {
    text: "One star. The appetizer was an alarm, the entree was a commute, and the tip was mandatory.",
    rubric: { fit: 19, grievance: 15, deadpan: 18, turn: 12, tight: 14 },
  },
  // The waiter asked how the weekend was, then billed me for the
  // answer.
  {
    text: "One star. Monday's waiter asked how my weekend was, then billed me for the answer.",
    rubric: { fit: 18, grievance: 15, deadpan: 18, turn: 13, tight: 14 },
  },
  // Special comes with a side of dread and a dessert menu that only
  // lists Tuesday.
  {
    text: "One star. The Monday special comes with a side of dread and a dessert menu that only lists Tuesday.",
    rubric: { fit: 18, grievance: 15, deadpan: 18, turn: 12, tight: 13 },
  },
  // Came for breakfast, served a performance review with a side of
  // existential dread.
  {
    text: "One star. I came for breakfast and Monday served a performance review with a side of existential dread.",
    rubric: { fit: 18, grievance: 16, deadpan: 17, turn: 12, tight: 13 },
  },
  // Health inspector shut the kitchen Friday; Monday reopened it
  // without fixing a thing.
  {
    text: "One star. The health inspector shut the kitchen on Friday; Monday reopened it without fixing a thing.",
    rubric: { fit: 17, grievance: 14, deadpan: 18, turn: 11, tight: 13 },
  },
  // Only dish is the same cold Monday, served weekly, no
  // substitutions allowed.
  {
    text: "One star. Monday's only dish is the same cold Monday, served weekly, with no substitutions allowed.",
    rubric: { fit: 18, grievance: 14, deadpan: 18, turn: 11, tight: 14 },
  },
  // Reservation was for two quiet days; Monday showed up early, ate
  // both, and left the dishes.
  {
    text: "One star. The reservation was for two quiet days; Monday showed up early, ate both, and left the dishes.",
    rubric: { fit: 19, grievance: 17, deadpan: 18, turn: 13, tight: 13 },
  },
];

// ---------------------------------------------------------------- scoring
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function score(c: Scored): number {
  const r = c.rubric;
  const base = r.fit + r.grievance + r.deadpan + r.turn + r.tight;
  const len = c.text.length;
  const bonus = len <= 120 ? 3 : len <= 140 ? 1 : 0;
  return base + bonus;
}

function valid(text: string): boolean {
  // Gate: one line, 1 to 160 characters, not only white space,
  // at most 25 words — the competition limit.
  return (
    text.length >= 1 &&
    text.length <= 160 &&
    text.trim().length > 0 &&
    !text.includes("\n") &&
    wordCount(text) <= 25
  );
}

function pick(): Scored {
  const pool = CANDIDATES.filter((c) => valid(c.text));
  if (pool.length === 0) throw new Error("no valid candidate");
  let best = pool[0];
  for (const c of pool.slice(1)) {
    const a = score(c);
    const b = score(best);
    if (
      a > b ||
      (a === b && c.text.length < best.text.length) ||
      (a === b && c.text.length === best.text.length && c.text < best.text)
    ) {
      best = c;
    }
  }
  return best;
}

// ---------------------------------------------------------------- entrypoint
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
mkdirSync(outDir, { recursive: true });
const winner = pick();
if (wordCount(winner.text) > 25) throw new Error("winner exceeds 25 words");
writeFileSync(join(outDir, "entry.txt"), winner.text, "utf8");
// Round-trip verification: read the file back, throw unless byte-identical.
const written = readFileSync(join(outDir, "entry.txt"), "utf8");
if (written !== winner.text) throw new Error("entry.txt round-trip mismatch");
console.log(
  `winner (${wordCount(winner.text)} words, ${winner.text.length} chars, score ${score(winner)}): ${winner.text}`,
);
