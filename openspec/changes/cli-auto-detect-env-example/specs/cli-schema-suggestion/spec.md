## ADDED Requirements

### Requirement: Schema Suggestion Prompt
If `.env.example` keys are detected, the CLI SHALL prompt the user to confirm if they want to use these keys to scaffold their ArkEnv schema.

#### Scenario: User accepts suggestion
- **WHEN** the CLI prompts "Detected .env.example. Use its keys for your schema?"
- **AND** the user selects "Yes"
- **THEN** the resulting ArkEnv configuration SHALL include the detected keys

#### Scenario: User declines suggestion
- **WHEN** the CLI prompts "Detected .env.example. Use its keys for your schema?"
- **AND** the user selects "No"
- **THEN** the resulting ArkEnv configuration SHALL use the default template keys (`NODE_ENV`, `PORT`)

### Requirement: Dynamic Schema Generation
The CLI templates SHALL be capable of generating a valid ArkEnv configuration using a provided list of environment variable keys.

#### Scenario: Generate schema from extracted keys
- **WHEN** the user accepts the suggestion for keys `PORT` and `DATABASE_URL`
- **THEN** the generated file SHALL contain a schema definition including `PORT: "string"` and `DATABASE_URL: "string"` (or appropriate default validators)
