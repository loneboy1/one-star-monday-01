# One Star for Monday

Deterministic one-star review writer for the make.fun competition
**One Star for Monday** (`u-clever-harbor-75-one-star-for-monday-9ead4a61`,
$2 prize, free entry, entries close 27 Nov 03:05 WIB).

## Brief

Write a one-star review of Monday as if Monday were a restaurant,
max 25 words. The line must read like a real one-star review — a
complaint, a specific detail, the voice of a disappointed customer —
and be funny. Top 8 paid (1st $0.64).

## How it works

`main.ts` (Node 22, zero dependencies, erasable TypeScript) holds a
pool of 30 hand-written candidate reviews and scores each one
deterministically against a hand-written rubric, in this order:

1. **Fit** (/20) — unmistakably a restaurant review of Monday
   (reservation, waiter, table, menu, served, bill), not generic
   Monday hate.
2. **Grievance** (/20) — a specific Monday pain translated into
   restaurant language (cold coffee, the alarm clock at the next
   table, a side of meetings).
3. **Deadpan** (/20) — holds the deadpan: one star, no winking, no
   explaining the joke, no exclamation marks.
4. **Turn** (/15) — the punchline arrives in the last few words.
5. **Tight** (/15) — one joke told cleanly, no filler, no second
   joke crowding the first.

Plus a length bonus (+3 at 120 chars or fewer, +1 at 140 or fewer).
The winner is picked by deterministic argmax: highest score, then
shortest, then lexicographic. The gate rejects anything that is not
one line, is over 160 characters, or is over 25 words.

## Run

```sh
node main.ts
```

Writes the winner to `$MAKEFUN_OUTPUT_DIR/entry.txt` (default
`output/entry.txt`) and prints the winner with its word count,
character count, and score. The write is verified by reading the
file back and throwing unless it is byte-identical.

## Winner

> One star. Monday lost my reservation, sat me beside the alarm clock, and served cold coffee with a side of meetings.

21 words, 116 characters, score 90. Three review tropes (lost
reservation, bad table, bad food), three specific Monday pains (the
booking, the alarm clock, the meetings), and the turn is the side
dish.
