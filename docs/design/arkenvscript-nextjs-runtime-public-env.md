# ArkEnvScript / `__arkenv_env__` — keep or remove?

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** accepted as [ADR 0034](../adr/0034-no-nextjs-runtime-env-global.md) for [#1911](https://github.com/yamcodes/arkenv/issues/1911). **Chosen public story:** **S = A2 + B4 + C1**, with **A3 docs shipping** (dedicated Next.js + Docker guide + migrating-to-v1 note naming `next-runtime-env`).

Maintainer locked **B** on the issue. Implementation removes the surface and documents the Docker story without a runtime global.

## Problem

When RC ships, `@arkenv/nextjs` must not leave a **semi-public Next surface** that agents and humans invent as “required for Next,” with no reference page — same class of risk as [#1906](https://github.com/yamcodes/arkenv/issues/1906).

What must be true:

1. The public Next story for client `NEXT_PUBLIC_*` is **one transport**, taught in docs (not changelog archaeology).
2. That story matches ArkEnv’s product boundary: **typesafe validation + host-honest boundary**, not every Docker workaround the ecosystem invents.
3. Docker users who need public env without rebuild have a clear answer: either ArkEnv owns it fully, or ArkEnv points them elsewhere — never a silent half-solution wired into codegen.

## Layer map

These are **orthogonal**. Issue options A/B flatten them into one false choice.

- **Layer A — Who owns “public env without rebuild” on Next?** Product commitment for Docker/staging/prod URL swaps without rebuilding client bundles.
- **Layer B — Fate of `ArkEnvScript` / `globalThis.__arkenv_env__`.** What happens to the concrete export and the codegen global read.
- **Layer C — How the documented Next happy path teaches client values.** Orthogonal teaching surface (codegen `runtimeEnv` + Next inlining vs escape-hatch docs vs migration notes). Composes with A/B; does not replace them.

Items on different layers compose. A complete answer is a **stack**.

## Metrics

| Metric                | Question                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Host honesty          | Does this fight Next’s documented build-time `NEXT_PUBLIC_*` model, or cooperate with it? |
| Product scope fit     | Is this validation/boundary work, or a parallel env-transport product?                    |
| Tax fairness          | Do Vercel/build-time users pay complexity for Docker no-rebuild users (and vice versa)?   |
| Agent / docs footguns | Can an agent invent this as required Next setup when the happy path never mentions it?    |
| Maintenance hell      | How sticky is owning a `next-runtime-env`-shaped escape hatch across Next majors?         |
| Teachability          | Can the frameworks matrix stay true (Nuxt yes / Next rebuild) without contradiction?      |
| Reversibility at RC   | Cheap to remove now and re-add later, or cheap to document now and stuck for 1.x?         |
| Real demand honesty   | Does the community Docker pain still get a path, even if ArkEnv does not own it?          |

## The hat

### Layer A — ownership of Next public-env-without-rebuild

| #  | Option                         | Notes                                                                                                                         |
| -- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| A1 | **ArkEnv owns it first-class** | Compete with `next-runtime-env` / `next-dynenv`. Nuxt-parity marketing for Docker.                                            |
| A2 | **Host / Next owns it**        | Rebuild per env, or fetch server-side and pass props. Official Next stance.                                                   |
| A3 | **Ecosystem owns it**          | Remove ArkEnv’s surface; docs mention `next-runtime-env` (or equivalent) for the Docker hole.                                 |
| A4 | **Docs recipe only**           | No component; short DIY (entrypoint string-replace, custom layout script) in migrate/guides.                                  |
| A5 | **Defer ownership**            | Leave status quo (wired but undocumented) until post-1.0. **Out of scope for RC hygiene** — scored so it cannot silently win. |

### Layer B — surface fate

| #  | Option                                       | Notes                                                                                                       |
| -- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| B1 | **Keep + document as happy path**            | Issue option A, maximal. Layout always includes `<ArkEnvScript />`.                                         |
| B2 | **Keep + document as advanced escape hatch** | Still exported; codegen keeps global; docs put it under “Docker / runtime public env,” not getting started. |
| B3 | **Soft-deprecate one release, then remove**  | Warn on import / changelog; hard remove in next pre-release.                                                |
| B4 | **Hard remove now (RC)**                     | Issue option B. Delete component, drop `__arkenv_env__` from codegen + runtime merge.                       |
| B5 | **Extract to optional package**              | e.g. `@arkenv/nextjs-runtime-env`. Keeps core adapter lean.                                                 |
| B6 | **Leave undocumented**                       | Status quo. **Rejected for RC** — this is the bug \[#1911] exists to close.                                 |

### Layer C — teaching / happy-path story

| #  | Option                                                     | Notes                                                        |
| -- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| C1 | **Codegen `runtimeEnv` + Next inlining only**              | Matches frameworks table today (“Requires rebuild”).         |
| C2 | **Dual story: inlining default + runtime script advanced** | Two transports in docs.                                      |
| C3 | **Runtime script as default Next client transport**        | Flips the frameworks table; fights Next compiler story.      |
| C4 | **Migration-only mention**                                 | After remove: one line in migrating-to-v1; no ongoing guide. |

## Evaluation

### Layer A

**A1 ArkEnv owns it first-class** — Host honesty: low (Next freezes `NEXT_PUBLIC_*` at build; we paper over it with a global). Product scope: stretches CONTEXT.md’s “parser / validation” into a deployment-transport product. Tax fairness: every Next user inherits codegen that always peeks `globalThis.__arkenv_env__` even when they never use Docker. Demand honesty: high — this is exactly what Docker users want, and Nuxt already sells the pattern via Nitro. Maintenance: we become a soft fork of `next-runtime-env` inside `@arkenv/nextjs`. Reversibility: documenting as first-class locks the API for 1.x.

**A2 Host / Next owns it** — Host honesty: high. Scope fit: high (validation + boundary only). Tax fairness: Docker users rebuild or use server props; Vercel users get the simple story. Footguns: low if the surface is gone. Demand honesty: medium — pain remains, but it is Next’s documented trade-off, already printed in `frameworks/index.mdx`. Matches ADR 0028’s refusal to fight Next’s env pipeline.

**A3 Ecosystem owns it** — Same as A2 for ArkEnv’s API, plus Real demand honesty: high if docs name the hole and a dedicated library. Risk: recommending third parties in core docs; keep it a one-liner, not a partnership. Composes cleanly with B4.

**A4 Docs recipe only** — Honest and dependency-free, but entrypoint `sed` over `.next` chunks is fragile and easy to get wrong; worse teachability than “use next-runtime-env” or “rebuild.” Acceptable as a short advanced note, not as the default answer.

**A5 Defer** — Fails the problem statement. Agents keep inventing the script. Zero score on footguns metric. Not an RC answer.

### Layer B

**B1 Keep as happy path** — Only coherent under A1 + C3. Contradicts the published frameworks matrix (“Requires rebuild for `NEXT_PUBLIC_*`”). Forces every getting-started layout to grow a script tag. Highest maintenance and agent surface.

**B2 Keep as advanced hatch** — Coherent under A1-lite. Better tax fairness than B1 if getting-started stays clean, but codegen still always emits the global read — Vercel users still pay the dual-transport cost in generated code. Agents still find the export and over-apply it (“add ArkEnvScript to fix env”). Same class of semi-magic as the removed `package.json` `"arkenv"` pointer (#1906) unless docs are excellent and skills forbid inventing it.

**B3 Soft-deprecate then remove** — Gentler for any silent consumers of the changelog-only feature. RC is already pre-1.0; a second hop delays hygiene and keeps the footgun alive through the critical docs freeze. Only worth it if telemetry showed real adoption (we have none; zero docs mentions).

**B4 Hard remove now** — Cheapest RC answer. Aligns with #1906 “drop undocumented semi-public surface.” Reversibility: **high** — re-adding a documented script later is easy; removing a documented 1.0 API is hard. Migration: rebuild for public env changes; server-fetch for truly dynamic public config.

**B5 Optional package** — Looks elegant (lean core adapter) but still commits ArkEnv to owning the transport forever, just under another name. Splits the Next story across two packages agents will glue together wrongly. A-tier only if A1 wins and we refuse to bloat `@arkenv/nextjs`.

**B6 Leave undocumented** — The status quo. Explicitly fails acceptance criteria. Scored only to prevent silent return.

### Layer C

**C1 Inlining only** — Already the public story in `frameworks/index.mdx` and `client-vs-server.mdx`. S-tier companion to A2/A3 + B4.

**C2 Dual story** — Required if B1/B2 ship. Teachability cost is real: Nuxt gets one host-native story; Next gets two competing ones.

**C3 Script as default** — Rejected: fights Next, contradicts matrix, maximizes footguns.

**C4 Migration-only** — Right after B4. Do not invent a permanent “how to get Docker no-rebuild on Next with ArkEnv” guide unless A1 returns.

### Ecosystem research in the hat (not a separate option)

The “official Next leans B / community Docker leans A” write-up is real and useful. It is **not** a third option — it is evidence for metrics:

- Official stance → boosts **Host honesty** and **Scope fit** for A2 + B4.
- Community `next-runtime-env` demand → boosts **Real demand honesty** for A1 or A3, not automatically for shipping our own half-clone.
- Tie-breaker (“validator vs end-to-end deployment pain”) → CONTEXT.md and the lint RFC already answered: ArkEnv focuses on **runtime schema validation**, and file/deploy concerns that belong elsewhere get deferred to dedicated tools. Same pattern as archived `arkenv lint` → `dotenv-linter`.

Nuxt is not a counterexample to B4. Nuxt’s no-rebuild story rides **Nitro `runtimeConfig`**, a first-class host API. `ArkEnvScript` is the opposite: a bespoke global that bypasses Next’s compiler. ADR 0028 already refused to own Next’s env pipeline; owning a parallel browser global is the same shape of fight.

## Tier list

Solutions ranked as **answers to the whole problem** (stacks).

**S (chosen / default story)**

- **A2 + B4 + C1 + A3 docs + dedicated Docker guide** — Next public client env is build-time inlining via codegen `runtimeEnv`. No `ArkEnvScript`. No `__arkenv_env__`. Frameworks table stays true. RC drops the undocumented surface. Migrating-to-v1 and [Next.js and Docker](../../apps/www/content/docs/guides/nextjs-docker.mdx) name ecosystem tools (`next-runtime-env`) for no-rebuild client injection.

**A (optional tuck-away — do not block)**

- **B5** only if a future major reopens A1 and we refuse to grow `@arkenv/nextjs`.

**B**

- **A1 + B2 + C2** — Keep as documented advanced hatch. Defensible if product vision explicitly expands to “complete env deployment solution” for Next Docker. Costs: dual transport forever, agent footguns, frameworks-matrix rewrite, 1.x API lock-in.
- **B3** — Soft-deprecate first. Extra hop with little evidence of consumers.

**C**

- **A1 + B1 + C3** — Script as happy path. Maximum product expansion; maximum fight with Next.

**D**

- **A4 as the primary answer** — DIY `sed` recipes as the main Docker story. Fragile, unowned, still a footgun magnet.

**E**

- **A5 / B6** — Leave wired but undocumented. This is the bug.

## S and A usage

### Use case 1: Vercel / build-per-environment Next app

**S (A2 + B4 + C1):**

```tsx
// app/layout.tsx — no ArkEnvScript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// env.ts — NEXT_PUBLIC_* validated; withArkEnv codegen inlines at build
export const env = arkenv({
  DATABASE_URL: "string.url",
  NEXT_PUBLIC_API_URL: "string.url",
});
```

**A (A3 note only):** unchanged app code; no third-party library needed.

### Use case 2: One Docker image, staging vs prod public API URL

**S:**

```text
Build the image with the correct NEXT_PUBLIC_* for that deploy,
or fetch the public URL in a Server Component / Route Handler and pass it as props.
Public client literals stay build-time; secrets stay server-only via the proxy.
```

**A (ecosystem):**

```text
Keep ArkEnv for validation + boundary.
If you refuse rebuilds, add a dedicated runtime-public-env library yourself;
do not expect @arkenv/nextjs to inject globalThis.__arkenv_env__.
```

### Use case 3: Nuxt container (contrast — not Next)

**S:** unchanged — `@arkenv/nuxt` keeps Nitro boot gate + `runtimeConfig` hydration. Host-native no-rebuild remains a Nuxt feature, not a reason to fake the same transport on Next.

```ts
// Nuxt: public keys hydrate from runtimeConfig after container env injection
export const env = arkenv({
  DATABASE_URL: "string.url",
  NUXT_PUBLIC_API_URL: "string.url",
});
```

### Use case 4: Agent / human discovering `@arkenv/nextjs` exports

**S:** exports are `withArkEnv`, boundary helpers, and documented codegen — no `ArkEnvScript` to invent into every layout.

**A:** if an advanced Docker note exists, it must say “optional third-party; not required for ArkEnv.”

## Current lean

**Shipped:** remove `ArkEnvScript` and `__arkenv_env__` (issue **B**), codegen on plain `process.env.KEY` inlining, ADR 0034, migrating-to-v1 A3 note naming `next-runtime-env`, and the dedicated [Next.js and Docker](../../apps/www/content/docs/guides/nextjs-docker.mdx) guide.

**Still A-tier only:** `@arkenv/nextjs-runtime-env` (B5) — reopen post-1.0 if demand is proven.

**Why this beats “document and keep” for 1.0:** documenting locks a Next-fighting transport into the v1 lifecycle; removal is reversible; the frameworks matrix and CONTEXT.md already describe ArkEnv as validation + host-honest boundary; #1906 set the RC precedent for dropping undocumented semi-public surfaces; Nuxt’s Docker story is host-native and not a template for a bespoke Next global.

**When to reopen A1:** post-1.0 evidence that Next Docker users churn specifically for lack of a first-party script *and* refuse ecosystem libs — then ship B2/B5 with real docs, not a changelog line.

## Changelog of this note

- 2026-09-21: First write-up for #1911 (layers A/B/C, metrics, ecosystem research folded in, S lean = A2+B4+C1).
- 2026-09-21: Decision locked B; A3 + dedicated Docker guide promoted into AC/S; ADR 0034 accepted.
