# \<Problem title\>

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for `#<issue>` / PR `#<pr>`. **Chosen public story:** \<S stack, or “undecided”\>.

## Problem

\<What must be true when we are done — not the first idea that showed up.\>

## Layer map

- **\<Layer A\>:** \<dimension — items here are substitutes for each other\>
- **\<Layer B\>:** \<a different dimension; composes with Layer A\>

Items on different layers compose. Do not flatten into one list.

## Metrics

| Metric | Question |
| ------ | -------- |
|        |          |

## The hat

### \<Layer A — dimension\>

| # | Option | Notes |
| - | ------ | ----- |
| A1 | | Include rejected and out-of-scope options so they get scored. |

### \<Layer B — dimension\>

| # | Option | Notes |
| - | ------ | ----- |
| B1 | | |

## Evaluation

**\<id\> \<name\>** — Prose against the metrics. Not a vibe rank. For a close call, a comparison table is welcome.

## Tier list

Solutions ranked as **answers to the whole problem**. Some are complete; some are pieces. A complete answer may be a **stack** (one pick per layer).

**S (chosen / default story)**

- **\<stack\>** — why this is the public story

**A**

- Optional tuck-away or distribution. Not a blocker. Do not ship these to close the current change unless they are required.

**B** / **C** / **D** / **E** as needed.

## S and A usage

### Use case 1: \<name\>

**S:**

```text
concrete usage
```

**A:**

```text
concrete usage
```

Repeat for each real use case. The ranking is not abstract.

## Current lean

\<What ships now. What stays A-tier and is not required to close the change.\>

## Changelog of this note

- YYYY-MM-DD: First write-up (layers, metrics, hat, tier list).
