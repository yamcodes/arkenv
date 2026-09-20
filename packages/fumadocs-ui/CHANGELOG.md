# @arkenv/fumadocs-ui

## 1.0.0-alpha.7

### Major Changes

- #### Migrate all packages to pure ESM-only output _[`#1754`](https://github.com/yamcodes/arkenv/pull/1754) [`e29b46c`](https://github.com/yamcodes/arkenv/commit/e29b46c98f733980f55e1fff727c01ac0abee7df) [@yamcodes](https://github.com/yamcodes)_

	
	Every package now ships standard `.js` and `.d.ts` files under `"type": "module"`. The dual-published `.mjs`, `.cjs`, `.d.mts`, and `.d.cts` artifacts have been removed, and package `exports` no longer carry `require` conditions.
	
	CommonJS consumers keep working through Node's native `require(esm)`, which resolves each package through its `"default"` export condition. Bundlers (esbuild, Vite, Rollup, webpack) continue to transpile and inline the ESM output cleanly.
	
	**BREAKING CHANGE**: ArkEnv packages no longer ship `.cjs` builds. `require()` now returns the ESM namespace (for example, `require("@arkenv/core").default` is the `arkenv` function) and requires Node.js 20.19+, 22.12+, or 24. Projects that load ArkEnv from CommonJS on older Node versions need to upgrade Node or move to `import` syntax.

## 1.0.0-alpha.6

### Patch Changes

- #### Fix keyboard focus ring truncation in sidebar navigation _[`#1743`](https://github.com/yamcodes/arkenv/pull/1743) [`16f2d09`](https://github.com/yamcodes/arkenv/commit/16f2d09e4ef7cef95c332b080924802c31194fdd) [@yamcodes](https://github.com/yamcodes)_

	
	The drill-in sidebar slide container now uses `overflow: clip` with an expanded clip margin instead of `overflow: hidden`, preventing keyboard focus rings from being clipped along the left and right edges.

## 1.0.0-alpha.5

### Patch Changes

- #### Reduce package install sizes by omitting sourcemaps and externalizing core types _[`#1734`](https://github.com/yamcodes/arkenv/pull/1734) [`190b652`](https://github.com/yamcodes/arkenv/commit/190b652e7314e443b6a8f182c14fa57920058ede) [@yamcodes](https://github.com/yamcodes)_

	
	Published packages now omit declaration maps (`.d.ts.map`, `.d.mts.map`, `.d.cts.map`) and runtime JavaScript sourcemaps (`*.map`) across the monorepo, significantly reducing npm install footprints and package archive sizes. Both are loss-free removals: declaration maps are inert without the raw `.ts` sources they point to (which are never published), and runtime sourcemaps only re-map minified code (which ArkEnv does not ship).
	
	In addition, public ArkType type contracts in `@arkenv/core` declarations are now externalized rather than recursively expanded by the compiler, shrinking `@arkenv/core` declaration files and preventing internal AST definitions from being inlined into consumer type builds. The public type surface is unchanged — only how `tsc` encodes it on disk.

## 1.0.0-alpha.4

### Patch Changes

- #### Make markdown table wrappers keyboard-focusable _[`#1701`](https://github.com/yamcodes/arkenv/pull/1701) [`61c79f6`](https://github.com/yamcodes/arkenv/commit/61c79f6846a4accff8985733884a271b69466436) [@yamcodes](https://github.com/yamcodes)_

	
	Wide docs tables use an `overflow-auto` wrapper. That wrapper is now focusable (`tabIndex={0}`) so axe `scrollable-region-focusable` passes and keyboard users can scroll the region in Safari.

## 1.0.0-alpha.3

### Major Changes

- #### Remove `Header` from `@arkenv/fumadocs-ui` _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Site-wide navigation chrome now lives in the www app as **Site Nav** (floating glass pill / docs bar). The package `Header` export is removed so a second nav implementation cannot drift from the site.

  **BREAKING CHANGE**: `Header`, `HeaderLink`, and `HeaderProps` are no longer exported from `@arkenv/fumadocs-ui/components`. If you used them, replace with your own site chrome (ArkEnv www uses `apps/www/components/site-nav`).

### Minor Changes

- #### Replace docs "Copy Markdown" with a Copy page control _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Desktop docs pages now put a split **Copy page** button beside the title (copy plus a three-column grid menu for Markdown, AI chats, and GitHub). Narrow viewports show an inline **Copy for LLM** row under the description instead of the old bordered toolbar.

  Usage:

  ```tsx
  <AIActions
    only="desktop"
    markdownUrl={`${page.url}.mdx`}
    pageUrl={page.url}
    githubUrl={editHref}
  />
  <AIActions
    only="mobile"
    markdownUrl={`${page.url}.mdx`}
    pageUrl={page.url}
    githubUrl={editHref}
  />
  ```

- #### Add a Turborepo-style previous/next pager for docs pages _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Export `DocsFooter` so a Fumadocs `DocsPage` can replace the default bordered cards with a hairline rule, Previous/Next labels, and destination titles.

  Usage:

  ```tsx
  import { DocsFooter } from "@arkenv/fumadocs-ui/components";
  import { DocsPage } from "fumadocs-ui/page";

  <DocsPage
    slots={{
      footer: DocsFooter,
    }}
  >
    {children}
  </DocsPage>;
  ```

- #### Add Turborepo-style drill-in sidebar for Fumadocs docs layouts _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Export `drillInSidebarSlots` (and `DrillInSidebar`) so a Fumadocs `DocsLayout` can replace the default accordion sidebar with one-level section drill-in. Also export `DocsBreadcrumb` and `docsTocSlots` for matching docs chrome.

  Usage:

  ```tsx
  import { drillInSidebarSlots } from "@arkenv/fumadocs-ui/components";
  import { DocsLayout } from "fumadocs-ui/layouts/docs";

  <DocsLayout
    tree={source.pageTree}
    slots={{
      sidebar: drillInSidebarSlots,
    }}
  >
    {children}
  </DocsLayout>;
  ```

- #### Share the docs code-block Copy control _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Export `CodeBlockCopyButton` so the homepage (and other chrome) can reuse the same copy button as docs code blocks.

### Patch Changes

- #### Show the docs TOC rail from 1200px _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Match geistdocs/Turborepo (`--breakpoint-xl: 1200px`) so the right-hand table of contents stays visible between 1200px and 1280px instead of vanishing at Tailwind `xl`.

- #### Sit the TOC spy on the article rail and align active heading detection _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Drop the inner TOC hairline and draw the active heading marker on the column's start border (Vite `left: -1px`), so the ink bar rides the article↔TOC splitter. Select the last heading at or above the Site Nav scroll-margin so a section parked at the top of the page stays active when the next heading is in view.

- #### Match docs type to Turborepo/geistdocs _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Use Geist 450 with the geistdocs heading scale (40px page title, 24px `h2`). Article text uses Turbo's rendering (`antialiased`, `ss11`, `calt` off) so in-page headings match, not just the page title. Sidebar labels use 14px / 500 (`text-button-14`). Compact page actions stay 12px / 500 like Turbo's `text-label-12`.

- #### Flush docs sidebar items with the Site Nav wordmark _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Give the drill-in tree equal `--site-nav-gutter` column pads so the active pill is inset the same from both sidebar rails (pill left stays on the helm). Keep `px-2.5` inner padding so glyphs clear the 0.25rem pill radius. Clip the drill-in slide pane (`overflow: clip` plus `overflow-clip-margin: 0.5rem`) so a parked panel cannot leak a highlight sliver onto the outer rail.

- #### Align heading hash scroll with the article top _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Park clicked headings at `--fd-nav-height` plus `#nd-page` padding-top (`--fd-page-pad-top`), the same offset as the page title when the docs page is scrolled to the top.

- #### Fix continuous underlines for docs links that include inline code _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Links that wrap only a code chip or mix plain text with code now keep one continuous underline through the text and inside the code chip, instead of losing the line under the chip background.

  Affected markdown patterns:

  ```md
  [`number.port`](/docs/reference/keywords)

  [see the `number.port` keyword](/docs/reference/keywords)
  ```

- #### Align mobile docs spacing with Turborepo/geistdocs _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Match the geistdocs mobile rhythm: hide the page tagline under 960px, keep article `py-6`, sit the sidebar drawer below the header, and switch sidebar / Copy page at 960px (iPad Air mobile, iPad Pro sidebar).

- #### Use a Sidebar Tree in the mobile docs drawer _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Keep one-level section drill-in on the desktop rail. On viewports below 960px, render the same page tree as expandable nested folders (section title goes to Overview; a chevron toggles children) so the drawer is a wayfinding overlay instead of a second Sidebar Page.

- #### Match search dialog radius to control boundaries and maintain readable expanded layout _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Match the docs search dialog radius to the navbar search control (`--radius-control`, 0.375rem) so the collapsed overlay is no longer a pill, and adjust the expanded search panel radius so `overflow-hidden` does not clip result titles or excerpts.

- #### Fix clipped sidebar keyboard focus ring _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Replace the default outline on docs sidebar links and buttons with a rounded ring (page-colored gap + `--color-fd-ring`) so Tab focus matches the item shape and is no longer cut off by the drill-in pane.

- #### Soften docs sidebar and TOC rails _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Paint `#nd-sidebar` / `#nd-sidebar-mobile` rails with `--color-rule-y` (fallback `--color-fd-border`) so vertical cage lines stay slightly softer than horizontal `--color-rule`.

- #### Center the TOC footer hairline _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Match the heading list’s padding-bottom to the footer’s padding-top so the give-feedback rule sits equally between the last link and “Scroll to top”.

## 1.0.0-alpha.2

### Minor Changes

- #### Export `TypeTable` and `Collapsible` components _[`#1415`](https://github.com/yamcodes/arkenv/pull/1415) [`db45891`](https://github.com/yamcodes/arkenv/commit/db458917c651a6ea318b48900bfd281b9cf7a41c) [@yamcodes](https://github.com/yamcodes)_

  Export `TypeTable` and `Collapsible` from `@arkenv/fumadocs-ui/components`. The custom `TypeTable` supports `expandAll` to render all properties expanded by default.

  Usage:

  ```tsx
  import { TypeTable } from "@arkenv/fumadocs-ui/components";

  <TypeTable
    type={{
      port: {
        type: "number",
        description: "The port to run the server on",
        default: "3000",
      },
    }}
    expandAll
  />;
  ```

## 1.0.0-alpha.1

### Patch Changes

- #### Improve npm keywords across published packages for discoverability _[`#1387`](https://github.com/yamcodes/arkenv/pull/1387) [`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7) [@yamcodes](https://github.com/yamcodes)_

  Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

  - Remove the misleading `pnpm` keyword from `@arkenv/core` and `@arkenv/standard`, and give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
  - Keep validator-specific terms where they belong: `arktype` on `@arkenv/core`, and `zod` + `valibot` on `@arkenv/standard`.
  - Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
  - Extend the `arkenv` CLI keywords with `create`, `generator`, `env`, `environment-variables`, and `config`.
  - Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.

## 1.0.0-alpha.0

### Major Changes

- #### Initialize v1.0.0-alpha pre-releases _[`#1165`](https://github.com/yamcodes/arkenv/pull/1165) [`0e86f0d`](https://github.com/yamcodes/arkenv/commit/0e86f0d511b4f9e647da0123025f45687d89a4ed) [@yamcodes](https://github.com/yamcodes)_

  Start the pre-release track for the official v1.0.0 release.

## 0.0.8

### Patch changes

- #### Fix hamburger menu fade-in behavior on mobile _[`#935`](https://github.com/yamcodes/arkenv/pull/935) [`f1ee3de`](https://github.com/yamcodes/arkenv/commit/f1ee3de8c9cece2669ab4091aa992b25579a6b4e) [@yamcodes](https://github.com/yamcodes)_

## 0.0.7

### Patch changes

- Fix `arkenvComponents` typesafety issue when used in getMDXComponents _[`#835`](https://github.com/yamcodes/arkenv/pull/835) [`2b41340`](https://github.com/yamcodes/arkenv/commit/2b41340990cee90e7cc4a81b189d0be71706c847) [@renovate](https://github.com/apps/renovate)_

## 0.0.6

### Patch changes

- #### Fix transparent hamburger menu background issue on mobile _[`9237bf5`](https://github.com/yamcodes/arkenv/commit/9237bf5bc4ded6020078ffa9e231af8be9581fba) [@yamcodes](https://github.com/yamcodes)_

## 0.0.5

### Patch changes

- #### Hide esc button hint for search on mobile _[`34cf4fb`](https://github.com/yamcodes/arkenv/commit/34cf4fb9d8d97383661f85d255e4ee233d7dff96) [@yamcodes](https://github.com/yamcodes)_

## 0.0.4

### Patch changes

- #### Add `Header` component _[`#828`](https://github.com/yamcodes/arkenv/pull/828) [`e1f3183`](https://github.com/yamcodes/arkenv/commit/e1f3183f0fbdf5ea4fe5f529a061fdf451fba31c) [@yamcodes](https://github.com/yamcodes)_

  `@arkenv/fumadocs-ui` now exports a `Header` component for building site-wide navigation headers.

  ```tsx
  import { Header } from "@arkenv/fumadocs-ui/components";

  <Header
    logo={<MyLogo />}
    links={[
      { text: "Docs", url: "/docs" },
      { text: "Blog", url: "/blog" },
    ]}
    actions={[<SearchToggle />, <ThemeToggle />]}
    menuActions={[<ThemeToggle />]}
    menuSocialActions={[<GitHubLink />]}
    sidebarTrigger={<MySidebarTrigger />}
  />;
  ```

  The header is fixed to the top of the viewport and adapts its appearance as the user scrolls - transparent when at the top of the page, blurred with a semi-transparent background once the user scrolls down.

  On mobile the header renders a full-screen dropdown menu. Nav links are stacked at the top, an "Appearance" row (label + `menuActions`) sits above a centered row of `menuSocialActions`. An optional `sidebarTrigger` slot renders left of the logo for layouts that have a docs sidebar.

- #### Expand `css/theme.css` _[`#828`](https://github.com/yamcodes/arkenv/pull/828) [`e1f3183`](https://github.com/yamcodes/arkenv/commit/e1f3183f0fbdf5ea4fe5f529a061fdf451fba31c) [@yamcodes](https://github.com/yamcodes)_

  `@arkenv/fumadocs-ui/css/theme.css` now includes a complete set of fumadocs override styles so any app importing the theme gets correct defaults out of the box: nav/header height variables, sidebar drawer positioning (left-side on mobile), z-index stack (header → backdrop → sidebar drawer → search dialog → Radix poppers), search bar colors, external link icons, link underline styles, and heading anchor alignment.

## 0.0.3

### Patch changes

- #### Fix misconfigured package.json _[`a23997c`](https://github.com/yamcodes/arkenv/commit/a23997cb01b86a1e6ffd29df8279e22601864ced) [@yamcodes](https://github.com/yamcodes)_

  Fix misconfigured package.json by adding the `repository.url` field. This fixes an issue with pkg-pr-new and adheres to best practices.

## 0.0.2

### Patch changes

- #### First release _[`#775`](https://github.com/yamcodes/arkenv/pull/775) [`bb34860`](https://github.com/yamcodes/arkenv/commit/bb34860193dcb9a29026d84921b35e16a92f409b) [@yamcodes](https://github.com/yamcodes)_

  `@arkenv/fumadocs-ui` provides a theme, and components, for `fumadocs-ui` to replicate the "ArkEnv" website look.
