# Second pass

Run this after the page has what, why, and how. It cuts chatbot rhythm.
It does not find the voice. The draft you just wrote, plus the canon
pages, is the voice.

Do not load a separate humanizer, `stop-slop`, or a detector-bypass
tool. Those either ban the cadence this site uses or rewrite claims.
This file is that pass.

## Sample

You already read two canon pages. Match their rhythm: sentence length,
how direct the claims are, how much why they keep. Do not copy their
facts onto this page.

## Cut

- Significance inflation. "Pivotal", "testament", "landscape",
  "underscores", "in today's world", a bridge that "empowers" or
  "unlocks".
- Padding in threes. Three adjectives or three metaphors doing the job
  of one fact.
- Fake pivots. "It's not X, it's Y." "Not just X, but Y." A real fork
  stays a `<Callout>` with "instead", which is the house pattern.
- Throat-clearing and chatbot leftovers. "It's important to note",
  "delve", "certainly", "I hope this helps", "let me know if".
- A metronome. Every sentence the same length, every paragraph the same
  shape. Vary the length the canon pages vary it. Do not add fragments
  to look casual.

Leave a sentence alone when the only oddity is an adverb, an em dash,
a Wh- start, or passive voice. Banning those sands off the register.

## Do not touch

- The two-sentence lead, including "seamlessly" in that cadence, and
  the why bullets.
- House terms: Typesafe, "environment variables" in headings,
  "zero runtime dependencies" only where it is true, Nub.
- Fences, frontmatter, links, link targets, and `<Callout>` structure.
- Changelogs, boundary-error strings, and fenced `text` prompts.
- Any fact that was not on the page before this pass. A specific name,
  number, flag, or package added so the prose "sounds human" is a
  revert.

## Check

1. Mark sentences that carry a tell from the list above. Rewrite those
   sentences in the canon rhythm.
2. Diff the result against the draft from the voice pass. Headings,
   fences, and claims match. New behavior is a revert.
3. Read the lead and one why bullet aloud against a canon page. If
   this pass made them shorter or vaguer, restore them.

## Before and after

Cut this:

> ArkEnv isn't just a validator. It's a seamless, robust, and pivotal
> bridge that empowers teams to unlock typesafe environment variables
> in today's fast-paced landscape.

Keep a fact, in the register:

> ArkEnv validates environment variables before application code runs.
> You declare the schema once, and TypeScript infers the types from
> that same declaration.

Leave this lead alone. "Seamlessly" here is the cadence, not filler:

> ArkEnv is designed to work seamlessly with AI coding assistants.
> ArkEnv provides features that help AI understand your environment
> schema and work more efficiently.
