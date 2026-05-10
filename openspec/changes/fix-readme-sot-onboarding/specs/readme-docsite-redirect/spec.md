## ADDED Requirements

### Requirement: Root README serves as GitHub landing page only
The root `README.md` SHALL contain only: project logo, badges, a one-sentence tagline, the demo GIF, and a prominent link to the documentation site. It SHALL NOT contain a QuickStart, full feature list, installation instructions, requirements section, or any other content that duplicates the docsite.

#### Scenario: Visitor opens the GitHub repository
- **WHEN** a user navigates to `github.com/yamcodes/arkenv`
- **THEN** they see branding, badges, the demo GIF, and a clear call-to-action link to `arkenv.js.org`

#### Scenario: Root README is compared to docsite content
- **WHEN** the root README and the docsite onboarding pages are compared side by side
- **THEN** there SHALL be no duplicated prose sections (no shared QuickStart, Features, or Installation content)

### Requirement: Package README serves as npm landing page only
`packages/arkenv/README.md` SHALL follow the same concise pattern as the plugin READMEs: package name, one-sentence description, a "Read the docs" link, a minimal installation snippet, and related links. It SHALL NOT duplicate the root README or the docsite.

#### Scenario: npm user views the arkenv package page
- **WHEN** a user visits `npmjs.com/package/arkenv`
- **THEN** they see a one-liner description, install command for the default package manager, and a link to the full docs

#### Scenario: Package README is compared to root README
- **WHEN** the two README files are compared
- **THEN** the non-boilerplate prose sections SHALL NOT overlap
