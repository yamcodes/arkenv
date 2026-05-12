---
"@arkenv/cli": patch
---

#### Add agent skill support

The CLI now has a new `--agent` flag that lets the ArkEnv agent skill interact with it in a token-sensitive way. The skill has been updated to support this new mode.

Also, the CLI will now suggest to install the agent skill for you when in non-`--agent` mode.

Read more in the [ArkEnv CLI docs](https://arkenv.js.org/docs/cli).
