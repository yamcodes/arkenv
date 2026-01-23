# Fumadocs UI Theme Specification

## Purpose
The `@arkenv/fumadocs-ui-theme` package provides a standardized design system and a set of enhanced MDX components for ArkEnv-related documentation sites.

## ADDED Requirements

### Requirement: Design System Styles
The theme MUST provide a CSS entry point that implements the ArkEnv design system.

#### Scenario: Sharpened corners
- **WHEN** the theme CSS is imported
- **THEN** it MUST set the `--radius` variable to `0.125rem`
- **AND** it MUST override Tailwind's radius tokens (`--radius-sm`, etc.) to match this value
- **AND** it MUST apply this radius to UI elements like buttons and cards using `!important` where necessary to override Fumadocs defaults.

#### Scenario: Header Layout
- **WHEN** the theme CSS is imported
- **THEN** it MUST set `--fd-nav-height` and `--fd-header-height` to `80px !important`.

### Requirement: External Link Detection
The theme MUST provide a component that automatically handles external links.

#### Scenario: Internal Link detection
- **WHEN** a URL starts with `/` or `#`
- **THEN** the `isExternalUrl` utility MUST return `false`.

#### Scenario: External Link detection
- **WHEN** a URL starts with `http://` or `https://`
- **AND** it is not `localhost` or `127.0.0.1`
- **THEN** the `isExternalUrl` utility MUST return `true`.

#### Scenario: External Link visual indicator
- **WHEN** an `ExternalLink` component receives an external URL
- **THEN** it MUST apply `target="_blank"` and `rel="noopener noreferrer"`
- **AND** it MUST set `data-external-link="true"` to trigger the visual arrow icon in CSS.

### Requirement: Enhanced Headings
The theme MUST provide headings with anchor support and proper scrolling.

#### Scenario: Anchor Icons
- **WHEN** a heading component has an `id`
- **THEN** it MUST display a `LinkIcon` on hover
- **AND** the heading text MUST be wrapped in an anchor linking to its own `id`.

#### Scenario: Scroll Margin
- **WHEN** a heading component is rendered
- **THEN** it MUST have a `scroll-m-32` class to prevent it from being hidden under the 80px fixed header.

### Requirement: ArkEnv MDX Components
The theme MUST provide a pre-configured mapping of MDX components.

#### Scenario: Component Registration
- **WHEN** `arkenvComponents` is imported
- **THEN** it MUST include overrides for `a`, `h1`, `h2`, `h3`, and `pre`.

### Requirement: AI Actions
The theme MUST provide components for AI-related actions on documentation pages.

#### Scenario: LLMCopyButton
- **WHEN** an `LLMCopyButton` is rendered with a `markdownUrl`
- **THEN** it MUST allow copying the raw markdown content to the clipboard.

#### Scenario: ViewOptions
- **WHEN** `ViewOptions` is rendered with a `githubUrl` and `markdownUrl`
- **THEN** it MUST provide a menu with links to open the page in GitHub and various AI interfaces.

### Requirement: CodeBlock Enhancement
The theme MUST provide enhanced code blocks with sharpened corners.

#### Scenario: Pre/CodeBlock Overrides
- **WHEN** the `pre` component is rendered via `arkenvComponents`
- **THEN** it MUST wrap the content in a custom `CodeBlock` component
- **AND** it MUST apply sharpened corners via CSS.
