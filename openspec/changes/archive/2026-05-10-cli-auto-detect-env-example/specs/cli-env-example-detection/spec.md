## ADDED Requirements

### Requirement: .env.example Detection
The CLI SHALL check for the existence of a file named `.env.example` in the current working directory during the initialization process.

#### Scenario: .env.example exists
- **WHEN** the user runs `arkenv init` and `.env.example` is present in the current directory
- **THEN** the CLI SHALL notify the user that an `.env.example` file was detected

### Requirement: Environment Variable Key Extraction
The CLI SHALL parse the `.env.example` file and extract only the environment variable keys, ignoring values and comments.

#### Scenario: Extract keys from standard .env.example
- **WHEN** the CLI reads an `.env.example` file containing `PORT=3000`, `DATABASE_URL=`, and `# Comments`
- **THEN** the CLI SHALL identify `PORT` and `DATABASE_URL` as keys and ignore `# Comments`
