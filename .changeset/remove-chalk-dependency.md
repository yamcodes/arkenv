---
"arkenv": patch
---

#### Replace Chalk dependency with Node.js built-in `util.styleText`

Remove the external `chalk` dependency and replace it with Node.js built-in `util.styleText`, available [from Node.js v20.12.0](https://nodejs.org/api/util.html#utilstyletextformat-text-options). This makes ArkEnv zero-dependency.
