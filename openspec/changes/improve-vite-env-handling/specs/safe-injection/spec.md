## ADDED Requirements

### Requirement: Safe File Injection
The system SHALL provide a mechanism to append content to an existing file while preserving its current contents and formatting.

#### Scenario: Appending to a file with existing content
- **WHEN** the injection utility is called with a target file path and content to append
- **AND** the target file already contains data
- **THEN** the new content SHALL be added to the end of the file
- **AND** the existing content SHALL remain untouched

### Requirement: Reference Injection for Vite
The system SHALL support injecting Triple-Slash Directives into TypeScript declaration files safely.

#### Scenario: Injecting ArkEnv reference into vite-env.d.ts
- **WHEN** the user selects the "Append types safely" option
- **THEN** the system SHALL add `/// <reference types="@arkenv/vite-plugin/client" />` to the `vite-env.d.ts` file
- **AND** it SHALL ensure the reference is not duplicated if already present
