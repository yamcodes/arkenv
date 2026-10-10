# Docs prose register

Living evaluation, not an ADR. Update this file as options enter or leave
the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note. **Chosen public story:** `A1 + B1 + C1 + D1`.

The field survey behind the hat: Wikipedia's
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
(WikiProject AI Cleanup) is the shared pattern source.
[blader/humanizer](https://github.com/blader/humanizer) (\~55k stars, MIT,
35 of those patterns, two-pass claim check) and
[hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop)
(\~18k stars) are the skills people actually install.
[StoryScope](https://arxiv.org/abs/2604.03136) (arXiv:2604.03136) showed
that fiction is separable on plot shape alone (93.2% macro-F1 without
style features). [sepia](https://github.com/Nanako0129/sepia) and
Stop-Slop v3 are the 2026 responses. Rule engines and detector-bypass
packages exist; they are in the hat so they do not come back unnamed.

## Problem

When a docs page is done, a reader should be able to treat it as written
by the same person who wrote the canon pages:

1. Turbo-shaped what / why / how. A two-sentence lead, product name in
   both sentences, then H2s that define the thing, say why, then show
   the command.
2. Facts, APIs, headings, and house terms unchanged. No invented
   features, metrics, or packages added to "add meat" or "sound
   specific."
3. Chatbot rhythm gone: significance inflation, rule of three, negative
   parallelism, vague attribution, leftover offers to the user.
4. MDX survives: `package-install` fences, frontmatter, links, Callouts,
   code, and the words `Typesafe`, `environment variables`, package
   names.
5. Non-prose surfaces stay as they are: changelogs, boundary-error
   strings, fenced agent prompts.

`the-voice` already states (1) and (2). Its step 5 says to pass
`stop-slop` afterward, and then spends three lines telling that pass
not to strip the why or flatten the lead. That tension is the problem.
The de-AI pass and the register are currently aimed at different prose.

## Layer map

- **Register (A):** which voice the page is trying to occupy. Substitutes.
- **De-AI mechanism (B):** how tells get removed after (or instead of)
  that voice. Substitutes. Composes with A.
- **Order and scope (C):** when the mechanism runs, and which surfaces
  it may touch. Substitutes. Composes with A and B.
- **Voice lock (D):** what the pass is matching. Substitutes. Composes
  with the others.

A complete answer is one pick per layer.

## Metrics

| Metric        | Question                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Register lock | Does the page still match the canon cadence, including the lead and the why bullets?              |
| Fact lock     | Are claims limited to the source page and the product?                                            |
| MDX safety    | Do fences, frontmatter, links, Callouts, and house terms survive byte-for-byte where they should? |
| Tell removal  | Are chatbot rhythms gone, without a new scrubbed dialect taking their place?                      |
| Genre fit     | Was this built for instructional reference, or for fiction, essays, or detector scores?           |
| Footguns      | What does it destroy that these docs need?                                                        |
| Maintenance   | Can we keep the rule without tracking a moving upstream pattern list?                             |

## The hat

### Register

| #  | Option                               | Notes                                                                                      |
| -- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| A1 | `the-voice` plus the canon pages     | In repo. Positive routing into Turbo docs.                                                 |
| A2 | Generic "sound human"                | No product register.                                                                       |
| A3 | A personal writing sample, no canons | Matches a person, misses the site.                                                         |
| A4 | Stop-Slop v3 generic basins          | technical / instructional / business. The repo has \~2 stars.                              |
| A5 | Hallmark                             | Visual anti-slop. Out of scope for prose. Scored so it does not get reused as a copy pass. |
| A6 | `docs-writer` alone                  | Links, wrapping, Next steps. Gemini boilerplate if used as the register.                   |

### De-AI mechanism

| #   | Option                                    | Notes                                                                                                                                                                                                                 |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | blader/humanizer                          | Technical and reference prose stays plain. A writing sample overrides its default rules. Second pass checks the draft against the patterns and the original claims. Leaves code, frontmatter, and link targets alone. |
| B2  | hardikpandya/stop-slop                    | What `the-voice` step 5 names today. Bans phrases, "not X, it's Y", em dashes, Wh- starters, and all adverbs.                                                                                                         |
| B3  | Stop-Slop v3 routing                      | Positive constraints while drafting. Pattern catalog stays out of the generation prompt and is an editorial audit only.                                                                                               |
| B4  | Sepia / StoryScope                        | Narrative-architecture repair. Built on fiction features: ambiguity, subplots, broken chronology.                                                                                                                     |
| B5  | One-shot pattern scrub                    | Delete tells in a single pass. No claim check, no sample.                                                                                                                                                             |
| B6  | texthumanize and other synonym engines    | Offline rules: burstiness, connector swaps. The project says it normalizes style and does not produce a voice.                                                                                                        |
| B7  | Detector bypass                           | Perplexity and burstiness targeting, synonym maps, injected errors, "stealth" modes. Aimed at GPTZero / Turnitin.                                                                                                     |
| B8  | stylometric-transfer                      | JSON fingerprint from a corpus, then a constrained rewrite.                                                                                                                                                           |
| B9  | No de-AI pass                             | Register only.                                                                                                                                                                                                        |
| B10 | Wikipedia catalog inside the draft prompt | The failure mode B3 is written to avoid.                                                                                                                                                                              |
| B11 | Aboudjem humanizer-skill                  | 55 patterns, five generic voices, a 0–100 score.                                                                                                                                                                      |
| B12 | academic-humanizer                        | Papers and grants. Scholarly voice.                                                                                                                                                                                   |
| B13 | Short in-repo checklist                   | The tells these docs actually grow, maintained next to `the-voice`. No third-party skill.                                                                                                                             |

### Order and scope

| #  | Option                                   | Notes                                                |
| -- | ---------------------------------------- | ---------------------------------------------------- |
| C1 | Register first, de-AI second, prose only | `the-voice` workflow order. Exemptions listed below. |
| C2 | The de-AI skill does the whole rewrite   | Register is skipped.                                 |
| C3 | Pattern list loaded while drafting       | Generation and audit are the same prompt.            |
| C4 | Human audit only                         | No skill rewrite.                                    |
| C5 | Every surface                            | Changelogs, error strings, prompt fences, code.      |

### Voice lock

| #  | Option                                     | Notes                                                                             |
| -- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| D1 | In-repo canon pages as the sample          | Getting started, Introduction, Installation, Community, one framework guide.      |
| D2 | No sample                                  | The tool's default voice.                                                         |
| D3 | turborepo.dev as the only sample           | Shape reference. Copies features ArkEnv does not have if used as the text source. |
| D4 | Computed fingerprint of the published docs | B8's lock, applied to `apps/www/content/docs/`.                                   |

## Evaluation

**A1 `the-voice`.** Register lock is the point of the skill: canon pages, the Turbo lead, H2 shape, house terms, Callouts for forks. Fact lock is explicit (do not invent features to add meat). MDX safety is explicit (`package-install` fences, leave prompts and changelogs alone). Tell removal is incomplete on its own; skinny and stuffed are the failures it names, and a page can satisfy the shape and still read as a model. Genre fit is exact: this is the instructional register. Footgun: step 5 hands the page to a skill that the same file then has to restrain. Maintenance is low; the skill and the canons already live here.

**A2 generic human.** Tell removal can look successful and still fail register lock. The result is bursty, opinionated, and uneven across pages. Fact lock depends on the operator. MDX safety is unspecified. Genre fit is "blog post." Footgun: a docs site that no longer sounds like one product.

**A3 personal sample only.** Register lock fails unless that person is the canon. Useful as an input to D1, useless as the register.

**A4 generic basins.** Register lock is partial. "Instructional" is a basin, and it is coarser than the canon pages. Genre fit is closer than fiction skills. Maintenance is poor: the repo is an experiment, and adopting it would replace A1 with a weaker copy of what A1 already is. B3's rule (catalog out of the draft) is the part worth keeping, and C1 already applies it.

**A5 Hallmark.** Register lock for UI, none for docs prose. Out of scope. Running it on MDX would restyle the site, which these pages are not asking for.

**A6 `docs-writer` alone.** MDX safety and link mechanics are its job. Used as the register it produces skinny command lists. `the-voice` already wins tone conflicts. Keep it for links and wrapping; it is not a hat winner for this problem.

**B1 humanizer.** Tell removal is the strongest general tool that still has a technical-prose mode. Fact lock is structural: a second pass compares the draft to the original claims and refuses invented names, numbers, and citations. MDX safety is structural: code, frontmatter, and link targets are out of bounds. Register lock holds when D1 is required, and slips when the sample is omitted, because the default personal-writing rules are not the Turbo lead. Genre fit is good for reference prose and merely okay for the specific cadence ("seamlessly" in the AI-guide lead is exactly the sort of adverb a strict ban deletes). Footgun: the pattern list grew from 24 to 35 through 2026 and includes Wikipedia formatting tells that do not apply to MDX. Mitigation is the sample plus the do-not-touch list, not vendoring the skill. Maintenance is acceptable if we treat upstream as a tool and our exemptions as the pin.

**B2 stop-slop.** Tell removal is real and overshoots. The bans (every adverb, every em dash, every Wh- starter, active voice only, no negative-then-positive) define an essay voice. Register lock fails on the lead the canons require, which is why `the-voice` already says the pass must not flatten it and must not delete why bullets. Fact lock is not a check, only a hope. MDX safety is unspecified. Genre fit is personal essay. Footgun is the highest of the serious options: three guardrail sentences in the skill are evidence the tool and the register conflict. Maintenance of the upstream skill is fine; maintenance of the guardrails is the ongoing cost.

**B3 v3 routing.** This is a generation rule, and A1 already implements it for this product: aim at a basin, do not draft from a deny-list. As a substitute for B1 it has no claim check and no MDX rule. As a companion to C1 it is already adopted. Installing the v3 repo would not improve the pages.

**B4 Sepia / StoryScope.** The paper's result matters, and it points the wrong way for docs. AI fiction clusters on explicit themes, tidy single-track plots, and linear time. A guide is supposed to do those things. Importing ambiguity, subplots, or broken chronology would lower register lock and genre fit together. Tell removal of the surface kind is not what this layer does. Leave it for fiction.

**B5 one-shot scrub.** Tell removal is shallow. Fact lock and MDX safety are absent. The Wikipedia essay itself says deleting the signs can hide the deeper problem. That is this option.

**B6 synonym engines.** Genre fit is "statistical style." Register lock fails because the output is nobody's voice. Fact lock fails in practice when a swap hits `Typesafe`, a package name, or a fence. texthumanize is honest that it does not guarantee a human voice. Footgun is silent corruption.

**B7 detector bypass.** Optimizes detector scores. Injected errors and rare synonyms lower every metric that a docs page has. Out of scope for the site, scored so it does not return as a "stronger humanizer."

**B8 stylometric fingerprint.** Register lock could be high if the corpus is the canon pages, and the fingerprint is inspectable. Genre fit is right. Fact lock and MDX safety depend on the rewrite prompt wrapped around it. Maintenance is a second system: a JSON model, a metric dashboard, and a retry loop, for a site that already has five canon pages a model can read. D4 is the same idea with less machinery when the sample is the pages themselves.

**B9 no de-AI pass.** Register lock and fact lock stay with A1. Tell removal is the gap the AI-guide history already showed: a tighten pass can strip why, and a shape-correct page can still sound generated. Acceptable for a page a person just edited. Incomplete as the default agent workflow.

**B10 catalog in the draft.** Tell removal during generation teaches the model the tells. The draft then avoids the list and lands in a scrubbed dialect (no dashes, no adverbs, metronomic short sentences). Register lock drops. This is why the audit belongs in a second pass.

**B11 five generic voices.** A scored detect mode is a useful audit. The voices (casual, professional, technical, warm, blunt) are not the canon. Technical is the least-wrong profile and still loses register lock to D1. Smaller maintained fork of the same idea as B1, with a score and without B1's "sample overrides the default" contract stated as clearly.

**B12 academic-humanizer.** Genre fit is papers and grants. Product docs would pick up scholarly hedging. Wrong surface.

**B13 in-repo checklist.** Register lock and maintenance are the best in this layer, because we would write the exemptions next to the lead rule. Tell removal is narrower: it catches the phrases we list and misses uniform rhythm and unstated significance unless the list grows into a worse copy of B1. Fact lock and MDX safety are only as good as the sentences we add. This is the right fallback if B1's Wikipedia patterns start eating house style. It is the worse default, because the coverage is whatever we remembered to write down.

**C1 register, then de-AI, prose only.** Matches every metric once B and D are the right ones. The do-not-touch list is part of the option: the Turbo lead (including "seamlessly"), why bullets, house terms, fences, frontmatter, links, Callouts, changelogs, boundary-error strings, fenced prompts.

**C2 de-AI as the whole rewrite.** Register lock collapses to whatever B's default is. A humanizer cannot invent the H2 shape or the why. This is how skinny pages survive with cleaner sentences.

**C3 patterns while drafting.** Same failure as B10, at the workflow layer.

**C4 human audit only.** Highest register lock when the editor is a person who knows the canons. Tell removal is inconsistent across agents. Fine as a spot check. Not the default, because the pages are usually drafted by an agent.

**C5 every surface.** Fact lock and MDX safety fail. Changelogs are past tense on purpose. Boundary errors are a Next.js taint string. Prompt fences are agent instructions and are supposed to be tight.

**D1 canon sample.** Register lock's actual mechanism. The sample is text we publish, so fact drift has a diff. Maintenance is reading two pages, which `the-voice` already requires.

**D2 no sample.** The tool's default voice wins. For B1 that default is plainer than an essay and still not ArkEnv. For B2 it is the banned-adverb voice.

**D3 Turbo as the only sample.** Register lock of shape is good. Fact lock fails when Turbo features (worktrees, `turbo docs`, versioned subdomains) leak in. The canons file already says copy the shape, not the features. Use Turbo as the outside reference for cadence, and D1 as the sample the de-AI pass reads.

**D4 computed fingerprint.** See B8. More machinery than D1, same inputs, weaker MDX story.

## Tier list

Answers to the whole problem. One pick per layer.

**S**

- **A1 + B1 + C1 + D1.** Draft and rewrite in `the-voice` against the canons. Then run humanizer on the prose, with those canon pages as the sample, and with the do-not-touch list in force. Humanizer's second pass is what checks claims. The sample is what keeps the Turbo lead. This is the only stack that scores on register lock and tell removal at the same time.

**A**

- **A1 + B13 + C1 + D1.** Same order, with a short checklist instead of humanizer. Ship this if we decide an external skill is the wrong dependency. Coverage is lower. Ownership is higher. Not required to close the decision.
- Retargeting `the-voice` step 5 from `stop-slop` to this stack, including the do-not-touch list in the skill text. Until that line changes, agents will keep running B2. That edit is the rollout, not a second design.

**B**

- **A1 + B2 + C1 + D1.** The workflow the skill describes today, plus a sample. It works when the operator keeps the three guardrails in mind. The guardrails are the cost. B2 remains in the hat as the incumbent, not the default.

**C**

- **A1 + B9 + C4 + D1.** A person edits. Right for a page someone just rewrote by hand. Incomplete for agent drafts.
- **A1 + B11 + C1 + D1.** Acceptable detect-and-score audit. The five voices do not earn a place next to the canons.
- **A4 or B3 as an install.** The useful rule is already C1. The repo is not a better register than A1.

**D**

- **A2 or A3 or C2**, any B. Humanizing without the register.
- **B5, B8, B10, B12, C3, C5, D2, D3 as the sample.** Each fails one hard constraint: claims, MDX, generation-time priming, wrong genre, or feature leakage.
- **A5, A6 as the register.** Wrong tool. A6 stays in the workflow for links only.

**E**

- **B4 on docs.** StoryScope's AI cluster is what a good guide looks like. Do not repair it.
- **B6 and B7.** Synonym swaps and detector evasion. They corrupt terms and, in B7's case, the sentences.

## S and A usage

### A new or skinny page

Worked case: `apps/www/content/docs/guides/ai.mdx`. The meatier page had the Turbo shape. A later tighten pass stripped the why.

**S:**

```text
1. Read two canons (Introduction, and Next.js or Vite) and the Turbo
   "Using AI" lead shape. Copy the shape only.
2. the-voice: two-sentence lead, product name in both sentences,
   then each H2 as what / why / command / "teaches assistants" bullets.
   Forks go in a fumadocs Callout. Do not invent a feature to add meat.
3. humanizer, prose only, sample = those canon pages.
   Do not touch: the lead's "seamlessly" cadence, why bullets,
   Typesafe / environment variables / package names, fences,
   frontmatter, links, Callouts.
4. Check the result against the pre-humanizer draft. Any new package,
   flag, or behavior is a revert.
```

**A:**

```text
Steps 1, 2, and 4 stay. Step 3 is the in-repo checklist:
significance inflation, rule of three, "not X, it's Y",
vague attribution ("it is important to note", "delve",
"landscape"), and a chatbot offer left in the page.
Same do-not-touch list. No third-party skill.
```

### A page that is factually right and sounds generated

**S:**

```text
Do not reopen the IA. humanizer in edit mode on the prose,
sample = D1, do-not-touch list in force, then a claim diff
against the file before the pass.
```

**A:**

```text
Same scope. Checklist pass only. Leave sentence rhythm alone
unless a listed tell is in the sentence.
```

### Surfaces the stack does not enter

**S and A:**

```text
CHANGELOG.md and changesets (past tense, already specified).
Boundary access errors (Next.js taint string).
Fenced text prompts (agent instructions, kept tight).
package-install / code fences (authored as npx or npm install).
docs-writer still owns relative links, wrapping, and Next steps.
```

## Current lean

Ship the stack as the docs workflow: `the-voice` first, humanizer second, canon pages as the sample, prose only. `stop-slop` stays available and is no longer the named second pass.

Do not vendor humanizer. Do not install Sepia, Stop-Slop v3, a synonym engine, or a detector bypass for this site. Do not add the checklist unless humanizer's pattern list starts eating the lead or the house terms.

The skill file still tells agents to pass `stop-slop`. Changing that line is the rollout. It is not part of this note.

## Changelog of this note

- 2026-10-10: First write-up (layers, metrics, hat, tier list).
