## ADDED Requirements

### Requirement: Pluggable Logger Support for Error Formatting

The error formatting system SHALL support pluggable loggers for styling error messages. When a logger is provided, it SHALL be used for styling text instead of the default ANSI color codes. When no logger is provided, the system SHALL default to the current ANSI color code behavior for backward compatibility.

#### Scenario: Error formatting with logger
- **WHEN** a logger function is provided to `formatErrors` or `ArkEnvError`
- **AND** the logger function accepts a color name and text string
- **THEN** the logger function is used to style error messages
- **AND** the formatted errors use the logger's styling instead of ANSI codes

#### Scenario: Error formatting without logger (backward compatibility)
- **WHEN** no logger is provided to `formatErrors` or `ArkEnvError`
- **THEN** the system uses the default ANSI color code behavior
- **AND** error messages are formatted with ANSI codes as before
- **AND** existing code continues to work without changes

#### Scenario: Logger passed through createEnv
- **WHEN** a logger is provided to `createEnv`
- **AND** validation fails
- **THEN** the logger is passed to `ArkEnvError` for error formatting
- **AND** error messages use the logger's styling

### Requirement: Logger Interface

The logger interface SHALL be a simple function type that accepts a color name and text string, returning styled text. The logger SHALL support the colors "red", "yellow", and "cyan" to match the current `styleText` utility.

#### Scenario: Logger function signature
- **WHEN** a logger function is provided
- **THEN** it accepts parameters `(color: "red" | "yellow" | "cyan", text: string)`
- **AND** it returns a string with styled text
- **AND** the function can be used interchangeably with the default `styleText` behavior

