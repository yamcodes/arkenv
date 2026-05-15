# ArkEnv CLI Architecture

This project follows a hybrid of **Hexagonal Architecture (Ports and Adapters)** and **Feature-Sliced Design (FSD)** principles. The goal is to keep the core ArkEnv logic entirely headless and decoupled from the terminal UI and the file system.

## The Core Rule: Headless Domains

The most important rule in this codebase is that **Features must be headless**. 

- **Zero UI Imports**: Files in `features/` must never import from `cli/ui/` or libraries like `@clack/prompts`.
- **Zero direct I/O**: Features interact with the outside world (file system, process) only through **Ports** (interfaces) defined in `shared/ports/`.
- **Pure Transformations**: Features should prioritize string-to-string or data-to-data transformations (e.g., AST manipulation in `config-mutation`).

## Project Structure

```text
src/
├── cli/                      # Driving Adapters (The Shell)
│   ├── commands/             # Command orchestrators (init, help)
│   ├── ui/                   # Terminal UI adapters (prompts, visuals)
│   ├── composition.ts        # Composition Root (Dependency Injection)
│   └── cli.ts                # Arg parsing and global state
│
├── features/                 # Pure Business Domains (Headless)
│   ├── scaffold/             # Generation engine (Planner, Executor)
│   └── config-mutation/      # AST-based configuration manipulation
│
├── adapters/                 # Driven Adapters (Infrastructure)
│   ├── node-workspace.adapter.ts # Concrete File System & Process logic
│   └── logger.adapter.ts     # Concrete Terminal & JSON output logic
│
└── shared/                   # Cross-cutting concerns
    └── ports/                # Infrastructure contracts (Interfaces)
```

## Dependency Flow

The dependency direction always flows **inward** toward the ports or **outward** from the driving shell:

1.  **CLI (Shell)**: Imports from both `features` and `ui`. It orchestrates the flow:
    *   `cli/commands/init` -> `cli/ui/prompts` (get data)
    *   `cli/ui/prompts` -> `features/scaffold` (pass pure data)
2.  **Features (Core)**: Import only from `shared/ports/`. They define logic that is agnostic to *how* it is triggered.
3.  **Adapters (Infra)**: Import from `shared/ports/` to implement the contracts. They handle the "messy" side effects of the Node.js runtime.

## Headless / Agent Mode (`--agent`)

The architecture is specifically designed to support AI agents and headless environments via the `--agent` and `--json` flags.

- When `--agent` is passed, the `composition.ts` root injects a `JsonReporter` into the `LoggerPort`.
- Because the `scaffold` and `config-mutation` features are headless, they continue to function exactly the same. 
- The `init` command skips interactive `ui/prompts` and passes default/provided options directly to the `features`.
- No interactive prompt will ever hang a headless process.

## Testing Strategy

-   **Domain Tests**: Features are tested with pure data and mock ports. These tests are fast and do not touch the disk.
-   **Adapter Tests**: Concrete implementations in `adapters/` are tested against the actual Node.js environment (e.g., using `fsp.mkdtemp`).
-   **Smoke Tests**: High-level integration tests in `src/smoke.test.ts` verify the final bundled CLI from the user's perspective.
