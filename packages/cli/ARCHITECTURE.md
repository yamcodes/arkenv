# ArkEnv CLI Architecture

This project follows a hybrid of **Hexagonal Architecture (Ports and Adapters)** and **Feature-Sliced Design (FSD)** principles. The goal is to keep the core ArkEnv logic entirely headless and decoupled from the terminal UI and the file system.

## The Core Rule: Pure Orchestration & Headless Domains

The most important rule in this codebase is the strict separation of concerns:

- **Zero UI Imports in Core/Shell**: Files in `features/` (Domains) and `cli/commands/` (Use Cases) must never import from `cli/ui/` or libraries like `@clack/prompts`.
- **Port-Based Interaction**: Use Cases must interact with the user only through the `PromptPort` defined in `shared/ports/`. This ensures the business flow is agnostic to whether it is running in a terminal, a browser, or a headless agent.
- **Zero direct I/O**: Features and Use Cases interact with the outside world (file system, process) only through **Ports** defined in `shared/ports/`.

## Project Structure

```text
src/
├── cli/                      # Driving Adapters (The Shell)
│   ├── commands/             # Pure Command orchestrators (init, help)
│   ├── ui/                   # Terminal UI logic (Visuals only)
│   ├── composition.ts        # Composition Root (Dependency Injection)
│   └── cli.ts                # Arg parsing and global state
│
├── features/                 # Pure Business Domains (Headless)
│   ├── scaffold/             # Generation engine (Planner, Executor)
│   └── config-mutation/      # AST-based configuration manipulation
│
├── adapters/                 # Driven Adapters (Infrastructure)
│   ├── node-workspace.adapter.ts # Concrete File System & Process logic
│   ├── logger.adapter.ts     # Concrete Terminal & JSON output logic
│   └── prompt.adapter.ts     # Concrete @clack/prompts implementation
│
└── shared/                   # Cross-cutting concerns
    └── ports/                # Infrastructure contracts (Interfaces)
```

## Dependency Flow

The dependency direction always flows **inward** toward the ports or **outward** from the driving shell:

1. **CLI (Shell)**: Orchestrates the flow using Ports.
   - `cli/commands/init` -> `PromptPort.runWizard()`
   - `cli/commands/init` -> `features/scaffold` (pass pure data)
2. **Features (Core)**: Import only from `shared/ports/`. They are entirely side-effect free, delegating all I/O to the injected adapters.
3. **Adapters (Infra)**: Implement the contracts defined in `shared/ports/`. This is where terminal-specific (Clack) or OS-specific (fs) logic lives.

## Headless / Agent Mode (`--agent`)

The architecture is specifically designed to support AI agents and headless environments via the `--agent` and `--json` flags.

- When `--agent` is passed, the `composition.ts` root injects a `JsonReporter` into the `LoggerPort`.
- Because the `scaffold` and `config-mutation` features are headless, they continue to function exactly the same.
- The `init` command skips interactive `ui/prompts` and passes default/provided options directly to the `features`.
- No interactive prompt will ever hang a headless process.

## Testing Strategy

- **Domain Tests**: Features are tested with pure data and mock ports. These tests are fast and do not touch the disk.
- **Adapter Tests**: Concrete implementations in `adapters/` are tested against the actual Node.js environment (e.g., using `fsp.mkdtemp`).
- **Smoke Tests**: High-level integration tests in `src/smoke.test.ts` verify the final bundled CLI from the user's perspective.

### Interactive Local Testing

To test the interactive onboarding wizard in real-world scenarios, a helper script is provided at the monorepo root. You can run the CLI inside a clean, sandboxed testing directory without affecting any existing codebase.

From the monorepo root:

- **Test in an ArkEnv-less existing project** (creates a folder with `package.json` + `tsconfig.json` + `.env.example` but no ArkEnv setup):
  ```bash
  pnpm test:cli --existing
  ```

- **Test in a completely new/empty directory** (creates a completely blank directory and runs `init`):
  ```bash
  pnpm test:cli --new
  ```

These commands will automatically rebuild the CLI, configure the temporary directory under `apps/playgrounds/tmp-cli-*` (which is git-ignored), and launch the local CLI binary interactively inside it.
