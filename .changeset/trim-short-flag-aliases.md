---
"arkenv": major
---

#### Remove the `-C` (`--no-codegen`) and `-a` (`--agent`) short-flag aliases

**BREAKING CHANGE**: The `-C` and `-a` short aliases are no longer recognized. Their long forms, `--no-codegen` and `--agent`, continue to work exactly as before (`--agent` still implies `--yes --quiet --json`).

Short flags for an inverted boolean (`-C`) invite misreading as "enable codegen", and `--agent` targets machines and scripts that gain nothing from a keystroke shortcut. Passing `-C` or `-a` — standalone or inside a bundle like `-ya` — now fails with the standard `Unknown argument` error.

Migration: replace the short aliases with their long forms.

```bash
# Before
arkenv init -C
arkenv init -a

# After
arkenv init --no-codegen
arkenv init --agent
```

All other aliases (`-y`, `-f`, `-q`, `-j`, `-h`) are unchanged.
