---
"@arkenv/core": patch
"@arkenv/standard": patch
---

#### Record the schema without reading the environment when a tool is inspecting it

`arkenv()` now records the definition object instead of validating `process.env` when the ArkEnv CLI (or another in-process tool) is inspecting the schema. App validation is unchanged.
