---
"@arkenv/cli": patch
---

#### Passthrough `--yes` and `--quiet` to underlying process

The ArkEnv CLI will now pass the flags `--yes` and `--quiet` to underlying processes.

This means that if you run:

```sh
pnx @arkenv/cli init --yes
```

It would now use the recommnded settings and avoid prompts even in sub-processes like the Vercel Skills process to add the ArkEnv skill.

Similarly, if you run:

```sh
pnx @arkenv/cli init --quiet
```

You will not be exposed to the underlying Vercel Skills output, except for errors which are buffered in memory. (Resolves on exit code 0, discarding buffered output on success)
