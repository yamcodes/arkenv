## ADDED Requirements

### Requirement: Safe File Injection
The system SHALL provide a mechanism to append content to an existing file while preserving its current contents and formatting.

#### Scenario: Appending to a file with existing content
- **WHEN** the injection utility is called with a target file path and content to append
- **AND** the target file already contains data
- **THEN** the new content SHALL be added to the end of the file
- **AND** the existing content SHALL remain untouched

### Requirement: Reference Injection for Vite and Bun
The system SHALL support injecting Triple-Slash Directives or type declarations into TypeScript declaration files safely.

#### Scenario: Injecting ArkEnv reference into vite-env.d.ts
- **WHEN** the user selects the "Append types safely" option for Vite
- **THEN** the system SHALL add `/// <reference types="@arkenv/vite-plugin/client" />` (and associated interfaces) to the `vite-env.d.ts` file
- **AND** it SHALL ensure the reference is not duplicated if already present (the system SHALL detect prior injection by looking for the comment marker `// @arkenv-types` and, if present, SHALL skip injection)

#### Scenario: Injecting ArkEnv reference into bun-env.d.ts
- **WHEN** the user selects the "Append types safely" option for Bun
- **THEN** the system SHALL add `/// <reference types="bun-types" />` (if missing) and the ArkEnv `ProcessEnvAugmented` types to the `bun-env.d.ts` file
- **AND** the system MUST detect existing injections by searching for the design's marker-based tokens (e.g., `// @arkenv-types`) and treat matches as already-present (after normalizing whitespace and line endings); if the marker is found, the injector MUST skip inserting the reference, otherwise it MUST insert the reference wrapped with the same marker.
