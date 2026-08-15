---
name: the-hat
description: Compare design alternatives with a hat → metrics → tier-list loop, splitting composing layers and keeping a living note. Use when there are multiple ways to solve a design problem, the user says "throw it in the hat" or "/the-hat", asks for a tier list, design eval, or composing layers/dimensions, or when options look like they compose rather than compete — even if they have not named this skill.
metadata:
  internal: true
---

# The hat

When several ways exist to solve a design problem, do not vibe-rank in chat. Run this loop and leave the artifacts in a **living note** (repo file, not a premature ADR).

Worked example of the *shape* (not the product decision): the living note from #1564 / #1570 (`docs/to-json-schema-wiring.md` on `simplify-docs` until that restructure lands on `dev`). Copy headings from [NOTE-TEMPLATE.md](NOTE-TEMPLATE.md).

If the problem itself is still mushy, grill first (`grill-me` / `grill-with-docs`), then come back here to score options.

## Loop

1. **Name the problem** — what must be true when we are done, not the first idea that showed up.
2. **Split composing layers** if “solutions” are not the same kind of thing. Layers are **dimensions that compose**, not rivals in one list (how you type a callback vs where the wrapper lives). Do not flatten them into one false choice.
3. **Put every option in the hat**, including already-rejected and out-of-scope ones, so they get scored instead of silently returning.
4. **Pick metrics** that match the pain. Invent what fits (honesty, tax fairness, simplicity, DRY, composability, vendor neutrality, footguns, elegance, teachability, maintenance hell).
5. **Evaluate each hat item** against those metrics in prose. A table is welcome for a close call; a vibe ranking with no scores is not.
6. **Tier list** (S / A / B / C / D, plus E if needed). S is the default story. A is optional tuck-away or distribution, not a blocker. A complete answer may be a **stack** (one pick per layer), not a single winner.
7. **Show usage for S and A** across each real use case so the ranking is not abstract.
8. **Keep a living note.** New ideas get slotted; do not restart the write-up.
9. **Do not ship A-tier extras** that are not needed to close the current change.

## Living note

Write or update a repo file (typically `docs/<topic>.md`). Not chat-only. Not an ADR until the decision is hard to reverse, surprising without context, and the result of a real trade-off.

The note must contain:

- **Problem statement**
- **Layer map** — orthogonal dimensions; items on different layers compose
- **The hat** — numbered inventory of every option, grouped by layer (`A1`, `B1`, …)
- **Metrics** — named, with the question each one asks
- **Evaluation** — each hat item scored in prose against the metrics
- **Tier list** — S through D (or E), including stacks where layers combine
- **S/A usage** — concrete code (or equivalent) per real use case

## Layers vs a false choice

If two options are not substitutes, they are layers, not rivals.

False choice: “inline helper vs typed callback vs CLI recipe.”

Layers:

- **Typing** — what is the callback parameter?
- **Placement** — where does the wrapper live?

S can be a stack (one pick per layer). Rank stacks as answers to the whole problem.

## Rules

- Rejected and out-of-scope options stay in the hat and get scored. Silent return is how bad ideas come back next week.
- S is what you ship now. A is optional. Do not block the change on A.
- Slot new ideas into the existing note. Do not rewrite from scratch.
- Do not copy a prior eval’s *decision* into a new problem. Copy the *shape*.
