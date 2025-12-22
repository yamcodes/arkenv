---
"arkenv": patch
---

#### Fix error formatting

The ArkEnv error message is now formatted better, using correct spacing and removing the `f` prefix.

Before:

```
apps/playgrounds/node on  main [$] via 🤖 v24.11.1 
❯ ns

> node-playground@ start /Users/yamcodes/code/arkenv/apps/playgrounds/node
> tsx --env-file .env index.ts

/Users/yamcodes/code/arkenv/packages/arkenv/src/create-env.ts:49
                throw new ArkEnvError(validatedEnv);
                      ^

f [ArkEnvError]: Errors found while validating environment variables
  ZED_ENV must be present (was missing)

    at m (/Users/yamcodes/code/arkenv/packages/arkenv/src/create-env.ts:49:9)
    at <anonymous> (/Users/yamcodes/code/arkenv/apps/playgrounds/node/index.ts:4:13)
    at ModuleJob.run (node:internal/modules/esm/module_job:377:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:671:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.11.1
 ELIFECYCLE  Command failed with exit code 1.
```

After:

```
apps/playgrounds/node on  improve-error-formatting [$?] via 🤖 v24.11.1 
❯ ns   

> node-playground@ start /Users/yamcodes/code/arkenv/apps/playgrounds/node
> tsx --env-file .env index.ts

/Users/yamcodes/code/arkenv/packages/arkenv/src/create-env.ts:49
                throw new ArkEnvError(validatedEnv);
                      ^

ArkEnvError: Errors found while validating environment variables
  ZED_ENV must be present (was missing)

    at m (/Users/yamcodes/code/arkenv/packages/arkenv/src/create-env.ts:49:9)
    at <anonymous> (/Users/yamcodes/code/arkenv/apps/playgrounds/node/index.ts:4:13)
    at ModuleJob.run (node:internal/modules/esm/module_job:377:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:671:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.11.1
 ELIFECYCLE  Command failed with exit code 1.
```
