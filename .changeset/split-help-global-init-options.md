---
"arkenv": patch
---

#### Split `--help` options into Global and `init` sections

List shared flags under **Global options** and scaffolding flags under **init options**, matching the multi-command `/docs/cli` taxonomy.

```bash
npx arkenv@next --help
```

```text
Usage:
  arkenv init [project-name]    ...
  arkenv add host [provider]    ...

Global options:
  --yes, -y      Skip prompts and use defaults ...
  --quiet, -q    Quiet mode ...
  --json, -j     Output structured JSON ...
  --agent        Enable non-interactive, machine-readable mode ...
  --help, -h     Show this help message

init options:
  --example                     Specify an example name ...
  --force, -f                   Bypass checks and force scaffolding
  --no-codegen                  Disable automatic env.gen.ts code generation ...
  --host-preset, -H <preset>    Specify a hosting provider preset ...
```
